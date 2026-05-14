import type {
  DivinationType,
  LiurenTemplateType,
  MeihuaDivinationMethod,
  TarotSpreadType,
} from '@/types/divination';

export type DivinationMethodId =
  | 'random'
  | Extract<DivinationType, 'liuyao' | 'meihua' | 'qimen' | 'liuren' | 'tarot' | 'ssgw'>;

export const DIVINATION_METHOD_OPTIONS: Array<{
  value: DivinationMethodId;
  label: string;
  description: string;
}> = [
  {
    value: 'random',
    label: '随机',
    description: '随机选择一种占卜类型，适合没有明确偏好时快速起卦。',
  },
  {
    value: 'liuyao',
    label: '六爻',
    description: '适合判断能不能、会不会、该不该，重在事态变化。',
  },
  {
    value: 'meihua',
    label: '梅花易数',
    description: '适合快速起卦，兼顾体用、过程与结果。',
  },
  {
    value: 'qimen',
    label: '奇门遁甲',
    description: '适合看时机、策略和局势走向。',
  },
  {
    value: 'liuren',
    label: '大六壬',
    description: '适合看事情如何演变、卡点在哪以及该先处理什么。',
  },
  {
    value: 'tarot',
    label: '塔罗',
    description: '适合感受关系、能量状态与行动建议。',
  },
  {
    value: 'ssgw',
    label: '三山国王灵签',
    description: '随机求签，适合快速获得方向提示。',
  },
];

export const MEIHUA_METHOD_OPTIONS: Array<{
  value: Extract<MeihuaDivinationMethod, 'time' | 'number' | 'random'>;
  label: string;
}> = [
  { value: 'time', label: '时间起卦' },
  { value: 'number', label: '数字起卦' },
  { value: 'random', label: '随机起卦' },
];

export const TAROT_SPREAD_OPTIONS: Array<{
  value: TarotSpreadType;
  label: string;
}> = [
  { value: 'single', label: '单牌指引' },
  { value: 'three', label: '时间流牌阵' },
  { value: 'love', label: '爱情牌阵' },
  { value: 'career', label: '事业牌阵' },
  { value: 'decision', label: '选择牌阵' },
];

export const LIUREN_TEMPLATE_OPTIONS: Array<{
  value: LiurenTemplateType;
  label: string;
}> = [
  { value: 'general', label: '通用断课' },
  { value: 'ganqing', label: '感情断课' },
  { value: 'shiye', label: '事业断课' },
  { value: 'caifu', label: '财富断课' },
];
