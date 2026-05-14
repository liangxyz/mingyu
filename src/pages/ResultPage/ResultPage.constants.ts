import type { ZiweiScopeMode } from '@/lib/query-state';
import type { InspirationCategory } from './ResultPage.types';

export const inspirationCategories: InspirationCategory[] = [
  '全部',
  '事业',
  '财运',
  '婚恋',
  '子女',
  '六亲',
  '健康',
];

export const commonQuestionInspirations: Array<{
  category: Exclude<InspirationCategory, '全部'>;
  question: string;
}> = [
  { category: '事业', question: '我更适合走稳定上班路线，还是尝试主动开拓发展？' },
  { category: '事业', question: '我在工作中更适合做执行、管理、专业技术，还是资源整合？' },
  { category: '事业', question: '我现在的事业卡点主要出在能力、人际还是选择方向？' },
  { category: '事业', question: '如果想换工作，我更该优先看平台、收入还是成长空间？' },
  { category: '事业', question: '我适不适合创业，还是更适合在体系内发展？' },
  { category: '事业', question: '我更适合留在熟悉领域深耕，还是切换到新方向？' },
  { category: '事业', question: '我在职场里最容易被看到的优势是什么？' },
  { category: '事业', question: '我在工作合作中更适合主导还是辅助？' },
  { category: '事业', question: '如果想提升事业发展，我最该先补哪一项能力？' },
  { category: '事业', question: '我的事业压力更多来自外部环境还是自己选择？' },
  { category: '财运', question: '我的财运更偏正财还是偏财？' },
  { category: '财运', question: '我更适合靠工资积累，还是靠副业、项目、经营来赚钱？' },
  { category: '财运', question: '我在财务上最容易踩的坑是什么？' },
  { category: '财运', question: '我更适合求稳理财，还是适度冒险争取更大收益？' },
  { category: '财运', question: '我的财富积累重点更在开源还是守财？' },
  { category: '财运', question: '我赚钱时更该依赖专业能力还是资源整合能力？' },
  { category: '财运', question: '我在金钱决策上更容易冲动还是保守？' },
  { category: '财运', question: '我是否容易出现赚得快但留不住的情况？' },
  { category: '财运', question: '我适不适合和别人一起做生意或投资？' },
  { category: '财运', question: '如果要改善财务状态，我最该先管住哪一块？' },
  { category: '婚恋', question: '我的感情模式更容易主动、被动，还是反复拉扯？' },
  { category: '婚恋', question: '我适合什么类型的伴侣？' },
  { category: '婚恋', question: '我在亲密关系里最需要调整的地方是什么？' },
  { category: '婚恋', question: '我感情不顺更容易出在选择对象还是相处方式？' },
  { category: '婚恋', question: '如果进入长期关系，我最需要注意什么问题？' },
  { category: '婚恋', question: '我在感情里更容易付出过多还是防备过重？' },
  { category: '婚恋', question: '我更适合慢热稳定型关系，还是强吸引型关系？' },
  { category: '婚恋', question: '我在关系中最容易触发的矛盾点是什么？' },
  { category: '婚恋', question: '我该怎么判断一段关系值不值得继续投入？' },
  { category: '婚恋', question: '我的婚恋重点更在遇到合适的人，还是学会正确相处？' },
  { category: '子女', question: '我的子女缘分深不深？' },
  { category: '子女', question: '我在亲子关系里更适合温和引导还是严格管理？' },
  { category: '子女', question: '我未来与子女的互动重点会体现在哪些方面？' },
  { category: '子女', question: '在子女教育上，我最需要避免什么做法？' },
  { category: '子女', question: '我与子女的关系更容易亲近还是有距离感？' },
  { category: '子女', question: '我在对子女的期待上会不会给自己太大压力？' },
  { category: '子女', question: '面对子女问题，我更该重视沟通还是规则建立？' },
  { category: '子女', question: '我的亲子关系中最需要注意的情绪模式是什么？' },
  { category: '六亲', question: '我和父母之间的关系重点与压力点是什么？' },
  { category: '六亲', question: '我和兄弟姐妹之间更容易互助还是有隐性消耗？' },
  { category: '六亲', question: '我在家庭关系中更容易承担责任，还是容易被关系拖累？' },
  { category: '六亲', question: '面对家人问题，我更适合主动介入还是保持边界？' },
  { category: '六亲', question: '我在家庭里更像支持者、协调者，还是承压者？' },
  { category: '六亲', question: '我与家人之间最需要厘清的边界问题是什么？' },
  { category: '六亲', question: '我在家庭责任分配上是否容易失衡？' },
  { category: '六亲', question: '我和原生家庭的影响更偏助力还是牵制？' },
  { category: '六亲', question: '我应该怎样处理亲情中的愧疚感和责任感？' },
  { category: '健康', question: '我的身体最需要注意哪些方面？' },
  { category: '健康', question: '我当前更容易出现情绪压力，还是身体透支问题？' },
  { category: '健康', question: '我的作息、饮食、运动里最该先调整哪一项？' },
  { category: '健康', question: '我在健康管理上最容易忽视的隐患是什么？' },
  { category: '健康', question: '我更需要注意慢性消耗，还是突然性的身体失衡？' },
  { category: '健康', question: '我的健康问题更容易和情绪、压力有关吗？' },
  { category: '健康', question: '如果只调整一个生活习惯，最该先改什么？' },
  { category: '健康', question: '我在休息和恢复方面最容易出现什么问题？' },
];

export const baziSingleShortcutActions = [
  {
    label: '综合' as const,
    promptId: 'ai-mingge-zonglun',
    question:
      '请做一份综合分析，按“命局特点、性格优势与短板、事业发展、财运节奏、婚恋关系、六亲互动、健康隐患、学业与成长、当前阶段提醒、落地建议”这几个部分展开，结论尽量具体。',
  },
  {
    label: '事业' as const,
    promptId: 'ai-career',
    question:
      '请重点分析我的事业方向、适合的发展路径、职场优势、容易遇到的阻力、适合上班还是创业、当前阶段的突破口，以及接下来更值得投入的方向。',
  },
  {
    label: '财运' as const,
    promptId: 'ai-wealth-timing',
    question:
      '请重点分析我的财运类型、正财偏财表现、赚钱方式、起财时机、守财能力、容易破财的风险点，以及现阶段更稳妥的财务建议。',
  },
  {
    label: '婚恋' as const,
    promptId: 'ai-marriage',
    question:
      '请重点分析我的婚恋观与关系模式、适合的伴侣类型、感情中的优势和问题、婚缘节奏、进入长期关系后的注意点，以及当前最该调整的重点。',
  },
  {
    label: '子女' as const,
    promptId: 'ai-children-fate',
    question:
      '请重点分析我的子女缘、子女互动模式、亲子关系中的优势与压力、教育相处重点、需要注意的阶段性问题，以及更适合的引导方式。',
  },
  {
    label: '六亲' as const,
    promptId: 'ai-mingge-zonglun',
    question:
      '请重点分析我的六亲关系，分别说明与父母、兄弟姐妹、伴侣、子女之间的互动模式、助力与牵制、边界问题、责任压力，以及最需要改善的关系重点。',
  },
  {
    label: '健康' as const,
    promptId: 'ai-health',
    question:
      '请重点分析我最需要注意的健康隐患，说明更容易受影响的身心方向、压力与作息对健康的影响、生活习惯中的主要问题、日常调理重点，以及当前阶段的提醒。',
  },
  {
    label: '学业' as const,
    promptId: 'ai-mingge-zonglun',
    question:
      '请重点分析我的学业运、理解力与专注力特点、考试发挥、适合的学习方式、容易拖后腿的问题、进修深造潜力，以及当前最有效的提升建议。',
  },
] as const;

export const baziCompatibilityShortcutActions = [
  {
    label: '合婚' as const,
    promptId: 'ai-compat-marriage',
    question: '请重点分析我们两人的婚恋匹配度、长期磨合点和相处建议。',
  },
  {
    label: '合伙' as const,
    promptId: 'ai-compat-career',
    question: '请重点分析我们两人的合作模式、分工建议和利益风险。',
  },
  {
    label: '友情' as const,
    promptId: 'ai-compat-friendship',
    question: '请重点分析我们两人的相处默契、冲突点和关系建议。',
  },
  {
    label: '子女' as const,
    promptId: 'ai-compat-children',
    question: '请重点分析我们两人的子女缘分深浅、子女性格倾向和亲子相处重点。',
  },
  {
    label: '父母' as const,
    promptId: 'ai-compat-parents',
    question: '请重点分析我们双方父母的健康状况、需关注的风险方向和赡养建议。',
  },
  {
    label: '兄弟' as const,
    promptId: 'ai-compat-siblings',
    question: '请重点分析我们两人之间兄弟朋友关系的亲疏、助力与牵制、相处建议。',
  },
] as const;

export const ziweiSingleShortcutActions = [
  {
    label: '综合' as const,
    topic: 'life',
    question:
      '请做一份综合分析，按“人生主线、性格优势与短板、事业发展、财运节奏、婚恋关系、六亲互动、健康隐患、学业与成长、当前阶段提醒、落地建议”这几个部分展开，结论尽量具体。',
  },
  {
    label: '事业' as const,
    topic: 'career-wealth',
    question:
      '请重点分析我的事业方向、适合的发展路径、职场优势、容易遇到的阻力、适合上班还是创业、当前阶段的突破口，以及接下来更值得投入的方向。',
  },
  {
    label: '财运' as const,
    topic: 'career-wealth',
    question:
      '请重点分析我的财运类型、赚钱抓手、正财偏财表现、起财节奏、守财能力、容易破财的风险点，以及现阶段更稳妥的财务建议。',
  },
  {
    label: '婚恋' as const,
    topic: 'relationship',
    question:
      '请重点分析我的婚恋观与关系模式、适合的伴侣类型、感情中的优势和问题、婚缘节奏、进入长期关系后的注意点，以及当前最该调整的重点。',
  },
  {
    label: '子女' as const,
    topic: 'relationship',
    question:
      '请重点分析我的子女缘、子女互动模式、亲子关系中的优势与压力、教育相处重点、需要注意的阶段性问题，以及更适合的引导方式。',
  },
  {
    label: '六亲' as const,
    topic: 'chat',
    question:
      '请重点分析我的六亲关系，分别说明与父母、兄弟姐妹、伴侣、子女之间的互动模式、助力与牵制、边界问题、责任压力，以及最需要改善的关系重点。',
  },
  {
    label: '健康' as const,
    topic: 'chat',
    question:
      '请重点分析我最需要注意的健康隐患，说明更容易受影响的身心方向、压力与作息对健康的影响、生活习惯中的主要问题、日常养护重点，以及当前阶段的提醒。',
  },
  {
    label: '学业' as const,
    topic: 'chat',
    question:
      '请重点分析我的学业运、理解力与专注力特点、考试发挥、适合的学习方式、容易拖后腿的问题、进修深造潜力，以及当前最有效的提升建议。',
  },
] as const;

export const ziweiCompatibilityShortcutActions = [
  {
    label: '感情' as const,
    topic: 'relationship',
    question: '请重点分析双方关系匹配度、吸引点、冲突点和相处建议。',
  },
  {
    label: '合作' as const,
    topic: 'career-wealth',
    question: '请重点分析双方合作默契、优势互补和潜在风险。',
  },
  {
    label: '相处' as const,
    topic: 'chat',
    question: '请从双方盘面看互动模式、沟通盲点和长期建议。',
  },
] as const;

export const ziweiScopeLabelMap: Record<ZiweiScopeMode, string> = {
  origin: '本命',
  decadal: '大限',
  yearly: '流年',
  monthly: '流月',
  daily: '流日',
  hourly: '流时',
};

export const ZIWEI_GRID_ORDER = [
  3,
  4,
  5,
  6,
  2,
  'center',
  'center-skip',
  7,
  1,
  'center-skip',
  'center-skip',
  8,
  0,
  11,
  10,
  9,
] as const;
export const PROMPT_DRAFT_STORAGE_PREFIX = 'result-prompt-draft';
