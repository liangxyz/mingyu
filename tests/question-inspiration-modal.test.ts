import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const modalSource = readFileSync(
  new URL('../src/components/QuestionInspirationModal.tsx', import.meta.url),
  'utf8',
);
const resultPageSource = readFileSync(
  new URL('../src/pages/ResultPage/index.tsx', import.meta.url),
  'utf8',
);
const inspirationHookSource = readFileSync(
  new URL('../src/pages/ResultPage/hooks/useQuestionInspiration.ts', import.meta.url),
  'utf8',
);
const stylesSource = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const divinationInspirationSource = readFileSync(
  new URL('../src/lib/divination/inspiration.ts', import.meta.url),
  'utf8',
);
const resultPageConstantsSource = readFileSync(
  new URL('../src/pages/ResultPage/ResultPage.constants.ts', import.meta.url),
  'utf8',
);

test('通用问题灵感模态窗支持筛选、搜索和分组渲染', () => {
  assert.match(modalSource, /export function QuestionInspirationModal/);
  assert.match(modalSource, /question-inspiration-filters/);
  assert.match(modalSource, /question-inspiration-search/);
  assert.match(modalSource, /question-inspiration-section-title/);
  assert.match(modalSource, /question-inspiration-item/);
  assert.match(modalSource, /question-inspiration-close-btn/);
  assert.match(modalSource, /onSelect\(item\.question, item\.tag, item\.intent\)/);
});

test('结果页改为复用通用问题灵感模态窗,筛选逻辑抽到 hook', () => {
  assert.match(resultPageSource, /QuestionInspirationModal/);
  assert.match(resultPageSource, /useQuestionInspiration/);
  assert.match(inspirationHookSource, /filteredSections/);
});

test('问题灵感模态窗在电脑端使用更紧凑的布局', () => {
  assert.match(
    stylesSource,
    /@media \(min-width: 769px\) \{[\s\S]*\.question-inspiration-modal \{[\s\S]*width: min\(760px, calc\(100vw - 48px\)\);/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 769px\) \{[\s\S]*\.question-inspiration-toolbar \{[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(220px, 232px\);/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 769px\) \{[\s\S]*\.question-inspiration-list \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 769px\) \{[\s\S]*\.question-inspiration-item \{[\s\S]*padding: 8px 10px;/,
  );
  assert.match(
    stylesSource,
    /\.question-inspiration-modal-head \{[\s\S]*justify-content: space-between;/,
  );
});

test('占卜问题灵感数据已迁移自 sydf，并保留塔罗牌阵专属问题', () => {
  assert.match(divinationInspirationSource, /export const DIVINATION_INSPIRATION_TABS/);
  assert.match(divinationInspirationSource, /heading: '情感发展'/);
  assert.match(divinationInspirationSource, /heading: '事业发展'/);
  assert.match(divinationInspirationSource, /heading: '财运趋势'/);
  assert.match(divinationInspirationSource, /heading: '社交模式'/);
  assert.match(divinationInspirationSource, /heading: '学业规划'/);
  assert.match(divinationInspirationSource, /export const TAROT_SPREAD_INSPIRATION_QUESTIONS/);
  assert.match(divinationInspirationSource, /'我和TA的感情会如何发展？'/);
});

test('通用问题灵感也会使用更适合直接提问 AI 的走势、风险和行动句式', () => {
  assert.match(divinationInspirationSource, /'这段关系接下来会怎么发展？'/);
  assert.match(divinationInspirationSource, /'眼下最大的事业阻力或风险是什么？'/);
  assert.match(divinationInspirationSource, /'我现在更适合求进，还是先守财？'/);
  assert.match(divinationInspirationSource, /'我现在最该先调整哪种状态，才能更稳定？'/);
});

test('小六壬问题灵感补充快速问事专属语料，并默认落到更适合行动判断的分类', () => {
  assert.match(divinationInspirationSource, /export const XIAOLIUREN_SPECIAL_INSPIRATION_CONTENT/);
  assert.match(divinationInspirationSource, /heading: '事业速断'/);
  assert.match(divinationInspirationSource, /'这件事我现在适合继续推进吗？'/);
  assert.match(divinationInspirationSource, /'我这件事现在最该等，还是最该动？'/);
  assert.match(divinationInspirationSource, /if \(draft\.method === 'xiaoliuren'\) \s*\{\s*return \{\s*label: '速断'/);
  assert.match(divinationInspirationSource, /getDivinationInspirationSections/);
});

test('六爻、大六壬与雷诺曼的专项问题灵感会收敛到独立标签页数据里', () => {
  assert.match(divinationInspirationSource, /export const LIUYAO_TEMPLATE_INSPIRATION_CONTENT/);
  assert.match(divinationInspirationSource, /heading: '六爻感情断卦'/);
  assert.match(divinationInspirationSource, /'我们这段关系还有没有推进空间？'/);
  assert.match(divinationInspirationSource, /heading: '六爻鬼神断卦'/);
  assert.match(divinationInspirationSource, /'当前我更该先查现实原因，还是再看有没有阴性牵扯？'/);
  assert.match(divinationInspirationSource, /export const LIUREN_TEMPLATE_INSPIRATION_CONTENT/);
  assert.match(divinationInspirationSource, /heading: '大六壬事业断课'/);
  assert.match(divinationInspirationSource, /'这件工作机会后续会怎么发展？'/);
  assert.match(divinationInspirationSource, /export const LENORMAND_SPREAD_INSPIRATION_CONTENT/);
  assert.match(divinationInspirationSource, /heading: '雷诺曼关系牌阵'/);
  assert.match(divinationInspirationSource, /heading: '雷诺曼九宫牌阵'/);
  assert.match(divinationInspirationSource, /'这两个选项里，哪一个更顺势、更适合现在的我？'/);
});

test('梅花和奇门也提供独立标签页问题灵感', () => {
  assert.match(divinationInspirationSource, /export const MEIHUA_SPECIAL_INSPIRATION_CONTENT/);
  assert.match(divinationInspirationSource, /heading: '梅花趋势'/);
  assert.match(divinationInspirationSource, /'这件事接下来会怎么发展？'/);
  assert.match(divinationInspirationSource, /export const QIMEN_SPECIAL_INSPIRATION_CONTENT/);
  assert.match(divinationInspirationSource, /heading: '奇门时机'/);
  assert.match(divinationInspirationSource, /heading: '奇门布局'/);
  assert.match(divinationInspirationSource, /'这件事现在是不是合适的行动时机？'/);
  assert.match(divinationInspirationSource, /if \(draft\.method === 'meihua'\) \s*\{\s*return \{\s*label: '卦解'/);
  assert.match(divinationInspirationSource, /if \(draft\.method === 'qimen'\) \s*\{\s*return \{\s*label: '策略'/);
  assert.match(divinationInspirationSource, /if \(draft\.method === 'liuyao' && draft\.liuyaoTemplate !== 'general'\) \s*\{\s*return \{\s*label: '断卦'/);
});

test('专项占卜打开问题灵感时，会默认落到独立专项标签页', () => {
  assert.match(
    divinationInspirationSource,
    /if \(getDivinationSpecialInspiration\(draft\)\) \{\s*return 'special';\s*\}/,
  );
  assert.match(
    divinationInspirationSource,
    /if \(tabId === 'special'\) \{\s*return Boolean\(getDivinationSpecialInspiration\(draft\)\);\s*\}/,
  );
  assert.match(
    divinationInspirationSource,
    /export type DivinationInspirationTabId =[\s\S]*\| 'special'/,
  );
});

test('专项问题灵感的句式会收紧到走势、风险和行动建议导向', () => {
  assert.match(divinationInspirationSource, /'这段关系当前最大的阻力或风险在哪？'/);
  assert.match(divinationInspirationSource, /'当前最大的拖延风险或错判点是什么？'/);
  assert.match(divinationInspirationSource, /'我现在最该先做什么，才更顺？'/);
  assert.match(divinationInspirationSource, /'我现在最不该忽略的风险信号是什么？'/);
});

test('占卜问题灵感不再只写入问题文本，而会自动补齐更匹配的专项状态', () => {
  assert.match(divinationInspirationSource, /export function resolveDivinationInspiredDraftPatch/);
  assert.match(divinationInspirationSource, /next\.liuyaoTemplate = template as DivinationDraft\['liuyaoTemplate'\]/);
  assert.match(divinationInspirationSource, /next\.liurenTemplate = template as DivinationDraft\['liurenTemplate'\]/);
  assert.match(divinationInspirationSource, /next\.tarotSpread = spread as DivinationDraft\['tarotSpread'\]/);
  assert.match(divinationInspirationSource, /next\.lenormandSpread = spread as DivinationDraft\['lenormandSpread'\]/);
  assert.match(divinationInspirationSource, /next\.meihuaFocus = 'trend'/);
  assert.match(divinationInspirationSource, /next\.xiaoliurenFocus = 'career'/);
  assert.match(divinationInspirationSource, /next\.qimenFocus = 'strategy'/);
});

test('命理问题灵感已补到第二批高频专项意图，便于走完整专项框架', () => {
  assert.match(resultPageConstantsSource, /intent: 'startup-partnership'/);
  assert.match(resultPageConstantsSource, /intent: 'relationship-decision'/);
  assert.match(resultPageConstantsSource, /intent: 'home-move'/);
  assert.match(resultPageConstantsSource, /intent: 'study-advance'/);
  assert.match(resultPageConstantsSource, /intent: 'investment-partnership'/);
  assert.match(resultPageConstantsSource, /intent: 'reconciliation-decision'/);
  assert.match(resultPageConstantsSource, /intent: 'settle-relocate'/);
  assert.match(resultPageConstantsSource, /intent: 'exam-landing'/);
});
