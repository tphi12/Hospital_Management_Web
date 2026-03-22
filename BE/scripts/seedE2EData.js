const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { pool } = require('../src/config/database');

const PASSWORD = 'E2Epass123!';
const E2E_DEPARTMENT_CODE = 'E2E-SCHED';
const E2E_DEPARTMENT_NAME = 'Khoa Lich Truc E2E';
const WEEKLY_DESCRIPTION = 'E2E Weekly Work Schedule';

function getIsoWeekParts(date = new Date()) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  return { week, year: utc.getUTCFullYear() };
}

function getMondayOfIsoWeek(week, year) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay() || 7;
  if (dow <= 4) {
    simple.setUTCDate(simple.getUTCDate() - dow + 1);
  } else {
    simple.setUTCDate(simple.getUTCDate() + 8 - dow);
  }
  return simple;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

async function ensureDepartment(connection, code, name, type = 'simple') {
  const [existing] = await connection.execute(
    'SELECT department_id FROM DEPARTMENT WHERE department_code = ?',
    [code],
  );
  if (existing[0]) {
    await connection.execute(
      'UPDATE DEPARTMENT SET department_name = ?, department_type = ?, description = ?, updated_at = NOW() WHERE department_id = ?',
      [name, type, 'Seed data for E2E tests', existing[0].department_id],
    );
    return existing[0].department_id;
  }

  const [result] = await connection.execute(
    `INSERT INTO DEPARTMENT (department_code, department_name, department_type, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [code, name, type, 'Seed data for E2E tests'],
  );
  return result.insertId;
}

async function getRoleId(connection, roleCode) {
  const [rows] = await connection.execute('SELECT role_id FROM ROLE WHERE role_code = ?', [roleCode]);
  if (!rows[0]) {
    throw new Error(`Missing role ${roleCode}`);
  }
  return rows[0].role_id;
}

async function ensureUser(connection, user) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const [existing] = await connection.execute(
    'SELECT user_id FROM USER WHERE username = ?',
    [user.username],
  );

  if (existing[0]) {
    await connection.execute(
      `UPDATE USER
       SET full_name = ?, email = ?, password_hash = ?, phone = ?, employee_code = ?, department_id = ?, status = 'active', updated_at = NOW()
       WHERE user_id = ?`,
      [user.full_name, user.email, passwordHash, user.phone, user.employee_code, user.department_id, existing[0].user_id],
    );
    return existing[0].user_id;
  }

  const [result] = await connection.execute(
    `INSERT INTO USER
      (full_name, email, password_hash, phone, username, employee_code, department_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
    [user.full_name, user.email, passwordHash, user.phone, user.username, user.employee_code, user.department_id],
  );

  return result.insertId;
}

async function resetUserRoles(connection, userId, roleBindings) {
  await connection.execute('DELETE FROM USER_ROLE WHERE user_id = ?', [userId]);
  for (const binding of roleBindings) {
    await connection.execute(
      `INSERT INTO USER_ROLE (user_id, role_id, scope_type, department_id, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, binding.role_id, binding.scope_type, binding.department_id],
    );
  }
}

async function createDutyScheduleFixture(connection, fixture) {
  await connection.execute(
    'DELETE FROM SCHEDULE WHERE schedule_type = ? AND department_id = ? AND week = ? AND year = ?',
    ['duty', fixture.departmentId, fixture.week, fixture.year],
  );

  const [scheduleResult] = await connection.execute(
    `INSERT INTO SCHEDULE
      (schedule_type, department_id, week, year, description, created_by, status, source_department_id, owner_department_id, created_at, updated_at)
     VALUES ('duty', ?, ?, ?, ?, ?, 'draft', ?, ?, NOW(), NOW())`,
    [
      fixture.departmentId,
      fixture.week,
      fixture.year,
      'E2E duty schedule draft',
      fixture.createdBy,
      fixture.departmentId,
      fixture.ownerDepartmentId,
    ],
  );

  const scheduleId = scheduleResult.insertId;
  const [shiftResult] = await connection.execute(
    `INSERT INTO SHIFT
      (schedule_id, department_id, shift_date, shift_type, note, start_time, end_time, max_staff)
     VALUES (?, ?, ?, 'morning', ?, '07:00:00', '11:00:00', 3)`,
    [scheduleId, fixture.departmentId, fixture.shiftDate, 'E2E seeded shift'],
  );

  await connection.execute(
    `INSERT INTO SHIFT_ASSIGNMENT (shift_id, user_id, assigned_at, status, note)
     VALUES (?, ?, NOW(), 'assigned', ?)`,
    [shiftResult.insertId, fixture.assignedUserId, 'Seeded assignment'],
  );

  return {
    scheduleId,
    shiftId: shiftResult.insertId,
  };
}

async function createWeeklyScheduleFixture(connection, fixture) {
  await connection.execute(
    'DELETE FROM SCHEDULE WHERE schedule_type = ? AND department_id = ? AND week = ? AND year = ? AND description = ?',
    ['weekly_work', fixture.departmentId, fixture.week, fixture.year, WEEKLY_DESCRIPTION],
  );

  const [scheduleResult] = await connection.execute(
    `INSERT INTO SCHEDULE
      (schedule_type, department_id, week, year, description, created_by, status, source_department_id, owner_department_id, created_at, updated_at)
     VALUES ('weekly_work', ?, ?, ?, ?, ?, 'draft', ?, ?, NOW(), NOW())`,
    [
      fixture.departmentId,
      fixture.week,
      fixture.year,
      WEEKLY_DESCRIPTION,
      fixture.createdBy,
      fixture.departmentId,
      fixture.departmentId,
    ],
  );

  return {
    scheduleId: scheduleResult.insertId,
  };
}

async function createPublishedWeeklyScheduleFixture(connection, fixture) {
  await connection.execute(
    'DELETE FROM SCHEDULE WHERE schedule_type = ? AND department_id = ? AND week = ? AND year = ? AND description = ?',
    ['weekly_work', fixture.departmentId, fixture.week, fixture.year, fixture.description],
  );

  const [scheduleResult] = await connection.execute(
    `INSERT INTO SCHEDULE
      (schedule_type, department_id, week, year, description, created_by, status, source_department_id, owner_department_id, created_at, updated_at)
     VALUES ('weekly_work', ?, ?, ?, ?, ?, 'approved', ?, ?, NOW(), NOW())`,
    [
      fixture.departmentId,
      fixture.week,
      fixture.year,
      fixture.description,
      fixture.createdBy,
      fixture.departmentId,
      fixture.departmentId,
    ],
  );

  const scheduleId = scheduleResult.insertId;
  const [itemResult] = await connection.execute(
    `INSERT INTO WEEKLY_WORK_ITEM
      (schedule_id, work_date, time_period, content, location, created_at, updated_at)
     VALUES (?, ?, 'Sáng', ?, ?, NOW(), NOW())`,
    [scheduleId, fixture.workDate, fixture.content, fixture.location],
  );

  await connection.execute(
    `INSERT INTO WEEKLY_WORK_ASSIGNMENT (weekly_work_item_id, user_id, assigned_at)
     VALUES (?, ?, NOW())`,
    [itemResult.insertId, fixture.participantUserId],
  );

  return {
    scheduleId,
    weeklyWorkItemId: itemResult.insertId,
  };
}

async function writeMetaFile(meta) {
  const targetDir = path.join(__dirname, '..', '..', 'FE', 'e2e');
  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = path.join(targetDir, '.seed-meta.json');
  fs.writeFileSync(targetFile, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

async function main() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const khthDepartmentId = await ensureDepartment(
      connection,
      'KHTH',
      'Phòng Kế Hoạch Tổng Hợp',
      'special',
    );
    const e2eDepartmentId = await ensureDepartment(
      connection,
      E2E_DEPARTMENT_CODE,
      E2E_DEPARTMENT_NAME,
      'simple',
    );

    const roleIds = {
      clerk: await getRoleId(connection, 'CLERK'),
      staff: await getRoleId(connection, 'STAFF'),
      manager: await getRoleId(connection, 'MANAGER'),
    };

    const clerkUserId = await ensureUser(connection, {
      username: 'e2e_clerk',
      email: 'e2e_clerk@hospital.local',
      full_name: 'E2E Clerk',
      phone: '0900000001',
      employee_code: 'E2E001',
      department_id: e2eDepartmentId,
    });

    const staffUserId = await ensureUser(connection, {
      username: 'e2e_staff',
      email: 'e2e_staff@hospital.local',
      full_name: 'E2E Staff',
      phone: '0900000002',
      employee_code: 'E2E002',
      department_id: e2eDepartmentId,
    });

    const khthManagerUserId = await ensureUser(connection, {
      username: 'e2e_khth',
      email: 'e2e_khth@hospital.local',
      full_name: 'E2E KHTH Manager',
      phone: '0900000003',
      employee_code: 'E2E003',
      department_id: khthDepartmentId,
    });

    const khthStaffUserId = await ensureUser(connection, {
      username: 'e2e_khth_staff',
      email: 'e2e_khth_staff@hospital.local',
      full_name: 'E2E KHTH Staff',
      phone: '0900000004',
      employee_code: 'E2E004',
      department_id: khthDepartmentId,
    });

    await resetUserRoles(connection, clerkUserId, [
      { role_id: roleIds.clerk, scope_type: 'department', department_id: e2eDepartmentId },
      { role_id: roleIds.staff, scope_type: 'department', department_id: e2eDepartmentId },
    ]);
    await resetUserRoles(connection, staffUserId, [
      { role_id: roleIds.staff, scope_type: 'department', department_id: e2eDepartmentId },
    ]);
    await resetUserRoles(connection, khthManagerUserId, [
      { role_id: roleIds.manager, scope_type: 'department', department_id: khthDepartmentId },
    ]);
    await resetUserRoles(connection, khthStaffUserId, [
      { role_id: roleIds.staff, scope_type: 'department', department_id: khthDepartmentId },
    ]);

    const current = getIsoWeekParts();
    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const next = getIsoWeekParts(nextWeekDate);
    const dutyMonday = getMondayOfIsoWeek(current.week, current.year);

    const duty = await createDutyScheduleFixture(connection, {
      departmentId: e2eDepartmentId,
      ownerDepartmentId: khthDepartmentId,
      createdBy: clerkUserId,
      assignedUserId: staffUserId,
      week: current.week,
      year: current.year,
      shiftDate: formatDate(dutyMonday),
    });

    const weekly = await createWeeklyScheduleFixture(connection, {
      departmentId: khthDepartmentId,
      createdBy: khthStaffUserId,
      week: next.week,
      year: next.year,
    });

    const publishedWeekly = await createPublishedWeeklyScheduleFixture(connection, {
      departmentId: khthDepartmentId,
      createdBy: khthManagerUserId,
      participantUserId: khthStaffUserId,
      week: current.week,
      year: current.year,
      workDate: formatDate(dutyMonday),
      description: 'E2E Weekly Work Schedule Published',
      content: 'Hop giao ban toan vien',
      location: 'Phong hop trung tam',
    });

    await connection.commit();

    const meta = {
      baseUrl: 'http://127.0.0.1:3000',
      password: PASSWORD,
      users: {
        clerk: { username: 'e2e_clerk', password: PASSWORD },
        staff: { username: 'e2e_staff', password: PASSWORD },
        khth: { username: 'e2e_khth', password: PASSWORD },
        khthStaff: { username: 'e2e_khth_staff', password: PASSWORD },
      },
      duty: {
        week: current.week,
        year: current.year,
        departmentCode: E2E_DEPARTMENT_CODE,
        departmentName: E2E_DEPARTMENT_NAME,
        scheduleId: duty.scheduleId,
        shiftId: duty.shiftId,
        shiftDate: formatDate(dutyMonday),
      },
      weekly: {
        week: next.week,
        year: next.year,
        scheduleId: weekly.scheduleId,
        description: WEEKLY_DESCRIPTION,
      },
      publishedWeekly: {
        week: current.week,
        year: current.year,
        scheduleId: publishedWeekly.scheduleId,
        weeklyWorkItemId: publishedWeekly.weeklyWorkItemId,
      },
    };

    await writeMetaFile(meta);
    console.log(JSON.stringify(meta, null, 2));
  } catch (error) {
    await connection.rollback();
    console.error(error);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

main();
