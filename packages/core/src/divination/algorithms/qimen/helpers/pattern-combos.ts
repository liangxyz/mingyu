/**
 * @file 奇门复合格局识别
 * @description 在经典单格基础上识别同宫叠加、吉凶混杂、吉格逢空、
 * 以及三奇、伏吟、反吟等关键盘面组合。
 *
 * 这里只输出结构化算法结果，不生成应用层报告、评分报告或具体场景话术。
 */

import type { QimenBranchPalace, QimenJiuGongGe } from '../../../../types/divination';
import type { ClassicPattern } from './classic-patterns';

export interface QimenPatternCombo {
  key: string;
  name: string;
  tone: 'super-good' | 'super-bad' | 'mixed';
  score: number;
  summary: string;
  palace?: number;
  sources: string[];
}

export interface PatternComboContext {
  classicPatterns?: ClassicPattern[];
  patternTags?: string[];
  voidPalaces?: QimenBranchPalace[];
  horseStar?: QimenBranchPalace;
  zhiShi?: string;
  jiuGongGe: QimenJiuGongGe[];
}

function hasName(patterns: ClassicPattern[], name: string): boolean {
  return patterns.some((pattern) => pattern.name === name);
}

function hasTag(tags: string[], tag: string): boolean {
  return tags.some((item) => item === tag || item.includes(tag));
}

function getPalaceName(jiuGongGe: QimenJiuGongGe[], palace: number): string {
  return jiuGongGe.find((item) => item.gong === palace)?.name || `${palace}宫`;
}

function pushPalaceCombos(ctx: PatternComboContext, out: QimenPatternCombo[]): void {
  const patterns = ctx.classicPatterns || [];
  const voidPalaces = new Set((ctx.voidPalaces || []).map((item) => item.palace));
  const byPalace = new Map<number, ClassicPattern[]>();

  for (const pattern of patterns) {
    if (!pattern.palace) continue;
    byPalace.set(pattern.palace, [...(byPalace.get(pattern.palace) || []), pattern]);
  }

  for (const [palace, list] of byPalace.entries()) {
    if (list.length < 2) continue;

    const palaceName = getPalaceName(ctx.jiuGongGe, palace);
    const goodPatterns = list.filter((pattern) => pattern.tone === 'good');
    const badPatterns = list.filter((pattern) => pattern.tone === 'bad');
    const palaceIsVoid = voidPalaces.has(palace);

    if (goodPatterns.length >= 3 && badPatterns.length === 0 && !palaceIsVoid) {
      out.push({
        key: `combo:triGood:${palace}`,
        name: `${palaceName}三吉聚气`,
        tone: 'super-good',
        score: 14,
        summary: `${palaceName}聚集${goodPatterns.length}个吉格，吉象叠加。`,
        palace,
        sources: goodPatterns.map((pattern) => pattern.name),
      });
    }

    if (badPatterns.length >= 3 && goodPatterns.length === 0) {
      out.push({
        key: `combo:triBad:${palace}`,
        name: `${palaceName}三凶集结`,
        tone: 'super-bad',
        score: -14,
        summary: `${palaceName}聚集${badPatterns.length}个凶格，凶象叠加。`,
        palace,
        sources: badPatterns.map((pattern) => pattern.name),
      });
    }

    if (goodPatterns.length > 0 && badPatterns.length > 0) {
      out.push({
        key: `combo:mixed:${palace}`,
        name: `${palaceName}吉凶混杂`,
        tone: 'mixed',
        score: 0,
        summary: `${palaceName}同时见吉格与凶格，气机不纯，需分清主次。`,
        palace,
        sources: [...goodPatterns, ...badPatterns].map((pattern) => pattern.name),
      });
    }

    if (palaceIsVoid && goodPatterns.length > 0 && badPatterns.length === 0) {
      out.push({
        key: `combo:goodVoid:${palace}`,
        name: `${palaceName}吉格逢空`,
        tone: 'mixed',
        score: -Math.round(goodPatterns.reduce((sum, pattern) => sum + pattern.score, 0) / 2),
        summary: `${palaceName}虽见吉格，但宫位逢空亡，吉象有落空之忧。`,
        palace,
        sources: goodPatterns.map((pattern) => pattern.name),
      });
    }
  }
}

function pushNamedCombos(ctx: PatternComboContext, out: QimenPatternCombo[]): void {
  const patterns = ctx.classicPatterns || [];
  const tags = ctx.patternTags || [];

  if (
    hasName(patterns, '乙奇升殿') &&
    hasName(patterns, '丙奇升殿') &&
    hasName(patterns, '丁奇升殿')
  ) {
    out.push({
      key: 'combo:sanQiAllGood',
      name: '三奇齐升',
      tone: 'super-good',
      score: 12,
      summary: '乙、丙、丁三奇同时升殿得位，三奇之气齐显。',
      sources: ['乙奇升殿', '丙奇升殿', '丁奇升殿'],
    });
  }

  const yiQiBlocked = hasName(patterns, '日奇入墓') || hasName(patterns, '日奇被刑');
  const bingQiBlocked = hasName(patterns, '月奇入墓') || hasName(patterns, '月奇悖师');
  const dingQiBlocked = hasName(patterns, '星奇入墓');
  if (yiQiBlocked && bingQiBlocked && dingQiBlocked) {
    out.push({
      key: 'combo:sanQiAllBad',
      name: '三奇齐困',
      tone: 'super-bad',
      score: -12,
      summary: '乙、丙、丁三奇同时受困，三奇之力闭塞。',
      sources: patterns
        .filter((pattern) => pattern.name.includes('奇') && pattern.tone === 'bad')
        .map((pattern) => pattern.name),
    });
  }

  const hasDunPattern = patterns.some(
    (pattern) => pattern.name.endsWith('遁') && pattern.tone === 'good',
  );
  if (hasDunPattern && (hasName(patterns, '青龙返首') || hasName(patterns, '飞鸟跌穴'))) {
    out.push({
      key: 'combo:dunPlusReturning',
      name: '遁格返首叠加',
      tone: 'super-good',
      score: 10,
      summary: '遁格与青龙返首或飞鸟跌穴同盘，吉格叠加。',
      sources: patterns
        .filter(
          (pattern) =>
            pattern.name.endsWith('遁') || ['青龙返首', '飞鸟跌穴'].includes(pattern.name),
        )
        .map((pattern) => pattern.name),
    });
  }

  if (hasName(patterns, '白虎猖狂') && hasTag(tags, '凶门凶神')) {
    out.push({
      key: 'combo:baihuPlusKill',
      name: '白虎助凶',
      tone: 'super-bad',
      score: -12,
      summary: '白虎猖狂叠加凶门凶神，凶象加重。',
      sources: ['白虎猖狂', '凶门凶神'],
    });
  }

  if (hasName(patterns, '月奇悖师') && hasName(patterns, '月奇入墓')) {
    out.push({
      key: 'combo:bingDoubleBad',
      name: '月奇双困',
      tone: 'super-bad',
      score: -10,
      summary: '丙奇既悖师又入墓，公开表达与外显之力受困。',
      sources: ['月奇悖师', '月奇入墓'],
    });
  }

  if (hasName(patterns, '太白入荧') && hasName(patterns, '荧入太白')) {
    out.push({
      key: 'combo:bingGengDual',
      name: '主客互攻',
      tone: 'super-bad',
      score: -10,
      summary: '太白入荧与荧入太白同盘，主客互克互攻。',
      sources: ['太白入荧', '荧入太白'],
    });
  }

  if (
    hasName(patterns, '玉女守门') &&
    patterns.some((pattern) => ['人遁', '地遁'].includes(pattern.name))
  ) {
    out.push({
      key: 'combo:yunvPlusYinDe',
      name: '阴德相扶',
      tone: 'super-good',
      score: 9,
      summary: '玉女守门遇人遁或地遁，柔顺与暗助之象叠加。',
      sources: patterns
        .filter((pattern) => ['玉女守门', '人遁', '地遁'].includes(pattern.name))
        .map((pattern) => pattern.name),
    });
  }

  if (
    hasTag(tags, '伏吟') &&
    patterns.some((pattern) => pattern.tone === 'bad' && Math.abs(pattern.score) >= 7)
  ) {
    out.push({
      key: 'combo:fuyinPlusBad',
      name: '伏吟带凶',
      tone: 'super-bad',
      score: -8,
      summary: '伏吟主迟滞，叠加大凶格，阻滞之象加重。',
      sources: [
        '伏吟',
        ...patterns
          .filter((pattern) => pattern.tone === 'bad' && Math.abs(pattern.score) >= 7)
          .map((pattern) => pattern.name),
      ],
    });
  }

  if (
    hasTag(tags, '反吟') &&
    patterns.some((pattern) => pattern.tone === 'bad' && Math.abs(pattern.score) >= 8)
  ) {
    out.push({
      key: 'combo:fanyinPlusBad',
      name: '反吟翻覆',
      tone: 'super-bad',
      score: -9,
      summary: '反吟主反复变动，叠加大凶格，翻覆之象加重。',
      sources: [
        '反吟',
        ...patterns
          .filter((pattern) => pattern.tone === 'bad' && Math.abs(pattern.score) >= 8)
          .map((pattern) => pattern.name),
      ],
    });
  }

  if (hasTag(tags, '门迫') && hasTag(tags, '凶门凶神')) {
    out.push({
      key: 'combo:menpoPlusBad',
      name: '迫上加凶',
      tone: 'super-bad',
      score: -9,
      summary: '门迫叠加凶门凶神，行动受压且环境不利。',
      sources: ['门迫', '凶门凶神'],
    });
  }

  if (hasTag(tags, '吉门吉神') && hasTag(tags, '三奇得使')) {
    out.push({
      key: 'combo:luckPlusQi',
      name: '吉门三奇',
      tone: 'super-good',
      score: 12,
      summary: '吉门吉神叠三奇得使，助力与关键资源同时出现。',
      sources: ['吉门吉神', '三奇得使'],
    });
  }

  if (hasTag(tags, '伏吟') && ctx.horseStar) {
    out.push({
      key: 'combo:fuyinPlusHorse',
      name: '静中藏动',
      tone: 'mixed',
      score: 0,
      summary: '伏吟主静，驿马主动，表面停滞而内有变化。',
      sources: ['伏吟', '驿马'],
    });
  }

  if (hasTag(tags, '反吟') && ctx.horseStar) {
    out.push({
      key: 'combo:fanyinPlusHorse',
      name: '动荡翻滚',
      tone: 'super-bad',
      score: -8,
      summary: '反吟叠驿马，变动与反复之象并见。',
      sources: ['反吟', '驿马'],
    });
  }
}

export function detectQimenPatternCombos(ctx: PatternComboContext): QimenPatternCombo[] {
  const out: QimenPatternCombo[] = [];
  pushPalaceCombos(ctx, out);
  pushNamedCombos(ctx, out);

  const seen = new Set<string>();
  return out.filter((combo) => {
    if (seen.has(combo.key)) return false;
    seen.add(combo.key);
    return true;
  });
}
