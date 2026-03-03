import { useState, useEffect, useCallback, useRef } from "react";
import {
  getSchedulesByWeek,
  createDutySchedule,
  submitSchedule,
  approveSchedule,
} from "../api/scheduleApi";

/**
 * useSchedule(week, year, type)
 *
 * Central hook for all schedule data-fetching and mutations.
 *
 * @param {number}                          week  – ISO week number (1-53)
 * @param {number}                          year  – Full year (e.g. 2025)
 * @param {'duty'|'weekly_work'|undefined}  type  – Schedule type filter (optional)
 *
 * @returns {{
 *   schedule : import('../api/scheduleApi').Schedule | null,
 *   loading  : boolean,
 *   error    : string | null,
 *   refresh  : () => void,
 *   create   : (payload?: Partial<import('../api/scheduleApi').CreateDutySchedulePayload>) => Promise<{success:boolean, message?:string}>,
 *   submit   : () => Promise<{success:boolean, message?:string}>,
 *   approve  : () => Promise<{success:boolean, message?:string}>,
 * }}
 *
 * Usage
 * -----
 *   const { schedule, loading, error, refresh, create, submit, approve } =
 *     useSchedule(currentWeek, currentYear, 'duty');
 *
 *   // Create then immediately reflect the new schedule:
 *   const res = await create({ description: 'Tuần 10 – Khoa Nội' });
 *   if (!res.success) message.error(res.message);
 *
 *   // Derived helpers that components often compute themselves:
 *   const isDraft     = schedule?.status === 'draft';
 *   const isSubmitted = schedule?.status === 'submitted';
 *   const isApproved  = schedule?.status === 'approved';
 */
export function useSchedule(week, year, type) {
  const [schedule, setSchedule] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // Track the latest fetch so a stale one can be ignored when params change
  // while a request is still in flight.
  const fetchCountRef = useRef(0);

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetch = useCallback(async () => {
    if (week == null || year == null) return;

    const token = ++fetchCountRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await getSchedulesByWeek(week, year, type);

      // Discard result if a newer fetch has been triggered
      if (token !== fetchCountRef.current) return;

      if (res.success) {
        const list = res.data ?? [];
        // Surface the first item; pages can further filter by dept if needed.
        setSchedule(list[0] ?? null);
      } else {
        setError(res.message ?? "Không thể tải lịch");
        setSchedule(null);
      }
    } catch (err) {
      if (token !== fetchCountRef.current) return;
      setError(err?.message ?? "Lỗi kết nối máy chủ");
      setSchedule(null);
    } finally {
      if (token === fetchCountRef.current) setLoading(false);
    }
  }, [week, year, type]);

  useEffect(() => { fetch(); }, [fetch]);

  // ─── refresh ────────────────────────────────────────────────────────────

  /** Force a re-fetch with the current week/year/type. */
  const refresh = useCallback(() => { fetch(); }, [fetch]);

  // ─── create ─────────────────────────────────────────────────────────────

  /**
   * Create a new duty schedule for the current week/year.
   *
   * @param {Partial<import('../api/scheduleApi').CreateDutySchedulePayload>} [extra]
   *   Additional fields to merge into the payload (e.g. description).
   * @returns {Promise<{success:boolean, message?:string}>}
   */
  const create = useCallback(
    async (extra = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await createDutySchedule({ week, year, ...extra });
        if (res.success) {
          // Immediately reflect the newly created schedule without a round-trip
          setSchedule(res.data ?? null);
          return { success: true };
        }
        const msg = res.message ?? "Tạo lịch thất bại";
        setError(msg);
        return { success: false, message: msg };
      } catch (err) {
        const msg = err?.message ?? "Lỗi kết nối máy chủ";
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setLoading(false);
      }
    },
    [week, year],
  );

  // ─── submit ─────────────────────────────────────────────────────────────

  /**
   * Submit the current schedule to KHTH.
   * No-ops if there is no loaded schedule.
   *
   * @returns {Promise<{success:boolean, message?:string}>}
   */
  const submit = useCallback(async () => {
    if (!schedule?.schedule_id) {
      return { success: false, message: "Không có lịch để gửi" };
    }
    setLoading(true);
    setError(null);
    try {
      const res = await submitSchedule(schedule.schedule_id);
      if (res.success) {
        // Optimistically update status; a full refresh follows
        setSchedule((prev) => prev ? { ...prev, status: "submitted" } : prev);
        await fetch();
        return { success: true };
      }
      const msg = res.message ?? "Gửi lịch thất bại";
      setError(msg);
      return { success: false, message: msg };
    } catch (err) {
      const msg = err?.message ?? "Lỗi kết nối máy chủ";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [schedule, fetch]);

  // ─── approve ────────────────────────────────────────────────────────────

  /**
   * Approve the current submitted schedule (KHTH only).
   * No-ops if there is no loaded schedule.
   *
   * @returns {Promise<{success:boolean, message?:string}>}
   */
  const approve = useCallback(async () => {
    if (!schedule?.schedule_id) {
      return { success: false, message: "Không có lịch để duyệt" };
    }
    setLoading(true);
    setError(null);
    try {
      const res = await approveSchedule(schedule.schedule_id);
      if (res.success) {
        setSchedule((prev) => prev ? { ...prev, status: "approved" } : prev);
        await fetch();
        return { success: true };
      }
      const msg = res.message ?? "Duyệt lịch thất bại";
      setError(msg);
      return { success: false, message: msg };
    } catch (err) {
      const msg = err?.message ?? "Lỗi kết nối máy chủ";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [schedule, fetch]);

  // ─── Return ─────────────────────────────────────────────────────────────

  return {
    /** The loaded schedule (null if not found or not yet fetched). */
    schedule,
    /** True while any network request is in flight. */
    loading,
    /** Last error message string, or null if no error. */
    error,
    /** Re-fetch the schedule with the current week/year/type. */
    refresh,
    /** Create a duty schedule for this week/year. Resolves {success, message?} */
    create,
    /** Submit the loaded draft schedule. Resolves {success, message?} */
    submit,
    /** Approve the loaded submitted schedule. Resolves {success, message?} */
    approve,
  };
}

export default useSchedule;
