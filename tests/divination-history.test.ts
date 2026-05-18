import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const historySource = readFileSync(
  new URL('../src/lib/history-records.ts', import.meta.url),
  'utf8',
);
const recordsPageSource = readFileSync(
  new URL('../src/pages/RecordsPage.tsx', import.meta.url),
  'utf8',
);

test('历史存储新增占卜记录的增删查能力', () => {
  assert.match(
    historySource,
    /const DIVINATION_HISTORY_STORAGE_KEY = 'prompt_studio_divination_history_v1';/,
  );
  assert.match(historySource, /export type DivinationHistoryRecord = \{/);
  assert.match(historySource, /export function loadDivinationHistory\(\)/);
  assert.match(
    historySource,
    /export function addDivinationHistory\(draft: DivinationDraft, session: DivinationSession\)/,
  );
  assert.match(historySource, /export function getDivinationHistoryById\(id: string\)/);
  assert.match(historySource, /export function removeDivinationHistory\(id: string\)/);
  assert.match(historySource, /function resolveDivinationRecordTitle/);
  assert.match(historySource, /黄历择日：/);
});

test('历史页新增占卜记录页签，并支持打开占卜历史', () => {
  assert.match(
    recordsPageSource,
    /type HistoryTab = 'personal' \| 'compatibility' \| 'divination';/,
  );
  assert.match(recordsPageSource, /label: '占卜记录', value: 'divination' as const/);
  assert.match(recordsPageSource, /loadDivinationHistory/);
  assert.match(recordsPageSource, /navigate\(`\/\?mode=divination&record=\$\{record\.id\}`\)/);
  assert.match(recordsPageSource, /暂无匹配的占卜记录/);
});

test('个人历史记录会按排盘体系区分，并在历史页显示体系标签', () => {
  assert.match(historySource, /input\.chartType,/);
  assert.match(historySource, /chartType: input\.chartType,/);
  assert.match(recordsPageSource, /const personalChartTypeLabelMap = \{/);
  assert.match(recordsPageSource, /bazi: '八字'/);
  assert.match(recordsPageSource, /ziwei: '紫微'/);
  assert.match(recordsPageSource, /astrolabe: '星盘'/);
  assert.match(recordsPageSource, /personalChartTypeLabelMap\[record\.chartType\] \|\| '个人'/);
  assert.match(recordsPageSource, /tab: 'bazi'/);
  assert.match(recordsPageSource, /promptSource: 'bazi'/);
});
