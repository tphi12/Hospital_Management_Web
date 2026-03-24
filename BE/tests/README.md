# Tests

This directory contains unit and integration tests for the Hospital Management System backend.

## Structure

```
tests/
├── services/           # Service layer tests
│   └── ScheduleService.test.js
├── models/            # Model layer tests (future)
├── controllers/       # Controller tests (future)
└── integration/       # Integration tests (future)
```

## Running Tests

### Install Dependencies
First, install Jest and testing dependencies:
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
Useful during development - automatically reruns tests on file changes:
```bash
npm run test:watch
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run with Coverage Report
```bash
npm test -- --coverage
```

## Test Coverage

Coverage reports are generated in the `coverage/` directory. Open `coverage/lcov-report/index.html` in a browser to view detailed coverage information.

### Coverage Thresholds
- Branches: 20%
- Functions: 18%
- Lines: 19%
- Statements: 19%

## ScheduleService Tests

### Test Cases Implemented

#### createDutySchedule()
✅ **Success Cases:**
- Successfully create a duty schedule with valid data

✅ **Authorization Failures:**
- Fail when user does not have CLERK role
- Fail when user has CLERK but wrong scope (hospital instead of department)
- Fail when user has CLERK but for different department

✅ **Validation Failures:**
- Fail when duplicate schedule exists for same week/year/department
- Fail when week is invalid (< 1 or > 53)
- Fail when year is invalid (< 2000 or > 2100)
- Fail when userId is missing
- Fail when departmentId is missing
- Fail when KHTH department is not found in system

#### addShift()
✅ **Success Cases:**
- Successfully add a shift with valid data
- Use default maxStaff value when not provided

✅ **Validation Failures:**
- Fail when schedule does not exist
- Fail when shift type is invalid
- Fail when shift date format is invalid
- Fail when maxStaff is too high (> 100)

#### assignUserToShift()
✅ **Success Cases:**
- Successfully assign user to shift

✅ **Validation Failures:**
- Fail when shift does not exist
- Fail when user is already assigned to shift
- Fail when shift is at maximum capacity
- Fail when shiftId is missing
- Fail when userId is missing

#### Additional Tests
✅ getScheduleDetails() - Return schedule with shifts and assignments
✅ submitSchedule() - Submit draft schedule for approval
✅ approveSchedule() - Approve submitted schedule

## Writing New Tests

### Test Structure
```javascript
describe('ServiceName', () => {
  beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something when condition is met', async () => {
      // Arrange - Set up test data and mocks
      const mockData = { ... };
      SomeModel.method.mockResolvedValue(mockData);

      // Act - Execute the function being tested
      const result = await Service.method(params);

      // Assert - Verify the results
      expect(result).toBe(expected);
      expect(SomeModel.method).toHaveBeenCalledWith(params);
    });
  });
});
```

### Mocking Dependencies
All external dependencies (models, database, etc.) should be mocked:

```javascript
jest.mock('../../src/models/ModelName');
```

### Best Practices
1. **One assertion per test** when possible
2. **Clear test names** that describe what is being tested
3. **Arrange-Act-Assert** pattern for test structure
4. **Mock all external dependencies**
5. **Test both success and failure cases**
6. **Test edge cases and boundary conditions**

## Test Results

Run `npm test` to see test results:

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
      ✓ should use default maxStaff value
    assignUserToShift
      ✓ should successfully assign user to shift
      ✓ should fail when shift does not exist
      ✓ should fail when user is already assigned
      ✓ should fail when shift is at maximum capacity
      ✓ should fail when shiftId is missing
      ✓ should fail when userId is missing

Test Suites: 1 passed, 1 total
Tests:       22+ passed, 22+ total
```

## Continuous Integration

Tests should be run in CI/CD pipeline:
```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test
```

## Troubleshooting

### Tests Failing
1. Check that all dependencies are installed: `npm install`
2. Clear Jest cache: `npx jest --clearCache`
3. Check for typos in mock paths
4. Verify all imports are correct

### Coverage Not Generated
1. Ensure jest.config.js exists
2. Run with explicit coverage flag: `npm test -- --coverage`
3. Check collectCoverageFrom patterns in jest.config.js

## Future Testing Tasks

- [ ] Add integration tests with real database
- [ ] Add controller tests
- [ ] Add model tests
- [ ] Add API endpoint tests with supertest
- [ ] Add authentication/authorization tests
- [ ] Add performance tests
- [ ] Set up CI/CD pipeline
- [ ] Add E2E tests
- [ ] Raise global coverage thresholds after expanding controller/middleware coverage

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [Node.js Testing Guide](https://nodejs.org/en/docs/guides/testing/)
