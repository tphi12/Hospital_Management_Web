# Quick Start Guide - ScheduleService Testing

## Installation

1. **Install Jest dependencies:**
   ```bash
   cd BE
   npm install
   ```

   This will install:
   - jest@^29.7.0
   - @types/jest@^29.5.11

2. **Verify installation:**
   ```bash
   npx jest --version
   ```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm test -- --coverage
```

Output:
```
 PASS  tests/services/ScheduleService.test.js
  ScheduleService
    createDutySchedule
      ✓ should successfully create a duty schedule with valid data (5 ms)
      ✓ should fail when user does not have CLERK role (2 ms)
      ✓ should fail when user has CLERK but wrong scope (2 ms)
      ...
    addShift
      ✓ should successfully add a shift with valid data (3 ms)
      ...
    assignUserToShift
      ✓ should successfully assign user to shift (2 ms)
      ...

Test Suites: 1 passed, 1 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        2.5 s
```

### Run in watch mode (for development)
```bash
npm run test:watch
```

### Run unit tests only
```bash
npm run test:unit
```

## View Coverage Report

After running tests with coverage:

1. Open in browser:
   ```bash
   # Windows
   start coverage/lcov-report/index.html
   
   # Mac/Linux
   open coverage/lcov-report/index.html
   ```

2. Or view in terminal:
   ```bash
   cat coverage/lcov-report/index.html
   ```

## Using ScheduleService

### Basic Usage

```javascript
const ScheduleService = require('./src/services/ScheduleService');

// Create a duty schedule
async function createSchedule() {
  try {
    const scheduleId = await ScheduleService.createDutySchedule({
      userId: 5,           // CLERK user
      departmentId: 3,     // Department ID
      week: 10,            // Week 10
      year: 2024,          // Year 2024
      description: 'Duty schedule for Internal Medicine'
    });
    
    console.log('Schedule created with ID:', scheduleId);
    return scheduleId;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Add a shift
async function addShift(scheduleId) {
  try {
    const shiftId = await ScheduleService.addShift({
      scheduleId: scheduleId,
      departmentId: 3,
      shiftDate: '2024-03-04',
      shiftType: 'morning',
      startTime: '07:00:00',
      endTime: '12:00:00',
      maxStaff: 5
    });
    
    console.log('Shift created with ID:', shiftId);
    return shiftId;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Assign user to shift
async function assignStaff(shiftId, userId) {
  try {
    const assignmentId = await ScheduleService.assignUserToShift({
      shiftId: shiftId,
      userId: userId,
      note: 'Regular assignment'
    });
    
    console.log('Assignment created with ID:', assignmentId);
    return assignmentId;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Complete workflow
async function createCompleteSchedule() {
  const scheduleId = await createSchedule();
  const shiftId = await addShift(scheduleId);
  await assignStaff(shiftId, 10);
}
```

## Expected Test Output

```
--------------------------------|---------|----------|---------|---------|-------------------
File                            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
--------------------------------|---------|----------|---------|---------|-------------------
All files                       |   >= 19 |    >= 20 |   >= 18 |   >= 19 |                   
--------------------------------|---------|----------|---------|---------|-------------------

Test Suites: 1 passed, 1 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        2.5s
```

Current repo note:
- The backend currently enforces a baseline global threshold while controller and middleware coverage is still being expanded.
- As new suites are added, these thresholds should be raised incrementally instead of jumping straight to 70%.

## Troubleshooting

### Issue: Module not found
```
Error: Cannot find module '../models/Schedule'
```

**Solution:** Ensure you're in the BE directory:
```bash
cd BE
npm test
```

### Issue: Jest not found
```
'jest' is not recognized as an internal or external command
```

**Solution:** Install dependencies:
```bash
npm install
```

### Issue: Tests timeout
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Solution:** Tests should complete quickly. If they timeout, check:
- Mock functions are properly set up
- No actual database calls are being made
- All async operations are properly handled

### Issue: Mock not working
```
TypeError: SomeModel.method is not a function
```

**Solution:** Ensure mock is declared at top of test file:
```javascript
jest.mock('../../src/models/ModelName');
```

## Next Steps

1. **Install dependencies:** `npm install`
2. **Run tests:** `npm test`
3. **View coverage:** Open `coverage/lcov-report/index.html`
4. **Integrate with controller:** See SCHEDULE_SERVICE_IMPLEMENTATION.md
5. **Add API endpoints:** Update scheduleRoutes.js

## Documentation

- [Service Implementation](./docs/SCHEDULE_SERVICE_IMPLEMENTATION.md) - Detailed API documentation
- [Test Documentation](./tests/README.md) - Testing guide
- [Schedule Module Phase 1](./docs/SCHEDULE_MODULE_PHASE1.md) - Database and architecture

## Support

For issues or questions:
1. Check test output for specific error messages
2. Review [tests/README.md](./tests/README.md) for testing guidelines
3. Check [docs/SCHEDULE_SERVICE_IMPLEMENTATION.md](./docs/SCHEDULE_SERVICE_IMPLEMENTATION.md) for usage examples
4. Verify database setup (KHTH department, roles, etc.)
