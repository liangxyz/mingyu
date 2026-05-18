import type {
  AlmanacData,
  AlmanacParticipantInput,
  AlmanacTopic,
  AstrolabeBirthInput,
  DivinationData,
  LenormandSpreadType,
  LiuyaoTemplateType,
  LiurenData,
  LiurenTemplateType,
  SupplementaryInfo,
  XiaoliurenDivinationMethod,
} from '../../../types/divination';
import type { DivinationMethodId } from '../config';
import {
  buildAstrolabeTopicGuidanceSection,
  buildAstrolabeTopicOutputRequirement,
  buildAstrolabeTopicTask,
  getAstrolabeDefaultQuestion,
  type AstrolabePromptTopic,
} from '../../astrolabe-prompts';
import {
  buildSection,
  buildSolarTimeInfoText,
  buildTimeInfoText,
  formatDivinationInfo,
  formatSupplementaryInfoSection,
} from './formatters';
import {
  buildMethodOutputRequirementText,
  buildMethodRequirementText,
  buildRoleText,
  buildTaskText,
} from './method-text';
import { buildLiurenTemplateText } from './liuren-template';
import { buildLiuyaoTemplateText } from './liuyao-template';

const CONCRETE_DIVINATION_METHODS: Array<Exclude<DivinationMethodId, 'random'>> = [
  'liuyao',
  'meihua',
  'xiaoliuren',
  'qimen',
  'liuren',
  'tarot',
  'ssgw',
  'lenormand',
];

export type DivinationDraft = {
  method: DivinationMethodId;
  question: string;
  questionSource?: 'custom' | 'inspiration';
  gender: '' | '男' | '女';
  birthYear: string;
  meihuaMethod: 'time' | 'number' | 'random';
  meihuaNumber: string;
  xiaoliurenMethod: XiaoliurenDivinationMethod;
  xiaoliurenNumber: string;
  meihuaFocus?: 'general' | 'trend' | 'relationship' | 'decision';
  xiaoliurenFocus?: 'general' | 'emotion' | 'career' | 'wealth' | 'social' | 'trend';
  qimenFocus?: 'general' | 'timing' | 'strategy' | 'competition';
  liuyaoTemplate: LiuyaoTemplateType;
  liurenTemplate: LiurenTemplateType;
  tarotSpread: 'single' | 'three' | 'love' | 'career' | 'decision';
  almanacTopic: AlmanacTopic;
  almanacStartDate: string;
  almanacEndDate: string;
  almanacParticipants: AlmanacParticipantInput[];
  lenormandSpread: LenormandSpreadType;
  astrolabeName: string;
  astrolabeGender: '' | '男' | '女';
  astrolabeYear: string;
  astrolabeMonth: string;
  astrolabeDay: string;
  astrolabeHour: string;
  astrolabeMinute: string;
  astrolabeLatitude: string;
  astrolabeLongitude: string;
  astrolabeTimezone: string;
  astrolabeTopic?: AstrolabePromptTopic;
};

export type DivinationSession = {
  method: Exclude<DivinationMethodId, 'random'>;
  requestedMethod: DivinationMethodId;
  question: string;
  prompt: string;
  data: DivinationData;
};

export type BuildDivinationPromptOptions = {
  isCustomQuestion?: boolean;
  liuyaoTemplate?: LiuyaoTemplateType;
  liurenTemplate?: LiurenTemplateType;
  meihuaFocus?: NonNullable<DivinationDraft['meihuaFocus']>;
  xiaoliurenFocus?: NonNullable<DivinationDraft['xiaoliurenFocus']>;
  qimenFocus?: NonNullable<DivinationDraft['qimenFocus']>;
  astrolabeTopic?: AstrolabePromptTopic;
};

export function buildDivinationPrompt(
  method: Exclude<DivinationMethodId, 'random'>,
  question: string,
  data: DivinationData,
  supplementaryInfo?: SupplementaryInfo,
  options: BuildDivinationPromptOptions = {},
) {
  const isCustomQuestion = Boolean(options.isCustomQuestion);
  const liuyaoTemplate = options.liuyaoTemplate ?? 'general';
  const liurenTemplate = options.liurenTemplate ?? 'general';
  const meihuaFocus = options.meihuaFocus ?? 'general';
  const xiaoliurenFocus = options.xiaoliurenFocus ?? 'general';
  const qimenFocus = options.qimenFocus ?? 'general';
  const isAlmanac = method === 'almanac';
  const astrolabeTopic =
    method === 'astrolabe' ? (options.astrolabeTopic ?? (isCustomQuestion ? 'chat' : 'life')) : '';
  const normalizedQuestion =
    method === 'astrolabe'
      ? question.trim() || getAstrolabeDefaultQuestion(astrolabeTopic, { isCustomQuestion })
      : question;
  const timeInfo = method === 'astrolabe' ? buildSolarTimeInfoText(data) : buildTimeInfoText(data);
  const supplementarySection = formatSupplementaryInfoSection(method, supplementaryInfo);
  const infoText = formatDivinationInfo(method, data, normalizedQuestion, supplementaryInfo);
  const requirementText = [
    isAlmanac
      ? '- 只基于提供的择日信息、补充信息与现实约束作答。'
      : '- 只基于提供的占卜信息与问题作答。',
    isAlmanac
      ? '- 资料包里没有直接写出的现实约束、参与人信息或择日条件，不得自行补充假定。'
      : '- 资料包里没有直接写出的卦象细节、盘局数据、牌位信息或签文条件，不得自行补算或假定。',
    ...(isCustomQuestion
      ? []
      : isAlmanac
        ? [
            '- 先直接给出择日结论，再讲主证据、条件限制和建议。',
            '- 优先抓最能影响筛选结果的 2 到 4 个证据点，不要平均复述全部候选日期资料。',
            '- 依据必须尽量落到黄历宜忌、冲煞、神煞、执日、星宿和参与人八字适配信息。',
          ]
        : [
            '- 先直接回答【问题】，再讲主证据、条件限制和建议。',
            '- 优先抓最能决定判断方向的 2 到 4 个证据点，不要平均复述全部材料。',
            '- 依据必须尽量落到卦象、盘局、牌面或签文信息。',
            ...(method === 'astrolabe'
              ? ['- 不要泛泛讲星座性格，必须把相关星体、宫位、守护星和相位连到问题。']
              : []),
          ]),
    '- 使用简体中文，不写空话，不重复抄写原始信息。',
    isCustomQuestion ? '' : buildMethodRequirementText(method),
    isCustomQuestion
      ? ''
      : buildDivinationFocusRequirementText(method, meihuaFocus, xiaoliurenFocus, qimenFocus),
  ].join('\n');
  const outputRequirementText = isAlmanac
    ? [
        '先直接给出首选日期、备选日期与慎用日期，再展开最关键的 2 到 4 个筛选重点；每个重点都要写明择日依据、适用条件与现实建议。',
        '如果信息不足或存在不确定性，需要明确说明，不要强行下绝对判断。',
        '最后补一条最值得执行的提醒。',
        buildMethodOutputRequirementText(method),
      ].join('\n')
    : method === 'liuren'
      ? [
          '先直接回答【问题】，再按【断课模板】或主线顺序展开起因、过程、结果与行动建议。',
          '每一段都要写明对应的课传依据、触发条件与现实建议。',
          '如果信息不足或存在不确定性，需要明确说明，不要强行下绝对判断。',
          '最后补一条最值得执行的提醒。',
          buildMethodOutputRequirementText(method),
        ].join('\n')
      : [
          '先直接回答【问题】，再展开最关键的 2 到 4 个重点；每个重点都要写明占卜依据、触发条件与现实建议。',
          '如果信息不足或存在不确定性，需要明确说明，不要强行下绝对判断。',
          '最后补一条最值得执行的提醒。',
          buildDivinationFocusOutputRequirementText(
            method,
            meihuaFocus,
            xiaoliurenFocus,
            qimenFocus,
          ),
          ...(method === 'astrolabe' ? [buildAstrolabeTopicOutputRequirement(astrolabeTopic)] : []),
          buildMethodOutputRequirementText(method),
        ].join('\n');
  const liurenTemplateSection =
    method === 'liuren'
      ? buildSection('【断课模板】', buildLiurenTemplateText(liurenTemplate, data as LiurenData))
      : '';
  const liuyaoTemplateSection =
    method === 'liuyao'
      ? buildSection('【断卦模板】', buildLiuyaoTemplateText(liuyaoTemplate, question))
      : '';
  const astrolabeGuidanceSection =
    method === 'astrolabe' && !isCustomQuestion
      ? buildSection('【分析框架】', buildAstrolabeTopicGuidanceSection(astrolabeTopic))
      : '';
  const divinationFocusGuidanceSection = isCustomQuestion
    ? ''
    : buildSection(
        '【分析框架】',
        buildDivinationFocusGuidanceText(method, meihuaFocus, xiaoliurenFocus, qimenFocus),
      );
  const taskText =
    method === 'astrolabe' && !isCustomQuestion
      ? buildAstrolabeTopicTask(astrolabeTopic)
      : buildDivinationFocusTaskText(method, meihuaFocus, xiaoliurenFocus, qimenFocus);

  return [
    buildRoleText(method),
    buildSection('【要求】', requirementText),
    buildSection('【当前时间】', timeInfo),
    supplementarySection ? buildSection('【补充信息】', supplementarySection) : '',
    buildSection('【占卜信息】', infoText),
    isAlmanac ? '' : buildSection('【问题】', normalizedQuestion),
    isCustomQuestion ? '' : astrolabeGuidanceSection,
    isCustomQuestion || astrolabeGuidanceSection ? '' : divinationFocusGuidanceSection,
    isCustomQuestion ? '' : buildSection('【任务】', taskText),
    isCustomQuestion ? '' : liuyaoTemplateSection,
    isCustomQuestion ? '' : liurenTemplateSection,
    isCustomQuestion ? '' : buildSection('【输出要求】', outputRequirementText),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildSupplementaryInfo(draft: DivinationDraft): SupplementaryInfo | undefined {
  const birthYear = draft.birthYear.trim() ? Number(draft.birthYear) : undefined;
  const hasBirthYear = typeof birthYear === 'number' && Number.isFinite(birthYear);

  const info: SupplementaryInfo = {};

  if (draft.gender) {
    info.gender = draft.gender;
  }
  if (hasBirthYear) {
    info.birthYear = birthYear;
  }
  if (draft.method === 'meihua') {
    info.meihuaSettings = {
      method: draft.meihuaMethod,
      ...(draft.meihuaMethod === 'number' && draft.meihuaNumber.trim()
        ? { number: Number(draft.meihuaNumber) }
        : {}),
    };
  }
  if (draft.method === 'almanac' && draft.question.trim()) {
    info.userSupplement = draft.question.trim();
  }

  return Object.keys(info).length > 0 ? info : undefined;
}

function validateDraft(draft: DivinationDraft) {
  if (draft.method !== 'almanac' && !draft.question.trim()) {
    throw new Error('请输入你想占卜的问题');
  }

  if (draft.method === 'meihua' && draft.meihuaMethod === 'number') {
    const number = Number(draft.meihuaNumber);
    if (!Number.isInteger(number) || number <= 0) {
      throw new Error('数字起卦需要填写正整数');
    }
  }

  if (draft.method === 'xiaoliuren' && draft.xiaoliurenMethod === 'number') {
    const number = Number(draft.xiaoliurenNumber);
    if (!Number.isInteger(number) || number <= 0) {
      throw new Error('小六壬数字起课需要填写正整数');
    }
  }

  if (draft.method === 'almanac') {
    if (!draft.almanacStartDate || !draft.almanacEndDate) {
      throw new Error('黄历择日需要选择开始日期和结束日期');
    }
  }

  if (draft.method === 'astrolabe') {
    const requiredFields = [
      draft.astrolabeYear,
      draft.astrolabeMonth,
      draft.astrolabeDay,
      draft.astrolabeHour,
      draft.astrolabeMinute,
      draft.astrolabeLatitude,
      draft.astrolabeLongitude,
      draft.astrolabeTimezone,
    ];
    if (requiredFields.some((value) => !value.trim())) {
      throw new Error('星盘需要填写出生时间、经纬度和时区');
    }
  }
}

function buildAlmanacSessionTitle(data: AlmanacData) {
  return `黄历择日：${data.topicLabel}（${data.startDate} 至 ${data.endDate}）`;
}

function resolveMethod(method: DivinationMethodId): Exclude<DivinationMethodId, 'random'> {
  if (method !== 'random') {
    return method;
  }

  const index = Math.floor(Math.random() * CONCRETE_DIVINATION_METHODS.length);
  return CONCRETE_DIVINATION_METHODS[index];
}

export async function generateDivinationSession(
  draft: DivinationDraft,
): Promise<DivinationSession> {
  validateDraft(draft);
  const method = resolveMethod(draft.method);
  const supplementaryInfo = buildSupplementaryInfo({
    ...draft,
    method,
  });
  const inputQuestion = draft.question.trim();

  let data: DivinationData;
  switch (method) {
    case 'liuyao': {
      const module = await import('../algorithms/liuyao');
      data = module.generateLiuyao();
      break;
    }
    case 'meihua': {
      const module = await import('../algorithms/meihua');
      data = module.generateMeihua(undefined, supplementaryInfo?.meihuaSettings);
      break;
    }
    case 'xiaoliuren': {
      const module = await import('../algorithms/xiaoliuren');
      data = module.generateXiaoliuren({
        method: draft.xiaoliurenMethod,
        ...(draft.xiaoliurenMethod === 'number' && draft.xiaoliurenNumber.trim()
          ? { number: Number(draft.xiaoliurenNumber) }
          : {}),
      });
      break;
    }
    case 'qimen': {
      const module = await import('../algorithms/qimen');
      data = module.generateQimen();
      break;
    }
    case 'liuren': {
      const module = await import('../algorithms/liuren');
      data = module.generateLiuren();
      break;
    }
    case 'tarot': {
      const module = await import('../../../utils/tarot');
      if (draft.tarotSpread === 'single') {
        const result = module.drawSingleCard();
        data = {
          spreadType: 'single',
          spreadName: '单牌指引',
          cards: [
            {
              id: result.card.number,
              name: result.card.name,
              position: result.position,
              reversed: result.isReversed,
              keywords: module.getCardKeywords(result.card.name).split(','),
            },
          ],
          timestamp: result.timestamp,
        };
      } else {
        const result = module.drawSpreadCards(draft.tarotSpread);
        data = {
          spreadType: draft.tarotSpread,
          spreadName: module.tarotSpreads[draft.tarotSpread].name,
          cards: result.cards.map((item) => ({
            id: item.card.number,
            name: item.card.name,
            position: item.position,
            reversed: item.isReversed,
            keywords: module.getCardKeywords(item.card.name).split(','),
          })),
          timestamp: result.timestamp,
        };
      }
      break;
    }
    case 'ssgw': {
      const module = await import('../algorithms/ssgw');
      data = module.drawRandomSign();
      break;
    }
    case 'almanac': {
      const module = await import('../algorithms/almanac');
      data = module.generateAlmanacSelection({
        topic: draft.almanacTopic,
        startDate: draft.almanacStartDate,
        endDate: draft.almanacEndDate,
        participants: draft.almanacParticipants,
      });
      break;
    }
    case 'lenormand': {
      const module = await import('../algorithms/lenormand');
      data = module.drawLenormandSpread(draft.lenormandSpread);
      break;
    }
    case 'astrolabe': {
      const module = await import('../algorithms/astrolabe');
      const input: AstrolabeBirthInput = {
        name: draft.astrolabeName,
        gender: draft.astrolabeGender,
        year: draft.astrolabeYear,
        month: draft.astrolabeMonth,
        day: draft.astrolabeDay,
        hour: draft.astrolabeHour,
        minute: draft.astrolabeMinute,
        latitude: draft.astrolabeLatitude,
        longitude: draft.astrolabeLongitude,
        timezone: draft.astrolabeTimezone,
      };
      data = module.generateAstrolabe(input);
      break;
    }
    default:
      throw new Error('暂不支持当前占卜方式');
  }

  const question =
    method === 'almanac' && !inputQuestion
      ? buildAlmanacSessionTitle(data as AlmanacData)
      : inputQuestion;
  const prompt = buildDivinationPrompt(method, question, data, supplementaryInfo, {
    isCustomQuestion: method === 'almanac' ? false : draft.questionSource === 'custom',
    liuyaoTemplate: draft.liuyaoTemplate,
    liurenTemplate: draft.liurenTemplate,
    meihuaFocus: draft.meihuaFocus,
    xiaoliurenFocus: draft.xiaoliurenFocus,
    qimenFocus: draft.qimenFocus,
    astrolabeTopic: draft.astrolabeTopic,
  });
  return {
    method,
    requestedMethod: draft.method,
    question,
    prompt,
    data,
  };
}

function buildDivinationFocusGuidanceText(
  method: Exclude<DivinationMethodId, 'random'>,
  meihuaFocus: NonNullable<DivinationDraft['meihuaFocus']>,
  xiaoliurenFocus: NonNullable<DivinationDraft['xiaoliurenFocus']>,
  qimenFocus: NonNullable<DivinationDraft['qimenFocus']>,
) {
  if (method === 'meihua') {
    switch (meihuaFocus) {
      case 'trend':
        return '先定体用强弱与当前主轴，再看互卦呈现过程变化，最后用变卦判断后续走势、转折点与顺势动作。';
      case 'relationship':
        return '重点判断双方关系当前是靠近、僵持还是疏离，再看主要阻力在自身、对方还是外部环境，最后落到短期互动趋势与沟通建议。';
      case 'decision':
        return '重点比较当前选择是否顺势、最容易忽略的风险在哪里，以及眼下更适合推进、观望还是调整路径。';
      default:
        return '';
    }
  }

  if (method === 'xiaoliuren') {
    switch (xiaoliurenFocus) {
      case 'emotion':
        return '先以结果宫位定关系走向，再回看起因、过程解释情绪和沟通卡点，最后给出主动、等待、缓和或止损建议。';
      case 'career':
        return '先看结果宫位定事情能否推进，再结合起因与过程判断阻力、节奏、是否宜动，以及下一步更稳的动作。';
      case 'wealth':
        return '重点判断见财可能、破财风险、投入节奏，以及当下更适合先守、先看还是先动。';
      case 'social':
        return '重点判断对方态度、沟通风险、是否适合请托协作，以及关系后续更容易缓和还是生变。';
      case 'trend':
        return '重点判断整体走势、反复点、关键卡点，以及当下先等、先动还是先调整更顺。';
      default:
        return '';
    }
  }

  if (method === 'qimen') {
    switch (qimenFocus) {
      case 'timing':
        return '先看值符值使与用门落宫判断当前时机，再结合空亡、马星和门星神干判断宜动宜守与更合适的时间窗口。';
      case 'strategy':
        return '重点看用门、关键宫位和门星神干组合，判断该怎么布局、借势、绕阻，以及优先做哪一步成功率更高。';
      case 'competition':
        return '重点看己方与对方对应宫位的强弱、生克和门星神干状态，判断谁更占上风、风险点在哪，以及该主动还是后手应对。';
      default:
        return '';
    }
  }

  return '';
}

function buildDivinationFocusTaskText(
  method: Exclude<DivinationMethodId, 'random'>,
  meihuaFocus: NonNullable<DivinationDraft['meihuaFocus']>,
  xiaoliurenFocus: NonNullable<DivinationDraft['xiaoliurenFocus']>,
  qimenFocus: NonNullable<DivinationDraft['qimenFocus']>,
) {
  if (method === 'meihua') {
    switch (meihuaFocus) {
      case 'trend':
        return '请围绕体用关系、互卦过程、变卦结果和四时旺衰，判断事情走势、转折点与顺势动作，直接回答问题。';
      case 'relationship':
        return '请围绕体用关系、互卦过程、变卦结果和四时旺衰，判断关系状态、阻力来源、短期互动趋势与沟通建议，直接回答问题。';
      case 'decision':
        return '请围绕体用关系、互卦过程、变卦结果和四时旺衰，判断当前选择是否顺势、风险点在哪、下一步更适合怎么走，直接回答问题。';
      default:
        return buildTaskText(method);
    }
  }

  if (method === 'xiaoliuren') {
    switch (xiaoliurenFocus) {
      case 'emotion':
        return '请围绕起因、过程、结果三段宫位变化，判断关系走向、沟通卡点与该主动、缓和还是止损，直接回答问题。';
      case 'career':
        return '请围绕起因、过程、结果三段宫位变化，判断事情能否推进、节奏是否顺、阻力在哪，以及下一步更稳的动作，直接回答问题。';
      case 'wealth':
        return '请围绕起因、过程、结果三段宫位变化，判断见财机会、破财风险、投入节奏与先守先动的取舍，直接回答问题。';
      case 'social':
        return '请围绕起因、过程、结果三段宫位变化，判断对方态度、沟通风险、是否适合请托协作，以及关系后续变化，直接回答问题。';
      case 'trend':
        return '请围绕起因、过程、结果三段宫位变化，判断整体走势、关键卡点与当前先等还是先动更顺，直接回答问题。';
      default:
        return buildTaskText(method);
    }
  }

  if (method === 'qimen') {
    switch (qimenFocus) {
      case 'timing':
        return '请围绕值符值使、用门落宫、门星神干组合、空亡与马星变化，判断当前时机、宜动宜守与更合适的时间窗口，直接回答问题。';
      case 'strategy':
        return '请围绕值符值使、用门落宫、门星神干组合、格局强弱与可用宫位，判断布局路径、借势方向、优先动作和绕开阻力的方法，直接回答问题。';
      case 'competition':
        return '请围绕值符值使、己方与对方对应宫位、门星神干生克与格局强弱，判断双方态势、胜算、风险与先手策略，直接回答问题。';
      default:
        return buildTaskText(method);
    }
  }

  return buildTaskText(method);
}

function buildDivinationFocusRequirementText(
  method: Exclude<DivinationMethodId, 'random'>,
  meihuaFocus: NonNullable<DivinationDraft['meihuaFocus']>,
  xiaoliurenFocus: NonNullable<DivinationDraft['xiaoliurenFocus']>,
  qimenFocus: NonNullable<DivinationDraft['qimenFocus']>,
) {
  if (method === 'meihua') {
    switch (meihuaFocus) {
      case 'relationship':
        return '- 不要把关系题泛讲成性格题，必须交代关系现状、阻力位置和短期互动变化。';
      case 'decision':
        return '- 不要只说吉凶，要明确当前选择更顺的方向、风险点和行动顺序。';
      default:
        return '';
    }
  }

  if (method === 'xiaoliuren') {
    switch (xiaoliurenFocus) {
      case 'emotion':
        return '- 不要只给感情吉凶词，必须落到关系走向、沟通卡点和现实动作。';
      case 'wealth':
        return '- 不要空泛说财运好坏，必须区分见财机会、破财风险和投入节奏。';
      default:
        return '';
    }
  }

  if (method === 'qimen') {
    switch (qimenFocus) {
      case 'timing':
        return '- 不要把时机题写成泛化趋势题，必须明确现在宜动、宜守还是宜等。';
      case 'strategy':
        return '- 不要只列格局名词，必须交代该借什么势、先做什么、避开什么。';
      case 'competition':
        return '- 不要只说谁强谁弱，必须交代胜负关键点和应对顺序。';
      default:
        return '';
    }
  }

  return '';
}

function buildDivinationFocusOutputRequirementText(
  method: Exclude<DivinationMethodId, 'random'>,
  meihuaFocus: NonNullable<DivinationDraft['meihuaFocus']>,
  xiaoliurenFocus: NonNullable<DivinationDraft['xiaoliurenFocus']>,
  qimenFocus: NonNullable<DivinationDraft['qimenFocus']>,
) {
  if (method === 'meihua') {
    switch (meihuaFocus) {
      case 'trend':
        return '要明确写出当前走势、关键转折点和最顺势的一步。';
      case 'relationship':
        return '要明确写出关系现状、主要阻力、短期互动趋势和沟通建议。';
      case 'decision':
        return '要明确写出哪个方向更顺、最大风险点在哪里，以及下一步先做什么。';
      default:
        return '';
    }
  }

  if (method === 'xiaoliuren') {
    switch (xiaoliurenFocus) {
      case 'emotion':
        return '要明确写出关系走向、沟通风险，以及现在更适合主动、缓和、等待还是止损。';
      case 'career':
        return '要明确写出事情能否推进、哪里最卡，以及现在更适合推进、观察还是调整。';
      case 'wealth':
        return '要明确写出钱的机会点、风险点，以及现在更适合先守还是先动。';
      case 'social':
        return '要明确写出对方态度、沟通风险，以及是否适合请托协作。';
      case 'trend':
        return '要明确写出整体走势、关键卡点，以及现在先等还是先动更顺。';
      default:
        return '';
    }
  }

  if (method === 'qimen') {
    switch (qimenFocus) {
      case 'timing':
        return '要明确写出现在是否宜动、宜守或宜等，以及对应的时机依据。';
      case 'strategy':
        return '要明确写出最值得先做的一步、可借的势与需要绕开的阻力。';
      case 'competition':
        return '要明确写出双方态势、胜负关键点，以及该主动出击还是后手应对。';
      default:
        return '';
    }
  }

  return '';
}
