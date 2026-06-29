import type { LiurenData, LiurenTransmission } from '../../../../types/divination';
import { getDivinationTime } from '../../../../utils/timeManager.ts';
import { getVoidBranches } from '../../../../utils/lunar.ts';
import { SolarTerm, SolarTime } from 'tyme4ts';
import {
  buildHeavenlyPlate,
  DIZHI,
  describeRelation,
  getDayStemResidence,
  getNoblemanBranch,
  getPlateItemByBranch,
  getUnderByUpper,
  getUpperByUnder,
} from './helpers/plate';
import { buildFourLessons, resolveInitialTransmission } from './helpers/lessons';
import { resolveLiurenClassicalRules } from './helpers/classical-rules';
import {
  buildTransmissionDetail,
  buildTransmissionNote,
  getPatternTag,
  getTransmissionPattern,
} from './helpers/transmission';

const MONTH_LEADER_BY_ZHONGQI: Record<string, string> = {
  雨水: '亥',
  春分: '戌',
  谷雨: '酉',
  小满: '申',
  夏至: '未',
  大暑: '午',
  处暑: '巳',
  秋分: '辰',
  霜降: '卯',
  小雪: '寅',
  冬至: '丑',
  大寒: '子',
};
const DAYTIME_BRANCHES = new Set(['卯', '辰', '巳', '午', '未', '申']);

/**
 * 按《大六壬指南》神煞体系计算核心神煞。
 * 驿马、劫煞、亡神按三合局取；桃花按四季取；天德月德按干支起。
 */
function buildShenShaSummary(
  _yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  _dayStem: string,
): string[] {
  const items: string[] = [];

  // 驿马（日支取）：申子辰在寅、亥卯未在巳、寅午戌在申、巳酉丑在亥
  const horseMap: Record<string, string> = {
    子: '寅',
    申: '寅',
    辰: '寅',
    亥: '巳',
    卯: '巳',
    未: '巳',
    寅: '申',
    午: '申',
    戌: '申',
    巳: '亥',
    酉: '亥',
    丑: '亥',
  };
  const horse = horseMap[dayBranch];
  if (horse) items.push(`驿马在${horse}`);

  // 劫煞（日支取）：三合局之绝位
  const jieShaMap: Record<string, string> = {
    子: '巳',
    申: '巳',
    辰: '巳',
    亥: '申',
    卯: '申',
    未: '申',
    寅: '亥',
    午: '亥',
    戌: '亥',
    巳: '寅',
    酉: '寅',
    丑: '寅',
  };
  const jieSha = jieShaMap[dayBranch];
  if (jieSha) items.push(`劫煞在${jieSha}`);

  // 亡神（日支取）：三合局之临官前一位
  const wangShenMap: Record<string, string> = {
    子: '亥',
    申: '亥',
    辰: '亥',
    亥: '寅',
    卯: '寅',
    未: '寅',
    寅: '巳',
    午: '巳',
    戌: '巳',
    巳: '申',
    酉: '申',
    丑: '申',
  };
  const wangShen = wangShenMap[dayBranch];
  if (wangShen) items.push(`亡神在${wangShen}`);

  // 桃花（日支取）：申子辰在酉、亥卯未在子、寅午戌在卯、巳酉丑在午
  const peachMap: Record<string, string> = {
    子: '酉',
    申: '酉',
    辰: '酉',
    亥: '子',
    卯: '子',
    未: '子',
    寅: '卯',
    午: '卯',
    戌: '卯',
    巳: '午',
    酉: '午',
    丑: '午',
  };
  const peach = peachMap[dayBranch];
  if (peach) items.push(`桃花在${peach}`);

  // 天德（月支取）：正丁二申三壬四辛五亥六甲七癸八寅九丙十乙子巳丑庚
  const tianDeMap: Record<string, string> = {
    寅: '丁',
    卯: '申',
    辰: '壬',
    巳: '辛',
    午: '亥',
    未: '甲',
    申: '癸',
    酉: '寅',
    戌: '丙',
    亥: '乙',
    子: '巳',
    丑: '庚',
  };
  const tianDe = tianDeMap[monthBranch];
  if (tianDe) items.push(`天德在${tianDe}`);

  // 月德（月支取）：寅午戌在丙、申子辰在壬、亥卯未在甲、巳酉丑在庚
  const yueDeMap: Record<string, string> = {
    寅: '丙',
    午: '丙',
    戌: '丙',
    申: '壬',
    子: '壬',
    辰: '壬',
    亥: '甲',
    卯: '甲',
    未: '甲',
    巳: '庚',
    酉: '庚',
    丑: '庚',
  };
  const yueDe = yueDeMap[monthBranch];
  if (yueDe) items.push(`月德在${yueDe}`);

  return items;
}

function getMonthLeaderByZhongqi(timeInfo: ReturnType<typeof getDivinationTime>['timeInfo']) {
  const currentTime = SolarTime.fromYmdHms(
    timeInfo.solar.year,
    timeInfo.solar.month,
    timeInfo.solar.day,
    timeInfo.solar.hour,
    timeInfo.solar.minute,
    0,
  );
  const currentJulianDay = currentTime.getJulianDay().getDay();
  const year = timeInfo.solar.year;
  let activeZhongqi = '冬至';
  let activeJulianDay = Number.NEGATIVE_INFINITY;

  for (const scanYear of [year - 1, year, year + 1]) {
    for (let termIndex = 0; termIndex < 24; termIndex += 2) {
      const term = SolarTerm.fromIndex(scanYear, termIndex);
      const termJulianDay = term.getJulianDay().getDay();
      if (termJulianDay <= currentJulianDay && termJulianDay > activeJulianDay) {
        activeJulianDay = termJulianDay;
        activeZhongqi = term.getName();
      }
    }
  }

  return MONTH_LEADER_BY_ZHONGQI[activeZhongqi] || '丑';
}

export function generateLiuren(customDate?: Date): LiurenData {
  const { ganzhi, timeInfo, timestamp } = getDivinationTime(customDate);
  const dayStem = ganzhi.day.charAt(0);
  const dayBranch = ganzhi.day.charAt(1);
  const hourStem = ganzhi.hour.charAt(0);
  const hourBranch = ganzhi.hour.charAt(1);
  const dayNight: '昼占' | '夜占' = DAYTIME_BRANCHES.has(hourBranch) ? '昼占' : '夜占';
  const monthLeader = getMonthLeaderByZhongqi(timeInfo);
  const noblemanBranch = getNoblemanBranch(dayStem, dayNight);
  const xunKong = getVoidBranches(ganzhi.day);
  const dayOfficer = '贵人';
  const heavenlyPlate = buildHeavenlyPlate({
    monthLeader,
    divinationBranch: hourBranch,
    noblemanBranch,
    dayNight,
  });
  const noblemanGroundBranch = getUnderByUpper(heavenlyPlate, noblemanBranch);

  const dayStemResidence = getDayStemResidence(dayStem, dayBranch);
  const fourLessons = buildFourLessons({
    heavenlyPlate,
    dayStem,
    dayBranch,
    dayStemResidence,
    xunKong,
  });

  const initialResult = resolveInitialTransmission(fourLessons, {
    dayStem,
    dayBranch,
    dayStemResidence,
    hourStem,
    hourBranch,
    heavenlyPlate,
  });
  const chu = initialResult.initial;
  const zhong = initialResult.branches?.[1] || getUpperByUnder(heavenlyPlate, chu);
  const mo = initialResult.branches?.[2] || getUpperByUnder(heavenlyPlate, zhong);
  const inferredTransmissionPattern = getTransmissionPattern(chu, zhong, mo);
  const transmissionPattern = initialResult.rule.includes('伏吟')
    ? '伏吟'
    : initialResult.rule.includes('返吟')
      ? '反吟'
      : inferredTransmissionPattern;
  const transmissionBranches = [chu, zhong, mo];
  const transmissionStages: LiurenTransmission['stage'][] = ['初传', '中传', '末传'];
  const threeTransmissions = transmissionBranches.map((branch, index) => {
    const plateItem = getPlateItemByBranch(heavenlyPlate, branch);
    const previousBranch = index === 0 ? fourLessons[0].lower : transmissionBranches[index - 1];
    const relation = describeRelation(branch, previousBranch);

    return {
      stage: transmissionStages[index],
      branch,
      god: plateItem.god,
      relation,
      note: buildTransmissionNote(transmissionStages[index], relation),
    };
  }) satisfies LiurenTransmission[];
  const classicalRules = resolveLiurenClassicalRules(initialResult.rule);

  const transmissionDetail = buildTransmissionDetail(
    initialResult.rule,
    transmissionPattern,
    threeTransmissions,
    classicalRules[0],
  );

  const patternTags = [
    `${threeTransmissions[0].god}发用`,
    initialResult.tag,
    threeTransmissions.some((item) => xunKong.includes(item.branch)) ? '空亡入传' : '传不逢空',
    getPatternTag(transmissionPattern),
  ];

  const lessonSummary = `四课源于日干寄宫${dayStemResidence}与日支${dayBranch}，关系呈${fourLessons
    .map((item) => item.relation)
    .join('、')}，重点先看${initialResult.tag}落点。`;
  const transmissionSummary = `三传${transmissionPattern}，主线依次为${threeTransmissions
    .map((item) => `${item.stage}${item.branch}`)
    .join(' → ')}。`;
  const shenShaSummary = buildShenShaSummary(
    ganzhi.year.charAt(1),
    ganzhi.month.charAt(1),
    ganzhi.day.charAt(1),
    ganzhi.day.charAt(0),
  );

  return {
    ganzhi,
    timestamp,
    dayNight,
    monthLeader,
    divinationBranch: hourBranch,
    dayOfficer,
    noblemanBranch,
    noblemanGroundBranch,
    xunKong,
    transmissionRule: initialResult.rule,
    transmissionPattern,
    transmissionDetail,
    earthlyPlate: [...DIZHI],
    dayStemResidence,
    heavenlyPlate,
    fourLessons,
    threeTransmissions,
    patternTags,
    classicalRules,
    lessonSummary: `${lessonSummary} 当前节气为${timeInfo.jieQi}。`,
    transmissionSummary,
    shenShaSummary,
  };
}
