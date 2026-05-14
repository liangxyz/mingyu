/**
 * 结合十神的神煞分析 (高级分析)
 * 例如：驿马+偏财 = 动中求财；桃花+七杀 = 桃花劫
 */
export function analyzeShenShaWithTenGod(shenShaList: string[], tenGod: string): string[] {
  const analysis: string[] = [];

  // 驿马互参
  if (shenShaList.includes('驿马')) {
    if (tenGod === '偏财') analysis.push('马奔财乡(动中求财)');
    if (tenGod === '正官' || tenGod === '七杀') analysis.push('马头带剑(威镇边疆或奔波劳碌)');
    if (tenGod === '食神' || tenGod === '伤官') analysis.push('艺术奔波');
    if (tenGod === '正印' || tenGod === '偏印') analysis.push('求学变动');
  }

  // 桃花互参
  if (shenShaList.includes('桃花')) {
    if (tenGod === '七杀') analysis.push('桃花带杀(因色生灾)');
    if (tenGod === '正官') analysis.push('桃花带官(因妻致富)');
    if (tenGod === '比肩' || tenGod === '劫财') analysis.push('桃花劫(因色破财)');
    if (tenGod === '正财' || tenGod === '偏财') analysis.push('财星桃花(异性缘带来财富)');
  }

  // 羊刃互参
  if (shenShaList.includes('羊刃')) {
    if (tenGod === '七杀') analysis.push('羊刃驾杀(掌兵权/威严)');
    if (tenGod === '正官') analysis.push('羊刃带官(掌权柄)');
    if (tenGod === '伤官') analysis.push('羊刃伤官(傲气/易惹是非)');
  }

  // 贵人互参
  if (shenShaList.includes('天乙贵人')) {
    if (tenGod === '食神') analysis.push('食神带贵(福禄丰厚)');
    if (tenGod === '正官') analysis.push('贵人带官(仕途顺遂)');
  }

  return analysis;
}
