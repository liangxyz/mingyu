import type { AnalysisPayloadV1, PalaceFact } from '@/types/analysis';
import { formatPalaceName, mapScopeLabel, normalizePalaceName } from './labels';
import {
  collectMutagenStars,
  getAllStars,
  getOppositePalace,
  getSurroundedPalaces,
} from './palace-helpers';
import type { PromptContext } from './types';

export function buildPalaceSummary(payload: AnalysisPayloadV1, palace: PalaceFact) {
  const oppositePalace = getOppositePalace(payload, palace);
  const surroundedPalaces = getSurroundedPalaces(payload, palace);
  const allStars = getAllStars(palace);
  const horoscopeMutagens = allStars
    .filter((star) => !!star.horoscope_mutagen)
    .map((star) => `${star.name}化${star.horoscope_mutagen}`);
  const selfMutagens = (palace.self_mutagens ?? []).map((m) => `自化${m}`);
  const mutagedFlies = (palace.mutaged_palaces ?? [])
    .filter((item) => item.palace_name)
    .map((item) => `化${item.mutagen}入${formatPalaceName(item.palace_name!)}`);

  return {
    宫位: formatPalaceName(palace.name),
    宫干支: `${palace.heavenly_stem}${palace.earthly_branch}`,
    当前动态宫名: palace.dynamic_scope_name || undefined,
    主星: palace.major_stars.map((item) => item.name),
    辅星: palace.minor_stars.map((item) => item.name),
    杂曜: palace.other_stars.map((item) => item.name),
    当前运限加临星曜: palace.scope_stars.map((item) => item.name),
    生年四化: collectMutagenStars(allStars, 'birth_mutagen'),
    流耀四化: horoscopeMutagens,
    当前运限四化: collectMutagenStars(allStars, 'active_scope_mutagen'),
    自化情况: selfMutagens,
    飞星走向: mutagedFlies,
    关键词: palace.summary_tags,
    运限命中: palace.scope_hits,
    对宫: oppositePalace ? formatPalaceName(oppositePalace.name) : '无',
    三方四正: surroundedPalaces.map((item) => formatPalaceName(item.name)),
    大限范围: `${palace.decadal_range[0]}-${palace.decadal_range[1]}岁`,
    长生十二神: palace.changsheng12,
  };
}

export function buildEvidenceSummary(
  payload: AnalysisPayloadV1,
  focusPalaces: PalaceFact[],
  reportContext: PromptContext,
) {
  const focusIndexes = new Set(focusPalaces.map((item) => item.index));
  const focusNames = new Set(focusPalaces.map((item) => normalizePalaceName(item.name)));
  const fallbackList =
    reportContext.selected_topic === 'risk'
      ? payload.evidence_pool.filter((item) => item.mutagens.includes('忌'))
      : payload.evidence_pool;
  const matchedEvidence = payload.evidence_pool.filter(
    (item) =>
      item.palace_indexes.some((index) => focusIndexes.has(index)) ||
      item.palace_names.some((name) => focusNames.has(normalizePalaceName(name))) ||
      (reportContext.selected_topic === 'risk' && item.mutagens.includes('忌')),
  );
  const evidencePool = (matchedEvidence.length > 0 ? matchedEvidence : fallbackList).sort(
    (left, right) => right.priority - left.priority,
  );

  const picked: typeof evidencePool = [];
  const seen = new Set<string>();

  evidencePool.forEach((item) => {
    const key = item.stable_key || item.id;
    if (seen.has(key) || picked.length >= 8) {
      return;
    }
    seen.add(key);
    picked.push(item);
  });

  return picked.map((item) => ({
    证据标题: item.title,
    作用范围: mapScopeLabel(item.scope),
    关联宫位: item.palace_names.map((name) => formatPalaceName(name)),
    关联星曜: item.star_names,
    关联四化: item.mutagens,
    说明: item.description,
  }));
}

export function buildPalaceIndex(payload: AnalysisPayloadV1) {
  return payload.palaces.map((item) => ({
    宫位: formatPalaceName(item.name),
    主星: item.major_stars.map((star) => star.name),
    当前动态宫名: item.dynamic_scope_name || undefined,
    关键标签: [...item.summary_tags, ...item.scope_hits].slice(0, 4),
  }));
}
