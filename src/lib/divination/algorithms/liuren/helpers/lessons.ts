import type { LiurenLesson } from '../../../../../types/divination';
import { isBranchKe } from './plate';

export function buildLessonNote(relation: string, xunKong: string[], upper: string, lower: string) {
  const xunKongTip =
    xunKong.includes(upper) || xunKong.includes(lower) ? '本课触及旬空，落地会有延后。' : '';

  if (relation === '比和') {
    return ['内外同气，推进阻力相对可控。', xunKongTip].filter(Boolean).join('');
  }
  if (relation.includes('生')) {
    return ['有承接与助推，但也要看后续是否跟得上。', xunKongTip].filter(Boolean).join('');
  }
  if (relation.includes('克')) {
    return ['现实牵制较强，先处理冲突点更稳。', xunKongTip].filter(Boolean).join('');
  }

  return ['需结合全课继续判断。', xunKongTip].filter(Boolean).join('');
}

function getCandidateScore(item: LiurenLesson, lessons: LiurenLesson[], xunKong: string[]) {
  let score = 0;

  if (!xunKong.includes(item.upper)) {
    score += 3;
  }
  if (!xunKong.includes(item.lower)) {
    score += 2;
  }
  if (item.god === '贵人' || item.god === '青龙' || item.god === '六合') {
    score += 1;
  }
  if (item.relation === '比和') {
    score += 1;
  }

  const sameUpperDamageCount = lessons.filter(
    (lesson) =>
      lesson.upper === item.upper &&
      (isBranchKe(lesson.lower, lesson.upper) || isBranchKe(lesson.upper, lesson.lower)),
  ).length;
  score += sameUpperDamageCount;

  return score;
}

function pickBestCandidate(candidates: LiurenLesson[], lessons: LiurenLesson[], xunKong: string[]) {
  if (candidates.length === 0) {
    throw new Error('pickBestCandidate 调用时 candidates 为空。');
  }
  const sorted = candidates
    .map((item, index) => ({
      item,
      index,
      score: getCandidateScore(item, lessons, xunKong),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const top = sorted[0];
  if (!top) {
    throw new Error('pickBestCandidate 排序后无有效候选。');
  }
  return top.item;
}

export function resolveInitialTransmission(lessons: LiurenLesson[], xunKong: string[]) {
  const lowerKeUpper = lessons.filter((item) => isBranchKe(item.lower, item.upper));
  if (lowerKeUpper.length > 0) {
    const picked = pickBestCandidate(lowerKeUpper, lessons, xunKong);
    return {
      initial: picked.upper,
      rule: '贼克法',
      tag: '贼克取用',
    };
  }

  const upperKeLower = lessons.filter((item) => isBranchKe(item.upper, item.lower));
  if (upperKeLower.length > 0) {
    const picked = pickBestCandidate(upperKeLower, lessons, xunKong);
    return {
      initial: picked.upper,
      rule: '克法',
      tag: '上克下',
    };
  }

  const biHe = lessons.filter((item) => item.relation === '比和');
  if (biHe.length > 0) {
    const picked = pickBestCandidate(biHe, lessons, xunKong);
    return {
      initial: picked.upper,
      rule: '比用法',
      tag: '比用',
    };
  }

  const sheHaiCandidates = lessons.filter((item) => item.relation.includes('克'));
  if (sheHaiCandidates.length > 0) {
    const picked = pickBestCandidate(sheHaiCandidates, lessons, xunKong);
    return {
      initial: picked.upper,
      rule: '涉害法',
      tag: '涉害',
    };
  }

  const safeLesson = lessons.find((item) => !xunKong.includes(item.upper));
  if (safeLesson) {
    return {
      initial: safeLesson.upper,
      rule: '别责法',
      tag: '别责',
    };
  }

  const firstLesson = lessons[0];
  if (!firstLesson) {
    throw new Error('resolveInitialTransmission 调用时 lessons 为空。');
  }
  return {
    initial: firstLesson.upper,
    rule: '八专法',
    tag: '八专',
  };
}
