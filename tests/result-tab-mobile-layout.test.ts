import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const stylesSource = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

test('结果页移动端页签按钮压缩尺寸，并支持八字紫微星盘提示词一行四列显示', () => {
  assert.match(
    stylesSource,
    /@media \(max-width: 900px\) \{[\s\S]*\.tab-chip \{[\s\S]*padding: 5px 8px;[\s\S]*font-size: 11px;[\s\S]*line-height: 1\.2;[\s\S]*\}/,
  );
  assert.match(
    stylesSource,
    /@media \(max-width: 520px\) \{[\s\S]*\.tab-strip \{[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);[\s\S]*gap: 4px;[\s\S]*\}/,
  );
  assert.match(
    stylesSource,
    /@media \(max-width: 520px\) \{[\s\S]*\.tab-chip \{[\s\S]*padding: 5px 0;[\s\S]*min-width: 0;[\s\S]*font-size: 11px;[\s\S]*line-height: 1\.15;[\s\S]*text-align: center;[\s\S]*\}/,
  );
});
