/**
 * scheduleApi.ts
 * Typed API layer for the Schedule module.
 *
 * Uses the shared axios instance (apiClient) from src/services/api.js.
 * Every function wraps the request in a try/catch and returns a typed
 * ApiResponse<T> so callers never need to handle raw AxiosError.
 */

import apiClient from '../../../services/api';
import type { AxiosResponse } from 'axios';

// Import domain types for use in payloads and re-export for consumers.
import type {
  ScheduleType,
  ScheduleStatus,
  ShiftType,
  Schedule,
  Shift,
  ShiftAssignment,
  WeeklyWorkItem,
} from '../types';

export type {
  ScheduleType,
  ScheduleStatus,
  ShiftType,
  Schedule,
  Shift,
  ShiftAssignment,
  WeeklyWorkItem,
};

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface ScheduleQueryParams {
  week?: number;
  year?: number;
  schedule_type?: ScheduleType;
  department_id?: number;
  status?: ScheduleStatus;
  source_department_id?: number;
}

export interface CreateDutySchedulePayload {
  week:         number;
  year:         number;
  description?: string;
  /** Source department; the backend derives from authenticated user if omitted */
  department_id?: number;
}

export interface AddShiftPayload {
  schedule_id:   number;
  department_id: number;
  shift_date:    string;        // YYYY-MM-DD
  shift_type:    ShiftType;
  start_time:    string;        // HH:MM
  end_time:      string;
  max_staff:     number;
  notes?:        string;
  staff_ids?:    number[];
}

export interface UpdateShiftPayload {
  shift_date?: string;
  shift_type?: ShiftType;
  start_time?: string;
  end_time?: string;
  max_staff?: number;
  note?: string;
}

export interface AssignUserToShiftPayload {
  shift_id: number;
  user_id:  number;
  note?:    string;
}

export interface CreateWeeklyWorkSchedulePayload {
  week: number;
  year: number;
  description?: string;
}

export interface AddWeeklyWorkItemPayload {
  schedule_id: number;
  work_date: string;
  time_period?: string;
  content: string;
  location?: string;
  participantIds?: number[] | null;
}

// ─── Response wrapper ─────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success:  boolean;
  data?:    T;
  message?: string;
  error?:   string;
}

// ─── Internal helper ──────────────────────────────────────────────────────────

async function request<T>(
  call: () => Promise<AxiosResponse<ApiResponse<T>>>,
): Promise<ApiResponse<T>> {
  try {
    const res = await call();
    return res.data;
  } catch (err: unknown) {
    // Axios wraps HTTP error responses in err.response.data
    if (
      err !== null &&
      typeof err === 'object' &&
      'response' in err &&
      err.response !== null &&
      typeof err.response === 'object' &&
      'data' in err.response
    ) {
      return err.response.data as ApiResponse<T>;
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}

// ─── Schedule API ─────────────────────────────────────────────────────────────

/**
 * Fetch all schedules matching a given week, year and optional type.
 *
 * GET /schedules?week=&year=&schedule_type=
 */
export async function getSchedulesByWeek(
  week: number,
  year: number,
  type?: ScheduleType,
): Promise<ApiResponse<Schedule[]>> {
  return request(() =>
    apiClient.get('/schedules', {
      params: {
        week,
        year,
        ...(type ? { schedule_type: type } : {}),
      },
    }),
  );
}

export async function getSchedules(
  params: ScheduleQueryParams = {},
): Promise<ApiResponse<Schedule[]>> {
  return request(() => apiClient.get('/schedules', { params }));
}

/**
 * Create a new duty schedule for the authenticated user's department.
 *
 * POST /schedules
 */
export async function createDutySchedule(
  data: CreateDutySchedulePayload,
): Promise<ApiResponse<Schedule>> {
  return request(() =>
    apiClient.post('/schedules', { ...data, schedule_type: 'duty' }),
  );
}

/**
 * Submit a draft duty schedule to KHTH for approval.
 *
 * PATCH /schedules/:id/submit
 */
export async function submitSchedule(
  id: number,
): Promise<ApiResponse<void>> {
  return request(() => apiClient.patch(`/schedules/${id}/submit`));
}

/**
 * Approve a submitted schedule (KHTH department only).
 *
 * PATCH /schedules/:id/approve
 */
export async function approveSchedule(
  id: number,
): Promise<ApiResponse<void>> {
  return request(() => apiClient.patch(`/schedules/${id}/approve`));
}

export async function deleteSchedule(
  id: number,
): Promise<ApiResponse<void>> {
  return request(() => apiClient.delete(`/schedules/${id}`));
}

/**
 * Add a shift to an existing duty schedule.
 *
 * POST /shifts
 */
export async function addShift(
  data: AddShiftPayload,
): Promise<ApiResponse<Shift>> {
  return request(() => apiClient.post('/shifts', data));
}

export async function updateShift(
  shiftId: number,
  data: UpdateShiftPayload,
): Promise<ApiResponse<Shift>> {
  return request(() => apiClient.put(`/shifts/${shiftId}`, data));
}

export async function deleteShift(
  shiftId: number,
): Promise<ApiResponse<void>> {
  return request(() => apiClient.delete(`/shifts/${shiftId}`));
}

/**
 * Assign a user to a specific shift.
 *
 * POST /shifts/:shiftId/assign
 */
export async function assignUserToShift(
  data: AssignUserToShiftPayload,
): Promise<ApiResponse<ShiftAssignment>> {
  const { shift_id, ...body } = data;
  return request(() => apiClient.post(`/shifts/${shift_id}/assign`, body));
}

/**
 * Fetch all weekly_work schedules for a given week / year.
 *
 * GET /schedules?week=&year=&schedule_type=weekly_work
 */
export async function getWeeklyWorkSchedule(
  week: number,
  year: number,
): Promise<ApiResponse<Schedule[]>> {
  return getSchedules({ week, year, schedule_type: 'weekly_work' });
}

export async function createWeeklyWorkSchedule(
  data: CreateWeeklyWorkSchedulePayload,
): Promise<ApiResponse<Schedule>> {
  return request(() =>
    apiClient.post('/schedules', { ...data, schedule_type: 'weekly_work' }),
  );
}

export async function getWeeklyWorkItems(
  scheduleId: number,
): Promise<ApiResponse<WeeklyWorkItem[]>> {
  return request(() => apiClient.get(`/schedules/${scheduleId}/weekly-items`));
}

export async function getWeeklyWorkItemById(
  scheduleId: number,
  itemId: number,
): Promise<ApiResponse<WeeklyWorkItem>> {
  return request(() => apiClient.get(`/schedules/${scheduleId}/weekly-items/${itemId}`));
}

/**
 * Add a work item entry to a weekly_work schedule.
 *
 * POST /schedules/:scheduleId/weekly-items
 */
export async function addWeeklyWorkItem(
  data: AddWeeklyWorkItemPayload,
): Promise<ApiResponse<WeeklyWorkItem>> {
  const { schedule_id, ...body } = data;
  return request(() =>
    apiClient.post(`/schedules/${schedule_id}/weekly-items`, body),
  );
}

export async function updateWeeklyWorkItem(
  scheduleId: number,
  itemId: number,
  data: Omit<AddWeeklyWorkItemPayload, 'schedule_id'>,
): Promise<ApiResponse<WeeklyWorkItem>> {
  return request(() =>
    apiClient.put(`/schedules/${scheduleId}/weekly-items/${itemId}`, data),
  );
}

export async function deleteWeeklyWorkItem(
  scheduleId: number,
  itemId: number,
): Promise<ApiResponse<void>> {
  return request(() => apiClient.delete(`/schedules/${scheduleId}/weekly-items/${itemId}`));
}

export async function importWeeklyWorkItems(
  scheduleId: number,
  file: File,
): Promise<ApiResponse<WeeklyWorkItem[]>> {
  const formData = new FormData();
  formData.append('file', file);

  return request(() =>
    apiClient.post(`/schedules/${scheduleId}/weekly-items/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
}

/**
 * Export a schedule as a PDF and return the raw Blob.
 * The caller is responsible for triggering a browser download.
 *
 * GET /schedules/:scheduleId/export/pdf
 *
 * @example
 * const res = await exportSchedulePdf(42);
 * if (res.success && res.data) {
 *   const url = URL.createObjectURL(res.data);
 *   const a   = document.createElement('a');
 *   a.href    = url;
 *   a.download = `schedule-${42}.pdf`;
 *   a.click();
 *   URL.revokeObjectURL(url);
 * }
 */
export async function exportSchedulePdf(
  scheduleId: number,
): Promise<ApiResponse<Blob>> {
  try {
    const res = await apiClient.get<Blob>(
      `/schedules/${scheduleId}/export/pdf`,
      { responseType: 'blob' },
    );
    return { success: true, data: res.data };
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'response' in err &&
      err.response !== null &&
      typeof err.response === 'object' &&
      'data' in err.response
    ) {
      return err.response.data as ApiResponse<Blob>;
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Export failed',
    };
  }
}

/**
 * Export consolidated duty schedule PDF of all approved departments in a week.
 *
 * GET /schedules/master/export/pdf?week=&year=
 */
export async function exportMasterDutySchedulePdf(
  week: number,
  year: number,
): Promise<ApiResponse<Blob>> {
  try {
    const res = await apiClient.get<Blob>(
      '/schedules/master/export/pdf',
      {
        params: { week, year },
        responseType: 'blob',
      },
    );
    return { success: true, data: res.data };
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'response' in err &&
      err.response !== null &&
      typeof err.response === 'object' &&
      'data' in err.response
    ) {
      return err.response.data as ApiResponse<Blob>;
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Export failed',
    };
  }
}
