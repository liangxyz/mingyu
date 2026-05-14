/**
 * 日期时间工具函数
 */

export function getTimeIndexFromClock(hour: number, minute = 0): number {
  if (hour === 23) return 12;
  if (hour === 0) return 0;
  if (hour >= 1 && hour < 3) return 1;
  if (hour >= 3 && hour < 5) return 2;
  if (hour >= 5 && hour < 7) return 3;
  if (hour >= 7 && hour < 9) return 4;
  if (hour >= 9 && hour < 11) return 5;
  if (hour >= 11 && hour < 13) return 6;
  if (hour >= 13 && hour < 15) return 7;
  if (hour >= 15 && hour < 17) return 8;
  if (hour >= 17 && hour < 19) return 9;
  if (hour >= 19 && hour < 21) return 10;
  if (hour >= 21 && hour < 23) return 11;

  if (hour === 24 && minute === 0) {
    return 12;
  }

  return -1;
}

/**
 * 检查是否为闰年
 * @param year 年份
 * @returns 是否为闰年
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * 获取月份的天数
 * @param year 年份
 * @param month 月份 (1-12)
 * @returns 该月份的天数
 */
export function getDaysInMonth(year: number, month: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return daysInMonth[month - 1];
}
