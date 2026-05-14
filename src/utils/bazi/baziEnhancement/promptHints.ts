/**
 * 提示词增强：分析维度与配对/子女/父母/兄弟分析片段。
 */

export function generateAnalysisDimensionHints(
  dimension: 'fuxin' | 'kongwang' | 'xingchong' | 'period' | 'lifespan',
): string {
  const hints: Record<string, string> = {
    fuxin: `【伏吟反吟】伏吟（同柱重复）主变动拖延：年月→早年奔波、日时→晚年孤寂；反吟（天克地冲）主动荡克害：年日→自身波折、月时→晚年孤独。分析伏吟反吟对婚姻、事业、财运的具体影响。`,

    kongwang: `【空亡详解】空亡五行代表命主最缺能量，需后天补充。年空→祖上无缘，月空→机遇难握，日空→配偶缘浅、才华难展，时空→子女缘薄。分析空亡对性格、事业、感情、财运的影响。`,

    xingchong: `【刑冲合会破】合（三合/六合）主和谐凝聚，冲（天克地冲最烈）主变动分离，刑（三刑、自刑）主是非伤害，会主力量凝聚，破主损失破裂。综合分析刑冲合会破对命局的影响。`,

    period: `【限运分析】少年(1-16)：学业、性格、健康；中青年(17-45)：事业、婚姻、财富；中老年(46+)：养生、子女、晚年规划。分析各阶段重点任务。`,

    lifespan: `【寿元分析】纳音：长寿类(大林木/长流水/松柏木等)、需注意类(路旁土/大驿土等)；风险期：大运冲克命局、流年叠大运不吉时；保护：用神得力、贵人护身。综合判断健康风险和养生建议。`,
  };

  return hints[dimension] || '';
}

export function generateMarriageMatchHints(): string {
  return `【婚姻配对】1.五行互补 2.合婚(六合/三合/六冲/相刑) 3.桃花配合 4.用神互补 5.大运同步。分析匹配度、相处模式、矛盾点。`;
}

export function generateChildrenFateHints(): string {
  return `【子女缘分】1.子女星(食神→女、伤官→男) 2.子女宫时柱(神煞/空亡) 3.时柱旺衰 4.生育时机(食伤透利生育/官杀混杂需择时)。分析子女缘分、性格、教育重点。`;
}

export function generateParentsAnalysisHints(): string {
  return `【父母吉凶】1.父母星(父:偏财/母:正印) 2.父母宫年柱(神煞/刑冲) 3.健康(印星→母/财星→父/岁运克应)。分析父母缘分、健康风险、赡养时机。`;
}

export function generateSiblingsAnalysisHints(): string {
  return `【兄弟朋友】1.兄弟星(比肩同/劫财异) 2.数量(纳音+旺衰) 3.关系(为用互助/为忌相争) 4.朋友类型(用神十神/贵人方位)。分析兄弟缘分、人际、交友建议。`;
}
