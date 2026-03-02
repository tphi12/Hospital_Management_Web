# ScheduleService Implementation Summary

## Overview
Implemented `ScheduleService` with business logic for schedule management, including authorization checks and validation rules.

## Implemented Methods

### 1. createDutySchedule(scheduleData)
Creates a duty schedule with strict authorization and validation rules.

**Authorization:**
- Only users with `CLERK` role
- Must have `department` scope (not `hospital`)
- User's department must match the schedule's department

**Business Rules:**
- `schedule_type` = `duty`
- `status` = `draft`
- `source_department_id` = user's department
- `owner_department_id` = KHTH department (Phòng Kế Hoạch Tổng Hợp)

**Validation:**
- Prevents duplicate schedules (same week/year/department)
- Week must be between 1-53
- Year must be between 2000-2100
- Required fields: userId, departmentId, week, year

**Parameters:**
```javascript
{
  userId: number,           // User creating the schedule
  departmentId: number,     // Department ID
  week: number,             // Week number (1-53)
  year: number,             // Year (2000-2100)
  description: string       // Optional description
}
```

**Returns:** `Promise<number>` - Schedule ID

**Throws:**
- "User ID is required"
- "Department ID is required"
- "Week must be between 1 and 53"
- "Year must be between 2000 and 2100"
- "Only CLERK with department scope can create duty schedules"
- "Duty schedule already exists for week X/YYYY in this department"
- "KHTH department not found in system"

### 2. addShift(shiftData)
Adds a shift to an existing schedule.

**Parameters:**
```javascript
{
  scheduleId: number,       // Schedule ID
  departmentId: number,     // Department ID
  shiftDate: string,        // YYYY-MM-DD format
  shiftType: string,        // 'morning' | 'afternoon' | 'night'
  startTime: string,        // HH:MM:SS format
  endTime: string,          // HH:MM:SS format
  maxStaff: number,         // Optional, default: 10, range: 1-100
  note: string              // Optional note
}
```

**Validation:**
- Schedule must exist
- Shift type must be: morning, afternoon, or night
- Date format must be YYYY-MM-DD
- maxStaff must be between 1 and 100

**Returns:** `Promise<number>` - Shift ID

**Throws:**
- "Schedule ID is required"
- "Department ID is required"
- "Shift date is required"
- "Shift type is required"
- "Shift type must be one of: morning, afternoon, night"
- "Schedule not found"
- "Shift date must be in YYYY-MM-DD format"
- "Max staff must be between 1 and 100"

### 3. assignUserToShift(assignmentData)
Assigns a user to a specific shift.

**Parameters:**
```javascript
{
  shiftId: number,          // Shift ID
  userId: number,           // User ID to assign
  note: string              // Optional note
}
```

**Validation:**
- Shift must exist
- User cannot be already assigned to the shift
- Shift must not be at maximum capacity

**Returns:** `Promise<number>` - Assignment ID

**Throws:**
- "Shift ID is required"
- "User ID is required"
- "Shift not found"
- "User is already assigned to this shift"
- "Shift is at maximum capacity (X staff)"

### 4. getScheduleDetails(scheduleId)
Retrieves complete schedule information with shifts and assignments.

**Parameters:**
- `scheduleId: number` - Schedule ID

**Returns:** `Promise<Object>` - Schedule with nested shifts and assignments

**Throws:**
- "Schedule not found"

### 5. submitSchedule(scheduleId, userId)
Submits a draft schedule for approval.

**Business Rules:**
- Only draft schedules can be submitted
- Only the schedule creator can submit

**Returns:** `Promise<boolean>` - Success status

**Throws:**
- "Schedule not found"
- "Only draft schedules can be submitted"
- "Only the schedule creator can submit it"

### 6. approveSchedule(scheduleId, userId)
Approves a submitted schedule.

**Authorization:**
- Only users with `MANAGER` role
- Must be manager of the owner department (KHTH)

**Business Rules:**
- Only submitted schedules can be approved

**Returns:** `Promise<boolean>` - Success status

**Throws:**
- "Schedule not found"
- "Only submitted schedules can be approved"
- "Only MANAGER of owner department can approve schedules"

## Usage Examples

### Example 1: Create Duty Schedule
```javascript
const ScheduleService = require('./services/ScheduleService');

// User is a CLERK in department 3
const scheduleId = await ScheduleService.createDutySchedule({
  userId: 5,
  departmentId: 3,
  week: 10,
  year: 2024,
  description: 'March duty schedule for Internal Medicine'
});

console.log('Created schedule ID:', scheduleId);
```

### Example 2: Add Shifts to Schedule
```javascript
const { DefaultShiftTimes, ShiftType } = require('./utils/enums');

// Add morning shift
const morningShiftId = await ScheduleService.addShift({
  scheduleId: scheduleId,
  departmentId: 3,
  shiftDate: '2024-03-04',
  shiftType: ShiftType.MORNING,
  startTime: DefaultShiftTimes.morning.start,
  endTime: DefaultShiftTimes.morning.end,
  maxStaff: 5
});

// Add afternoon shift
const afternoonShiftId = await ScheduleService.addShift({
  scheduleId: scheduleId,
  departmentId: 3,
  shiftDate: '2024-03-04',
  shiftType: ShiftType.AFTERNOON,
  startTime: '13:00:00',
  endTime: '17:00:00',
  maxStaff: 4
});
```

### Example 3: Assign Staff to Shifts
```javascript
// Assign user 10 to morning shift
const assignmentId = await ScheduleService.assignUserToShift({
  shiftId: morningShiftId,
  userId: 10,
  note: 'Regular assignment'
});

// Assign user 12 to afternoon shift
await ScheduleService.assignUserToShift({
  shiftId: afternoonShiftId,
  userId: 12
});
```

### Example 4: Complete Workflow
```javascript
try {
  // 1. Create duty schedule (as CLERK)
  const scheduleId = await ScheduleService.createDutySchedule({
    userId: clerkUserId,
    departmentId: departmentId,
    week: currentWeek,
    year: 2024
  });

  // 2. Add shifts for the week
  const shifts = [];
  for (let day = 0; day < 7; day++) {
    const date = getDateForWeekDay(currentWeek, 2024, day);
    
    // Morning shift
    const morningShift = await ScheduleService.addShift({
      scheduleId,
      departmentId,
      shiftDate: date,
      shiftType: 'morning',
      startTime: '07:00:00',
      endTime: '12:00:00',
      maxStaff: 5
    });
    shifts.push(morningShift);

    // Afternoon shift
    const afternoonShift = await ScheduleService.addShift({
      scheduleId,
      departmentId,
      shiftDate: date,
      shiftType: 'afternoon',
      startTime: '13:00:00',
      endTime: '17:00:00',
      maxStaff: 4
    });
    shifts.push(afternoonShift);
  }

  // 3. Assign staff to shifts
  const staffList = [10, 12, 15, 18, 20];
  for (const shiftId of shifts) {
    for (const userId of staffList.slice(0, 2)) {
      await ScheduleService.assignUserToShift({
        shiftId,
        userId
      });
    }
  }

  // 4. Submit for approval
  await ScheduleService.submitSchedule(scheduleId, clerkUserId);

  // 5. Approve (as MANAGER of KHTH)
  await ScheduleService.approveSchedule(scheduleId, managerUserId);

  console.log('Schedule created and approved successfully!');
} catch (error) {
  console.error('Error:', error.message);
}
```

### Example 5: Controller Integration
```javascript
// In scheduleController.js
const ScheduleService = require('../services/ScheduleService');

const createDutySchedule = async (req, res) => {
  try {
    const { departmentId, week, year, description } = req.body;
    const userId = req.user.user_id; // From auth middleware

    const scheduleId = await ScheduleService.createDutySchedule({
      userId,
      departmentId,
      week,
      year,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Duty schedule created successfully',
      data: { scheduleId }
    });
  } catch (error) {
    console.error('Create duty schedule error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { createDutySchedule };
```

## Unit Tests

### Test Coverage
✅ **22+ test cases** covering:
- Success scenarios
- Authorization failures
- Validation failures
- Edge cases
- Boundary conditions

### Running Tests
```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run in watch mode
npm run test:watch

# Run unit tests only
npm run test:unit
```

### Test Results
```
PASS  tests/services/ScheduleService.test.js
  ScheduleService
    createDutySchedule
      ✓ should successfully create a duty schedule with valid data
      ✓ should fail when user does not have CLERK role
      ✓ should fail when user has CLERK but wrong scope
      ✓ should fail when user has CLERK but for different department
      ✓ should fail when duplicate schedule exists
      ✓ should fail when week is invalid
      ✓ should fail when year is invalid
      ✓ should fail when userId is missing
      ✓ should fail when departmentId is missing
      ✓ should fail when KHTH department is not found
    addShift
      ✓ should successfully add a shift with valid data
      ✓ should fail when schedule does not exist
      ✓ should fail when shift type is invalid
      ✓ should fail when shift date format is invalid
      ✓ should fail when maxStaff is too high
      ✓ should use default maxStaff value when not provided
    assignUserToShift
      ✓ should successfully assign user to shift
      ✓ should fail when shift does not exist
      ✓ should fail when user is already assigned to shift
      ✓ should fail when shift is at maximum capacity
      ✓ should fail when shiftId is missing
      ✓ should fail when userId is missing
    getScheduleDetails
      ✓ should return schedule with shifts and assignments
      ✓ should fail when schedule does not exist
    submitSchedule
      ✓ should successfully submit a draft schedule
      ✓ should fail when schedule is not in draft status
      ✓ should fail when user is not the creator
    approveSchedule
      ✓ should successfully approve a submitted schedule
      ✓ should fail when schedule is not submitted
      ✓ should fail when user is not MANAGER of owner department

Test Suites: 1 passed, 1 total
Tests:       29 passed, 29 total
```

## Files Created/Modified

### New Files
1. ✅ `src/services/ScheduleService.js` - Service implementation (330+ lines)
2. ✅ `tests/services/ScheduleService.test.js` - Unit tests (570+ lines)
3. ✅ `jest.config.js` - Jest configuration
4. ✅ `tests/README.md` - Testing documentation

### Modified Files
1. ✅ `package.json` - Added Jest dependencies and test scripts

## Dependencies Added
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11"
  }
}
```

## Architecture

### Clean Architecture Principles
✅ **Separation of Concerns**
- Service layer handles business logic
- Models handle data access
- Controllers handle HTTP requests

✅ **Single Responsibility**
- Each method has one clear purpose
- Validation separated from business logic

✅ **Dependency Injection**
- Models are injected dependencies
- Easy to mock for testing

✅ **Error Handling**
- Clear, descriptive error messages
- Proper error propagation

## Security Considerations

### Authorization Checks
- ✅ Role-based access control (RBAC)
- ✅ Scope validation (department vs hospital)
- ✅ Department ownership verification
- ✅ Creator verification for submissions

### Input Validation
- ✅ Required field validation
- ✅ Range validation (week, year, maxStaff)
- ✅ Format validation (date, shift type)
- ✅ Duplicate prevention

### Data Integrity
- ✅ Foreign key validation
- ✅ Capacity checks
- ✅ Duplicate assignment prevention
- ✅ Status workflow enforcement

## Next Steps

### Phase 2 - Controller Integration
- [ ] Add ScheduleService methods to scheduleController.js
- [ ] Create API endpoints
- [ ] Add request validation middleware
- [ ] Add Swagger documentation

### Phase 3 - Additional Features
- [ ] Bulk shift creation
- [ ] Shift swap functionality
- [ ] Schedule templates
- [ ] Conflict detection
- [ ] Email notifications

### Phase 4 - Testing
- [ ] Integration tests with database
- [ ] API endpoint tests with supertest
- [ ] Performance testing
- [ ] Load testing

## Troubleshooting

### Common Issues

**Issue:** "KHTH department not found"
- **Solution:** Ensure KHTH department exists in database with code 'KHTH'

**Issue:** "User does not have CLERK role"
- **Solution:** Verify user has CLERK role with department scope via USER_ROLE table

**Issue:** "Duplicate schedule exists"
- **Solution:** Check SCHEDULE table for existing records with same week/year/department

**Issue:** Tests failing
- **Solution:** Run `npm install` to install Jest, then `npm test`

## Database Requirements

### Required Setup
1. KHTH department must exist with code 'KHTH'
2. Users must have roles assigned via USER_ROLE table
3. CLERK role must exist with role_code = 'CLERK'
4. MANAGER role must exist with role_code = 'MANAGER'

### Sample Data
```sql
-- Verify KHTH exists
SELECT * FROM DEPARTMENT WHERE department_code = 'KHTH';

-- Verify user has CLERK role
SELECT ur.*, r.role_code, r.role_name
FROM USER_ROLE ur
JOIN ROLE r ON ur.role_id = r.role_id
WHERE ur.user_id = ? AND r.role_code = 'CLERK';
```

## API Integration Example

```javascript
// POST /api/schedules/duty
router.post('/duty', auth, async (req, res) => {
  try {
    const scheduleId = await ScheduleService.createDutySchedule({
      userId: req.user.user_id,
      departmentId: req.body.departmentId,
      week: req.body.week,
      year: req.body.year,
      description: req.body.description
    });

    res.status(201).json({
      success: true,
      data: { scheduleId }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});
```

---

**Implementation Date:** March 2, 2026
**Status:** ✅ Complete and Tested
**Test Coverage:** 29 passing tests
**Lines of Code:** 900+
