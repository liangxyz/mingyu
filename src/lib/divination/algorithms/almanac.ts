import { SolarDay } from 'tyme4ts';
import { baziCalculator } from '../../../utils/bazi/baziCalculator';
import { getBirthDateValidationMessage } from '../../date-validation';
import type {
  AlmanacData,
  AlmanacDayCandidate,
  AlmanacParticipantInput,
  AlmanacParticipantProfile,
  AlmanacTopic,
} from '../../../types/divination';

export const ALMANAC_TOPIC_LABELS: Record<AlmanacTopic, string> = {
  move: '搬家入宅',
  marriage: '订婚结婚',
  opening: '开业启动',
  contract: '签约合作',
  travel: '出行赴任',
  medical: '就医手术',
  study: '考试学习',
  burial: '安葬修坟',
  renovation: '修造动土',
  custom: '自定义事项',
};

const TOPIC_RECOMMEND_KEYWORDS: Record<AlmanacTopic, string[]> = {
  move: ['入宅', '移徙', '安床', '修造', '动土'],
  marriage: ['嫁娶', '纳采', '订盟', '会亲友'],
  opening: ['开市', '交易', '立券', '纳财'],
  contract: ['交易', '立券', '纳财', '会亲友'],
  travel: ['出行', '赴任', '移徙'],
  medical: ['求医', '治病', '解除'],
  study: ['入学', '求嗣', '祭祀', '祈福'],
  burial: ['安葬', '修坟', '启钻', '立碑', '入殓', '移柩'],
  renovation: ['修造', '动土', '竖柱', '上梁', '盖屋', '起基'],
  custom: [],
};

const TOPIC_AVOID_KEYWORDS: Record<AlmanacTopic, string[]> = {
  move: ['入宅', '移徙', '安床'],
  marriage: ['嫁娶', '纳采', '订盟'],
  opening: ['开市', '交易', '立券'],
  contract: ['交易', '立券'],
  travel: ['出行', '赴任'],
  medical: ['求医', '治病'],
  study: ['入学', '求嗣'],
  burial: ['安葬', '修坟', '启钻'],
  renovation: ['修造', '动土', '竖柱', '上梁'],
  custom: [],
};

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function parseDateText(value: string, fieldName: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`${fieldName}需要使用 YYYY-MM-DD 格式`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900 || year > 2100) {
    throw new Error(`${fieldName}年份需在 1900-2100 之间`);
  }
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error(`${fieldName}不是有效日期`);
  }

  return { year, month, day, date };
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hasAnyKeyword(values: string[], keywords: string[]) {
  if (keywords.length === 0) {
    return false;
  }

  return values.some((value) => keywords.some((keyword) => value.includes(keyword)));
}

function normalizeTaboos(items: Array<{ getName(): string }>) {
  return items.map((item) => item.getName()).filter(Boolean);
}

function shouldBuildParticipantProfile(item: AlmanacParticipantInput) {
  return Boolean(item.year && item.month && item.day && item.timeIndex !== '');
}

function readParticipantInteger(value: string, label: string, min: number, max: number) {
  const text = value.trim();
  if (!/^\d+$/.test(text)) {
    throw new Error(`参与人${label}必须是 ${min}-${max} 的整数`);
  }

  const number = Number(text);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`参与人${label}必须是 ${min}-${max} 的整数`);
  }
  return number;
}

function readParticipantBirthInput(item: AlmanacParticipantInput) {
  const year = readParticipantInteger(item.year, '出生年份', 1900, 2100);
  const month = readParticipantInteger(item.month, '出生月份', 1, 12);
  const day = readParticipantInteger(item.day, '出生日期', 1, item.dateType === 'lunar' ? 30 : 31);
  const timeIndex = readParticipantInteger(item.timeIndex, '出生时辰', 0, 12);
  const validationMessage = getBirthDateValidationMessage({
    year,
    month,
    day,
    dateType: item.dateType,
    isLeapMonth: Boolean(item.isLeapMonth),
  });

  if (validationMessage) {
    throw new Error(`参与人出生${validationMessage}`);
  }

  return { year, month, day, timeIndex };
}

function createParticipantProfiles(
  participants: AlmanacParticipantInput[],
): AlmanacParticipantProfile[] {
  return participants.filter(shouldBuildParticipantProfile).map((item) => {
    const birthInput = readParticipantBirthInput(item);
    const chart = baziCalculator.calculateBazi({
      year: birthInput.year,
      month: birthInput.month,
      day: birthInput.day,
      timeIndex: birthInput.timeIndex,
      gender: item.gender === '男' ? 'male' : item.gender === '女' ? 'female' : '',
      isLunar: item.dateType === 'lunar',
      isLeapMonth: Boolean(item.isLeapMonth),
      useTrueSolarTime: false,
    });

    return {
      id: item.id,
      name: item.name.trim() || '未命名参与人',
      gender: item.gender,
      solarDate: `${chart.solarDate.year}-${String(chart.solarDate.month).padStart(2, '0')}-${String(chart.solarDate.day).padStart(2, '0')}`,
      lunarDate: `${chart.lunarDate.monthName}${chart.lunarDate.dayName}`,
      zodiac: chart.zodiac,
      constellation: chart.constellation,
      dayMaster: chart.dayMaster.gan,
      dayMasterElement: chart.dayMaster.element,
      pillars: {
        year: chart.pillars.year.ganZhi,
        month: chart.pillars.month.ganZhi,
        day: chart.pillars.day.ganZhi,
        hour: chart.pillars.hour.ganZhi,
      },
      usefulGods: chart.analysis.usefulGod.favorableWuxing ?? chart.analysis.usefulGod.favorable,
      avoidGods: chart.analysis.usefulGod.unfavorableWuxing ?? chart.analysis.usefulGod.unfavorable,
    };
  });
}

// 建除十二神宜忌
const JIANCHU_DUTIES: Record<string, { good: string[]; bad: string[]; advice: string }> = {
  建: { good: ['出行', '上任', '赴任'], bad: ['动土', '开仓'], advice: '宜出行上任，忌动土开仓' },
  除: { good: ['解除', '扫舍', '治病'], bad: ['出行', '嫁娶'], advice: '宜解除扫舍，忌出行嫁娶' },
  满: { good: ['祭祀', '祈福', '进人口'], bad: ['栽种', '下葬'], advice: '宜祭祀祈福，忌栽种下葬' },
  平: { good: ['修造', '动土', '装修'], bad: ['嫁娶', '出行'], advice: '宜修造动土，忌嫁娶出行' },
  定: { good: ['冠带', '嫁娶', '订盟'], bad: ['词讼', '出行'], advice: '宜冠带嫁娶，忌词讼出行' },
  执: { good: ['祭祀', '捕捉', '修造'], bad: ['移徙', '出行'], advice: '宜祭祀捕捉，忌移徙出行' },
  破: { good: [], bad: ['诸事不宜'], advice: '破日诸事不宜，宜破屋坏垣' },
  危: { good: ['安床', '祭祀', '祈福'], bad: ['登高', '出行'], advice: '宜安床祭祀，忌登高出行' },
  成: { good: ['开市', '嫁娶', '签约'], bad: ['词讼', '出行'], advice: '宜开市嫁娶，忌词讼出行' },
  收: { good: ['收债', '纳财', '进人口'], bad: ['开市', '出行'], advice: '宜收债纳财，忌开市出行' },
  开: { good: ['开市', '嫁娶'], bad: ['安葬', '出行'], advice: '宜开市嫁娶，忌安葬出行' },
  闭: { good: ['安葬', '收藏', '修补'], bad: ['开市', '出行'], advice: '宜安葬收藏，忌开市出行' },
};

// 传统吉凶神煞清单（取自《协纪辨方书》，名称与 tyme4ts God.NAMES 对齐）。
// tyme4ts 的 getGods() 已返回每日临值神煞及其吉凶（getLuck），此处按传统
// 择日口径识别大吉神与大凶神，用于评分加权。
const SHENSHA_AUSPICIOUS = [
  '天德',
  '月德',
  '天德合',
  '月德合',
  '天赦',
  '天愿',
  '天恩',
  '岁德',
  '月恩',
  '月空',
  '天德合',
  '母仓',
  '生气',
  '益后',
  '续世',
  '五富',
  '三合',
  '六合',
  '五合',
  '福德',
  '金匮',
  '玉堂',
  '司命',
  '青龙',
  '明堂',
  '金堂',
  '宝光',
];

const SHENSHA_INAUSPICIOUS = [
  '四废',
  '四离',
  '四穷',
  '四忌',
  '四击',
  '四耗',
  '五虚',
  '五离',
  '五墓',
  '劫煞',
  '灾煞',
  '月煞',
  '月刑',
  '月害',
  '月厌',
  '月破',
  '月建',
  '大煞',
  '大耗',
  '大败',
  '大时',
  '天火',
  '地火',
  '天贼',
  '天刑',
  '天牢',
  '朱雀',
  '白虎',
  '元武',
  '勾陈',
  '死神',
  '死气',
  '致死',
  '血支',
  '血忌',
  '游祸',
  '河魁',
  '土符',
  '土府',
  '往亡',
  '归忌',
  '厌对',
  '招摇',
  '九空',
  '九坎',
  '九焦',
  '天罡',
];

function scoreDay(params: {
  topic: AlmanacTopic;
  dayBranch: string;
  dayDuty: string;
  recommends: string[];
  avoids: string[];
  gods: string[];
  participants: AlmanacParticipantProfile[];
}) {
  const highlights: string[] = [];
  const cautions: string[] = [];
  const participantNotes: string[] = [];
  let score = 60;

  const recommendKeywords = TOPIC_RECOMMEND_KEYWORDS[params.topic];
  const avoidKeywords = TOPIC_AVOID_KEYWORDS[params.topic];

  if (hasAnyKeyword(params.recommends, recommendKeywords)) {
    score += 18;
    highlights.push(`黄历宜项命中${ALMANAC_TOPIC_LABELS[params.topic]}`);
  }
  if (hasAnyKeyword(params.avoids, avoidKeywords)) {
    score -= 24;
    cautions.push(`黄历忌项触及${ALMANAC_TOPIC_LABELS[params.topic]}`);
  }

  // 建除十二神评分
  const duty = JIANCHU_DUTIES[params.dayDuty];
  if (duty) {
    if (hasAnyKeyword(recommendKeywords, duty.good)) {
      score += 8;
      highlights.push(`执日${params.dayDuty}宜${ALMANAC_TOPIC_LABELS[params.topic]}`);
    }
    if (hasAnyKeyword(avoidKeywords, duty.bad) || params.dayDuty === '破') {
      score -= 15;
      cautions.push(`执日${params.dayDuty}${duty.advice}`);
    }
  }

  if (params.gods.length >= 4) {
    score += 6;
    highlights.push('吉神信息较多，可作为辅助加分');
  }

  // 传统吉凶神煞评分（tyme4ts God 已含天德/月德/天赦/天愿/岁德等大吉神与四废/劫煞/灾煞等大凶神）。
  // 按《协纪辨方书》口径：大吉神临值宜趋吉，大凶神临值宜避忌。
  const bigAuspicious = SHENSHA_AUSPICIOUS.filter((name) => params.gods.includes(name));
  const bigInauspicious = SHENSHA_INAUSPICIOUS.filter((name) => params.gods.includes(name));
  if (bigAuspicious.length > 0) {
    score += bigAuspicious.length * 6;
    highlights.push(`吉神临值：${bigAuspicious.join('、')}`);
  }
  if (bigInauspicious.length > 0) {
    score -= bigInauspicious.length * 6;
    cautions.push(`凶神临值：${bigInauspicious.join('、')}，宜避忌`);
  }

  params.participants.forEach((participant) => {
    const yearBranch = participant.pillars.year.slice(-1);
    const dayBranch = participant.pillars.day.slice(-1);
    const isYearClash = yearBranch && params.dayBranch === getOppositeBranch(yearBranch);
    const isDayClash = dayBranch && params.dayBranch === getOppositeBranch(dayBranch);

    if (isYearClash || isDayClash) {
      score -= isDayClash ? 12 : 8;
      participantNotes.push(
        `${participant.name}：候选日地支${params.dayBranch}${isDayClash ? `冲日支${dayBranch}` : `冲生肖/年支${yearBranch}`}，需谨慎`,
      );
      return;
    }

    participantNotes.push(
      `${participant.name}：日主${participant.dayMaster}${participant.dayMasterElement}，生肖${participant.zodiac}，未见直接冲克提醒`,
    );
  });

  return {
    score: Math.max(0, Math.min(100, score)),
    highlights,
    cautions,
    participantNotes,
  };
}

function getOppositeBranch(branch: string) {
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const index = branches.indexOf(branch);
  return index >= 0 ? branches[(index + 6) % branches.length] : '';
}

function buildDayCandidate(
  date: Date,
  topic: AlmanacTopic,
  participants: AlmanacParticipantProfile[],
): AlmanacDayCandidate {
  const solarDay = SolarDay.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const lunarDay = solarDay.getLunarDay();
  const dayCycle = lunarDay.getSixtyCycle();
  const dayBranch = dayCycle.getEarthBranch();
  const recommends = normalizeTaboos(lunarDay.getRecommends());
  const avoids = normalizeTaboos(lunarDay.getAvoids());
  const gods = lunarDay.getGods().map((item: { getName(): string }) => item.getName());
  const dayDuty = lunarDay.getDuty().getName();
  const scoring = scoreDay({
    topic,
    dayBranch: dayBranch.getName(),
    dayDuty,
    recommends,
    avoids,
    gods,
    participants,
  });

  return {
    date: formatDate(date),
    weekday: WEEKDAYS[date.getDay()],
    lunarDate: lunarDay.toString(),
    ganzhi: {
      year: lunarDay.getYearSixtyCycle().getName(),
      month: lunarDay.getMonthSixtyCycle().getName(),
      day: dayCycle.getName(),
    },
    zodiac: dayBranch.getZodiac().getName(),
    dayOfficer: lunarDay.getDuty().getName(),
    twelveStar: lunarDay.getTwelveStar().getName(),
    twentyEightStar: lunarDay.getTwentyEightStar().getName(),
    nineStar: lunarDay.getNineStar().getName(),
    gods,
    recommends,
    avoids,
    pengZu: dayCycle.getPengZu().getName(),
    clash: `冲${dayBranch.getOpposite().getName()}，煞${dayBranch.getOminous().getName()}`,
    score: scoring.score,
    highlights: scoring.highlights,
    cautions: scoring.cautions,
    participantNotes: scoring.participantNotes,
  };
}

export function generateAlmanacSelection(params: {
  topic: AlmanacTopic;
  startDate: string;
  endDate: string;
  participants?: AlmanacParticipantInput[];
}): AlmanacData {
  const start = parseDateText(params.startDate, '开始日期');
  const end = parseDateText(params.endDate, '结束日期');
  const diffDays = Math.round((end.date.getTime() - start.date.getTime()) / 86400000);

  if (diffDays < 0) {
    throw new Error('结束日期不能早于开始日期');
  }
  if (diffDays > 30) {
    throw new Error('黄历择日一次最多比较 31 天，请缩小日期范围');
  }

  const participants = createParticipantProfiles(params.participants ?? []);
  const days = Array.from({ length: diffDays + 1 }, (_, index) => {
    const current = new Date(start.date);
    current.setDate(start.date.getDate() + index);
    return buildDayCandidate(current, params.topic, participants);
  }).sort((a, b) => b.score - a.score);

  return {
    topic: params.topic,
    topicLabel: ALMANAC_TOPIC_LABELS[params.topic],
    startDate: params.startDate,
    endDate: params.endDate,
    days,
    participants,
    timestamp: Date.now(),
  };
}
