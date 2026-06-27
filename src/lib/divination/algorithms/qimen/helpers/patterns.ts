import { qimen } from '../../../../../config/divination-data.ts';
import { isKe } from '../../_shared';
import { getDoorElement, getOppositePalace } from './palace-utils';

const { palaceStars, doorPalaceMap } = qimen;

// 入墓规则：天干入墓宫
const RU_MU_MAP: Record<string, number> = {
  戊: 5, // 辰
  己: 2, // 丑
  庚: 2, // 丑
  辛: 5, // 辰
  壬: 5, // 辰
  癸: 8, // 未
};

// 宫位地支映射
const PALACE_BRANCH_MAP: Record<number, string> = {
  1: '子', 2: '丑', 3: '寅', 4: '卯', 5: '辰', 6: '巳', 7: '午', 8: '未', 9: '申',
};

function getMenPoTags(
  jiuGongGe: Array<{
    name: string;
    element: string;
    renPan: { door: string };
  }>,
): string[] {
  return jiuGongGe
    .filter((gong) => gong.renPan.door)
    .filter((gong) => isKe(getDoorElement(gong.renPan.door), gong.element))
    .map((gong) => `门迫（${gong.name}${gong.renPan.door}）`);
}

function getJiXingTag(stem: string, landingPalace: number, palaceName: string): string | null {
  const jiXingMap: Record<string, number> = {
    戊: 3,
    己: 2,
    庚: 8,
    辛: 9,
    壬: 4,
    癸: 4,
  };

  if (jiXingMap[stem] === landingPalace) {
    return `击刑（时干${stem}落${palaceName}）`;
  }

  return null;
}

function getRuMuTag(stem: string, landingPalace: number, palaceName: string): string | null {
  const muPalace = RU_MU_MAP[stem];
  if (muPalace === landingPalace) {
    return `入墓（时干${stem}落${palaceName}）`;
  }
  return null;
}

export function getQimenPatternTags(args: {
  zhiFu: string;
  zhiShi: string;
  zhiFuLandingPalace: number;
  zhiShiLandingPalace: number;
  jiuGongGe: Array<{
    gong: number;
    name: string;
    element: string;
    renPan: { door: string };
  }>;
  hourGanForFind: string;
}): string[] {
  const tags: string[] = [];
  const zhiFuOriginalPalace = palaceStars.indexOf(args.zhiFu) + 1;
  const zhiShiOriginalPalace = doorPalaceMap[args.zhiShi as keyof typeof doorPalaceMap] || 0;

  if (args.zhiFuLandingPalace === zhiFuOriginalPalace) {
    tags.push('星伏吟');
  } else if (getOppositePalace(zhiFuOriginalPalace) === args.zhiFuLandingPalace) {
    tags.push('星反吟');
  }

  if (args.zhiShiLandingPalace === zhiShiOriginalPalace) {
    tags.push('门伏吟');
  } else if (getOppositePalace(zhiShiOriginalPalace) === args.zhiShiLandingPalace) {
    tags.push('门反吟');
  }

  tags.push(...getMenPoTags(args.jiuGongGe));

  const zhiFuLandingGong = args.jiuGongGe.find((gong) => gong.gong === args.zhiFuLandingPalace);
  const jiXingTag = zhiFuLandingGong
    ? getJiXingTag(args.hourGanForFind, args.zhiFuLandingPalace, zhiFuLandingGong.name)
    : null;
  if (jiXingTag) {
    tags.push(jiXingTag);
  }

  // 入墓判断
  const ruMuTag = zhiFuLandingGong
    ? getRuMuTag(args.hourGanForFind, args.zhiFuLandingPalace, zhiFuLandingGong.name)
    : null;
  if (ruMuTag) {
    tags.push(ruMuTag);
  }

  return tags;
}

export function buildPatternDetails(
  patternTags: string[],
): Array<{ tag: string; summary: string }> {
  return patternTags.map((tag) => ({
    tag,
    summary: getPatternSummary(tag),
  }));
}

function getPatternSummary(tag: string): string {
  if (tag === '星伏吟') {
    return '九星回原位，事情多原地盘旋、推进偏慢。';
  }
  if (tag === '星反吟') {
    return '九星临对冲宫，局势波动较大，易反复。';
  }
  if (tag === '门伏吟') {
    return '八门回原位，事项推进迟滞，宜耐心等待。';
  }
  if (tag === '门反吟') {
    return '八门落反吟位，节奏多突变，计划易临时调整。';
  }
  if (tag.startsWith('门迫')) {
    return '门受宫克，该宫事项易受压制，行动阻力偏大。';
  }
  if (tag.startsWith('击刑')) {
    return '时干落击刑位，主压力、掣肘或规章束缚，宜谨慎行事。';
  }
  if (tag.startsWith('入墓')) {
    return '时干入墓宫，主能量被困、事情停滞或难以施展，宜等待时机或寻求突破。';
  }
  return '需结合全局继续参看。';
}

export function buildPalaceInsights(args: {
  jiuGongGe: Array<{
    gong: number;
    name: string;
    renPan: { door: string };
    shenPan: { god: string };
    tianPan: { star: string };
  }>;
  zhiFu: string;
  zhiShi: string;
  patternTags: string[];
}): Array<{
  gong: number;
  name: string;
  level: '有利' | '风险' | '关注';
  summary: string;
}> {
  const riskDoors = new Set(['死门', '伤门', '惊门']);
  const goodDoors = new Set(['开门', '生门', '休门']);
  const riskGods = new Set(['白虎', '玄武', '螣蛇']);
  const goodGods = new Set(['值符', '六合', '九天', '太阴']);

  return args.jiuGongGe.flatMap((gong) => {
    const insights: Array<{
      gong: number;
      name: string;
      level: '有利' | '风险' | '关注';
      summary: string;
    }> = [];

    const relatedTags = args.patternTags.filter(
      (tag) => tag.includes(`（${gong.name}`) || tag.includes(`落${gong.name}`),
    );
    if (relatedTags.length > 0) {
      insights.push({
        gong: gong.gong,
        name: gong.name,
        level: '风险',
        summary: `该宫带有${relatedTags.join('、')}，行事阻滞和牵制较明显。`,
      });
    } else if (riskDoors.has(gong.renPan.door) || riskGods.has(gong.shenPan.god)) {
      const reasons = [
        riskDoors.has(gong.renPan.door) ? gong.renPan.door : '',
        riskGods.has(gong.shenPan.god) ? gong.shenPan.god : '',
      ].filter(Boolean);
      insights.push({
        gong: gong.gong,
        name: gong.name,
        level: '风险',
        summary: `${reasons.join('、')}同宫，宜防阻力、口舌或反复。`,
      });
    }

    if (gong.tianPan.star === args.zhiFu || gong.renPan.door === args.zhiShi) {
      const focusParts = [
        gong.tianPan.star === args.zhiFu ? `值符落${gong.name}` : '',
        gong.renPan.door === args.zhiShi ? `值使门在${gong.name}` : '',
      ].filter(Boolean);
      insights.push({
        gong: gong.gong,
        name: gong.name,
        level: '关注',
        summary: `${focusParts.join('，')}，是当前局的核心观察位。`,
      });
    }

    if (goodDoors.has(gong.renPan.door) || goodGods.has(gong.shenPan.god)) {
      const goodParts = [
        goodDoors.has(gong.renPan.door) ? gong.renPan.door : '',
        goodGods.has(gong.shenPan.god) ? gong.shenPan.god : '',
      ].filter(Boolean);
      insights.push({
        gong: gong.gong,
        name: gong.name,
        level: '有利',
        summary: `${goodParts.join('、')}同宫，可作为推进、求助或争取资源的优先方位。`,
      });
    }

    return insights;
  });
}
