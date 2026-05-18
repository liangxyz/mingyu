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
const ziweiPromptSource = readFileSync(
  new URL('../src/lib/full-chart-engine/ziwei.ts', import.meta.url),
  'utf8',
);
const divinationPanelSource = readFileSync(
  new URL('../src/components/DivinationPanel/index.tsx', import.meta.url),
  'utf8',
);
const divinationEngineSource = readFileSync(
  new URL('../src/lib/divination/engine/index.ts', import.meta.url),
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

test('八字自定义问题不再显示问题类型选择', () => {
  assert.doesNotMatch(resultPageSource, /<span>问题类型<\/span>/);
  assert.doesNotMatch(resultPageSource, /baziQuestionSceneOptions/);
  assert.doesNotMatch(resultPageSource, /手动选择后生效/);
});

test('问题灵感独立于自定义，仍按专项提示词生成', () => {
  assert.match(promptShortcutsSource, /setActiveBaziShortcutMode\('问题灵感'\)/);
  assert.match(promptShortcutsSource, /setActiveZiweiShortcutMode\('问题灵感'\)/);
  assert.match(promptShortcutsSource, /resolveBaziPresetIdByInspirationCategory/);
  assert.match(promptShortcutsSource, /resolveZiweiTopicByInspirationCategory/);
  assert.match(shortcutPanelSource, /activeMode === '问题灵感'/);
});

test('问题灵感选中的具体问题会单独持久化，刷新后不会丢失', () => {
  assert.match(promptShortcutsSource, /readPromptDraft\(baziDraftStorageKey, 'inspiration'\)/);
  assert.match(promptShortcutsSource, /readPromptDraft\(ziweiDraftStorageKey, 'inspiration'\)/);
  assert.match(
    promptShortcutsSource,
    /writePromptDraft\(baziDraftStorageKey, baziQuestionDraft, 'inspiration'\)/,
  );
  assert.match(
    promptShortcutsSource,
    /writePromptDraft\(ziweiDraftStorageKey, ziweiQuestionDraft, 'inspiration'\)/,
  );
  assert.match(
    promptShortcutsSource,
    /writePromptDraft\(baziDraftStorageKey, question, 'inspiration'\)/,
  );
  assert.match(
    promptShortcutsSource,
    /writePromptDraft\(ziweiDraftStorageKey, question, 'inspiration'\)/,
  );
});

test('切回自定义时应恢复上次草稿，不能把已写内容清空', () => {
  assert.match(
    promptShortcutsSource,
    /if \(mode === '自定义'\) \{\s*setBaziQuestionDraft\(readPromptDraft\(baziDraftStorageKey\)\);/,
  );
  assert.match(
    promptShortcutsSource,
    /if \(mode === '自定义'\) \{\s*setZiweiQuestionDraft\(readPromptDraft\(ziweiDraftStorageKey\)\);/,
  );
  assert.match(
    promptShortcutsSource,
    /if \(mode === '自定义'\) \{\s*setAstrolabeQuestionDraft\(readPromptDraft\(astrolabeDraftStorageKey\)\);/,
  );
  assert.doesNotMatch(promptShortcutsSource, /if \(mode === '自定义'\) \{\s*setBaziQuestionDraft\(''\);/);
  assert.doesNotMatch(
    promptShortcutsSource,
    /if \(mode === '自定义'\) \{\s*setZiweiQuestionDraft\(''\);/,
  );
  assert.doesNotMatch(
    promptShortcutsSource,
    /if \(mode === '自定义'\) \{\s*setAstrolabeQuestionDraft\(''\);/,
  );
});

test('合盘结果页也应支持自定义问题，但问题灵感仍只在单人模式开放', () => {
  assert.match(resultPageSource, /showCustomAction/);
  assert.match(
    resultPageSource,
    /showInspirationAction=\{inputState\.analysisMode === 'single'\}/,
  );
  assert.match(
    resultPageSource,
    /inputState\.analysisMode === 'compatibility'[\s\S]*我们适合继续合作，还是更适合保持边界/,
  );
  assert.match(
    resultPageSource,
    /inputState\.analysisMode === 'compatibility'[\s\S]*请直接分析我们这段关系更适合推进，还是先放慢节奏/,
  );
});

test('紫微与占卜自定义问题会去掉任务和输出要求', () => {
  assert.match(ziweiPromptSource, /options: \{ isCustomQuestion\?: boolean \} = \{\}/);
  assert.match(ziweiPromptSource, /isCustomQuestion[\s\S]*\?\s*\[\][\s\S]*【分析框架】/);
  assert.match(resultPageSource, /activeZiweiShortcutMode === '自定义'/);
  assert.match(divinationPanelSource, /resolveDivinationInspiredDraftPatch/);
  assert.match(divinationEngineSource, /isCustomQuestion \? '' : buildSection\('【任务】'/);
  assert.match(divinationEngineSource, /isCustomQuestion \? '' : buildSection\('【输出要求】'/);
});

test('紫微合盘提示词不应把合作与相处按钮都写成婚恋关系模板', () => {
  assert.doesNotMatch(
    ziweiPromptSource,
    /question:\s*question \|\| '请先分析双方关系匹配度、互动模式和相处建议。'/,
  );
  assert.doesNotMatch(ziweiPromptSource, /先判断关系主基调/);
});
