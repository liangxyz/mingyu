import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/ResultPage/index.tsx'), 'utf8');

test('八字加紫微增强来源在提示词页只保留一个年限选择入口', () => {
  assert.match(source, /promptState\.promptSource === 'ziwei' \? \(/);
  assert.doesNotMatch(source, /八字年限/);
  assert.doesNotMatch(source, /紫微范围/);
});
