import { baziCalculator } from '@/utils/bazi/baziCalculator';
import type { BaziChartResult } from '@/utils/bazi/baziTypes';
import type { Person } from '@/composables/useFormState';

export function buildPersonFromInput(input: {
  gender: 'male' | 'female';
  year: string;
  month: string;
  day: string;
  timeIndex: number | '';
  dateType: 'solar' | 'lunar';
  isLeapMonth: boolean;
  useTrueSolarTime: boolean;
  birthHour: string;
  birthMinute: string;
  birthPlace: string;
  birthLongitude: string;
}): Person {
  if (!input.useTrueSolarTime && input.timeIndex === '') {
    throw new Error('请选择出生时辰。');
  }

  return {
    name: '',
    gender: input.gender,
    year: Number(input.year),
    month: Number(input.month),
    day: Number(input.day),
    timeIndex: Number(input.timeIndex),
    isLunar: input.dateType === 'lunar',
    isLeapMonth: input.isLeapMonth,
    useTrueSolarTime: input.useTrueSolarTime,
    birthHour: input.useTrueSolarTime ? Number(input.birthHour) : undefined,
    birthMinute: input.useTrueSolarTime ? Number(input.birthMinute) : undefined,
    birthPlace: input.useTrueSolarTime ? input.birthPlace : '',
    birthLongitude: input.useTrueSolarTime ? Number(input.birthLongitude) : undefined,
  };
}

export function calculateFullBaziChart(person: Person): BaziChartResult {
  return baziCalculator.calculateBazi({
    year: Number(person.year),
    month: Number(person.month),
    day: Number(person.day),
    timeIndex: person.timeIndex,
    gender: person.gender,
    isLunar: person.isLunar,
    isLeapMonth: person.isLeapMonth,
    useTrueSolarTime: person.useTrueSolarTime,
    birthHour: person.birthHour,
    birthMinute: person.birthMinute,
    birthPlace: person.birthPlace,
    birthLongitude: person.birthLongitude,
  });
}
