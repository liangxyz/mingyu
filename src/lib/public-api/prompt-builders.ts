import type { ScopeType } from '../../types/analysis';
import type { BaziChartResult } from '../../utils/bazi/baziTypes';
import type { FortuneSelectionContext } from '../../utils/bazi/fortuneSelection';
import {
  BAZI_AI_PROMPTS,
  buildPromptFromConfig,
  type AIPromptOption,
} from '../../utils/ai/aiPrompts';
import { buildCombinedZiweiPrompt, type ZiweiRuntime } from '../full-chart-engine/ziwei';

export const BAZI_PROMPT_TOPICS = [
  'general',
  'recent',
  'career',
  'job-change',
  'startup-partnership',
  'investment-partnership',
  'wealth',
  'marriage',
  'relationship-push',
  'relationship-decision',
  'reconciliation-decision',
  'children',
  'family',
  'home-move',
  'settle-relocate',
  'social',
  'emotion',
  'health',
  'parents',
  'study',
  'study-advance',
  'exam-landing',
  'growth',
  'talent',
] as const;

export const ZIWEI_PROMPT_TOPICS = [
  'destiny',
  'relationship',
  'relationship-push',
  'relationship-decision',
  'children',
  'career-wealth',
  'job-change',
  'startup-partnership',
  'investment-partnership',
  'recent',
  'family',
  'home-move',
  'settle-relocate',
  'social',
  'emotion',
  'health',
  'study',
  'study-advance',
  'exam-landing',
  'growth',
  'talent',
  'reconciliation-decision',
  'life',
  'chat',
] as const;

export const ZIWEI_PROMPT_SCOPES = [
  'origin',
  'decadal',
  'yearly',
  'monthly',
  'daily',
  'hourly',
  'age',
] as const;

export const PROMPT_MODES = ['framework', 'custom'] as const;

export type BaziPromptTopic = (typeof BAZI_PROMPT_TOPICS)[number];
export type ZiweiPromptTopic = (typeof ZIWEI_PROMPT_TOPICS)[number];
export type ZiweiPromptScope = (typeof ZIWEI_PROMPT_SCOPES)[number];
export type PromptMode = (typeof PROMPT_MODES)[number];

const BAZI_TOPIC_TO_PROMPT_ID: Record<BaziPromptTopic, string> = {
  general: 'ai-mingge-zonglun',
  recent: 'ai-recent',
  career: 'ai-career',
  'job-change': 'ai-job-change',
  'startup-partnership': 'ai-startup-partnership',
  'investment-partnership': 'ai-investment-partnership',
  wealth: 'ai-wealth-timing',
  marriage: 'ai-marriage',
  'relationship-push': 'ai-relationship-push',
  'relationship-decision': 'ai-relationship-decision',
  'reconciliation-decision': 'ai-reconciliation-decision',
  children: 'ai-children-fate',
  family: 'ai-home',
  'home-move': 'ai-home-move',
  'settle-relocate': 'ai-settle-relocate',
  social: 'ai-social',
  emotion: 'ai-emotion',
  health: 'ai-health',
  parents: 'ai-family',
  study: 'ai-study',
  'study-advance': 'ai-study-advance',
  'exam-landing': 'ai-exam-landing',
  growth: 'ai-growth',
  talent: 'ai-talent',
};

export function buildCombinedPromptText(system: string, user: string) {
  return [system, user].filter(Boolean).join('\n\n');
}

function resolveBaziPromptOption(topic: BaziPromptTopic): AIPromptOption {
  const promptId = BAZI_TOPIC_TO_PROMPT_ID[topic] ?? BAZI_TOPIC_TO_PROMPT_ID.general;
  return BAZI_AI_PROMPTS.single.find((item) => item.id === promptId) ?? BAZI_AI_PROMPTS.single[0];
}

export function buildBaziPromptForResult(params: {
  result: BaziChartResult;
  question?: string;
  topic?: BaziPromptTopic;
  mode?: PromptMode;
  fortuneSelectionContext?: FortuneSelectionContext | null;
}) {
  const option = resolveBaziPromptOption(params.topic ?? 'general');
  const prompt = buildPromptFromConfig(
    params.question ?? '',
    option,
    params.result,
    params.fortuneSelectionContext ?? null,
    params.topic ?? 'general',
    { isCustomQuestion: params.mode === 'custom' },
  );

  return buildCombinedPromptText(prompt.system, prompt.user);
}

export function buildSerializableZiweiResult(result: ZiweiRuntime) {
  return {
    basicInfo: result.payloadByScope.origin.basic_info,
    scopeNames: Object.keys(result.payloadByScope),
    payloadByScope: result.payloadByScope,
  };
}

export function buildZiweiPromptForRuntime(params: {
  result: ZiweiRuntime;
  question?: string;
  topic?: ZiweiPromptTopic;
  scope?: ZiweiPromptScope;
  mode?: PromptMode;
}) {
  const scope = params.scope ?? 'origin';
  const payload =
    params.result.payloadByScope[scope as ScopeType] ?? params.result.payloadByScope.origin;
  const fallbackTopic = params.mode === 'custom' ? 'chat' : 'life';
  return buildCombinedZiweiPrompt(payload, params.topic ?? fallbackTopic, params.question ?? '', {
    isCustomQuestion: params.mode === 'custom',
  });
}

function buildPublicZiweiTaskText(topic: ZiweiPromptTopic) {
  const topicTextMap: Partial<Record<ZiweiPromptTopic, string>> = {
    relationship: '围绕感情关系，优先看夫妻宫、命宫、福德宫、迁移宫、三方四正与四化牵动，判断关系模式、风险点和经营建议。',
    'career-wealth':
      '围绕事业财运，优先看官禄宫、财帛宫、命宫、迁移宫、福德宫与四化牵动，判断发展方向、资源优势和风险边界。',
    'job-change':
      '围绕工作变动，优先看官禄宫、迁移宫、财帛宫、命宫与当前分析对象，判断留任、跳槽或转方向的条件。',
    recent:
      '围绕近期趋势，优先看当前分析对象、本命底色、重点宫位和四化触发，判断阶段主线、机会与风险。',
    life: '围绕人生解析，优先看命身定位、长期课题、能力资源、关系模式、关键转折和当前阶段策略。',
    destiny: '围绕命局综述，优先看命身格局、核心宫位、生年四化、三方四正与长期人生主线。',
    chat: '先判断问题落在哪些宫位，再选取对应宫位、三方四正、四化和分析对象作为主要证据。',
  };

  return topicTextMap[topic] ?? topicTextMap.chat!;
}

export function buildPublicZiweiPromptForRuntime(params: {
  result: ZiweiRuntime;
  question?: string;
  topic?: ZiweiPromptTopic;
  scope?: ZiweiPromptScope;
  mode?: PromptMode;
}) {
  const scope = params.scope ?? 'origin';
  const mode = params.mode ?? 'framework';
  const topic = params.topic ?? (mode === 'custom' ? 'chat' : 'life');
  const payload =
    params.result.payloadByScope[scope as ScopeType] ?? params.result.payloadByScope.origin;
  const prompt = buildCombinedZiweiPrompt(payload, topic, params.question ?? '', {
    isCustomQuestion: true,
  });

  if (mode === 'custom') {
    return prompt;
  }

  return [
    prompt,
    '',
    `【任务】\n${buildPublicZiweiTaskText(topic)}请结合【问题】直接给出判断、关键依据和可执行建议。`,
    '',
    '【输出要求】\n先直接回答【问题】，再展开最关键的 2 到 4 个重点；每个重点都要写明主证、辅证、反证或限制；证据不足时要明确说明，不要编造盘面没有提供的信息。',
  ].join('\n');
}
