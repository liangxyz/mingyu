import type { LiurenData, LiurenTemplateType } from '../../../types/divination';

export function getLiurenPatternHint(pattern?: LiurenData['transmissionPattern']) {
  if (pattern === '伏吟') {
    return '传态伏吟：旧因反复，先稳局再推进。';
  }
  if (pattern === '反吟') {
    return '传态反吟：冲动与反复并存，先定底线和止损。';
  }
  if (pattern === '回环') {
    return '传态回环：问题会回到原点，要先切断循环触发点。';
  }
  if (pattern === '递传') {
    return '传态递传：宜分阶段推进，按节奏逐步落地。';
  }

  return '传态未标注：优先按初传-中传-末传的顺序说明。';
}

export function buildLiurenTemplateText(template: LiurenTemplateType, data: LiurenData) {
  const templateLabelMap: Record<LiurenTemplateType, string> = {
    general: '通用断课',
    ganqing: '感情断课',
    shiye: '事业断课',
    caifu: '财富断课',
  };
  const templateFocusMap: Record<LiurenTemplateType, string> = {
    ganqing: '关系定位、沟通边界、推进节奏（继续/观望/止损）。',
    shiye: '岗位路径、协作阻力、窗口时机（推进/调整/暂缓）。',
    caifu: '现金流稳定性、风险敞口、操作节奏（进攻/防守/回撤）。',
    general: '核心目标、现实阻力、下一步动作（先做什么）。',
  };
  const chu = data.threeTransmissions[0];
  const zhong = data.threeTransmissions[1];
  const mo = data.threeTransmissions[2];

  return [
    `断课类型：${templateLabelMap[template]}`,
    `断课重点：${templateFocusMap[template]}`,
    getLiurenPatternHint(data.transmissionPattern),
    `主线证据：先以${chu ? `${chu.branch}乘${chu.god}` : '初传'}定发用主线，再结合${data.transmissionRule || '取传法'}、${data.transmissionPattern || '传态'}与旬空${data.xunKong?.join('、') || '未知'}判断节奏。`,
    '取证顺序：四课三传为主证，课体与神煞为辅证；若辅证与三传主线冲突，先以发用与三传演变为准。',
    '建议展开顺序：',
    `1. 起因判断：围绕初传${chu ? `${chu.branch}（${chu.relation}）` : '未知'}，交代事件为何起。`,
    `2. 过程判断：围绕中传${zhong ? `${zhong.branch}（${zhong.relation}）` : '未知'}，交代主要卡点与转折。`,
    `3. 结果判断：围绕末传${mo ? `${mo.branch}（${mo.relation}）` : '未知'}，交代短期落点与走势。`,
    '4. 行动建议：给出一条可立即执行的动作和一条必须回避的风险。',
  ].join('\n');
}
