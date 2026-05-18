import type { AnalysisPayloadV1 } from '@/types/analysis';
import {
  buildEvidenceSummary,
  buildPalaceIndex,
  buildPalaceSummary,
  buildScopeStructureSummary,
} from './builders';
import { buildFocusTaskBundle } from './focus-bundle';
import { formatKeyValueBlock, formatObjectList } from './formatters';
import { formatPalaceName, mapScopeLabel, mapTopicLabel } from './labels';
import { getPalaceByIndex } from './palace-helpers';
import type { PromptContext } from './types';

function dedupeAndTrim(values: string[] | undefined, limit: number) {
  if (!values?.length) {
    return [];
  }

  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean))).slice(0, limit);
}

function normalizeHintSentence(value: string) {
  return value.trim().replace(/[。；;、，,]+$/u, '');
}

function buildHintSummary(values: string[] | undefined, limit: number) {
  const normalized = dedupeAndTrim(
    values?.map((item) => normalizeHintSentence(item)).filter(Boolean),
    limit,
  );

  return normalized.length > 0 ? normalized.join('；') : undefined;
}

function sortByPriority<T extends { priority?: number }>(items: T[]) {
  return [...items].sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));
}

function buildPromptTaskSummary(params: {
  focusSummary: string;
  focusPalaces: string[];
  outputFocus: string[];
  avoid: string[];
  focusNotes: string[];
}) {
  const focusHints = buildHintSummary([...params.focusNotes, ...params.outputFocus], 2);

  return {
    解读目标: params.focusSummary,
    重点参考宫位: dedupeAndTrim(params.focusPalaces, 4),
    严格边界: dedupeAndTrim(params.avoid, 2),
    焦点提示: focusHints,
  };
}

export function buildPromptContextSnapshot(params: {
  payload: AnalysisPayloadV1;
  reportContext: PromptContext;
}) {
  const { payload, reportContext } = params;
  const focusTaskBundle = buildFocusTaskBundle(payload, reportContext);
  const currentPalace = getPalaceByIndex(payload, payload.active_scope.palace_index);
  const fourPillars = payload.basic_info.four_pillars;
  const hiddenPalaces = payload.basic_info.hidden_palaces;
  const patterns = payload.patterns ?? [];
  const focusPalaces = focusTaskBundle.focusPalaces.slice(0, 4);
  const currentMutagens = payload.active_scope.mutagen_map ?? [];

  return {
    当前报告任务: buildPromptTaskSummary({
      focusSummary: focusTaskBundle.focusSummary,
      focusPalaces: focusTaskBundle.focusPalaces.map((item) => formatPalaceName(item.name)),
      outputFocus: focusTaskBundle.outputFocus,
      avoid: focusTaskBundle.avoid,
      focusNotes: reportContext.focus_notes,
    }),
    命主基础信息: {
      性别: payload.basic_info.gender,
      阳历生日: payload.basic_info.solar_date,
      农历生日: payload.basic_info.lunar_date,
      四柱八字: fourPillars
        ? `${fourPillars.year_pillar} ${fourPillars.month_pillar} ${fourPillars.day_pillar} ${fourPillars.hour_pillar}`
        : undefined,
      出生时辰: `${payload.basic_info.birth_time_label}（${payload.basic_info.birth_time_range}）`,
      命主: payload.basic_info.soul,
      身主: payload.basic_info.body,
      五行局: payload.basic_info.five_elements_class,
      身宫: hiddenPalaces?.body_palace_name
        ? formatPalaceName(hiddenPalaces.body_palace_name)
        : undefined,
      来因宫: hiddenPalaces?.original_palace_name
        ? formatPalaceName(hiddenPalaces.original_palace_name)
        : undefined,
      暗合宫: hiddenPalaces?.anhe_palace_name
        ? formatPalaceName(hiddenPalaces.anhe_palace_name)
        : undefined,
    },
    当前运限信息: {
      时限类型: mapScopeLabel(payload.active_scope.scope),
      时限标签: payload.active_scope.label,
      参考日期: payload.active_scope.solar_date,
      虚岁: payload.active_scope.nominal_age,
      当前落宫: currentPalace ? formatPalaceName(currentPalace.name) : undefined,
      当前四化:
        currentMutagens.length > 0
          ? currentMutagens.map((item) =>
              item.palace_name
                ? `${item.star}化${item.mutagen}→${formatPalaceName(item.palace_name)}`
                : `${item.star}化${item.mutagen}`,
            )
          : undefined,
    },
    命盘格局: sortByPriority(patterns)
      .slice(0, 4)
      .map((item) => ({
        格局: item.name,
        性质: item.kind === 'auspicious' ? '吉格' : item.kind === 'inauspicious' ? '凶格' : '中性',
        关联宫位: item.palace_names.map((name) => formatPalaceName(name)),
        关联星曜: item.star_names,
        说明: item.description,
      })),
    运限结构: buildScopeStructureSummary(payload).slice(0, 8),
    重点宫位摘要: focusPalaces.map((item) => buildPalaceSummary(payload, item)),
    关键证据摘要: buildEvidenceSummary(payload, focusPalaces, reportContext).slice(0, 6),
    全盘宫位索引: buildPalaceIndex(payload),
  };
}

export function buildZiweiReadableSnapshot(params: {
  payload: AnalysisPayloadV1;
  reportContext: PromptContext;
}) {
  const snapshot = buildPromptContextSnapshot(params);

  return [
    '【分析背景】',
    formatKeyValueBlock({
      分析主题: mapTopicLabel(params.reportContext.selected_topic),
      分析范围: params.reportContext.scope_label,
      重点宫位: params.reportContext.palace_name
        ? formatPalaceName(params.reportContext.palace_name)
        : undefined,
    }),
    '',
    '【当前报告任务】',
    formatKeyValueBlock(snapshot.当前报告任务),
    '',
    '【基础信息】',
    formatKeyValueBlock(snapshot.命主基础信息),
    '',
    '【当前运限】',
    formatKeyValueBlock(snapshot.当前运限信息),
    '',
    '【命盘格局】',
    formatObjectList(snapshot.命盘格局),
    '',
    '【运限结构】',
    formatObjectList(snapshot.运限结构),
    '',
    '【重点宫位摘要】',
    formatObjectList(snapshot.重点宫位摘要),
    '',
    '【关键证据摘要】',
    formatObjectList(snapshot.关键证据摘要),
    '',
    '【全盘宫位索引】',
    formatObjectList(snapshot.全盘宫位索引),
  ].join('\n');
}
