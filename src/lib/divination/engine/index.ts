import type {
  DivinationData,
  LiurenData,
  LiurenTemplateType,
  SupplementaryInfo,
} from '../../../types/divination';
import type { DivinationMethodId } from '../config';
import {
  buildSection,
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

const CONCRETE_DIVINATION_METHODS: Array<Exclude<DivinationMethodId, 'random'>> = [
  'liuyao',
  'meihua',
  'qimen',
  'liuren',
  'tarot',
  'ssgw',
];

export type DivinationDraft = {
  method: DivinationMethodId;
  question: string;
  gender: '' | '男' | '女';
  birthYear: string;
  meihuaMethod: 'time' | 'number' | 'random';
  meihuaNumber: string;
  liurenTemplate: LiurenTemplateType;
  tarotSpread: 'single' | 'three' | 'love' | 'career' | 'decision';
};

export type DivinationSession = {
  method: Exclude<DivinationMethodId, 'random'>;
  requestedMethod: DivinationMethodId;
  question: string;
  prompt: string;
  data: DivinationData;
};

export function buildDivinationPrompt(
  method: Exclude<DivinationMethodId, 'random'>,
  question: string,
  data: DivinationData,
  supplementaryInfo?: SupplementaryInfo,
  liurenTemplate: LiurenTemplateType = 'general',
) {
  const timeInfo = buildTimeInfoText();
  const supplementarySection = formatSupplementaryInfoSection(supplementaryInfo);
  const infoText = formatDivinationInfo(method, data, question, supplementaryInfo);
  const requirementText = [
    '- 只基于提供的占卜信息与问题作答。',
    '- 先给判断，再讲依据和建议。',
    '- 依据必须尽量落到卦象、盘局、牌面或签文信息。',
    '- 使用简体中文，不写空话，不重复抄写原始信息。',
    buildMethodRequirementText(method),
  ].join('\n');
  const outputRequirementText = [
    '先给核心结论，再展开最关键的 2 到 4 个重点；每个重点都要写明占卜依据与现实建议。',
    '如果信息不足或存在不确定性，需要明确说明，不要强行下绝对判断。',
    '最后补一条最值得执行的提醒。',
    buildMethodOutputRequirementText(method),
  ].join('\n');
  const liurenTemplateSection =
    method === 'liuren'
      ? buildSection('【断课模板】', buildLiurenTemplateText(liurenTemplate, data as LiurenData))
      : '';

  return [
    buildRoleText(method),
    buildSection('【要求】', requirementText),
    buildSection('【当前时间】', timeInfo),
    supplementarySection ? buildSection('【补充信息】', supplementarySection) : '',
    buildSection('【占卜信息】', infoText),
    buildSection('【问题】', question),
    buildSection('【任务】', buildTaskText(method)),
    liurenTemplateSection,
    buildSection('【输出要求】', outputRequirementText),
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

  return Object.keys(info).length > 0 ? info : undefined;
}

function validateDraft(draft: DivinationDraft) {
  if (!draft.question.trim()) {
    throw new Error('请输入你想占卜的问题');
  }

  if (draft.method === 'meihua' && draft.meihuaMethod === 'number') {
    const number = Number(draft.meihuaNumber);
    if (!Number.isInteger(number) || number <= 0) {
      throw new Error('数字起卦需要填写正整数');
    }
  }
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
  const question = draft.question.trim();

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
    default:
      throw new Error('暂不支持当前占卜方式');
  }

  const prompt = buildDivinationPrompt(
    method,
    question,
    data,
    supplementaryInfo,
    draft.liurenTemplate,
  );
  return {
    method,
    requestedMethod: draft.method,
    question,
    prompt,
    data,
  };
}
