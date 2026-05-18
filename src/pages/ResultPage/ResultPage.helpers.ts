import type { DecadalTimelineOption } from '@/lib/iztro/decadal';
import { formatPromptCurrentTime } from '@/lib/prompt-time';
import type { BaziQuestionScene, QueryPromptState, ZiweiScopeMode } from '@/lib/query-state';
import type { AstrolabePromptTopic } from '@/lib/astrolabe-prompts';
import type { PalaceFact } from '@/types/analysis';
import type { BaziChartResult } from '@/utils/bazi/baziTypes';
import type { BaziFortuneSelectionValue } from '@/utils/bazi/fortuneSelection';
import { safeStorage } from '@/lib/safe-storage';
import { ASTROLABE_SHORTCUT_ACTIONS } from '@/lib/astrolabe-prompts';
import {
  baziCompatibilityShortcutActions,
  baziSingleShortcutActions,
  ziweiCompatibilityShortcutActions,
  ziweiScopeLabelMap,
  ziweiSingleShortcutActions,
} from './ResultPage.constants';
import type {
  QuestionInspirationIntent,
  ZiweiDayOption,
  ZiweiMonthOption,
  ZiweiYearOption,
} from './ResultPage.types';

export type PromptDraftKind = 'custom' | 'inspiration';

function buildPromptDraftStorageKey(storageKey: string, kind: PromptDraftKind) {
  return kind === 'custom' ? storageKey : `${storageKey}:${kind}`;
}

export function readPromptDraft(storageKey: string, kind: PromptDraftKind = 'custom') {
  return safeStorage.get(buildPromptDraftStorageKey(storageKey, kind)) ?? '';
}

export function writePromptDraft(
  storageKey: string,
  value: string,
  kind: PromptDraftKind = 'custom',
) {
  const targetKey = buildPromptDraftStorageKey(storageKey, kind);
  if (value.trim()) {
    safeStorage.set(targetKey, value);
    return;
  }
  safeStorage.remove(targetKey);
}

export function getBaziShortcutActions(analysisMode: 'single' | 'compatibility') {
  return analysisMode === 'compatibility'
    ? baziCompatibilityShortcutActions
    : baziSingleShortcutActions;
}

export function getZiweiShortcutActions(analysisMode: 'single' | 'compatibility') {
  return analysisMode === 'compatibility'
    ? ziweiCompatibilityShortcutActions
    : ziweiSingleShortcutActions;
}

export function resolveBaziQuestionSceneByShortcutMode(mode: string): BaziQuestionScene {
  if (mode === '近期') return 'recent';
  if (mode === '事业' || mode === '合伙') return 'career';
  if (mode === '换工作') return 'job-change';
  if (mode === '创业合作') return 'startup-partnership';
  if (mode === '投资合作') return 'investment-partnership';
  if (mode === '财运') return 'wealth';
  if (mode === '婚恋' || mode === '合婚') return 'marriage';
  if (mode === '关系推进') return 'relationship-push';
  if (mode === '关系去留') return 'relationship-decision';
  if (mode === '复合判断') return 'reconciliation-decision';
  if (mode === '子女') return 'children';
  if (mode === '六亲' || mode === '父母' || mode === '兄弟') return 'parents';
  if (mode === '家庭') return 'family';
  if (mode === '搬家置业') return 'home-move';
  if (mode === '定居换城') return 'settle-relocate';
  if (mode === '人际') return 'social';
  if (mode === '情绪') return 'emotion';
  if (mode === '健康') return 'health';
  if (mode === '学业') return 'study';
  if (mode === '考证进修') return 'study-advance';
  if (mode === '考试上岸') return 'exam-landing';
  if (mode === '成长') return 'growth';
  if (mode === '天赋') return 'talent';
  return 'general';
}

export function resolveBaziQuestionSceneByInspirationCategory(
  category?: string,
): BaziQuestionScene {
  return resolveBaziQuestionSceneByShortcutMode(category || '');
}

export function resolveBaziQuestionSceneByInspirationIntent(
  intent?: QuestionInspirationIntent,
): BaziQuestionScene | undefined {
  if (intent === 'job-change') return 'job-change';
  if (intent === 'relationship-push') return 'relationship-push';
  if (intent === 'startup-partnership') return 'startup-partnership';
  if (intent === 'relationship-decision') return 'relationship-decision';
  if (intent === 'investment-partnership') return 'investment-partnership';
  if (intent === 'reconciliation-decision') return 'reconciliation-decision';
  if (intent === 'home-move') return 'home-move';
  if (intent === 'settle-relocate') return 'settle-relocate';
  if (intent === 'study-advance') return 'study-advance';
  if (intent === 'exam-landing') return 'exam-landing';
  return undefined;
}

export function resolveBaziPresetIdByInspirationCategory(category?: string) {
  if (category === '近期') return 'ai-recent';
  if (category === '事业') return 'ai-career';
  if (category === '财运') return 'ai-wealth-timing';
  if (category === '婚恋') return 'ai-marriage';
  if (category === '子女') return 'ai-children-fate';
  if (category === '六亲') return 'ai-family';
  if (category === '家庭') return 'ai-home';
  if (category === '人际') return 'ai-social';
  if (category === '情绪') return 'ai-emotion';
  if (category === '健康') return 'ai-health';
  if (category === '学业') return 'ai-study';
  if (category === '成长') return 'ai-growth';
  if (category === '天赋') return 'ai-talent';
  return 'ai-mingge-zonglun';
}

export function resolveBaziPresetIdByInspirationIntent(intent?: QuestionInspirationIntent) {
  if (intent === 'job-change') return 'ai-job-change';
  if (intent === 'relationship-push') return 'ai-relationship-push';
  if (intent === 'startup-partnership') return 'ai-startup-partnership';
  if (intent === 'relationship-decision') return 'ai-relationship-decision';
  if (intent === 'investment-partnership') return 'ai-investment-partnership';
  if (intent === 'reconciliation-decision') return 'ai-reconciliation-decision';
  if (intent === 'home-move') return 'ai-home-move';
  if (intent === 'settle-relocate') return 'ai-settle-relocate';
  if (intent === 'study-advance') return 'ai-study-advance';
  if (intent === 'exam-landing') return 'ai-exam-landing';
  return undefined;
}

export function resolveZiweiTopicByInspirationCategory(category?: string) {
  if (category === '近期') return 'recent';
  if (category === '事业' || category === '财运') return 'career-wealth';
  if (category === '婚恋' || category === '子女') return 'relationship';
  if (category === '六亲' || category === '家庭') return 'family';
  if (category === '人际') return 'social';
  if (category === '情绪') return 'emotion';
  if (category === '健康') return 'health';
  if (category === '学业') return 'study';
  if (category === '成长') return 'growth';
  if (category === '天赋') return 'talent';
  return 'life';
}

export function resolveZiweiTopicByInspirationIntent(intent?: QuestionInspirationIntent) {
  if (intent === 'job-change') return 'job-change';
  if (intent === 'relationship-push') return 'relationship-push';
  if (intent === 'startup-partnership') return 'startup-partnership';
  if (intent === 'relationship-decision') return 'relationship-decision';
  if (intent === 'investment-partnership') return 'investment-partnership';
  if (intent === 'reconciliation-decision') return 'reconciliation-decision';
  if (intent === 'home-move') return 'home-move';
  if (intent === 'settle-relocate') return 'settle-relocate';
  if (intent === 'study-advance') return 'study-advance';
  if (intent === 'exam-landing') return 'exam-landing';
  return undefined;
}

export function resolveAstrolabeTopicByShortcutMode(mode: string): AstrolabePromptTopic {
  return ASTROLABE_SHORTCUT_ACTIONS.find((item) => item.label === mode)?.topic ?? 'chat';
}

export function resolveAstrolabeTopicByInspirationCategory(
  category?: string,
): AstrolabePromptTopic {
  if (category === '近期') return 'recent';
  if (category === '事业') return 'career';
  if (category === '财运') return 'wealth';
  if (category === '婚恋') return 'relationship';
  if (category === '子女') return 'family';
  if (category === '六亲' || category === '家庭') return 'family';
  if (category === '人际') return 'social';
  if (category === '情绪') return 'emotion';
  if (category === '健康') return 'health';
  if (category === '学业') return 'study';
  if (category === '成长') return 'growth';
  if (category === '天赋') return 'talent';
  return 'life';
}

export function resolveAstrolabeTopicByInspirationIntent(
  intent?: QuestionInspirationIntent,
): AstrolabePromptTopic | undefined {
  if (intent === 'job-change') return 'job-change';
  if (intent === 'relationship-push') return 'relationship-push';
  if (intent === 'startup-partnership') return 'startup-partnership';
  if (intent === 'relationship-decision') return 'relationship-decision';
  if (intent === 'investment-partnership') return 'investment-partnership';
  if (intent === 'reconciliation-decision') return 'reconciliation-decision';
  if (intent === 'home-move') return 'home-move';
  if (intent === 'settle-relocate') return 'settle-relocate';
  if (intent === 'study-advance') return 'study-advance';
  if (intent === 'exam-landing') return 'exam-landing';
  return undefined;
}

export function resolveCompatType(
  promptId: string,
): 'marriage' | 'career' | 'friendship' | 'children' | 'parents' | 'siblings' | undefined {
  if (promptId === 'ai-compat-marriage') return 'marriage';
  if (promptId === 'ai-compat-career') return 'career';
  if (promptId === 'ai-compat-friendship') return 'friendship';
  if (promptId === 'ai-compat-children') return 'children';
  if (promptId === 'ai-compat-parents') return 'parents';
  if (promptId === 'ai-compat-siblings') return 'siblings';
  return undefined;
}

export function findBaziShortcutByMode(mode: string, analysisMode: 'single' | 'compatibility') {
  return getBaziShortcutActions(analysisMode).find((item) => item.label === mode) ?? null;
}

export function findZiweiShortcutByMode(mode: string, analysisMode: 'single' | 'compatibility') {
  return getZiweiShortcutActions(analysisMode).find((item) => item.label === mode) ?? null;
}

export function findAstrolabeShortcutByMode(mode: string) {
  return ASTROLABE_SHORTCUT_ACTIONS.find((item) => item.label === mode) ?? null;
}

export function resolveBaziShortcutMode(
  promptState: QueryPromptState,
  analysisMode: 'single' | 'compatibility',
) {
  if (promptState.baziShortcutMode === '自定义') {
    return '自定义';
  }

  if (promptState.baziShortcutMode === '问题灵感') {
    return '问题灵感';
  }

  if (findBaziShortcutByMode(promptState.baziShortcutMode, analysisMode)) {
    return promptState.baziShortcutMode;
  }

  if (analysisMode === 'compatibility') {
    return (
      baziCompatibilityShortcutActions.find((item) => item.promptId === promptState.baziPresetId)
        ?.label ?? '自定义'
    );
  }

  const matched = getBaziShortcutActions(analysisMode).find(
    (item) =>
      item.promptId === promptState.baziPresetId && item.question === promptState.baziQuickQuestion,
  );
  return matched?.label ?? '自定义';
}

export function resolveZiweiShortcutMode(
  promptState: QueryPromptState,
  analysisMode: 'single' | 'compatibility',
) {
  if (promptState.ziweiShortcutMode === '自定义') {
    return '自定义';
  }

  if (promptState.ziweiShortcutMode === '问题灵感') {
    return '问题灵感';
  }

  if (findZiweiShortcutByMode(promptState.ziweiShortcutMode, analysisMode)) {
    return promptState.ziweiShortcutMode;
  }

  if (analysisMode === 'compatibility') {
    return (
      ziweiCompatibilityShortcutActions.find((item) => item.topic === promptState.ziweiTopic)
        ?.label ?? '自定义'
    );
  }

  const matched = getZiweiShortcutActions(analysisMode).find(
    (item) =>
      item.topic === promptState.ziweiTopic && item.question === promptState.ziweiQuickQuestion,
  );
  return matched?.label ?? '自定义';
}

export function resolveAstrolabeShortcutMode(promptState: QueryPromptState) {
  if (promptState.astrolabeShortcutMode === '自定义') {
    return '自定义';
  }

  if (promptState.astrolabeShortcutMode === '问题灵感') {
    return '问题灵感';
  }

  if (findAstrolabeShortcutByMode(promptState.astrolabeShortcutMode)) {
    return promptState.astrolabeShortcutMode;
  }

  const matched = ASTROLABE_SHORTCUT_ACTIONS.find(
    (item) =>
      item.topic === promptState.astrolabeTopic &&
      (!promptState.astrolabeQuickQuestion || item.question === promptState.astrolabeQuickQuestion),
  );
  return matched?.label ?? '综合';
}

export function buildCombinedPromptText(system: string, user: string) {
  return [system, '', user].join('\n');
}

export function buildCompatibilityPromptWithUnknownTime(params: {
  firstName: string;
  firstText: string;
  secondName: string;
  secondText: string;
  question: string;
  isCustomQuestion?: boolean;
}) {
  const isCustomQuestion = Boolean(params.isCustomQuestion);
  return [
    '你是资深八字命理师，当前合盘信息里至少有一方出生时辰未知，请只做保守分析。',
    '【要求】',
    '- 只基于提供的双方信息作答。',
    '- 其中带“时辰未知”的一方只能按三柱理解，不得自行补足时柱。',
    '- 资料里没有直接写出的额外盘面事实，不得自行补算、脑补或假定。',
    '- 凡是明显依赖时柱、子女宫或更细时限的判断，都要标记为待确认。',
    ...(isCustomQuestion
      ? []
      : [
          '- 先直接回答【问题】，并区分当前能确认的主线与因时辰未知而待确认的部分。',
          '- 最后补充最值得继续核验的时辰线索。',
        ]),
    '',
    `【当前时间】\n${formatPromptCurrentTime()}`,
    `【第一人排盘信息】\n姓名：${params.firstName}\n${params.firstText}`,
    '',
    `【第二人排盘信息】\n姓名：${params.secondName}\n${params.secondText}`,
    '',
    `【问题】\n${params.question.trim() || '请先从双方互动模式与现实建议开始分析。'}`,
    ...(isCustomQuestion
      ? []
      : [
          '【任务】\n请结合双方已知信息，先做保守分析，并明确哪些部分需要等时辰确认后再细化。',
          '【输出要求】\n先直接回答【问题】，再分成“可确认部分”“待确认部分”“建议继续核验的线索”三段；每段尽量写明对应依据、触发条件与建议；证据不足时直接说明；用简体中文。',
        ]),
  ].join('\n');
}

export function formatGender(value: string) {
  return value === 'male' ? '男' : value === 'female' ? '女' : value || '未知';
}

export function formatBaziDate(result: BaziChartResult) {
  return `${result.solarDate.year}-${String(result.solarDate.month).padStart(2, '0')}-${String(result.solarDate.day).padStart(2, '0')}`;
}

export function joinText(values: Array<string | undefined>, fallback = '暂无') {
  const list = values.filter(Boolean) as string[];
  return list.length > 0 ? list.join('、') : fallback;
}

export function joinMultilineText(values: Array<string | undefined>, fallback = '暂无') {
  return joinText(values, fallback).replaceAll('、', '\n');
}

export function formatUsefulGodPrioritySummary(result: BaziChartResult) {
  const primary =
    result.analysis.usefulGod.primaryFavorableWuxing ||
    result.analysis.usefulGod.favorableWuxing?.[0] ||
    '暂无';
  const secondary = joinText(
    result.analysis.usefulGod.secondaryFavorableWuxing ||
      result.analysis.usefulGod.favorableWuxing?.slice(1) ||
      [],
    '暂无',
  );
  return `主用:${primary} / 辅助:${secondary}`;
}

export function formatAvoidGodPrioritySummary(result: BaziChartResult) {
  const primary =
    result.analysis.usefulGod.primaryUnfavorableWuxing ||
    result.analysis.usefulGod.unfavorableWuxing?.[0] ||
    '暂无';
  const secondary = joinText(
    result.analysis.usefulGod.secondaryUnfavorableWuxing ||
      result.analysis.usefulGod.unfavorableWuxing?.slice(1) ||
      [],
    '暂无',
  );
  return `主忌:${primary} / 次忌:${secondary}`;
}

export function formatZiweiPromptScopeSummary(
  scope: ZiweiScopeMode,
  dateStr: string,
  resolvedLabel?: string,
) {
  const label = resolvedLabel || ziweiScopeLabelMap[scope] || '本命';
  if (!dateStr || scope === 'origin') {
    return label;
  }

  return `${label} · ${dateStr}`;
}

export function joinStarNames(stars: PalaceFact['major_stars'], fallback: string) {
  return stars.length > 0 ? stars.map((star) => star.name).join(' ') : fallback;
}

export function splitGanZhi(value: string) {
  return [value.charAt(0), value.charAt(1)];
}

export function formatMonthDayLabel(dateStr: string) {
  const [, month, day] = dateStr.split('-');
  return `${month}/${day}`;
}

export function parseZiweiDateParts(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

export function buildZiweiMonthAnchorDate(dateStr: string) {
  const parts = parseZiweiDateParts(dateStr);
  if (!parts) {
    return '';
  }

  return `${parts.year}-${String(parts.month).padStart(2, '0')}-15`;
}

export function findZiweiDecadalIndexByDate(
  decadalOptions: DecadalTimelineOption[],
  dateStr: string,
  fallbackIndex: number,
) {
  if (!dateStr || decadalOptions.length === 0) {
    return fallbackIndex;
  }

  for (let index = decadalOptions.length - 1; index >= 0; index -= 1) {
    if (dateStr >= decadalOptions[index].dateStr) {
      return index;
    }
  }

  return 0;
}

export function findZiweiYearOptionDate(yearOptions: ZiweiYearOption[], dateStr: string) {
  const parts = parseZiweiDateParts(dateStr);
  if (!parts) {
    return yearOptions[0]?.dateStr ?? '';
  }

  return (
    yearOptions.find((item) => item.year === parts.year)?.dateStr ?? yearOptions[0]?.dateStr ?? ''
  );
}

export function findZiweiMonthOptionDate(monthOptions: ZiweiMonthOption[], dateStr: string) {
  const parts = parseZiweiDateParts(dateStr);
  if (!parts) {
    return monthOptions[0]?.dateStr ?? '';
  }

  return (
    monthOptions.find((item) => {
      const optionParts = parseZiweiDateParts(item.dateStr);
      return optionParts?.year === parts.year && optionParts?.month === parts.month;
    })?.dateStr ??
    monthOptions[0]?.dateStr ??
    ''
  );
}

export function findZiweiDayOptionDate(dayOptions: ZiweiDayOption[], dateStr: string) {
  const parts = parseZiweiDateParts(dateStr);
  if (!parts) {
    return dayOptions[0]?.dateStr ?? '';
  }

  return dayOptions.find((item) => item.day === parts.day)?.dateStr ?? dayOptions[0]?.dateStr ?? '';
}

export function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function buildBaziFortuneSelectionValue(
  promptState: QueryPromptState,
): BaziFortuneSelectionValue {
  return {
    scope: promptState.baziFortuneScope,
    cycleIndex: parseOptionalNumber(promptState.baziFortuneCycleIndex),
    year: parseOptionalNumber(promptState.baziFortuneYear),
    month: parseOptionalNumber(promptState.baziFortuneMonth),
    day: parseOptionalNumber(promptState.baziFortuneDay),
  };
}
