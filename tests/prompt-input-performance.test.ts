import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const resultPageSource = readFileSync(
  new URL('../src/pages/ResultPage/index.tsx', import.meta.url),
  'utf8',
);
const shortcutPanelSource = readFileSync(
  new URL('../src/pages/ResultPage/components/PromptShortcutPanel.tsx', import.meta.url),
  'utf8',
);
const promptShortcutsSource = readFileSync(
  new URL('../src/pages/ResultPage/hooks/usePromptShortcuts.ts', import.meta.url),
  'utf8',
);
const source = resultPageSource + shortcutPanelSource + promptShortcutsSource;
const constantsSource = readFileSync(
  new URL('../src/pages/ResultPage/ResultPage.constants.ts', import.meta.url),
  'utf8',
);

test('AI 页自定义问题使用本地草稿态，避免输入时直接写 URL', () => {
  assert.match(constantsSource, /const PROMPT_DRAFT_STORAGE_PREFIX = 'result-prompt-draft';/);
  assert.match(source, /PROMPT_DRAFT_STORAGE_PREFIX/);
  assert.match(
    promptShortcutsSource,
    /const \[baziQuestionDraft, setBaziQuestionDraft\] = useState\(\(\) =>/,
  );
  assert.match(
    promptShortcutsSource,
    /const \[ziweiQuestionDraft, setZiweiQuestionDraft\] = useState\(\(\) =>/,
  );
  assert.match(promptShortcutsSource, /readPromptDraft\(baziDraftStorageKey\)/);
  assert.match(promptShortcutsSource, /readPromptDraft\(ziweiDraftStorageKey\)/);
  assert.match(promptShortcutsSource, /writePromptDraft\(baziDraftStorageKey, baziQuestionDraft\)/);
  assert.match(
    promptShortcutsSource,
    /writePromptDraft\(ziweiDraftStorageKey, ziweiQuestionDraft\)/,
  );
  assert.match(resultPageSource, /customDraft=\{baziQuestionDraft\}/);
  assert.match(resultPageSource, /customDraft=\{ziweiQuestionDraft\}/);
  assert.match(resultPageSource, /onCustomDraftChange=\{setBaziQuestionDraft\}/);
  assert.match(resultPageSource, /onCustomDraftChange=\{setZiweiQuestionDraft\}/);
  assert.match(shortcutPanelSource, /value=\{customDraft\}/);
  assert.match(
    shortcutPanelSource,
    /onChange=\{\(event\) => onCustomDraftChange\(event\.target\.value\)\}/,
  );
  assert.doesNotMatch(source, /onBlur=\{\(\) => syncBaziQuestionDraft\(\)\}/);
  assert.doesNotMatch(source, /onBlur=\{\(\) => syncZiweiQuestionDraft\(\)\}/);
});
