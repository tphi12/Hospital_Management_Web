/**
 * downloadSchedulePdf.js
 *
 * Calls exportSchedulePdf(scheduleId), receives the Blob, and triggers a
 * browser file-save dialog with the standardised filename pattern:
 *
 *   Duty_Schedule_Week_<week>_<year>.pdf
 *
 * Returns a result object so callers can show success/error feedback
 * without every call site duplicating try/catch.
 *
 * @param {object} schedule – Schedule object containing at minimum:
 *   { schedule_id: number, week: number, year: number }
 *
 * @returns {Promise<{ success: boolean, message?: string }>}
 *
 * @example
 * import { downloadSchedulePdf } from '../utils/downloadSchedulePdf';
 *
 * const result = await downloadSchedulePdf(schedule);
 * if (!result.success) message.error(result.message);
 */

import { exportSchedulePdf } from '../api/scheduleApi';

export async function downloadSchedulePdf(schedule) {
  if (!schedule?.schedule_id) {
    return { success: false, message: 'Không có lịch để xuất PDF' };
  }

  let res;
  try {
    res = await exportSchedulePdf(schedule.schedule_id);
  } catch (err) {
    return {
      success: false,
      message: err?.message ?? 'Lỗi kết nối khi xuất PDF',
    };
  }

  if (!res.success || !res.data) {
    return { success: false, message: res.message ?? 'Xuất PDF thất bại' };
  }

  // ── Trigger browser download ───────────────────────────────────────────
  const filename = `Duty_Schedule_Week_${schedule.week}_${schedule.year}.pdf`;
  const url      = URL.createObjectURL(res.data);

  const anchor      = document.createElement('a');
  anchor.href       = url;
  anchor.download   = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Revoke after a short delay so the browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 10_000);

  return { success: true };
}
