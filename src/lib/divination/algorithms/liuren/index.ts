import type { LiurenData, LiurenLesson, LiurenTransmission } from '../../../../types/divination';
import { getDivinationTime } from '../../../../utils/timeManager.ts';
import { getVoidBranches } from '../../../../utils/lunar.ts';
import {
  buildHeavenlyPlate,
  describeRelation,
  getNoblemanBranch,
  getPlateItemByBranch,
  getUpperByUnder,
} from './helpers/plate';
import { buildLessonNote, resolveInitialTransmission } from './helpers/lessons';
import {
  buildTransmissionDetail,
  buildTransmissionNote,
  getPatternTag,
  getTransmissionPattern,
} from './helpers/transmission';

const MONTH_LEADER_MAP: Record<string, string> = {
  寅: '亥',
  卯: '戌',
  辰: '酉',
  巳: '申',
  午: '未',
  未: '午',
  申: '巳',
  酉: '辰',
  戌: '卯',
  亥: '寅',
  子: '丑',
  丑: '子',
};
const DAY_STEM_RESIDENCE_MAP: Record<string, string> = {
  甲: '寅',
  乙: '辰',
  丙: '巳',
  丁: '未',
  戊: '巳',
  己: '未',
  庚: '申',
  辛: '戌',
  壬: '亥',
  癸: '丑',
};
const DAYTIME_BRANCHES = new Set(['卯', '辰', '巳', '午', '未', '申']);

export function generateLiuren(customDate?: Date): LiurenData {
  const { ganzhi, timeInfo, timestamp } = getDivinationTime(customDate);
  const monthBranch = ganzhi.month.charAt(1);
  const dayStem = ganzhi.day.charAt(0);
  const dayBranch = ganzhi.day.charAt(1);
  const hourBranch = ganzhi.hour.charAt(1);
  const dayNight: '昼占' | '夜占' = DAYTIME_BRANCHES.has(hourBranch) ? '昼占' : '夜占';
  const monthLeader = MONTH_LEADER_MAP[monthBranch] || '亥';
  const noblemanBranch = getNoblemanBranch(dayStem, dayNight);
  const xunKong = getVoidBranches(ganzhi.day);
  const dayOfficer = '贵人';
  const heavenlyPlate = buildHeavenlyPlate({
    monthLeader,
    divinationBranch: hourBranch,
    noblemanBranch,
    dayNight,
  });

  const dayStemResidence = DAY_STEM_RESIDENCE_MAP[dayStem] || dayBranch;
  const yiKeUpper = getUpperByUnder(heavenlyPlate, dayStemResidence);
  const erKeUpper = getUpperByUnder(heavenlyPlate, yiKeUpper);
  const sanKeUpper = getUpperByUnder(heavenlyPlate, dayBranch);
  const siKeUpper = getUpperByUnder(heavenlyPlate, sanKeUpper);
  const lessonNames: LiurenLesson['name'][] = ['一课', '二课', '三课', '四课'];
  const lessonPairs: Array<{ upper: string; lower: string }> = [
    { upper: yiKeUpper, lower: dayStemResidence },
    { upper: erKeUpper, lower: yiKeUpper },
    { upper: sanKeUpper, lower: dayBranch },
    { upper: siKeUpper, lower: sanKeUpper },
  ];

  const fourLessons = lessonPairs.map((item, index) => {
    const relation = describeRelation(item.upper, item.lower);
    const god = getPlateItemByBranch(heavenlyPlate, item.upper).god;

    return {
      name: lessonNames[index],
      upper: item.upper,
      lower: item.lower,
      god,
      relation,
      note: buildLessonNote(relation, xunKong, item.upper, item.lower),
    };
  }) satisfies LiurenLesson[];

  const initialResult = resolveInitialTransmission(fourLessons, xunKong);
  const chu = initialResult.initial;
  const zhong = getUpperByUnder(heavenlyPlate, chu);
  const mo = getUpperByUnder(heavenlyPlate, zhong);
  const transmissionPattern = getTransmissionPattern(chu, zhong, mo);
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

  const transmissionDetail = buildTransmissionDetail(
    initialResult.rule,
    transmissionPattern,
    threeTransmissions,
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

  return {
    ganzhi,
    timestamp,
    dayNight,
    monthLeader,
    divinationBranch: hourBranch,
    dayOfficer,
    noblemanBranch,
    xunKong,
    transmissionRule: initialResult.rule,
    transmissionPattern,
    transmissionDetail,
    heavenlyPlate,
    fourLessons,
    threeTransmissions,
    patternTags,
    lessonSummary: `${lessonSummary} 当前节气为${timeInfo.jieQi}。`,
    transmissionSummary,
  };
}
