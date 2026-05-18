import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const modalSource = readFileSync(resolve('src/pages/InputPage.BirthPlaceModal.tsx'), 'utf8');
const stylesSource = readFileSync(resolve('src/styles.css'), 'utf8');

test('出生地模态窗将滚动区域与底部操作区拆分，避免按钮随内容滚动到底部', () => {
  assert.match(modalSource, /<div className="birth-place-modal-body">/);
  assert.match(
    modalSource,
    /<div className="birth-place-modal-body">[\s\S]*<\/div>\s*<div className="modal-actions birth-place-modal-actions">/,
  );
  assert.match(stylesSource, /\.birth-place-modal-card\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*column;[\s\S]*overflow:\s*hidden;/);
  assert.match(
    stylesSource,
    /\.birth-place-modal-body\s*\{[\s\S]*flex:\s*1 1 auto;[\s\S]*min-height:\s*0;[\s\S]*overflow:\s*auto;/,
  );
  assert.match(
    stylesSource,
    /\.birth-place-modal-actions\s*\{[\s\S]*flex-shrink:\s*0;/,
  );
});
