import { SolarTime } from 'tyme4ts';

export function getDayHourBreakdown(year: number, month: number, day: number) {
  const previousDate = new Date(year, month - 1, day - 1);
  const entries = [
    {
      year: previousDate.getFullYear(),
      month: previousDate.getMonth() + 1,
      day: previousDate.getDate(),
      hour: 23,
      label: '晚子时',
      timeRange: `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${String(previousDate.getDate()).padStart(2, '0')} 23:00-23:59`,
    },
    {
      year,
      month,
      day,
      hour: 0,
      label: '早子时',
      timeRange: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 00:00-00:59`,
    },
    {
      year,
      month,
      day,
      hour: 2,
      label: '丑时',
      timeRange: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 01:00-02:59`,
    },
    {
      year,
      month,
      day,
      hour: 4,
      label: '寅时',
      timeRange: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 03:00-04:59`,
    },
    {
      year,
      month,
      day,
      hour: 6,
      label: '卯时',
      timeRange: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 05:00-06:59`,
    },
    {
      year,
      month,
      day,
      hour: 8,
      label: '辰时',
      timeRange: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 07:00-08:59`,
    },
    {
      year,
      month,
      day,
      hour: 10,
      label: '巳时',
      timeRange: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 09:00-10:59`,
    },
    {
      year,
      month,
      day,
      hour: 12,
      label: '午时',
      timeRange: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 11:00-12:59`,
    },
    {
      year,
      month,
      day,
      hour: 14,
      label: '未时',
      timeRange: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 13:00-14:59`,
    },
    {
      year,
      month,
      day,
      hour: 16,
      label: '申时',
      timeRange: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 15:00-16:59`,
    },
    {
      year,
      month,
      day,
      hour: 18,
      label: '酉时',
      timeRange: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 17:00-18:59`,
    },
    {
      year,
      month,
      day,
      hour: 20,
      label: '戌时',
      timeRange: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 19:00-20:59`,
    },
    {
      year,
      month,
      day,
      hour: 22,
      label: '亥时',
      timeRange: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 21:00-22:59`,
    },
  ];

  return entries.map((entry) => {
    const solarTime = SolarTime.fromYmdHms(entry.year, entry.month, entry.day, entry.hour, 0, 0);
    const hourPillar = solarTime.getLunarHour().getEightChar().getHour();

    return {
      label: entry.label,
      ganZhi: hourPillar.getName(),
      timeRange: entry.timeRange,
    };
  });
}
