import { LunarHour, SolarTime } from 'tyme4ts';
import {
  getGanYinYang,
  getTenGod,
  getTenGodForBranch,
  getWuxing,
} from '../../utils/bazi/baziUtils';

export type BirthBaseInput = {
  gender: 'male' | 'female';
  dateType: 'solar' | 'lunar';
  year: string;
  month: string;
  day: string;
  isLeapMonth: boolean;
};

export type ThreePillarDetail = {
  label: '年柱' | '月柱' | '日柱';
  gan: string;
  zhi: string;
  ganZhi: string;
  ganWuxing: string;
  zhiWuxing: string;
  tenGod: string;
  branchTenGod: string;
};

export type ThreePillarsProfile = {
  genderLabel: string;
  dateTypeLabel: string;
  solarDateLabel: string;
  lunarDateLabel: string;
  zodiac: string;
  dayMaster: {
    gan: string;
    element: string;
    yinYang: string;
  };
  pillars: {
    year: ThreePillarDetail;
    month: ThreePillarDetail;
    day: ThreePillarDetail;
  };
  wuxingCount: Record<string, number>;
  promptText: string;
};

function normalizeNumber(value: string, fallback: string) {
  return value.trim() || fallback;
}

function createBaseTime(input: BirthBaseInput) {
  const year = Number(normalizeNumber(input.year, '0'));
  const month = Number(normalizeNumber(input.month, '0'));
  const day = Number(normalizeNumber(input.day, '0'));

  if (!year || !month || !day) {
    throw new Error('请先填写完整的出生年月日。');
  }

  if (input.dateType === 'lunar') {
    const lunarMonth = input.isLeapMonth ? -Math.abs(month) : month;
    const lunarHour = LunarHour.fromYmdHms(year, lunarMonth, day, 12, 0, 0);
    return {
      solarTime: lunarHour.getSolarTime(),
      lunarHour,
    };
  }

  const solarTime = SolarTime.fromYmdHms(year, month, day, 12, 0, 0);
  return {
    solarTime,
    lunarHour: solarTime.getLunarHour(),
  };
}

function buildPillarDetail(
  label: ThreePillarDetail['label'],
  gan: string,
  zhi: string,
  dayMasterGan: string,
): ThreePillarDetail {
  return {
    label,
    gan,
    zhi,
    ganZhi: `${gan}${zhi}`,
    ganWuxing: getWuxing(gan),
    zhiWuxing: getWuxing(zhi),
    tenGod: label === '日柱' ? '日主' : getTenGod(gan, dayMasterGan),
    branchTenGod: label === '日柱' ? '日支' : getTenGodForBranch(zhi, dayMasterGan),
  };
}

function buildWuxingCount(pillars: ThreePillarsProfile['pillars']) {
  const count: Record<string, number> = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0,
  };

  Object.values(pillars).forEach((pillar) => {
    count[pillar.ganWuxing] += 1;
    count[pillar.zhiWuxing] += 1;
  });

  return count;
}

function formatWuxingCount(wuxingCount: Record<string, number>) {
  return Object.entries(wuxingCount)
    .map(([key, value]) => `${key}:${value}`)
    .join('  ');
}

export function buildThreePillarsProfile(input: BirthBaseInput): ThreePillarsProfile {
  const { solarTime, lunarHour } = createBaseTime(input);
  const eightChar = lunarHour.getEightChar();
  const yearPillar = eightChar.getYear();
  const monthPillar = eightChar.getMonth();
  const dayPillar = eightChar.getDay();
  const dayMasterGan = dayPillar.getHeavenStem().getName();

  const pillars = {
    year: buildPillarDetail(
      '年柱',
      yearPillar.getHeavenStem().getName(),
      yearPillar.getEarthBranch().getName(),
      dayMasterGan,
    ),
    month: buildPillarDetail(
      '月柱',
      monthPillar.getHeavenStem().getName(),
      monthPillar.getEarthBranch().getName(),
      dayMasterGan,
    ),
    day: buildPillarDetail(
      '日柱',
      dayPillar.getHeavenStem().getName(),
      dayPillar.getEarthBranch().getName(),
      dayMasterGan,
    ),
  };

  const wuxingCount = buildWuxingCount(pillars);
  const profile: ThreePillarsProfile = {
    genderLabel: input.gender === 'male' ? '男' : '女',
    dateTypeLabel: input.dateType === 'solar' ? '公历' : '农历',
    solarDateLabel: `${solarTime.getYear()}-${String(solarTime.getMonth()).padStart(2, '0')}-${String(
      solarTime.getDay(),
    ).padStart(2, '0')}`,
    lunarDateLabel: `${lunarHour.getLunarDay().getLunarMonth().getLunarYear().getYear()}年${lunarHour
      .getLunarDay()
      .getLunarMonth()
      .getName()}${lunarHour.getLunarDay().getName()}`,
    zodiac: lunarHour
      .getLunarDay()
      .getLunarMonth()
      .getLunarYear()
      .getSixtyCycle()
      .getEarthBranch()
      .getZodiac()
      .getName(),
    dayMaster: {
      gan: dayMasterGan,
      element: getWuxing(dayMasterGan),
      yinYang: getGanYinYang(dayMasterGan),
    },
    pillars,
    wuxingCount,
    promptText: '',
  };

  profile.promptText = formatThreePillarsForPrompt(profile);
  return profile;
}

export function formatThreePillarsForPrompt(profile: ThreePillarsProfile) {
  return [
    '【基础信息】',
    `性别：${profile.genderLabel}`,
    `输入日历：${profile.dateTypeLabel}`,
    `公历：${profile.solarDateLabel}`,
    `农历：${profile.lunarDateLabel}`,
    `时辰：未知（待反推）`,
    `生肖：${profile.zodiac}`,
    `日主：${profile.dayMaster.gan} ${profile.dayMaster.element}（${profile.dayMaster.yinYang}）`,
    '',
    '【三柱】',
    `年柱：${profile.pillars.year.ganZhi} | 天干十神：${profile.pillars.year.tenGod} | 地支十神：${profile.pillars.year.branchTenGod} | 五行：${profile.pillars.year.ganWuxing}/${profile.pillars.year.zhiWuxing}`,
    `月柱：${profile.pillars.month.ganZhi} | 天干十神：${profile.pillars.month.tenGod} | 地支十神：${profile.pillars.month.branchTenGod} | 五行：${profile.pillars.month.ganWuxing}/${profile.pillars.month.zhiWuxing}`,
    `日柱：${profile.pillars.day.ganZhi} | 天干十神：${profile.pillars.day.tenGod} | 地支十神：${profile.pillars.day.branchTenGod} | 五行：${profile.pillars.day.ganWuxing}/${profile.pillars.day.zhiWuxing}`,
    '',
    '【五行统计】',
    formatWuxingCount(profile.wuxingCount),
    '',
    '【说明】',
    '当前只保留年柱、月柱、日柱，不包含时柱；凡是强依赖时柱的判断都只能先做保守推测。',
  ].join('\n');
}
