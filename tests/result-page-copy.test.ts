import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync(
  new URL('../src/pages/ResultPage/index.tsx', import.meta.url),
  'utf8',
);
const ziweiCalculationsSource = readFileSync(
  new URL('../src/pages/ResultPage/hooks/useZiweiCalculations.ts', import.meta.url),
  'utf8',
);
const ziweiBoardSource = readFileSync(
  new URL('../src/pages/ResultPage/components/ZiweiBoard.tsx', import.meta.url),
  'utf8',
);
const ziweiTraditionalBoardSource = readFileSync(
  new URL('../src/pages/ResultPage/components/ZiweiTraditionalBoard.tsx', import.meta.url),
  'utf8',
);
const threePillarsBoardSource = readFileSync(
  new URL('../src/pages/ResultPage/components/ThreePillarsBoard.tsx', import.meta.url),
  'utf8',
);
const ziweiScopeModalSource = readFileSync(
  new URL('../src/pages/ResultPage/components/ZiweiScopeModal.tsx', import.meta.url),
  'utf8',
);
const promptShortcutsSource = readFileSync(
  new URL('../src/pages/ResultPage/hooks/usePromptShortcuts.ts', import.meta.url),
  'utf8',
);
const createDisplayWorkerSource = readFileSync(
  new URL('../src/pages/ResultPage/utils/createDisplayWorker.ts', import.meta.url),
  'utf8',
);
const createPayloadWorkerSource = readFileSync(
  new URL('../src/pages/ResultPage/utils/createPayloadWorker.ts', import.meta.url),
  'utf8',
);
const resultPageConstantsSource = readFileSync(
  new URL('../src/pages/ResultPage/ResultPage.constants.ts', import.meta.url),
  'utf8',
);
const source = `${indexSource}\n${ziweiCalculationsSource}\n${ziweiBoardSource}\n${ziweiTraditionalBoardSource}\n${threePillarsBoardSource}\n${ziweiScopeModalSource}\n${promptShortcutsSource}\n${createDisplayWorkerSource}\n${createPayloadWorkerSource}`;

test('结果页不应渲染开发参考说明文案', () => {
  assert.doesNotMatch(source, /参考 `bz` 项目的专业盘表结构，按年、月、日、时展开。/);
  assert.doesNotMatch(source, /参考 `zw` 项目的传统盘布局，按 4x4 盘面集中展示十二宫。/);
  assert.doesNotMatch(source, /参考 `zw` 项目的结果页，先看时限与四化，再看宫位。/);
});

test('AI 页预览使用延迟值，复制和分享始终使用最新提示词', () => {
  assert.match(
    source,
    /const deferredBaziQuickQuestion = useDeferredValue\(effectiveBaziQuickQuestion\);/,
  );
  assert.match(
    source,
    /const deferredZiweiQuickQuestion = useDeferredValue\(effectiveZiweiQuickQuestion\);/,
  );
  assert.match(source, /const latestActivePromptText =/);
  assert.match(source, /const previewActivePromptText =/);
  assert.match(source, /usePromptCopyShare\(latestActivePromptText\)/);
  assert.match(
    source,
    /<div className="prompt-send-tip">\s*点击复制后，发送到你常用的在线 AI 软件继续提问。\s*<\/div>/,
  );
  assert.match(source, /<pre className="result-pre">\{previewActivePromptText\}<\/pre>/);
});

test('AI 场景下紫微提示词数据走 Worker，结果页挂载后就预热紫微运行时', () => {
  assert.match(source, /const shouldLoadZiweiPromptPayload =/);
  assert.match(
    source,
    /new Worker\(\s*new URL\('(?:\.\.\/)+workers\/ziwei-payload\.worker\.ts', import\.meta\.url\),/,
  );
  assert.match(source, /const shouldWarmZiweiRuntime = Boolean\(primaryZiweiInput\);/);
  assert.match(source, /if \(!shouldWarmZiweiRuntime \|\| !primaryZiweiInput\) \{/);
  assert.match(
    source,
    /const activeZiweiPayloadByScope = ziweiRuntime\?\.payloadByScope \?\? ziweiPayloadByScope;/,
  );
});

test('结果页会先定义 updatePromptState，再把它传给后续 hook', () => {
  const defineIndex = indexSource.indexOf('const updatePromptState = useCallback(');
  const hookIndex = indexSource.indexOf(
    'updatePromptState,',
    indexSource.indexOf('usePromptShortcuts('),
  );

  assert.ok(defineIndex >= 0, '应该存在 updatePromptState 定义');
  assert.ok(hookIndex >= 0, '应该存在把 updatePromptState 传给 usePromptShortcuts 的调用');
  assert.ok(defineIndex < hookIndex, 'updatePromptState 必须先初始化，再传给 usePromptShortcuts');
});

test('紫微页切换时限时会用 Worker 重算展示盘面，并显示轻量加载遮罩', () => {
  assert.match(
    source,
    /new Worker\(\s*new URL\('(?:\.\.\/)+workers\/ziwei-display\.worker\.ts', import\.meta\.url\),/,
  );
  assert.match(
    source,
    /const \[isDisplayPayloadLoading, setIsDisplayPayloadLoading\] = useState\(false\);/,
  );
  assert.match(source, /className="ziwei-board-loading-mask"/);
  assert.match(source, /<ZiweiBoardSkeleton/);
});

test('紫微提示词年限选择改成八字同款草稿确认结构', () => {
  assert.match(source, /当前将写入：/);
  assert.match(source, /fortune-modal-quick-label">当前</);
  assert.match(source, /const normalizedSelectedScope: Exclude<ZiweiScopeMode, 'hourly'> =/);
  assert.match(
    source,
    /const \[draftScope, setDraftScope\] =[\s\S]*?useState<Exclude<ZiweiScopeMode, 'hourly'>>/,
  );
  assert.match(
    source,
    /const \[draftDecadalIndex, setDraftDecadalIndex\] = useState\(initialDecadalIndex\);/,
  );
  assert.match(source, /findZiweiDecadalIndexByDate\(/);
  assert.match(source, /仅使用本命信息，不附加任何大限流年流月流日。/);
  assert.match(source, /modal-actions modal-actions-split/);
  assert.match(source, /仅用本命/);
  assert.match(source, /取消/);
  assert.match(source, /确定/);
  assert.match(source, /<h3>大限<\/h3>/);
  assert.match(source, /<h3>流年<\/h3>/);
  assert.match(source, /<h3>流月<\/h3>/);
  assert.match(source, /<h3>流日<\/h3>/);
  assert.doesNotMatch(source, /scope: 'hourly', label: '流时'/);
  assert.match(source, /modal-card bazi-fortune-modal/);
  assert.match(
    source,
    /const ziweiScopeSummaryText =\s*promptState\.ziweiScope === 'origin'\s*\?\s*'仅使用本命信息'/,
  );
  assert.doesNotMatch(source, /<strong>紫微运限<\/strong>/);
});

test('紫微提示词支持指定具体年限日期，并用自定义 payload 生成提示词', () => {
  assert.match(source, /const shouldUseCustomZiweiPromptPayload =/);
  assert.match(source, /promptState\.ziweiScopeDate/);
  assert.match(
    source,
    /new Worker\(\s*new URL\('(?:\.\.\/)+workers\/ziwei-display\.worker\.ts', import\.meta\.url\),/,
  );
  assert.match(source, /ziweiScopeDate: scope === 'origin' \? '' : dateStr/);
  assert.match(source, /formatZiweiPromptScopeSummary\(/);
});

test('结果页展示层不应再把星座混入八字与紫微卡片', () => {
  assert.doesNotMatch(source, /生肖 \/ 星座/);
  assert.doesNotMatch(source, /basic_info\.sign/);
  assert.doesNotMatch(source, /profile\.constellation/);
});

test('结果页提示词来源会严格分流到各自引擎，避免八字紫微星盘互相串味', () => {
  assert.match(
    source,
    /const latestActivePromptText =\s*promptState\.promptSource === 'astrolabe'\s*\?\s*latestAstrolabePromptText\s*:\s*promptState\.promptSource === 'bazi'\s*\?\s*latestBaziPromptText\s*:\s*latestZiweiPromptText;/,
  );
  assert.match(
    source,
    /const previewActivePromptText =\s*promptState\.promptSource === 'astrolabe'\s*\?\s*previewAstrolabePromptText\s*:\s*promptState\.promptSource === 'bazi'\s*\?\s*previewBaziPromptText\s*:\s*previewZiweiPromptText;/,
  );
  assert.match(source, /return buildDivinationPrompt\(\s*'astrolabe',/);
  assert.match(source, /return buildCombinedZiweiPrompt\(/);
  assert.match(source, /const \{ system, user \} = promptEngine\.buildPromptFromConfig\(/);
});

test('结果页空问题回退不应再写死旧文案，而应交给统一默认问题逻辑', () => {
  assert.match(indexSource, /getBaziDefaultQuestion/);
  assert.doesNotMatch(indexSource, /请先从婚恋匹配角度做整体解读/);
  assert.doesNotMatch(indexSource, /const fallbackQuestion =/);
});

test('问题灵感在不同提示词来源下只更新对应体系的状态', () => {
  assert.match(promptShortcutsSource, /if \(promptState\.promptSource === 'bazi'\) \{/);
  assert.match(promptShortcutsSource, /baziShortcutMode: '问题灵感'/);
  assert.match(
    promptShortcutsSource,
    /resolveBaziPresetIdByInspirationIntent\(intent\) \?\?/,
  );
  assert.match(
    promptShortcutsSource,
    /resolveBaziQuestionSceneByInspirationIntent\(intent\) \?\?/,
  );
  assert.match(promptShortcutsSource, /else if \(promptState\.promptSource === 'astrolabe'\) \{/);
  assert.match(
    promptShortcutsSource,
    /writePromptDraft\(astrolabeDraftStorageKey, question, 'inspiration'\)/,
  );
  assert.match(promptShortcutsSource, /setActiveAstrolabeShortcutMode\('问题灵感'\);/);
  assert.match(promptShortcutsSource, /setAstrolabeQuestionDraft\(question\);/);
  assert.match(
    promptShortcutsSource,
    /astrolabeShortcutMode: '问题灵感'/,
  );
  assert.match(
    promptShortcutsSource,
    /resolveAstrolabeTopicByInspirationIntent\(intent\) \?\?/,
  );
  assert.match(promptShortcutsSource, /ziweiShortcutMode: '问题灵感'/);
  assert.match(
    promptShortcutsSource,
    /resolveZiweiTopicByInspirationIntent\(intent\) \?\?/,
  );
});

test('结果页快捷按钮与问题灵感已覆盖第二批高频专项文案', () => {
  assert.match(resultPageConstantsSource, /创业合作/);
  assert.match(resultPageConstantsSource, /关系去留/);
  assert.match(resultPageConstantsSource, /搬家置业/);
  assert.match(resultPageConstantsSource, /考证进修/);
  assert.match(resultPageConstantsSource, /投资合作/);
  assert.match(resultPageConstantsSource, /复合判断/);
  assert.match(resultPageConstantsSource, /定居换城/);
  assert.match(resultPageConstantsSource, /考试上岸/);
});
