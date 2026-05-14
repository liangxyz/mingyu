import type { DecadalTimelineOption } from '@/lib/iztro/decadal';
import type { QueryPromptState, ZiweiScopeMode } from '@/lib/query-state';
import type { PalaceFact } from '@/types/analysis';
import type { BaziChartResult } from '@/utils/bazi/baziTypes';
import type { BaziFortuneSelectionValue } from '@/utils/bazi/fortuneSelection';
import { safeStorage } from '@/lib/safe-storage';
import {
  baziCompatibilityShortcutActions,
  baziSingleShortcutActions,
  ziweiCompatibilityShortcutActions,
  ziweiScopeLabelMap,
  ziweiSingleShortcutActions,
} from './ResultPage.constants';
import type { ZiweiDayOption, ZiweiMonthOption, ZiweiYearOption } from './ResultPage.types';

export function readPromptDraft(storageKey: string) {
  return safeStorage.get(storageKey) ?? '';
}

export function writePromptDraft(storageKey: string, value: string) {
  if (value.trim()) {
    safeStorage.set(storageKey, value);
    return;
  }
  safeStorage.remove(storageKey);
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

export function resolveCompatType(
  promptId: string,
): 'marriage' | 'children' | 'parents' | 'siblings' | undefined {
  if (promptId === 'ai-compat-marriage') return 'marriage';
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

export function resolveBaziShortcutMode(
  promptState: QueryPromptState,
  analysisMode: 'single' | 'compatibility',
) {
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

export function buildCombinedPromptText(system: string, user: string) {
  return [system, '', user].join('\n');
}

export function buildCompatibilityPromptWithUnknownTime(params: {
  firstName: string;
  firstText: string;
  secondName: string;
  secondText: string;
  question: string;
}) {
  return [
    '你是资深八字命理师，当前合盘信息里至少有一方出生时辰未知，请只做保守分析。',
    '【要求】',
    '- 只基于提供的双方信息作答。',
    '- 其中带“时辰未知”的一方只能按三柱理解，不得自行补足时柱。',
    '- 先说能确认的关系主线，再说因时辰未知而待确认的部分。',
    '- 最后补充最值得继续核验的时辰线索。',
    '',
    `【当前时间】\n${new Date().toLocaleString('zh-CN')}`,
    `【第一人排盘信息】\n${params.firstText}`,
    '',
    `【第二人排盘信息】\n${params.secondText}`,
    '',
    `【问题】\n${params.question.trim() || '请先从整体关系匹配度和相处建议开始分析。'}`,
    '【任务】\n请结合双方已知信息，先做保守的关系分析，并明确哪些部分需要等时辰确认后再细化。',
    '【输出要求】\n先给关系结论，再分成“可确认部分”“待确认部分”“建议继续核验的线索”三段；用简体中文。',
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
