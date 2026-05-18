import type { LenormandData, LenormandSpreadType } from '@/types/divination';

const LENORMAND_CARDS = [
  { id: 1, name: '骑士', keywords: ['消息', '到来', '进展'], meaning: '消息抵达，事情开始移动。' },
  {
    id: 2,
    name: '三叶草',
    keywords: ['机会', '短暂好运', '轻松'],
    meaning: '短期机会出现，宜快不宜拖。',
  },
  { id: 3, name: '船', keywords: ['远方', '变化', '出行'], meaning: '有距离、迁移或方向转换。' },
  {
    id: 4,
    name: '房子',
    keywords: ['家庭', '稳定', '根基'],
    meaning: '关注安全感、住所和基础条件。',
  },
  {
    id: 5,
    name: '树',
    keywords: ['成长', '健康', '长期'],
    meaning: '事情发展较慢，但有长期根系。',
  },
  {
    id: 6,
    name: '云',
    keywords: ['不明朗', '混乱', '遮蔽'],
    meaning: '信息不清，需要先辨别真假。',
  },
  {
    id: 7,
    name: '蛇',
    keywords: ['复杂', '诱惑', '迂回'],
    meaning: '关系或路径有绕行与隐藏动机。',
  },
  {
    id: 8,
    name: '棺材',
    keywords: ['结束', '停滞', '转折'],
    meaning: '旧阶段需要收尾，不能强行续命。',
  },
  {
    id: 9,
    name: '花束',
    keywords: ['喜悦', '礼物', '好感'],
    meaning: '有善意、邀请或被认可的机会。',
  },
  {
    id: 10,
    name: '镰刀',
    keywords: ['切断', '突发', '决断'],
    meaning: '快速分割或突然变化，需要果断。',
  },
  {
    id: 11,
    name: '鞭子',
    keywords: ['争执', '重复', '压力'],
    meaning: '反复拉扯，容易因沟通产生摩擦。',
  },
  {
    id: 12,
    name: '鸟',
    keywords: ['沟通', '焦虑', '讨论'],
    meaning: '消息频繁，但情绪也容易放大。',
  },
  {
    id: 13,
    name: '孩子',
    keywords: ['新开始', '单纯', '试探'],
    meaning: '事情尚早，适合从小步尝试。',
  },
  {
    id: 14,
    name: '狐狸',
    keywords: ['策略', '警惕', '工作'],
    meaning: '需要看清利益结构，避免被套路。',
  },
  {
    id: 15,
    name: '熊',
    keywords: ['力量', '资源', '保护'],
    meaning: '资源和权力是关键，也可能有人强势介入。',
  },
  {
    id: 16,
    name: '星星',
    keywords: ['希望', '愿景', '网络'],
    meaning: '目标感增强，远景或线上资源有帮助。',
  },
  {
    id: 17,
    name: '鹳',
    keywords: ['变化', '迁移', '改善'],
    meaning: '适合调整环境，局势有改善空间。',
  },
  {
    id: 18,
    name: '狗',
    keywords: ['忠诚', '朋友', '支持'],
    meaning: '可信任的人或长期关系会提供支持。',
  },
  { id: 19, name: '塔', keywords: ['机构', '隔离', '规则'], meaning: '制度、边界或距离感是重点。' },
  {
    id: 20,
    name: '花园',
    keywords: ['社交', '公开', '圈层'],
    meaning: '事情会进入公开场域或社交圈。',
  },
  { id: 21, name: '山', keywords: ['阻碍', '延迟', '困难'], meaning: '推进受阻，需要绕路或等待。' },
  {
    id: 22,
    name: '路',
    keywords: ['选择', '分岔', '决定'],
    meaning: '关键在选择路径，不能两头都要。',
  },
  {
    id: 23,
    name: '老鼠',
    keywords: ['消耗', '损失', '焦虑'],
    meaning: '小问题会持续消耗，需要止损。',
  },
  {
    id: 24,
    name: '心',
    keywords: ['感情', '喜欢', '热情'],
    meaning: '情感动机强，适合看真实心意。',
  },
  {
    id: 25,
    name: '戒指',
    keywords: ['承诺', '契约', '循环'],
    meaning: '关系、合同或重复模式成为主轴。',
  },
  {
    id: 26,
    name: '书',
    keywords: ['秘密', '知识', '未知'],
    meaning: '仍有未公开信息，需继续了解。',
  },
  {
    id: 27,
    name: '信',
    keywords: ['文本', '通知', '文件'],
    meaning: '书面消息、通知或证据很重要。',
  },
  {
    id: 28,
    name: '男士',
    keywords: ['男性', '主动方', '本人'],
    meaning: '男性角色或主动方成为焦点。',
  },
  {
    id: 29,
    name: '女士',
    keywords: ['女性', '接收方', '本人'],
    meaning: '女性角色或接收方成为焦点。',
  },
  {
    id: 30,
    name: '百合',
    keywords: ['成熟', '平和', '伦理'],
    meaning: '需要成熟处理，重视体面与长期安稳。',
  },
  { id: 31, name: '太阳', keywords: ['成功', '清晰', '能量'], meaning: '局势转明，成功率提升。' },
  {
    id: 32,
    name: '月亮',
    keywords: ['情绪', '名声', '直觉'],
    meaning: '情绪和外界评价会影响判断。',
  },
  { id: 33, name: '钥匙', keywords: ['答案', '突破', '关键'], meaning: '关键条件出现，问题有解。' },
  { id: 34, name: '鱼', keywords: ['金钱', '流动', '资源'], meaning: '钱、资源和流动性是重点。' },
  { id: 35, name: '锚', keywords: ['稳定', '工作', '坚持'], meaning: '稳定和长期承诺能带来结果。' },
  {
    id: 36,
    name: '十字架',
    keywords: ['压力', '宿命感', '责任'],
    meaning: '责任较重，需要承担代价或接受现实。',
  },
];

const SPREADS: Record<LenormandSpreadType, { name: string; positions: string[] }> = {
  single: { name: '单牌线索', positions: ['核心线索'] },
  three: { name: '三牌事件线', positions: ['起因', '现状', '走向'] },
  relationship: {
    name: '关系牌阵',
    positions: ['你的状态', '对方状态', '关系纽带', '隐藏因素', '后续走向'],
  },
  decision: {
    name: '选择牌阵',
    positions: ['当前处境', '选择A', '选择A走向', '选择B', '选择B走向', '关键建议'],
  },
  nine: {
    name: '九宫牌阵',
    positions: ['左上', '上方', '右上', '左侧', '核心', '右侧', '左下', '下方', '右下'],
  },
};

function shuffleCards() {
  const shuffled = [...LENORMAND_CARDS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function drawLenormandSpread(spreadType: LenormandSpreadType = 'three'): LenormandData {
  const spread = SPREADS[spreadType] ?? SPREADS.three;
  const cards = shuffleCards()
    .slice(0, spread.positions.length)
    .map((card, index) => ({
      ...card,
      position: spread.positions[index],
    }));

  return {
    spreadType,
    spreadName: spread.name,
    cards,
    timestamp: Date.now(),
  };
}
