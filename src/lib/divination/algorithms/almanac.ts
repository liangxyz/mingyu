import { SolarDay } from 'tyme4ts';
import { baziCalculator } from '../../../utils/bazi/baziCalculator';
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
  custom: [],
};

const TOPIC_AVOID_KEYWORDS: Record<AlmanacTopic, string[]> = {
  move: ['入宅', '移徙', '安床', '动土'],
  marriage: ['嫁娶', '纳采', '订盟'],
  opening: ['开市', '交易', '立券'],
  contract: ['交易', '立券'],
  travel: ['出行', '赴任'],
  medical: ['求医', '治病'],
  study: ['入学', '求嗣'],
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

function createParticipantProfiles(
  participants: AlmanacParticipantInput[],
): AlmanacParticipantProfile[] {
  return participants
    .filter((item) => item.year && item.month && item.day && item.timeIndex !== '')
    .map((item) => {
      const chart = baziCalculator.calculateBazi({
        year: Number(item.year),
        month: Number(item.month),
        day: Number(item.day),
        timeIndex: Number(item.timeIndex),
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
        avoidGods:
          chart.analysis.usefulGod.unfavorableWuxing ?? chart.analysis.usefulGod.unfavorable,
      };
    });
}

function scoreDay(params: {
  topic: AlmanacTopic;
  dayBranch: string;
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

  if (params.gods.length >= 4) {
    score += 6;
    highlights.push('吉神信息较多，可作为辅助加分');
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
  const gods = lunarDay.getGods().map((item) => item.getName());
  const scoring = scoreDay({
    topic,
    dayBranch: dayBranch.getName(),
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
