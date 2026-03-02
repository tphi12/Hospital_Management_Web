# Schedule Module Phase 1 - Documentation

## Overview
This document describes the Schedule Module Phase 1 implementation for the Hospital Management System. The module manages duty schedules and weekly work schedules with a clean, normalized database design following 3NF principles.

## Database Design

### Entity-Relationship Model

```
DEPARTMENT (1) ----< (M) SCHEDULE
USER (1) ----< (M) SCHEDULE [created_by]
SCHEDULE (1) ----< (M) SHIFT
DEPARTMENT (1) ----< (M) SHIFT
SHIFT (1) ----< (M) SHIFT_ASSIGNMENT
USER (1) ----< (M) SHIFT_ASSIGNMENT
```

### Entities

#### 1. SCHEDULE
Primary table for managing schedules.

**Columns:**
- `schedule_id` (PK, INT, AUTO_INCREMENT) - Primary key
- `schedule_type` (ENUM: 'duty', 'weekly_work') - Type of schedule
- `department_id` (FK -> DEPARTMENT, INT) - Department that owns this schedule
- `week` (INT, 1-53) - Week number of the year
- `year` (INT, 2000-2100) - Year
- `description` (TEXT) - Description or notes about the schedule
- `created_by` (FK -> USER, INT) - User who created the schedule
- `status` (ENUM: 'draft', 'submitted', 'approved') - Workflow status
- `source_department_id` (FK -> DEPARTMENT, INT, NULL) - Source department if different from owner
- `owner_department_id` (FK -> DEPARTMENT, INT, NULL) - Owner department if different from creator
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- `idx_schedule_type` - On schedule_type
- `idx_week_year` - Composite on (week, year)
- `idx_week_year_type` - **Composite on (week, year, schedule_type)** - Performance optimization
- `idx_status` - On status
- `idx_department_id` - On department_id

**Constraints:**
- UNIQUE: (schedule_type, department_id, week, year) - Prevents duplicate schedules
- CHECK: week >= 1 AND week <= 53
- CHECK: year >= 2000 AND year <= 2100
- FK: department_id -> DEPARTMENT(department_id) ON DELETE CASCADE
- FK: created_by -> USER(user_id) ON DELETE CASCADE
- FK: source_department_id -> DEPARTMENT(department_id) ON DELETE SET NULL
- FK: owner_department_id -> DEPARTMENT(department_id) ON DELETE SET NULL

**Business Rules:**
- Each department can have only one schedule per week/year/type combination
- Status workflow: draft -> submitted -> approved
- Deletion cascades to child shifts and assignments

#### 2. SHIFT
Represents individual shifts within a schedule.

**Columns:**
- `shift_id` (PK, INT, AUTO_INCREMENT) - Primary key
- `schedule_id` (FK -> SCHEDULE, INT) - Parent schedule
- `department_id` (FK -> DEPARTMENT, INT) - Department for this shift
- `shift_date` (DATE) - Date of the shift
- `shift_type` (ENUM: 'morning', 'afternoon', 'night') - Time period of shift
- `start_time` (TIME) - Start time of shift
- `end_time` (TIME) - End time of shift
- `max_staff` (INT, DEFAULT 10) - Maximum number of staff allowed
- `note` (TEXT) - Additional notes

**Indexes:**
- `idx_schedule_id` - On schedule_id
- `idx_shift_date` - On shift_date
- `idx_shift_type` - On shift_type
- `idx_department_id` - On department_id
- `idx_date_type` - Composite on (shift_date, shift_type)

**Constraints:**
- CHECK: max_staff > 0 AND max_staff <= 100
- FK: schedule_id -> SCHEDULE(schedule_id) ON DELETE CASCADE
- FK: department_id -> DEPARTMENT(department_id) ON DELETE CASCADE

**Business Rules:**
- Shifts must belong to a schedule
- Maximum staff limit prevents over-assignment
- Deletion cascades to assignments

#### 3. SHIFT_ASSIGNMENT
Assigns users to specific shifts.

**Columns:**
- `shift_assignment_id` (PK, INT, AUTO_INCREMENT) - Primary key
- `shift_id` (FK -> SHIFT, INT) - Shift being assigned
- `user_id` (FK -> USER, INT) - User assigned to the shift
- `status` (ENUM: 'assigned', 'swapped', 'canceled') - Assignment status
- `assigned_at` (TIMESTAMP) - When assignment was made
- `note` (TEXT) - Additional notes

**Indexes:**
- `idx_shift_id` - On shift_id
- `idx_user_id` - On user_id
- `idx_status` - On status
- `idx_user_status` - Composite on (user_id, status)
- `idx_assigned_at` - On assigned_at

**Constraints:**
- UNIQUE: (shift_id, user_id, status) - Prevents duplicate active assignments
- FK: shift_id -> SHIFT(shift_id) ON DELETE CASCADE
- FK: user_id -> USER(user_id) ON DELETE CASCADE

**Business Rules:**
- Users can only be assigned once per shift (for active statuses)
- Status transitions: assigned -> swapped/canceled
- Deletion cascades when shift or user is deleted

## Normalization Analysis (3NF)

### First Normal Form (1NF)
✅ All tables have:
- Atomic values (no arrays or comma-separated values)
- Unique column names
- Primary keys
- No repeating groups

### Second Normal Form (2NF)
✅ All non-key attributes are fully functionally dependent on the primary key:
- SCHEDULE: All attributes depend on schedule_id
- SHIFT: All attributes depend on shift_id
- SHIFT_ASSIGNMENT: All attributes depend on shift_assignment_id

### Third Normal Form (3NF)
✅ No transitive dependencies:
- SCHEDULE: created_by references USER, but user details not stored
- SHIFT: department_id references DEPARTMENT, but department details not stored
- SHIFT_ASSIGNMENT: user_id references USER, but user details not stored

All foreign key relationships are properly normalized with no redundant data.

## Enum Definitions

Located in: `BE/src/utils/enums.js`

### Schedule Enums
- **ScheduleType**: `duty`, `weekly_work`
- **ScheduleStatus**: `draft`, `submitted`, `approved`

### Shift Enums
- **ShiftType**: `morning`, `afternoon`, `night`
- **ShiftAssignmentStatus**: `assigned`, `swapped`, `canceled`

### Default Shift Times
- Morning: 07:00 - 12:00
- Afternoon: 13:00 - 17:00
- Night: 18:00 - 23:00

## Entity Models

### 1. Schedule Model
**Location:** `BE/src/models/Schedule.js`

**Methods:**
- `create(scheduleData)` - Create new schedule
- `findAll(filters)` - Get all schedules with optional filters
- `findById(id)` - Get schedule by ID
- `update(id, scheduleData)` - Update schedule
- `updateStatus(id, status)` - Update schedule status
- `delete(id)` - Delete schedule and cascading data
- `checkExists(schedule_type, department_id, week, year)` - Check for duplicates

### 2. Shift Model
**Location:** `BE/src/models/Shift.js`

**Methods:**
- `create(shiftData)` - Create new shift
- `findBySchedule(scheduleId)` - Get shifts for a schedule
- `findById(id)` - Get shift by ID
- `update(id, shiftData)` - Update shift
- `delete(id)` - Delete shift and assignments
- `getWithDetails(shiftId)` - Get shift with full details
- `findByDateRange(departmentId, startDate, endDate)` - Get shifts in date range

### 3. ShiftAssignment Model
**Location:** `BE/src/models/ShiftAssignment.js`

**Methods:**
- `create(assignmentData)` - Create new assignment
- `findById(id)` - Get assignment by ID
- `findByShift(shiftId)` - Get all assignments for a shift
- `findByUser(userId, filters)` - Get user's assignments
- `findBySchedule(scheduleId)` - Get all assignments for a schedule
- `updateStatus(id, status, note)` - Update assignment status
- `updateNote(id, note)` - Update assignment note
- `delete(id)` - Delete assignment
- `deleteByShift(shiftId)` - Delete all assignments for a shift
- `checkExistingAssignment(shiftId, userId)` - Check if user already assigned
- `getAssignmentCount(shiftId)` - Get active assignment count
- `swap(assignment1Id, assignment2Id)` - Swap assignments between users
- `findByUserWeek(userId, week, year)` - Get user assignments for a week

## Migration Files

### Migration Strategy
Migrations are located in `BE/database/migrations/` and numbered sequentially:

1. **001_create_base_tables.sql** - Base tables (DEPARTMENT, USER, ROLE, USER_ROLE)
2. **002_create_schedule_tables.sql** - Schedule module tables (SCHEDULE, SHIFT, SHIFT_ASSIGNMENT)
3. **003_add_composite_indexes.sql** - Additional performance indexes

### Running Migrations
To apply migrations manually:
```bash
mysql -u username -p database_name < BE/database/migrations/001_create_base_tables.sql
mysql -u username -p database_name < BE/database/migrations/002_create_schedule_tables.sql
mysql -u username -p database_name < BE/database/migrations/003_add_composite_indexes.sql
```

Or use the complete schema:
```bash
mysql -u username -p database_name < BE/database/schema.sql
```

## Foreign Key Relationships

### SCHEDULE Table
- `department_id` -> DEPARTMENT(department_id) ON DELETE CASCADE
- `created_by` -> USER(user_id) ON DELETE CASCADE
- `source_department_id` -> DEPARTMENT(department_id) ON DELETE SET NULL
- `owner_department_id` -> DEPARTMENT(department_id) ON DELETE SET NULL

### SHIFT Table
- `schedule_id` -> SCHEDULE(schedule_id) ON DELETE CASCADE
- `department_id` -> DEPARTMENT(department_id) ON DELETE CASCADE

### SHIFT_ASSIGNMENT Table
- `shift_id` -> SHIFT(shift_id) ON DELETE CASCADE
- `user_id` -> USER(user_id) ON DELETE CASCADE

## Index Strategy

### Performance Indexes
1. **week + year + schedule_type** - Critical for filtering schedules
2. **shift_date + shift_type** - Optimizes shift queries by date
3. **user_id + status** - Fast lookup of user assignments by status
4. **schedule_id + shift_date** - Efficient date-based shift retrieval

### Unique Constraints
1. **(schedule_type, department_id, week, year)** - Prevents duplicate schedules
2. **(shift_id, user_id, status)** - Prevents duplicate active assignments

## Usage Examples

### Creating a Schedule
```javascript
const Schedule = require('./models/Schedule');

const scheduleId = await Schedule.create({
  schedule_type: 'duty',
  department_id: 3,
  week: 10,
  year: 2024,
  description: 'March duty schedule',
  created_by: 5,
  status: 'draft'
});
```

### Creating Shifts
```javascript
const Shift = require('./models/Shift');

const shiftId = await Shift.create({
  schedule_id: scheduleId,
  department_id: 3,
  shift_date: '2024-03-04',
  shift_type: 'morning',
  start_time: '07:00:00',
  end_time: '12:00:00',
  max_staff: 5
});
```

### Assigning Staff
```javascript
const ShiftAssignment = require('./models/ShiftAssignment');

const assignmentId = await ShiftAssignment.create({
  shift_id: shiftId,
  user_id: 10,
  status: 'assigned',
  note: 'Regular assignment'
});
```

### Querying User Schedule
```javascript
// Get user's assignments for a specific week
const assignments = await ShiftAssignment.findByUserWeek(userId, 10, 2024);

// Get user's assignments with date filter
const futureAssignments = await ShiftAssignment.findByUser(userId, {
  status: 'assigned',
  from_date: '2024-03-01',
  to_date: '2024-03-31'
});
```

## Clean Architecture Principles

### Separation of Concerns
- **Models** (entities): Encapsulate data access logic
- **Controllers**: Handle business logic and HTTP requests
- **Routes**: Define API endpoints
- **Middleware**: Handle authentication, validation, authorization

### Dependency Direction
```
Routes -> Controllers -> Models -> Database
       -> Middleware
```

### Model Responsibilities
- Data validation at database level (constraints, enums)
- CRUD operations
- Complex queries
- Transaction management
- No business logic (belongs in controllers)

## Future Enhancements (Phase 2+)

1. **Audit Trail**: Track all changes to schedules and assignments
2. **Conflict Detection**: Prevent overlapping shift assignments
3. **Notifications**: Alert users of new assignments
4. **Swap Requests**: User-initiated shift swap workflow
5. **Analytics**: Generate reports on shift coverage and hours
6. **Approval Workflow**: Multi-level approval for schedules
7. **Templates**: Save and reuse schedule patterns
8. **Integration**: Sync with external calendar systems

## Testing Considerations

### Unit Tests
- Model CRUD operations
- Enum validators
- Constraint violations

### Integration Tests
- Schedule workflow (draft -> submitted -> approved)
- Cascading deletes
- Assignment limits
- Duplicate prevention

### Performance Tests
- Query performance with composite indexes
- Large dataset handling (1000+ schedules)
- Concurrent assignment operations

## Security Considerations

1. **Authorization**: Verify user has permission for department operations
2. **Data Validation**: Validate enums, dates, and foreign keys
3. **SQL Injection**: Use parameterized queries (already implemented)
4. **Audit Logging**: Track who creates/modifies schedules

## Conclusion

The Schedule Module Phase 1 provides a solid foundation for managing hospital schedules with:
- ✅ Clean, normalized database design (3NF)
- ✅ Comprehensive entity models with full CRUD operations
- ✅ Proper foreign key relationships and constraints
- ✅ Performance-optimized indexes
- ✅ Type-safe enum definitions
- ✅ Migration files for version control
- ✅ Transaction support for data integrity
- ✅ Extensible architecture for future enhancements
