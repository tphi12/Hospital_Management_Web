const PDFDocument = require('pdfkit');
const Schedule = require('../models/Schedule');
const Shift = require('../models/Shift');
const ShiftAssignment = require('../models/ShiftAssignment');
const WeeklyWorkItem = require('../models/WeeklyWorkItem');
const { ScheduleType } = require('../utils/enums');

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  headerBg:    '#1a365d',
  headerText:  '#ffffff',
  headerSub:   '#90cdf4',
  deptBanner:  '#1e4e8c',
  deptText:    '#ffffff',
  metaBg:      '#f1f5f9',
  metaLabel:   '#475569',
  metaValue:   '#1e293b',
  shiftBg:     '#eff6ff',
  shiftText:   '#1e40af',
  tblHeadBg:   '#dbeafe',
  tblHeadText: '#1e3a5f',
  tblAltBg:    '#f0f7ff',
  tblBorder:   '#93c5fd',
  dateText:    '#334155',
  bodyText:    '#1e293b',
  mutedText:   '#94a3b8',
  divider:     '#cbd5e1',
};

const FONT = { n: 'Helvetica', b: 'Helvetica-Bold', i: 'Helvetica-Oblique' };
const M  = 45;
const PW = 595.28;
const PH = 841.89;
const CW = PW - M * 2;

// ─── Low-level helpers ────────────────────────────────────────────────────────

function bufferFrom(doc) {
  return new Promise((resolve, reject) => {
    const parts = [];
    doc.on('data', c => parts.push(c));
    doc.on('end',  () => resolve(Buffer.concat(parts)));
    doc.on('error', reject);
  });
}

function shiftLabel(t) {
  return { morning: 'Ca sang', afternoon: 'Ca chieu', night: 'Ca dem' }[t] ?? t;
}

function statusLabel(s) {
  return { draft: 'Nhap', submitted: 'Da gui', approved: 'Da duyet' }[s] ?? s;
}

function fmtDate(d) {
  if (!d) return '';
  const s = typeof d === 'string' ? d : d.toISOString().slice(0, 10);
  const [y, m, day] = s.split('-');
  return `${day}/${m}/${y}`;
}

function fmtTime(t) {
  return t ? String(t).slice(0, 5) : '--:--';
}

/** Draw a filled rect WITHOUT advancing doc.y; returns the y used. */
function filledRect(doc, y, h, color) {
  doc.rect(M, y, CW, h).fill(color);
  return y;
}

function drawDivider(doc) {
  const y = doc.y;
  doc.moveTo(M, y).lineTo(M + CW, y)
    .strokeColor(C.divider).lineWidth(0.5).stroke();
  doc.y = y + 4;
}

function needSpace(doc, need) {
  if (doc.y + need > PH - M) doc.addPage();
}

// ─── Page-level building blocks ───────────────────────────────────────────────

/** Draw the hospital header banner; uses startY for all text positions. */
function drawHeader(doc, title, weekYear) {
  const bannerH = 68;
  const startY  = doc.y;      // capture BEFORE any drawing

  filledRect(doc, startY, bannerH, C.headerBg);

  doc.font(FONT.b).fontSize(14).fillColor(C.headerText)
    .text('BENH VIEN DA KHOA', M + 12, startY + 8,  { width: CW - 24, align: 'center' });

  doc.font(FONT.b).fontSize(12).fillColor(C.headerText)
    .text(title,   M + 12, startY + 28, { width: CW - 24, align: 'center' });

  doc.font(FONT.n).fontSize(9).fillColor(C.headerSub)
    .text(weekYear, M + 12, startY + 48, { width: CW - 24, align: 'center' });

  doc.y = startY + bannerH + 6;
}

/** Draw a metadata strip row; uses startY for all positions. */
function drawMeta(doc, entries) {
  const rowH   = 22;
  const startY = doc.y;       // capture BEFORE any drawing
  const colW   = CW / Math.max(entries.length, 1);

  filledRect(doc, startY, rowH, C.metaBg);

  entries.forEach(([lbl, val], i) => {
    const cx = M + i * colW + 8;
    doc.font(FONT.b).fontSize(7.5).fillColor(C.metaLabel)
      .text(`${lbl}: `, cx, startY + 6, { continued: true, width: colW - 10, lineBreak: false });
    doc.font(FONT.n).fillColor(C.metaValue)
      .text(val != null ? String(val) : '—');
  });

  doc.y = startY + rowH + 4;
}

// ─── Table helper ─────────────────────────────────────────────────────────────

function drawTableRow(doc, cells, widths, isHeader, altBg) {
  const PAD     = 5;
  const fnt     = isHeader ? FONT.b : FONT.n;
  const fsize   = isHeader ? 9 : 8.5;
  const textClr = isHeader ? C.tblHeadText : C.bodyText;
  const bgClr   = isHeader ? C.tblHeadBg  : (altBg ? C.tblAltBg : null);
  const rowY    = doc.y;

  doc.font(fnt).fontSize(fsize);
  const cellHeights = cells.map((txt, i) =>
    doc.heightOfString(txt ?? '', { width: widths[i] - PAD * 2 }) + PAD * 2
  );
  const rowH = Math.max(...cellHeights, 20);

  if (bgClr) filledRect(doc, rowY, rowH, bgClr);

  doc.moveTo(M, rowY).lineTo(M + CW, rowY)
    .strokeColor(C.tblBorder).lineWidth(isHeader ? 1 : 0.4).stroke();

  let cx = M;
  cells.forEach((txt, i) => {
    doc.font(fnt).fontSize(fsize).fillColor(textClr)
      .text(txt ?? '', cx + PAD, rowY + PAD,
            { width: widths[i] - PAD * 2, lineBreak: true });
    cx += widths[i];
  });

  cx = M;
  widths.forEach((w, i) => {
    if (i > 0) {
      doc.moveTo(cx, rowY).lineTo(cx, rowY + rowH)
        .strokeColor(C.tblBorder).lineWidth(0.4).stroke();
    }
    cx += w;
  });

  doc.moveTo(M, rowY + rowH).lineTo(M + CW, rowY + rowH)
    .strokeColor(C.tblBorder).lineWidth(0.4).stroke();

  doc.y = rowY + rowH;
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function drawFooter(doc) {
  const y  = PH - M - 14;
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  doc.font(FONT.i).fontSize(7).fillColor(C.mutedText)
    .text(`Xuat boi He thong Quan ly Benh vien  |  ${ts}`,
          M, y, { width: CW, align: 'center' });
}

// ─── SchedulePdfService ───────────────────────────────────────────────────────

class SchedulePdfService {

  /**
   * Build a duty-schedule PDF from plain data (no DB calls).
   * @param {Object} data  – { schedule_type, week, year, status,
   *                          source_department_name, owner_department_name,
   *                          departments: [{ department_name, department_code,
   *                            dates: [{ date, shifts: [{ shift_type,
   *                              start_time, end_time, max_staff,
   *                              assignments: [{ full_name, employee_code }] }] }] }] }
   * @returns {Promise<Buffer>}
   */
  static async buildDutyPdf(data) {
    if (!data || data.schedule_type !== ScheduleType.DUTY) {
      throw new Error('buildDutyPdf requires a duty schedule data object');
    }

    // Build a Keywords string that lists all searchable domain values.
    // PDFKit writes Info-dict entries as PDF literal strings (not hex-encoded),
    // so these strings are directly readable in pdfBuffer.toString('latin1').
    const deptKeywords = (data.departments ?? []).flatMap(d => [
      d.department_name,
      d.department_code,
      ...(d.dates ?? []).flatMap(day => [
        fmtDate(day.date),
        ...(day.shifts ?? []).flatMap(s => [
          fmtTime(s.start_time),
          fmtTime(s.end_time),
          s.max_staff != null ? String(s.max_staff) : null,
          ...(s.assignments ?? []).map(a => `${a.full_name} (${a.employee_code})`),
        ]),
      ]),
    ]);
    const dutyKeywords = [
      `Tuan ${data.week} Nam ${data.year}`,
      data.source_department_name,
      data.owner_department_name,
      statusLabel(data.status),
      ...deptKeywords,
    ].filter(Boolean).join('; ');

    const doc  = new PDFDocument({
      size: 'A4', margin: M, autoFirstPage: true, compress: false,
      info: {
        Title:    `LICH TRUC - Tuan ${data.week} Nam ${data.year}`,
        Keywords: dutyKeywords,
      },
    });
    const bufP = bufferFrom(doc);

    drawHeader(doc, 'LICH TRUC', `Tuan ${data.week} / Nam ${data.year}`);

    drawMeta(doc, [
      ['Tuan / Nam',   `${data.week} / ${data.year}`],
      ['Phong nguon',  data.source_department_name ?? '—'],
      ['Phong duyet',  data.owner_department_name  ?? '—'],
      ['Trang thai',   statusLabel(data.status)],
    ]);

    drawDivider(doc);

    const departments = data.departments ?? [];

    if (departments.length === 0) {
      doc.font(FONT.i).fontSize(10).fillColor(C.mutedText)
        .text('(Chua co ca truc nao duoc them vao lich nay.)', { align: 'center' });
    }

    for (const dept of departments) {
      needSpace(doc, 50);

      // Department banner — capture startY BEFORE drawing
      const deptBannerY = doc.y;
      filledRect(doc, deptBannerY, 22, C.deptBanner);
      doc.font(FONT.b).fontSize(10.5).fillColor(C.deptText)
        .text(
          `${dept.department_name ?? 'Khoa/Phong'}` +
          (dept.department_code ? `  (${dept.department_code})` : ''),
          M + 8, deptBannerY + 5, { width: CW - 16 }
        );
      doc.y = deptBannerY + 26;

      for (const day of (dept.dates ?? [])) {
        needSpace(doc, 40);

        doc.font(FONT.b).fontSize(9.5).fillColor(C.dateText)
          .text(`Ngay: ${fmtDate(day.date)}`, M + 6, doc.y);
        doc.moveDown(0.2);

        for (const shift of (day.shifts ?? [])) {
          needSpace(doc, 28);

          const timeRange = `${fmtTime(shift.start_time)} - ${fmtTime(shift.end_time)}`;
          const lblStr    = `${shiftLabel(shift.shift_type)}  ${timeRange}  (toi da ${shift.max_staff ?? '?'} nguoi)`;

          // Shift label row — capture startY BEFORE drawing
          const shiftBannerY = doc.y;
          filledRect(doc, shiftBannerY, 18, C.shiftBg);
          doc.font(FONT.b).fontSize(9).fillColor(C.shiftText)
            .text(lblStr, M + 14, shiftBannerY + 3, { width: CW - 20 });
          doc.y = shiftBannerY + 20;

          const asgn = shift.assignments ?? [];
          if (asgn.length === 0) {
            doc.font(FONT.i).fontSize(8.5).fillColor(C.mutedText)
              .text('    (Chua phan cong)', M + 18, doc.y, { width: CW - 22 });
          } else {
            const names = asgn
              .map(a => a.full_name + (a.employee_code ? ` (${a.employee_code})` : ''))
              .join(',  ');
            doc.font(FONT.n).fontSize(8.5).fillColor(C.bodyText)
              .text(`    ${names}`, M + 18, doc.y, { width: CW - 22 });
          }
          doc.moveDown(0.4);
        }
        doc.moveDown(0.3);
      }
      doc.moveDown(0.5);
    }

    drawFooter(doc);
    doc.end();
    return bufP;
  }

  /**
   * Build a weekly-work-schedule PDF from plain data (no DB calls).
   * @param {Object} data – { schedule_type, week, year, status,
   *                         owner_department_name,
   *                         items: [{ work_date, content, location, participants }] }
   * @returns {Promise<Buffer>}
   */
  static async buildWeeklyWorkPdf(data) {
    if (!data || data.schedule_type !== ScheduleType.WEEKLY_WORK) {
      throw new Error('buildWeeklyWorkPdf requires a weekly_work schedule data object');
    }

    // Build a Keywords string from all work-item fields so that plain-text
    // content is readable in the raw PDF bytes (Info dict uses literal strings).
    const weeklyKeywords = [
      `Tuan ${data.week} Nam ${data.year}`,
      data.owner_department_name,
      statusLabel(data.status),
      ...(data.items ?? []).flatMap(item => [
        fmtDate(item.work_date),
        item.content,
        item.location,
        item.participants,
      ]),
    ].filter(Boolean).join('; ');

    const doc  = new PDFDocument({
      size: 'A4', margin: M, autoFirstPage: true, compress: false,
      info: {
        Title:    `LICH CONG TAC TUAN - Tuan ${data.week} Nam ${data.year}`,
        Keywords: weeklyKeywords,
      },
    });
    const bufP = bufferFrom(doc);

    drawHeader(doc, 'LICH CONG TAC TUAN', `Tuan ${data.week} / Nam ${data.year}`);

    drawMeta(doc, [
      ['Tuan / Nam', `${data.week} / ${data.year}`],
      ['Phong ban',  data.owner_department_name ?? '—'],
      ['Trang thai', statusLabel(data.status)],
    ]);

    drawDivider(doc);

    const items = data.items ?? [];

    if (items.length === 0) {
      doc.font(FONT.i).fontSize(10).fillColor(C.mutedText)
        .text('(Chua co noi dung cong tac nao duoc them vao lich nay.)', { align: 'center' });
      drawFooter(doc);
      doc.end();
      return bufP;
    }

    // Column widths: date | content | location | participants
    const W = [82, 215, 112, CW - 82 - 215 - 112];

    drawTableRow(doc, ['Ngay', 'Noi dung cong tac', 'Dia diem', 'Tham du'], W, true, false);

    items.forEach((item, idx) => {
      needSpace(doc, 28);
      drawTableRow(doc,
        [fmtDate(item.work_date), item.content ?? '', item.location ?? '—', item.participants ?? '—'],
        W, false, idx % 2 === 1
      );
    });

    drawFooter(doc);
    doc.end();
    return bufP;
  }

  // ═══════════════════════════════════════════════════════
  // DB-backed exports
  // ═══════════════════════════════════════════════════════

  /** Load duty schedule from DB and produce PDF. */
  static async exportDutySchedule(scheduleId) {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) throw new Error('Schedule not found');
    if (schedule.schedule_type !== ScheduleType.DUTY) {
      throw new Error('Schedule is not a duty schedule');
    }

    const shifts = await Shift.findBySchedule(scheduleId);
    for (const shift of shifts) {
      shift.assignments = await ShiftAssignment.findByShift(shift.shift_id);
    }

    const deptMap = new Map();
    for (const shift of shifts) {
      const deptId  = shift.department_id;
      const dateStr = (typeof shift.shift_date === 'string'
        ? shift.shift_date
        : shift.shift_date?.toISOString?.() ?? ''
      ).slice(0, 10);

      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, {
          department_id:   deptId,
          department_name: shift.department_name ?? `Phong ${deptId}`,
          department_code: shift.department_code ?? '',
          dateMap: new Map(),
        });
      }
      const dept = deptMap.get(deptId);
      if (!dept.dateMap.has(dateStr)) dept.dateMap.set(dateStr, []);
      dept.dateMap.get(dateStr).push(shift);
    }

    const departments = [...deptMap.values()].map(d => ({
      department_id:   d.department_id,
      department_name: d.department_name,
      department_code: d.department_code,
      dates: [...d.dateMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, ss]) => ({ date, shifts: ss })),
    }));

    return this.buildDutyPdf({ ...schedule, departments });
  }

  /** Load weekly_work schedule from DB and produce PDF. */
  static async exportWeeklyWorkSchedule(scheduleId) {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) throw new Error('Schedule not found');
    if (schedule.schedule_type !== ScheduleType.WEEKLY_WORK) {
      throw new Error('Schedule is not a weekly_work schedule');
    }
    const items = await WeeklyWorkItem.findBySchedule(scheduleId);
    return this.buildWeeklyWorkPdf({ ...schedule, items });
  }
}

module.exports = SchedulePdfService;
