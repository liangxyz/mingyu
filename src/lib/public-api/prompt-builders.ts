import type { ScopeType } from '../../types/analysis';
import type { BaziChartResult } from '../../utils/bazi/baziTypes';
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
}) {
  const option = resolveBaziPromptOption(params.topic ?? 'general');
  const prompt = buildPromptFromConfig(
    params.question ?? '',
    option,
    params.result,
    null,
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
