/**
 * useScheduleQuery.js
 * React Query hooks for the Schedule module.
 *
 * All hooks share a single query key namespace ("schedules") so that
 * any mutation can bust exactly the right query with one
 * `queryClient.invalidateQueries` call — giving automatic refetch after
 * every successful create / submit / approve.
 *
 * ─── Query key factory ────────────────────────────────────────────────
 *
 *   scheduleKeys.all()              → ['schedules']
 *   scheduleKeys.byWeek(w, y, t)    → ['schedules', { week, year, type }]
 *
 * Keys are plain arrays / objects so React Query's fuzzy matching lets
 * `invalidateQueries({ queryKey: scheduleKeys.all() })` invalidate every
 * schedule query regardless of week/year/type params.
 *
 * ─── Error contract ───────────────────────────────────────────────────
 *
 * The raw `scheduleApi` functions return `ApiResponse<T>` (always resolve,
 * never throw). Inside each `queryFn` / `mutationFn` we inspect `success`
 * and throw a plain `Error` when it is false. This converts an API-level
 * failure into a React Query error so consumers can read `query.error` or
 * `mutation.error` normally and not also have to inspect `success`.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  getSchedulesByWeek,
  createDutySchedule,
  submitSchedule,
  approveSchedule,
  addShift,
} from '../api/scheduleApi';

// ─── Query key factory ────────────────────────────────────────────────────────

/**
 * Centralised key descriptors.
 * Using an object factory keeps keys consistent across queries and mutations.
 */
export const scheduleKeys = {
  /** Root key — matches ALL schedule queries (useful for broad invalidation). */
  all: () => ['schedules'],

  /**
   * Scoped key for a specific week / year / type combination.
   * Passing `type` as `undefined` is fine; Object.is equality still works.
   */
  byWeek: (week, year, type) => ['schedules', { week, year, type }],
};

// ─── useScheduleQuery ─────────────────────────────────────────────────────────

/**
 * Fetch all schedules matching a given week, year, and optional schedule type.
 *
 * The query is disabled until both `week` and `year` are non-null so the hook
 * is safe to call before the week navigator has been initialised.
 *
 * @param {number|null} week  – ISO week number (1–53)
 * @param {number|null} year  – Full year (e.g. 2025)
 * @param {'duty'|'weekly_work'|undefined} [type]  – Optional schedule type filter
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<
 *   import('../api/scheduleApi').Schedule[],
 *   Error
 * >}
 *
 * @example
 * const { data: schedules = [], isLoading, error } = useScheduleQuery(week, year, 'duty');
 */
export function useScheduleQuery(week, year, type) {
  return useQuery({
    queryKey: scheduleKeys.byWeek(week, year, type),

    queryFn: async () => {
      const res = await getSchedulesByWeek(week, year, type);
      if (!res.success) {
        throw new Error(res.message ?? 'Không thể tải lịch');
      }
      return res.data ?? [];
    },

    // Don't fetch until the caller has a real week and year
    enabled: week != null && year != null,
  });
}

// ─── useCreateScheduleMutation ────────────────────────────────────────────────

/**
 * Create a new duty schedule.
 *
 * Automatically invalidates the `scheduleKeys.all()` namespace on success,
 * triggering a background refetch of every active `useScheduleQuery`.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<
 *   import('../api/scheduleApi').Schedule,
 *   Error,
 *   import('../api/scheduleApi').CreateDutySchedulePayload
 * >}
 *
 * @example
 * const createMutation = useCreateScheduleMutation();
 *
 * await createMutation.mutateAsync({
 *   week: 10, year: 2025, description: 'Tuần 10 – Khoa Nội',
 * });
 */
export function useCreateScheduleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await createDutySchedule(payload);
      if (!res.success) {
        throw new Error(res.message ?? 'Tạo lịch thất bại');
      }
      return res.data;
    },

    onSuccess: () => {
      message.success('Tạo lịch trực thành công');
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all() });
    },
    onError: (err) => {
      message.error(err?.message ?? 'Tạo lịch thất bại');
    },
  });
}

// ─── useSubmitScheduleMutation ────────────────────────────────────────────────

/**
 * Submit a draft schedule to KHTH for approval.
 *
 * Automatically invalidates `scheduleKeys.all()` on success.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<
 *   void,
 *   Error,
 *   number   ← scheduleId
 * >}
 *
 * @example
 * const submitMutation = useSubmitScheduleMutation();
 *
 * await submitMutation.mutateAsync(schedule.schedule_id);
 */
export function useSubmitScheduleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId) => {
      const res = await submitSchedule(scheduleId);
      if (!res.success) {
        throw new Error(res.message ?? 'Gửi lịch thất bại');
      }
    },

    onSuccess: () => {
      message.success('Gửi lịch thành công. KHTH sẽ xem xét và duyệt sớm.');
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all() });
    },
    onError: (err) => {
      message.error(err?.message ?? 'Gửi lịch thất bại');
    },
  });
}

// ─── useApproveScheduleMutation ───────────────────────────────────────────────

/**
 * Approve a submitted schedule (KHTH / MANAGER only).
 *
 * Automatically invalidates `scheduleKeys.all()` on success.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<
 *   void,
 *   Error,
 *   number   ← scheduleId
 * >}
 *
 * @example
 * const approveMutation = useApproveScheduleMutation();
 *
 * await approveMutation.mutateAsync(schedule.schedule_id);
 */
export function useApproveScheduleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId) => {
      const res = await approveSchedule(scheduleId);
      if (!res.success) {
        throw new Error(res.message ?? 'Duyệt lịch thất bại');
      }
    },

    onSuccess: () => {
      message.success('Duyệt lịch trực thành công.');
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all() });
    },
    onError: (err) => {
      message.error(err?.message ?? 'Duyệt lịch thất bại');
    },
  });
}

// ─── useAddShiftMutation ──────────────────────────────────────────────────────

/**
 * Add a new shift (ca trực) to an existing duty schedule.
 *
 * Payload shape: AddShiftPayload from scheduleApi.ts
 *   { schedule_id, department_id, shift_date, shift_type,
 *     start_time, end_time, max_staff, notes? }
 *
 * Automatically invalidates `scheduleKeys.all()` on success so any
 * active `useScheduleQuery` view re-fetches with the new shift.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useAddShiftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await addShift(payload);
      if (!res.success) {
        throw new Error(res.message ?? 'Thêm ca trực thất bại');
      }
      return res.data;
    },

    onSuccess: () => {
      message.success('Thêm ca trực thành công');
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all() });
    },
    onError: (err) => {
      message.error(err?.message ?? 'Thêm ca trực thất bại');
    },
  });
}
