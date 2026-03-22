import dayjs from "dayjs";

export function isoWeeksInYear(year) {
  const jan1 = dayjs(`${year}-01-01`).isoWeekday();
  const dec31 = dayjs(`${year}-12-31`).isoWeekday();
  return jan1 === 4 || dec31 === 4 ? 53 : 52;
}

export function weekDays(week, year) {
  const monday = dayjs().year(year).isoWeek(week).isoWeekday(1);
  return Array.from({ length: 7 }, (_, index) => monday.add(index, "day"));
}
