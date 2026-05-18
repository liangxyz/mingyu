import type { BaziArray } from './types';

/**
 * 全局神煞分析（基于已识别的神煞列表）
 */
export function analyzeGlobalShenSha(shenShaList: string[]): string[] {
  const analysis: string[] = [];

  if (shenShaList.includes('三奇贵人')) {
    analysis.push('整局天干顺布三奇，传统多视为悟性、机缘与贵人助力较易形成合力。');
  }

  return analysis;
}

/**
 * 计算全局神煞（四柱整体相关的神煞）
 */
export function calculateGlobalShenSha(baziArray: BaziArray): string[] {
  const globalShenSha: string[] = [];
  const gans = baziArray.map(([gan]) => gan);
  // 三奇贵人：天上三奇甲戊庚、地下三奇乙丙丁、人中三奇辛壬癸
  // 天干需按序出现，但允许间隔（不要求连续三柱）
  const sequences: string[][] = [
    ['甲', '戊', '庚'], // 天上三奇
    ['乙', '丙', '丁'], // 地下三奇
    ['辛', '壬', '癸'], // 人中三奇
  ];

  for (const seq of sequences) {
    let matchIdx = 0;
    for (const g of gans) {
      if (g === seq[matchIdx]) matchIdx++;
      if (matchIdx === seq.length) break;
    }
    if (matchIdx === seq.length) {
      globalShenSha.push('三奇贵人');
      break;
    }
  }

  return globalShenSha;
}
