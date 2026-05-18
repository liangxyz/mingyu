import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const inputPageSource = readFileSync(
  new URL('../src/pages/InputPage.tsx', import.meta.url),
  'utf8',
);
const divinationPanelIndex = readFileSync(
  new URL('../src/components/DivinationPanel/index.tsx', import.meta.url),
  'utf8',
);
const divinationPanelForm = readFileSync(
  new URL('../src/components/DivinationPanel/DivinationForm.tsx', import.meta.url),
  'utf8',
);
const divinationPanelResult = readFileSync(
  new URL('../src/components/DivinationPanel/DivinationResult.tsx', import.meta.url),
  'utf8',
);
const divinationPanelConstants = readFileSync(
  new URL('../src/components/DivinationPanel/constants.ts', import.meta.url),
  'utf8',
);
const astrolabeChartSource = readFileSync(
  new URL('../src/components/AstrolabeChart.tsx', import.meta.url),
  'utf8',
);
const divinationPanelSource =
  divinationPanelIndex +
  divinationPanelForm +
  divinationPanelResult +
  divinationPanelConstants +
  astrolabeChartSource;
const divinationConfigSource = readFileSync(
  new URL('../src/lib/divination/config.ts', import.meta.url),
  'utf8',
);
const stylesSource = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const resultPageSource = readFileSync(
  new URL('../src/pages/ResultPage/index.tsx', import.meta.url),
  'utf8',
);
const astrolabePromptSource = readFileSync(
  new URL('../src/lib/astrolabe-prompts.ts', import.meta.url),
  'utf8',
);
const personFormSource = readFileSync(
  new URL('../src/pages/InputPage.PersonForm.tsx', import.meta.url),
  'utf8',
);

test('输入页顶部切换新增占卜入口，并按需懒加载占卜面板', () => {
  assert.match(inputPageSource, /label: '占卜', value: 'divination' as const/);
  assert.match(inputPageSource, /label: '择日', value: 'almanac' as const/);
  assert.match(inputPageSource, /const LazyDivinationPanel = lazy\(async \(\) =>/);
  assert.match(inputPageSource, /<LazyDivinationPanel/);
});

test('输入页顶部切换会把当前模式写回地址栏，刷新后仍保留在当前页签', () => {
  assert.match(inputPageSource, /const \[searchParams, setSearchParams\] = useSearchParams\(\);/);
  assert.match(inputPageSource, /function updateEntryMode\(value: InputEntryMode\)/);
  assert.match(inputPageSource, /nextSearchParams\.set\('mode', value\);/);
  assert.match(inputPageSource, /setSearchParams\(nextSearchParams, \{ replace: true \}\);/);
  assert.match(inputPageSource, /onChange=\{updateEntryMode\}/);
});

test('个人页改为一份信息统一生成多套结果，星盘由真太阳时条件驱动出现', () => {
  assert.doesNotMatch(personFormSource, /label: '星盘', value: 'astrolabe' as const/);
  assert.doesNotMatch(inputPageSource, /onChartTypeChange=\{updateChartType\}/);
  assert.doesNotMatch(inputPageSource, /sectionTitle=\{form\.chartType === 'astrolabe' \? '星盘信息'/);
  assert.match(
    inputPageSource,
    /填写一份个人信息，自动生成八字、紫微；勾选真太阳时后会同时生成星盘。/,
  );
  assert.match(
    inputPageSource,
    /填写一份个人信息，自动生成八字、紫微；勾选真太阳时后会同时生成星盘。/,
  );
  assert.match(inputPageSource, /tab: 'bazi'/);
  assert.match(inputPageSource, /promptSource: 'bazi'/);
  assert.match(
    resultPageSource,
    /const hasAstrolabeChart =[\s\S]*inputState\.useTrueSolarTime[\s\S]*Boolean\(inputState\.birthHour\)[\s\S]*Boolean\(inputState\.birthPlace\)/,
  );
  assert.match(resultPageSource, /const isAstrolabePromptSource = promptState\.promptSource === 'astrolabe';/);
  assert.match(resultPageSource, /switchTab\('astrolabe'\)/);
  assert.match(resultPageSource, /<AstrolabeBoard/);
  assert.match(resultPageSource, /buildDivinationPrompt\(\s*'astrolabe'/);
  assert.match(
    resultPageSource,
    /八字[\s\S]*紫微[\s\S]*星盘[\s\S]*提示词/,
  );
});

test('顶部主入口不再保留独立星盘按钮', () => {
  assert.doesNotMatch(inputPageSource, /{ label: '星盘', value: 'astrolabe' as const },/);
});

test('择日可以作为顶部独立入口直达对应表单', () => {
  assert.match(inputPageSource, /searchParams\.get\('mode'\) === 'almanac'/);
  assert.match(inputPageSource, /initialMethod=\{entryMode === 'almanac' \? 'almanac'/);
  assert.match(inputPageSource, /lockedMethod=\{entryMode === 'almanac' \? 'almanac'/);
  assert.match(inputPageSource, /entryMode === 'almanac'[\s\S]*\? 'almanac'/);
  assert.match(
    divinationPanelSource,
    /lockedMethod\?: Extract<DivinationDraft\['method'\], 'almanac' \| 'astrolabe'>/,
  );
  assert.match(divinationPanelSource, /lockedMethod === 'almanac' \? '择日'/);
  assert.match(
    divinationPanelSource,
    /!isMethodLocked \? \([\s\S]*className="divination-method-grid"/,
  );
});

test('输入页切换到占卜时使用固定舞台和骨架回退，减少高度宽度抖动', () => {
  assert.match(inputPageSource, /const divinationPanelFallback = \(/);
  assert.match(inputPageSource, /className="divination-panel-shell input-mode-loading"/);
  assert.match(inputPageSource, /<Suspense fallback=\{divinationPanelFallback\}>/);
  assert.doesNotMatch(inputPageSource, /<Suspense fallback=\{null\}>/);
  assert.match(stylesSource, /\.analysis-view \{[\s\S]*min-height: 560px;/);
  assert.match(
    stylesSource,
    /\.analysis-view > \* \{[\s\S]*width: 100%;[\s\S]*max-width: 100%;[\s\S]*min-width: 0;/,
  );
  assert.match(
    stylesSource,
    /@media \(max-width: 900px\) \{[\s\S]*\.analysis-view \{[\s\S]*min-height: max\(520px, calc\(100dvh - 150px\)\);/,
  );
});

test('占卜面板复用复制与移动端分享能力', () => {
  assert.match(divinationPanelSource, /shouldShowPromptShareButton/);
  assert.match(
    divinationPanelSource,
    /usePromptCopyShare\([\s\S]*?session\?\.prompt \?\? ''[\s\S]*?\)/,
  );
});

test('占卜页提示词操作按钮在电脑端保持单行，避免复制按钮文字换行', () => {
  assert.match(divinationPanelSource, /className="panel-head divination-prompt-head"/);
  assert.match(
    divinationPanelSource,
    /className="action-row compact-actions divination-prompt-actions"/,
  );
  assert.match(
    divinationPanelSource,
    /<div className="prompt-send-tip">\s*点击复制后，发送到你常用的在线 AI 软件继续提问。\s*<\/div>/,
  );
  assert.match(
    stylesSource,
    /\.divination-prompt-actions \.copy-button \{[\s\S]*white-space: nowrap;/,
  );
});

test('占卜面板会自动写入历史，并提供历史记录入口', () => {
  assert.match(divinationPanelSource, /addDivinationHistory/);
  assert.match(
    divinationPanelSource,
    /const savedRecord = addDivinationHistory\(draft, nextSession\);/,
  );
  assert.match(divinationPanelSource, /nextSearchParams\.set\('record', savedRecord\.id\);/);
  assert.match(divinationPanelSource, /navigate\('\/records\?tab=divination'\)/);
});

test('占卜面板可根据地址栏里的记录 id 恢复历史结果', () => {
  assert.match(divinationPanelSource, /const recordId = searchParams\.get\('record'\);/);
  assert.match(divinationPanelSource, /const record = getDivinationHistoryById\(recordId\);/);
  assert.match(divinationPanelSource, /setDraft\(record\.draft\);/);
  assert.match(divinationPanelSource, /setSession\(record\.session\);/);
});

test('排盘与占卜输入页底部操作区统一为左历史右开始', () => {
  assert.match(
    inputPageSource,
    /<button[\s\S]*className="secondary-page-button"[\s\S]*>\s*历史记录\s*<\/button>[\s\S]*<button[\s\S]*className="primary-button start-submit-button"[\s\S]*>\s*开始排盘\s*<\/button>/,
  );
  assert.match(
    divinationPanelSource,
    /<button[\s\S]*className="secondary-page-button"[\s\S]*>\s*历史记录\s*<\/button>[\s\S]*<button[\s\S]*className="primary-button start-submit-button"[\s\S]*>\s*\{submitButtonText\}\s*<\/button>/,
  );
});

test('占卜页把底部操作区放在卡片外，和排盘页结构一致', () => {
  assert.match(
    divinationPanelSource,
    /<\/section>\s*\{error \? <div className="form-error-text global-form-error">\{error\}<\/div> : null\}\s*<div[\s\S]*className="form-actions page-submit-actions"/,
  );
});

test('占卜页改为单个问题灵感按钮，不再直接渲染三条快捷问题', () => {
  assert.match(divinationPanelSource, />\s*问题灵感\s*</);
  assert.match(divinationPanelSource, /openQuestionInspirationModal/);
  assert.doesNotMatch(divinationPanelSource, /DIVINATION_EXAMPLES/);
  assert.doesNotMatch(divinationPanelSource, /currentExamples/);
});

test('移动端把问题灵感按钮放进起卦方式同一行，并隐藏桌面端的独立入口', () => {
  assert.match(divinationPanelSource, /className="quick-chip divination-mobile-inspiration-btn"/);
  assert.match(
    divinationPanelSource,
    /className="divination-mobile-method-picker"[\s\S]*draft\.method === 'meihua'[\s\S]*className="divination-mobile-secondary-picker"[\s\S]*draft\.method === 'tarot'[\s\S]*className="divination-mobile-secondary-picker"[\s\S]*draft\.method === 'liuren'[\s\S]*className="divination-mobile-secondary-picker"[\s\S]*className="quick-chip divination-mobile-inspiration-btn"/,
  );
  assert.match(stylesSource, /\.divination-mobile-inspiration-btn \{[\s\S]*display: none;/);
  assert.match(
    stylesSource,
    /\.divination-mobile-control-row \{[\s\S]*display: flex;[\s\S]*flex-wrap: wrap;[\s\S]*width: 100%;/,
  );
  assert.match(
    stylesSource,
    /\.divination-mobile-inspiration-btn \{[\s\S]*width: auto;[\s\S]*min-width: max-content;[\s\S]*margin-left: auto;/,
  );
  assert.match(stylesSource, /\.divination-desktop-question-footer \{[\s\S]*display: none;/);
});

test('电脑端把问题灵感放到输入框下方右侧，并和额外参数共用一行，塔罗不显示出生年份', () => {
  assert.match(
    divinationPanelSource,
    /className="divination-question-field"[\s\S]*id="divination-question-input"[\s\S]*className="divination-desktop-question-footer"[\s\S]*className="divination-desktop-question-controls"[\s\S]*id="meihua-method-select"[\s\S]*id="liuyao-template-select"[\s\S]*id="liuren-template-select"[\s\S]*id="tarot-spread-select"[\s\S]*className="quick-chip divination-desktop-inspiration-btn"/,
  );
  assert.match(
    divinationPanelSource,
    /className=\{`form-row-flex divination-meta-row \$\{draft\.method === 'tarot' \? 'is-single' : ''\}`\}[\s\S]*divination-gender-select[\s\S]*draft\.method !== 'tarot' \?/,
  );
  assert.match(
    stylesSource,
    /\.divination-desktop-question-footer \{[\s\S]*display: flex;[\s\S]*justify-content: space-between;/,
  );
  assert.match(
    stylesSource,
    /\.divination-desktop-inspiration-btn \{[\s\S]*width: auto;[\s\S]*min-width: 112px;[\s\S]*min-height: 46px;/,
  );
});

test('占卜页复用通用问题灵感模态窗，并接入 sydf 迁移过来的灵感数据', () => {
  assert.match(divinationPanelSource, /QuestionInspirationModal/);
  assert.match(divinationPanelSource, /DIVINATION_INSPIRATION_TABS/);
  assert.match(divinationPanelSource, /getDivinationInspirationSections/);
  assert.match(divinationPanelSource, /TAROT_SPREAD_INSPIRATION_QUESTIONS/);
  assert.match(divinationPanelSource, /questionInputRef/);
});

test('占卜页打开问题灵感时，会把完整草稿传给默认分类与专项灵感逻辑', () => {
  assert.match(divinationPanelIndex, /setActiveInspirationTab\(getDefaultDivinationInspirationTab\(draft\)\);/);
  assert.match(divinationPanelIndex, /getDivinationSpecialInspiration/);
  assert.match(divinationPanelIndex, /resolveDivinationInspiredDraftPatch/);
  assert.match(divinationPanelIndex, /const specialInspiration = useMemo\(\(\) => getDivinationSpecialInspiration\(draft\), \[draft\]\);/);
  assert.match(divinationPanelIndex, /label: specialInspiration\.label/);
  assert.match(divinationPanelIndex, /value: 'special' as const/);
  assert.match(divinationPanelIndex, /if \(activeInspirationTab === 'special'\)/);
  assert.match(divinationPanelIndex, /if \(!specialInspiration\) \{\s*return \[\];\s*\}/);
  assert.match(
    divinationPanelIndex,
    /return getDivinationInspirationSections\(draft, activeInspirationTab\)/,
  );
  assert.match(divinationPanelSource, /liuyaoTemplate/);
  assert.match(divinationPanelSource, /liurenTemplate/);
  assert.match(divinationPanelSource, /lenormandSpread/);
  assert.match(divinationPanelIndex, /\.\.\.resolveDivinationInspiredDraftPatch\(current, question\)/);
});

test('小六壬结果页增加三段式推演展示，方便用户直接拿去喂给 AI 展开', () => {
  assert.match(divinationPanelResult, /function XiaoliurenBoard/);
  assert.match(divinationPanelResult, /function XiaoliurenStageCard/);
  assert.match(divinationPanelResult, /小六壬三段推演/);
  assert.match(divinationPanelResult, /label="起因"/);
  assert.match(divinationPanelResult, /label="过程"/);
  assert.match(divinationPanelResult, /label="结果"/);
  assert.match(divinationPanelResult, /主判断/);
  assert.match(divinationPanelResult, /问事提醒/);
  assert.match(divinationPanelResult, /session\.method === 'xiaoliuren'/);
  assert.match(stylesSource, /\.xiaoliuren-card-grid \{/);
  assert.match(stylesSource, /\.xiaoliuren-overview-grid \{/);
});

test('随机占卜结果会明确显示本次随机到的卦种', () => {
  assert.match(divinationPanelSource, /session\.requestedMethod === 'random'/);
  assert.match(divinationPanelSource, /本次随机到：\{methodLabelMap\[session\.method\]\}/);
});

test('占卜面板不再提供解读风格和输出长度选项', () => {
  assert.doesNotMatch(divinationPanelSource, /divination-style-select/);
  assert.doesNotMatch(divinationPanelSource, /divination-length-select/);
  assert.doesNotMatch(divinationPanelSource, /解读风格/);
  assert.doesNotMatch(divinationPanelSource, /输出长度/);
});

test('随机占卜入口放在第一个', () => {
  assert.match(
    divinationConfigSource,
    /DIVINATION_METHOD_OPTIONS[\s\S]*value: 'random'[\s\S]*label: '随机'[\s\S]*value: 'liuyao'/,
  );
});

test('塔罗入口位于三山国王灵签之后、雷诺曼之前', () => {
  assert.match(
    divinationConfigSource,
    /value: 'ssgw'[\s\S]*label: '三山国王灵签'[\s\S]*value: 'tarot'[\s\S]*label: '塔罗'[\s\S]*value: 'almanac'[\s\S]*value: 'lenormand'[\s\S]*label: '雷诺曼'/,
  );
});

test('占卜面板提供移动端下拉入口，并与当前卦种共用同一个状态源', () => {
  assert.match(divinationPanelSource, /divination-mobile-method-select/);
  assert.match(divinationPanelSource, /value=\{draft\.method\}/);
  assert.match(
    divinationPanelSource,
    /updateDraft\('method', event\.target\.value as DivinationDraft\['method'\]\)/,
  );
});

test('六爻增加专项入口，和梅花起卦方式、大六壬断课模板保持同一交互层级', () => {
  assert.match(divinationPanelSource, /LIUYAO_TEMPLATE_OPTIONS/);
  assert.match(divinationPanelSource, /liuyaoTemplateLabelMap/);
  assert.match(divinationPanelSource, /id="liuyao-template-select"/);
  assert.match(divinationPanelSource, /aria-label="六爻专项"/);
  assert.match(divinationPanelSource, /value=\{draft\.liuyaoTemplate\}/);
  assert.match(divinationPanelSource, /'liuyaoTemplate'/);
  assert.match(divinationConfigSource, /value: 'guaishen'[\s\S]*label: '鬼神怪异'/);
});

test('占卜面板默认卦种仍为随机，桌面端按钮组继续展示扩展后的选项', () => {
  assert.match(
    divinationPanelSource,
    /const defaultDraft: DivinationDraft = \{[\s\S]*method: 'random'/,
  );
  assert.match(divinationPanelSource, /className="divination-method-grid"/);
  assert.match(divinationPanelSource, /GENERAL_DIVINATION_METHOD_OPTIONS\.map/);
  assert.match(
    divinationConfigSource,
    /value: 'liuren'[\s\S]*label: '大六壬'[\s\S]*value: 'xiaoliuren'[\s\S]*label: '小六壬'/,
  );
  assert.match(divinationConfigSource, /value: 'lenormand'[\s\S]*label: '雷诺曼'/);
  assert.match(divinationConfigSource, /value: 'almanac'[\s\S]*label: '黄历择日'/);
  assert.match(divinationConfigSource, /value: 'astrolabe'[\s\S]*label: '星盘'/);
  assert.match(
    divinationConfigSource,
    /GENERAL_DIVINATION_METHOD_OPTIONS[\s\S]*item\.value !== 'almanac' && item\.value !== 'astrolabe'/,
  );
  assert.match(
    stylesSource,
    /\.divination-method-grid \{[\s\S]*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\);/,
  );
  assert.match(
    stylesSource,
    /\.input-mode-loading-methods \{[\s\S]*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\);/,
  );
  assert.match(inputPageSource, /Array\.from\(\{ length: 8 \}, \(_, index\) =>/);
});

test('占卜普通入口不再展示已独立到顶部的择日和星盘', () => {
  assert.match(divinationPanelForm, /GENERAL_DIVINATION_METHOD_OPTIONS\.map/);
  assert.doesNotMatch(divinationPanelForm, /(?<!GENERAL_)DIVINATION_METHOD_OPTIONS\.map/);
  assert.match(divinationConfigSource, /GENERAL_DIVINATION_METHOD_OPTIONS/);
  assert.match(divinationConfigSource, /item\.value !== 'almanac'/);
  assert.match(divinationConfigSource, /item\.value !== 'astrolabe'/);
});

test('黄历择日前端提供事项、日期范围和多人出生信息输入', () => {
  assert.match(divinationPanelSource, /almanac-topic-select/);
  assert.match(divinationPanelSource, /almanac-start-date-input/);
  assert.match(divinationPanelSource, /almanac-end-date-input/);
  assert.match(divinationPanelSource, /almanacParticipants/);
  assert.match(divinationPanelSource, /添加参与人/);
  assert.match(divinationPanelSource, /参与人出生信息/);
  assert.match(divinationPanelSource, /补充信息（可选）/);
  assert.match(divinationPanelSource, /开始择日/);
});

test('星盘前端展示专业星盘图作为结果证明', () => {
  assert.match(divinationPanelSource, /AstrolabeChart/);
  assert.match(divinationPanelSource, /astrolabe-chart-svg/);
  assert.match(divinationPanelSource, /星盘图/);
  assert.doesNotMatch(divinationPanelSource, /西洋占星/);
});

test('星盘提示词页提供更多快捷方向并保留按钮间距', () => {
  for (const label of [
    '综合',
    '事业',
    '财富',
    '感情',
    '婚姻',
    '家庭',
    '人际',
    '情绪',
    '成长',
    '天赋',
    '健康',
    '学业',
    '近期',
  ]) {
    assert.match(astrolabePromptSource, new RegExp(`label: '${label}'`));
  }
  assert.match(resultPageSource, /quickGridClassName="astrolabe-quick-grid"/);
  assert.match(resultPageSource, /activeMode=\{activeAstrolabeShortcutMode\}/);
  assert.match(resultPageSource, /onApplyMode=\{applyAstrolabeShortcutMode\}/);
  assert.match(resultPageSource, /showCustomAndInspiration/);
  assert.match(resultPageSource, /onOpenInspiration=\{inspiration\.open\}/);
  assert.match(stylesSource, /\.astrolabe-quick-grid \{[\s\S]*gap: 10px;/);
  assert.match(
    stylesSource,
    /\.astrolabe-quick-grid \{[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/,
  );
  assert.match(stylesSource, /\.astrolabe-quick-grid \.quick-chip \{[\s\S]*text-align: center;/);
  assert.match(
    stylesSource,
    /\.astrolabe-quick-grid \+ \.field-card textarea[\s\S]*\.astrolabe-quick-grid \+ \.quick-grid \+ \.field-card textarea/s,
  );
});

test('星盘结果页弱化内部独立卡头，改为复用统一结果卡结构', () => {
  assert.match(astrolabeChartSource, /showHeader = true/);
  assert.match(astrolabeChartSource, /\{showHeader \? \(/);
  assert.match(resultPageSource, /<AstrolabeBoard/);
  assert.match(stylesSource, /\.astrolabe-chart-shell \{/);
  assert.match(stylesSource, /\.astrolabe-chart-svg \{[\s\S]*border: 1px solid var\(--border-soft\);/);
});
