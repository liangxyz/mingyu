import { resolveZiweiTrueSolarBirth } from '../ziwei/true-solar-input';
import type { ChartInput } from '../../types/chart';
import type { AnalysisPayloadV1, ScopeType } from '../../types/analysis';
import type { IztroAstrolabe, IztroHoroscope } from '../../types/iztro';
import {
  buildAstrolabeFromInput,
  buildHoroscope,
  getDefaultHoroscopeContext,
} from '../iztro/runtime-helpers';
import { buildAnalysisPayloadV1 } from '../iztro/build-analysis-payload';
import {
  getZiweiCompatibilityDefaultQuestion,
  getZiweiDefaultQuestion,
} from '../prompt-default-questions';
import { buildPortablePromptPack, type PromptContext } from '../ziwei-prompts';
import { formatPromptCurrentTime } from '../prompt-time';
import {
  ZIWEI_ANALYSIS_REQUIREMENT,
  ZIWEI_ANALYST_ROLE,
  ZIWEI_COMPATIBILITY_ROLE,
} from '../ziwei-prompt-copy';

export type ZiweiRuntime = {
  astrolabe: IztroAstrolabe;
  horoscope: IztroHoroscope;
  payloadByScope: Record<ScopeType, AnalysisPayloadV1>;
};

export function buildZiweiPayloadByScope(params: {
  astrolabe: IztroAstrolabe;
  horoscope: IztroHoroscope;
}) {
  const scopes: ScopeType[] = ['origin', 'decadal', 'yearly', 'monthly', 'daily', 'hourly', 'age'];

  return Object.fromEntries(
    scopes.map((scope) => [
      scope,
      buildAnalysisPayloadV1({
        astrolabe: params.astrolabe,
        horoscope: params.horoscope,
        currentScope: scope,
      }),
    ]),
  ) as Record<ScopeType, AnalysisPayloadV1>;
}

export async function calculateFullZiweiChart(input: ChartInput): Promise<ZiweiRuntime> {
  const astrolabe = await buildAstrolabeFromInput(input);
  const { dateStr, hourIndex } = getDefaultHoroscopeContext();
  const horoscope = buildHoroscope(astrolabe, dateStr, hourIndex);
  const payloadByScope = buildZiweiPayloadByScope({
    astrolabe,
    horoscope,
  });

  return {
    astrolabe,
    horoscope,
    payloadByScope,
  };
}

export async function calculateZiweiPayloadByScope(input: ChartInput) {
  const astrolabe = await buildAstrolabeFromInput(input);
  const { dateStr, hourIndex } = getDefaultHoroscopeContext();
  const horoscope = buildHoroscope(astrolabe, dateStr, hourIndex);

  return buildZiweiPayloadByScope({
    astrolabe,
    horoscope,
  });
}

export async function calculateZiweiDisplayPayload(params: {
  input: ChartInput;
  dateStr: string;
  hourIndex: number;
  scope: ScopeType;
}) {
  const astrolabe = await buildAstrolabeFromInput(params.input);
  const horoscope = buildHoroscope(astrolabe, params.dateStr, params.hourIndex);

  return buildAnalysisPayloadV1({
    astrolabe,
    horoscope,
    currentScope: params.scope,
  });
}

export function buildZiweiChartInput(input: {
  name: string;
  gender: 'male' | 'female';
  dateType: 'solar' | 'lunar';
  year: string;
  month: string;
  day: string;
  timeIndex: number | '';
  isLeapMonth: boolean;
  useTrueSolarTime?: boolean;
  birthHour?: string;
  birthMinute?: string;
  birthLongitude?: string;
}): ChartInput {
  if (!input.useTrueSolarTime && input.timeIndex === '') {
    throw new Error('请选择出生时辰。');
  }

  const gender = input.gender === 'male' ? '男' : '女';
  const trueSolarBirth = input.useTrueSolarTime
    ? resolveZiweiTrueSolarBirth({
        dateType: input.dateType,
        year: input.year,
        month: input.month,
        day: input.day,
        isLeapMonth: input.isLeapMonth,
        birthHour: input.birthHour ?? '',
        birthMinute: input.birthMinute ?? '',
        birthLongitude: input.birthLongitude ?? '',
      })
    : null;
  const birthDate =
    trueSolarBirth?.birthDate ??
    `${input.year}-${input.month.padStart(2, '0')}-${input.day.padStart(2, '0')}`;

  return {
    name: input.name,
    gender,
    dateType: input.useTrueSolarTime ? 'solar' : input.dateType,
    birthDate,
    birthTimeIndex: trueSolarBirth?.birthTimeIndex ?? Number(input.timeIndex),
    isLeapMonth: input.isLeapMonth,
    fixLeap: true,
    astroType: 'earth',
    algorithm: 'default',
    yearDivide: 'normal',
    horoscopeDivide: 'normal',
    ageDivide: 'normal',
    dayDivide: 'current',
  };
}

function createZiweiReportContext(payload: AnalysisPayloadV1, topic: string): PromptContext {
  const topicMap: Record<
    string,
    { report_type: string; report_title: string; selected_topic: string }
  > = {
    destiny: {
      report_type: payload.active_scope.scope === 'origin' ? 'destiny-overview' : 'scope',
      report_title:
        payload.active_scope.scope === 'origin' ? '命局综述' : `${payload.active_scope.label}报告`,
      selected_topic: 'destiny',
    },
    relationship: {
      report_type: 'relationship',
      report_title: '婚姻感情报告',
      selected_topic: 'relationship',
    },
    'relationship-push': {
      report_type: 'relationship-push',
      report_title: '关系推进报告',
      selected_topic: 'relationship-push',
    },
    'relationship-decision': {
      report_type: 'relationship-decision',
      report_title: '关系去留报告',
      selected_topic: 'relationship-decision',
    },
    'career-wealth': {
      report_type: 'career-wealth',
      report_title: '事业财运报告',
      selected_topic: 'career-wealth',
    },
    'job-change': {
      report_type: 'job-change',
      report_title: '工作变动报告',
      selected_topic: 'job-change',
    },
    'startup-partnership': {
      report_type: 'startup-partnership',
      report_title: '创业合作报告',
      selected_topic: 'startup-partnership',
    },
    'investment-partnership': {
      report_type: 'investment-partnership',
      report_title: '投资合作报告',
      selected_topic: 'investment-partnership',
    },
    recent: {
      report_type: 'recent',
      report_title: '近期趋势报告',
      selected_topic: 'recent',
    },
    family: {
      report_type: 'family',
      report_title: '六亲家庭报告',
      selected_topic: 'family',
    },
    'home-move': {
      report_type: 'home-move',
      report_title: '搬家置业报告',
      selected_topic: 'home-move',
    },
    'settle-relocate': {
      report_type: 'settle-relocate',
      report_title: '定居换城报告',
      selected_topic: 'settle-relocate',
    },
    social: {
      report_type: 'social',
      report_title: '人际合作报告',
      selected_topic: 'social',
    },
    emotion: {
      report_type: 'emotion',
      report_title: '情绪调节报告',
      selected_topic: 'emotion',
    },
    health: {
      report_type: 'health',
      report_title: '健康养护报告',
      selected_topic: 'health',
    },
    study: {
      report_type: 'study',
      report_title: '学业成长报告',
      selected_topic: 'study',
    },
    'study-advance': {
      report_type: 'study-advance',
      report_title: '考证进修报告',
      selected_topic: 'study-advance',
    },
    'exam-landing': {
      report_type: 'exam-landing',
      report_title: '考试上岸报告',
      selected_topic: 'exam-landing',
    },
    'reconciliation-decision': {
      report_type: 'reconciliation-decision',
      report_title: '复合判断报告',
      selected_topic: 'reconciliation-decision',
    },
    growth: {
      report_type: 'growth',
      report_title: '成长课题报告',
      selected_topic: 'growth',
    },
    talent: {
      report_type: 'talent',
      report_title: '天赋优势报告',
      selected_topic: 'talent',
    },
    life: {
      report_type: 'life',
      report_title: '人生解析报告',
      selected_topic: 'life',
    },
    chat: {
      report_type: 'chat',
      report_title: '自由问答',
      selected_topic: 'chat',
    },
  };

  const matched = topicMap[topic] ?? topicMap.chat;

  return {
    report_key: `${matched.selected_topic}:${payload.active_scope.scope}:${payload.active_scope.solar_date}`,
    report_title: matched.report_title,
    report_type: matched.report_type,
    selected_topic: matched.selected_topic,
    scope_type: payload.active_scope.scope,
    scope_label: payload.active_scope.label,
    focus_notes: [],
  };
}

function buildZiweiTopicGuidanceSection(topic: string) {
  const commonLines = [
    '先判断【问题】对应的宫位范围，再组织证据，不要只做星曜罗列。',
    '先看命宫、身宫、三方四正、对宫与四化，再结合当前运限、自化、飞化和重点宫位触发。',
    '优先使用【重点宫位摘要】和【关键证据摘要】组织推理，不要平均复述全盘。',
    '资料包里没有直接写出的额外盘面事实，不得自行补算、脑补或假定。',
    '每个关键结论都要对应到宫位、星曜、四化、运限或现实建议；证据不足时要说明倾向和待确认处。',
  ];

  const topicLines: Record<string, string[]> = {
    destiny: [
      '综合分析按“人生主线、性格优势与短板、事业财帛、婚恋六亲、健康迁移、当前阶段提醒、落地建议”展开。',
      '重点看命身格局、命财官迁福德田宅等核心宫位，以及生年四化和大限流年对主线的引动。',
    ],
    life: [
      '人生解析按“命身定位、长期课题、能力资源、关系模式、关键转折、当前阶段策略”展开。',
      '重点区分原局底色与当前运限触发，不要把短期波动说成一生命定。',
    ],
    relationship: [
      '感情关系先看夫妻宫、命宫、福德宫、迁移宫与三方四正，再看红鸾天喜、桃花星曜和四化牵动。',
      '说明关系模式、吸引点、冲突点、适合对象、推进节奏和经营建议。',
    ],
    'relationship-push': [
      '关系推进先看夫妻宫、命宫、福德宫、迁移宫与当前运限牵动，再看桃花星曜和四化如何放大或拖缓关系节奏。',
      '重点区分当前更适合主动推进、稳定经营、放慢观察还是及时止损，并说明投入价值、现实阻力和判断标准。',
    ],
    'relationship-decision': [
      '关系去留先看夫妻宫、命宫、福德宫、迁移宫与当前运限牵动，再看桃花星曜和四化如何继续支撑或消耗这段关系。',
      '重点区分当前更适合继续投入、放慢观察、重新建立边界还是及时止损，并说明继续条件、止损信号和现实代价。',
    ],
    'career-wealth': [
      '事业财运先看官禄宫、财帛宫、命宫、迁移宫、田宅宫与福德宫的联动。',
      '区分适合的工作路径、赚钱方式、资源平台、风险点、守财能力和当前可行动窗口。',
    ],
    'job-change': [
      '工作变动先看官禄宫、迁移宫、财帛宫、命宫、田宅宫与福德宫，再结合当前运限落宫和四化触发。',
      '重点区分留任积累、跳槽窗口、转方向成本、平台资源、收入变化和短期风险，不要泛写成事业总论。',
    ],
    'startup-partnership': [
      '创业合作先看官禄宫、财帛宫、迁移宫、命宫、福德宫与兄弟宫，再结合当前运限落宫和四化触发。',
      '重点区分当前更适合单干、合作、试水、继续积累还是暂缓，并说明方向选择、资源来源、合作分工和现金流风险。',
    ],
    'investment-partnership': [
      '投资合作先看财帛宫、官禄宫、福德宫、兄弟宫、迁移宫与命宫的联动。',
      '重点区分当前更适合独立投资、合作求财、继续观望还是先守财，并说明收益模式、资金压力、合作分工、风险边界和现实代价。',
    ],
    recent: [
      '近期趋势先看当前运限落宫、命宫、身宫、官禄宫、财帛宫、迁移宫与福德宫的联动。',
      '重点区分当前阶段主线、近期适合主动推进的事项、应该暂缓的风险、节奏变化点和下一步动作优先级。',
    ],
    family: [
      '六亲家庭先看父母宫、兄弟宫、田宅宫、福德宫、命宫，以及夫妻宫、子女宫与当前运限的牵动。',
      '区分原生家庭影响、现实责任分配、情感边界、照护压力和可调整的相处方式。',
    ],
    'home-move': [
      '搬家置业先看田宅宫、迁移宫、财帛宫、福德宫、命宫与父母宫，再结合当前运限落宫和四化触发。',
      '重点区分现在更适合搬家、换城市、买房置业、租住调整还是继续观望，并说明稳定性、资金压力、家庭牵动和现实代价。',
    ],
    'settle-relocate': [
      '定居换城先看田宅宫、迁移宫、官禄宫、财帛宫、福德宫、命宫与父母宫，再结合当前运限落宫和四化触发。',
      '重点区分现在更适合留在当前城市、换城发展、两地过渡还是暂缓决定，并说明稳定性、事业机会、家庭牵动、成本压力和行动顺序。',
    ],
    social: [
      '人际合作先看兄弟宫、迁移宫、福德宫、命宫、官禄宫和财帛宫的联动。',
      '区分合作方式、贵人来源、沟通短板、圈层筛选和关系消耗，不把人脉与婚恋混在一起。',
    ],
    emotion: [
      '情绪调节先看福德宫、疾厄宫、命宫、身宫、田宅宫和当前运限触发。',
      '区分安全感来源、情绪触发点、压力累积和修复方式，只给趋势提醒与可执行建议。',
    ],
    health: [
      '健康养护先看疾厄宫、福德宫、命宫、身宫、迁移宫和当前运限触发。',
      '只判断更容易承压的方向、慢性消耗与阶段性风险，给作息、情绪、检查和养护建议，不做医学诊断。',
    ],
    study: [
      '学业成长先看命宫、福德宫、官禄宫、父母宫、迁移宫和当前运限联动。',
      '区分理解吸收、专注持续、考试发挥、进修路径和学习方法，不把短期波动直接说成长期定局。',
    ],
    'study-advance': [
      '考证进修先看命宫、福德宫、官禄宫、父母宫、迁移宫和当前运限联动，再看当前岁限是否适合学习投入与证书积累。',
      '重点区分更适合考证、读研进修、跨领域学习还是暂缓，并说明投入产出、执行压力和现实代价。',
    ],
    'exam-landing': [
      '考试上岸先看命宫、福德宫、官禄宫、父母宫、迁移宫与当前运限联动，再看当前岁限是否正在放大考试、面试或申请的上岸窗口。',
      '重点区分更适合全力冲刺、稳住发挥、优化目标还是调整预期，并说明上岸机会、失误风险、准备节奏和下一步动作。',
    ],
    'reconciliation-decision': [
      '复合判断先看夫妻宫、命宫、福德宫、迁移宫、子女宫与当前运限牵动，再看桃花星曜和四化是否重新点燃旧缘或继续放大消耗。',
      '重点区分当前更适合争取复合、保持观察、先立边界还是及时放下，并说明复合条件、现实阻力、风险信号和接下来的判断标准。',
    ],
    growth: [
      '成长课题先看命宫、身宫、福德宫、官禄宫、田宅宫和当前运限的长期牵动。',
      '区分原局底色、反复受阻模式、需要整合的矛盾与现实突破口，不讲空泛的心灵鸡汤。',
    ],
    talent: [
      '天赋优势先看命宫、身宫、官禄宫、财帛宫、福德宫与迁移宫的组合。',
      '区分学习吸收、表达输出、组织执行和资源整合的不同优势，并说明更适合放大的场景。',
    ],
    chat: [
      '自由问答先判断问题落在哪些宫位，再选取对应宫位、三方四正、四化和运限作为主证据。',
      '如果问题涉及健康、家庭或具体风险，要保守表达，只给趋势、提醒和可执行建议。',
    ],
  };

  return [...commonLines, ...(topicLines[topic] || topicLines.chat)]
    .map((line) => `- ${line}`)
    .join('\n');
}

export function buildCombinedZiweiPrompt(
  payload: AnalysisPayloadV1,
  topic: string,
  question: string,
  options: { isCustomQuestion?: boolean } = {},
) {
  const isCustomQuestion = Boolean(options.isCustomQuestion);
  const normalizedQuestion =
    question.trim() || getZiweiDefaultQuestion(topic, { isCustomQuestion });
  const reportContext = createZiweiReportContext(payload, topic);
  const pack = buildPortablePromptPack({
    payload,
    reportContext,
  });

  return [
    ZIWEI_ANALYST_ROLE,
    '【要求】',
    `- ${ZIWEI_ANALYSIS_REQUIREMENT}`,
    ...(isCustomQuestion
      ? []
      : [
          '- 先直接回答【问题】，再展开最关键的 2 到 4 个重点。',
          '- 每个重点都要写明盘面依据、触发机制与建议。',
          '- 优先说明宫位主线、四化命中、格局线索、自化迹象和三方四正呼应。',
        ]),
    '- 资料包里没有直接写出的额外盘面事实，不得自行补算、脑补或假定。',
    '- 不要整段复述原始盘面信息。',
    '',
    `【当前时间】\n${formatPromptCurrentTime()}`,
    pack,
    `【问题】\n${normalizedQuestion}`,
    ...(isCustomQuestion
      ? []
      : [
          `【分析框架】\n${buildZiweiTopicGuidanceSection(topic)}`,
          '【任务】\n结合【当前报告任务】、盘面结构与当前运限，优先从宫位主线、四化触发、格局线索、自化与三方四正呼应中提炼核心判断、关键依据和建议。',
          '【输出要求】\n先直接回答【问题】，再展开最关键的 2 到 4 个重点；每个重点都要写明盘面依据、触发机制与建议；证据不足或结论存在条件时要单独说明。',
        ]),
  ].join('\n');
}

export function buildCombinedZiweiCompatibilityPrompt(params: {
  primaryPayload: AnalysisPayloadV1;
  partnerPayload: AnalysisPayloadV1;
  topic: string;
  question: string;
  isCustomQuestion?: boolean;
}) {
  const isCustomQuestion = Boolean(params.isCustomQuestion);
  const primaryContext = createZiweiReportContext(params.primaryPayload, params.topic);
  const partnerContext = createZiweiReportContext(params.partnerPayload, params.topic);
  const primaryPack = buildPortablePromptPack({
    payload: params.primaryPayload,
    reportContext: primaryContext,
  });
  const partnerPack = buildPortablePromptPack({
    payload: params.partnerPayload,
    reportContext: partnerContext,
  });
  const compatibilityTopic = params.topic || 'chat';

  const compatibilityRulesMap: Record<string, string[]> = {
    recent: [
      '- 先判断双方当前阶段的互动主轴，再展开 2 到 4 个关键点。',
      '- 重点说明近期节奏变化、推进阻力、关系或合作压力，以及更适合的行动顺序。',
    ],
    relationship: [
      '- 先判断关系主轴，再展开 2 到 4 个关键点。',
      '- 重点说明关系模式、互补点、冲突点、四化牵动、推进节奏与建议。',
    ],
    'relationship-push': [
      '- 先判断当前这段关系更适合推进、放慢还是重新评估，再展开 2 到 4 个关键点。',
      '- 重点说明推进阻力、投入价值、关系节奏、现实边界和下一步建议。',
    ],
    'career-wealth': [
      '- 先判断合作主轴，再展开 2 到 4 个关键点。',
      '- 重点说明合作分工、资源互补、利益风险、四化牵动与长期建议。',
    ],
    chat: [
      '- 先判断互动主轴，再展开 2 到 4 个关键点。',
      '- 重点说明互动模式、沟通盲点、边界压力、四化牵动与长期建议。',
    ],
  };
  const compatibilityTaskMap: Record<string, string> = {
    recent:
      '请综合双方盘面，重点分析当前阶段最强触发点、近期互动节奏、主要阻力风险，以及更适合的现实推进建议。',
    relationship:
      '请综合双方盘面，重点分析关系模式、互补点、冲突点、四化牵动、长期走向与相处建议。',
    'relationship-push':
      '请综合双方盘面，重点分析这段关系当前更适合推进、放慢还是重新评估，并说明投入价值、现实阻力、节奏变化与建议。',
    'career-wealth': '请综合双方盘面，重点分析合作分工、资源互补、利益风险、四化牵动与长期建议。',
    chat: '请综合双方盘面，重点分析互动模式、沟通盲点、边界压力、四化牵动与长期建议。',
  };
  const compatibilityQuestionMap: Record<string, string> = {
    recent: '请先从当前阶段重点、近期互动节奏和风险提醒开始分析。',
    relationship: '请先从双方关系匹配度、互动模式和相处建议开始分析。',
    'relationship-push': '请先从这段关系该主动推进、稳定经营还是先放慢开始分析。',
    'relationship-decision': '请先从这段关系该继续投入、放手止损还是保持观察开始分析。',
    'career-wealth': '请先从合作默契、优势互补和潜在风险开始分析。',
    'startup-partnership': '请先从适不适合创业、单干还是合作，以及如何判断当前时机开始分析。',
    chat: '请先从互动模式、沟通盲点和长期建议开始分析。',
  };
  const compatibilityRules =
    compatibilityRulesMap[compatibilityTopic] ?? compatibilityRulesMap.chat;
  const compatibilityTask = compatibilityTaskMap[compatibilityTopic] ?? compatibilityTaskMap.chat;
  const compatibilityQuestion =
    compatibilityQuestionMap[compatibilityTopic] ??
    getZiweiCompatibilityDefaultQuestion(compatibilityTopic);

  return [
    ZIWEI_COMPATIBILITY_ROLE,
    '【要求】',
    '- 只基于提供的双方盘面和问题作答。',
    '- 资料包里没有直接写出的额外盘面事实，不得自行补算、脑补或假定。',
    ...(isCustomQuestion ? [] : compatibilityRules),
    '- 不要整段复述双方原始盘面信息。',
    '',
    `【当前时间】\n${formatPromptCurrentTime()}`,
    '【第一人盘面】',
    primaryPack,
    '',
    '【第二人盘面】',
    partnerPack,
    '',
    `【问题】\n${params.question.trim() || compatibilityQuestion}`,
    ...(isCustomQuestion
      ? []
      : [
          `【任务】\n${compatibilityTask}`,
          '【输出要求】\n先直接回答【问题】，再展开最关键的 2 到 4 个重点；每个重点都要写明盘面依据、触发机制与建议；证据不足或结论存在条件时要单独说明。',
        ]),
  ].join('\n');
}
