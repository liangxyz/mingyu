import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildPromptFromConfig,
  getCompatibilityPrompt,
  resolveBaziQuestionScene,
} from '../src/utils/ai/aiPrompts';
import { baziCalculator } from '../src/utils/bazi/baziCalculator';
import { buildFortuneSelectionContext } from '../src/utils/bazi/fortuneSelection';
import {
  generateAnalysisDimensionHints,
  generateCareerPartnershipHints,
  generateChildrenFateHints,
  generateFriendshipHints,
  generateMarriageMatchHints,
  generateParentsAnalysisHints,
  generateSiblingsAnalysisHints,
} from '../src/utils/bazi/baziEnhancement';

test('八字 AI 系统规则明确要求复核命盘中已给出的喜忌结论', () => {
  const source = readFileSync(resolve('src/utils/ai/aiPrompts.ts'), 'utf8');

  assert.match(source, /《穷通宝鉴》/);
  assert.match(source, /判断喜忌/);
  assert.match(source, /先旺衰月令.*格局调候.*取用路径十神.*神煞/);
  assert.match(source, /普通格局按扶抑/);
  assert.match(source, /专旺从格按顺势/);
  assert.match(source, /神煞不得单独推翻主体判断/);
  assert.match(source, /资料包中标注为“传统旁证”的内容只作辅助验证，不得盖过核心判断依据/);
  assert.match(source, /说清核心用神/);
  assert.match(source, /结论与推理不一致时必须指出冲突点/);
  assert.match(source, /优先使用命盘中的核心判断依据组织推理/);
  assert.match(source, /不得编造资料包没有给出的新盘面事实/);
  assert.match(source, /允许基于资料包做传统八字推理/);
  assert.match(source, /必须标明来自原局、岁运、十神、合冲刑害、神煞旁证或现实补充信息/);
  assert.match(source, /只有写入【分析对象】的大运、流年、流月、流日才可作为当前岁运证据/);
  assert.match(source, /证据不足/);
  assert.match(source, /用神优先级/);
  assert.doesNotMatch(source, /本地/);
});

test('八字合盘系统提示词应使用专门的双盘规则，不混入单盘要求', () => {
  const result1 = baziCalculator.calculateBazi({
    year: 1988,
    month: 1,
    day: 1,
    timeIndex: 0,
    gender: 'female',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });
  const result2 = baziCalculator.calculateBazi({
    year: 1990,
    month: 6,
    day: 15,
    timeIndex: 5,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const prompt = getCompatibilityPrompt('请分析我们适不适合长期合伙。', result1, result2, 'career');

  assert.match(prompt.system, /只基于提供的双方命盘、岁运和问题作答/);
  assert.match(
    prompt.system,
    /双盘先分别判断旺衰、格局、调候和用忌，再汇总双方互动主线、互补点、冲突点、现实压力和建议/,
  );
  assert.match(prompt.system, /关系结论若与双方命局主线或岁运节奏不一致，必须指出冲突点/);
  assert.match(prompt.system, /不得编造资料包没有给出的新盘面事实/);
  assert.match(prompt.system, /允许基于双方资料包做传统八字推理/);
  assert.doesNotMatch(prompt.system, /说清核心用神、辅助喜用与主忌/);
  assert.equal((prompt.system.match(/信息不足时说明证据不足/g) || []).length, 1);
});

test('八字盘面格式化会把喜忌五行和十神清单直接写进提示词', () => {
  const source = readFileSync(resolve('src/utils/bazi/baziAnalysisFormatter.ts'), 'utf8');

  assert.match(source, /主用\$\{primaryFavorableWuxing\}/);
  assert.match(source, /辅.*secondaryFavorableWuxing/);
  assert.match(source, /主忌\$\{primaryUnfavorableWuxing\}/);
  assert.match(source, /喜忌五行:/);
  assert.match(source, /喜忌十神:/);
  assert.match(source, /十神归类: 喜/);
  assert.match(source, /旺衰拆分:/);
  assert.match(source, /格局依据:/);
  assert.match(source, /月令:/);
  assert.match(source, /通根:/);
  assert.match(source, /帮扶:/);
  assert.match(source, /克泄耗:/);
});

test('结果页摘要会突出核心用神与核心忌神，不再只展示并列清单', () => {
  const pageSource = readFileSync(resolve('src/pages/ResultPage/index.tsx'), 'utf8');
  const helpersSource = readFileSync(resolve('src/pages/ResultPage/ResultPage.helpers.ts'), 'utf8');
  const baziChartBoardSource = readFileSync(
    resolve('src/pages/ResultPage/components/BaziChartBoard.tsx'),
    'utf8',
  );
  const source = `${pageSource}\n${helpersSource}\n${baziChartBoardSource}`;

  assert.match(source, /核心用神/);
  assert.match(source, /核心忌神/);
  assert.match(source, /主用:/);
  assert.match(source, /辅助:/);
  assert.match(source, /主忌:/);
  assert.match(source, /次忌:/);
});

test('八字单盘提示词统一改为 section 结构', () => {
  const source = readFileSync(resolve('src/utils/ai/aiPrompts.ts'), 'utf8');

  assert.doesNotMatch(source, /首句固定写成“核心用神：……，辅助喜用：……，主忌：……。”/);
  assert.doesNotMatch(source, /CORE_USEFUL_GOD_OPENING/);
  assert.match(source, /buildPromptSection\(\s*'当前时间'/);
  assert.match(source, /buildPromptSection\(\s*'排盘信息'/);
  assert.match(source, /buildPromptSection\(\s*'问题'/);
  assert.match(source, /buildPromptSection\(\s*'任务'/);
  assert.match(source, /buildPromptSection\(\s*'输出要求'/);
  assert.doesNotMatch(source, /输出：先给结论，再补关键依据与建议。/);
});

test('八字主提示词不再区分简洁模式，统一由同一套系统规则驱动', () => {
  const aiPromptsSource = readFileSync(resolve('src/utils/ai/aiPrompts.ts'), 'utf8');

  assert.doesNotMatch(aiPromptsSource, /conciseSystem/);
  assert.doesNotMatch(aiPromptsSource, /isSimpleQuestion/);
  assert.doesNotMatch(aiPromptsSource, /useConciseMode/);
  assert.match(aiPromptsSource, /buildPromptSection\('分析对象'/);
  assert.match(aiPromptsSource, /buildPromptSection\('分析对象优先级'/);
  assert.match(aiPromptsSource, /每个重点都要写明主证、辅证、反证或限制，以及应期条件/);
});

test('八字问题场景只由内置快捷配置提供，不再根据问题文本自动猜测', () => {
  const enhancementSource = readFileSync(
    resolve('src/utils/bazi/baziPromptEnhancement.ts'),
    'utf8',
  );
  const aiPromptsSource = readFileSync(resolve('src/utils/ai/aiPrompts.ts'), 'utf8');

  assert.equal(resolveBaziQuestionScene('general'), 'general');
  assert.equal(resolveBaziQuestionScene('recent'), 'recent');
  assert.equal(resolveBaziQuestionScene('marriage'), 'marriage');
  assert.equal(resolveBaziQuestionScene(undefined), 'general');
  assert.equal(resolveBaziQuestionScene('未知类型'), 'general');
  assert.match(
    aiPromptsSource,
    /resolveBaziQuestionScene\(questionScene \|\| promptConfig\?\.scene\)/,
  );
  assert.match(aiPromptsSource, /isCustomQuestion/);
  assert.doesNotMatch(enhancementSource, /detectQuestionScene/);
});

test('八字内置快捷会加入传统专项研判框架，自定义问题保持干净', () => {
  const source = [
    readFileSync(resolve('src/utils/ai/aiPrompts.ts'), 'utf8'),
    readFileSync(resolve('src/utils/ai/baziQuestionScene.ts'), 'utf8'),
  ].join('\n');

  assert.match(source, /问题研判框架/);
  assert.match(source, /isCustomQuestion\s*\?\s*''/);
  assert.match(source, /isCustomQuestion\s*\?\s*''\s*:\s*buildPromptSection\(\s*'任务'/);
  assert.match(source, /isCustomQuestion\s*\?\s*''\s*:\s*buildPromptSection\(\s*'输出要求'/);
  assert.match(source, /先围绕【问题】展开/);
  assert.match(source, /先按传统八字次序立论/);
  assert.match(source, /格局成败/);
  assert.match(source, /神煞、纳音、桃花、驿马、空亡等只能作为旁证/);
  assert.match(source, /区分“本命长期倾向”和“当前\/指定岁运触发”/);
  assert.match(source, /男命以财星为妻星，女命以官杀为夫星/);
  assert.match(source, /食伤生财或财生官是否通顺/);
  assert.match(source, /文昌、学堂、词馆作旁证/);
  assert.match(source, /健康问题先看调候寒暖燥湿/);
  assert.match(source, /不作医学诊断/);
  assert.match(source, /ai-family/);
  assert.match(source, /ai-recent/);
  assert.match(source, /ai-home/);
  assert.match(source, /ai-social/);
  assert.match(source, /ai-emotion/);
  assert.match(source, /ai-study/);
  assert.match(source, /ai-growth/);
  assert.match(source, /ai-talent/);
  assert.match(source, /ai-job-change/);
  assert.match(source, /ai-relationship-push/);
  assert.match(source, /ai-startup-partnership/);
  assert.match(source, /ai-relationship-decision/);
  assert.match(source, /ai-home-move/);
  assert.match(source, /ai-study-advance/);
  assert.match(source, /ai-investment-partnership/);
  assert.match(source, /ai-reconciliation-decision/);
  assert.match(source, /ai-settle-relocate/);
  assert.match(source, /ai-exam-landing/);
  assert.match(source, /社交风格、合作关系、贵人来源/);
  assert.match(source, /情绪触发点、压力来源、安全感需求/);
  assert.match(source, /核心天赋、学习吸收、表达输出、组织执行和资源整合能力/);
  assert.match(source, /近期问题先看当前所处大运、流年、流月是否正在触发命局主线/);
  assert.match(
    source,
    /换工作问题先看当前大运、流年、流月是否对官杀、印星、食伤、财星形成新的引动/,
  );
  assert.match(source, /关系推进问题先看配偶星、夫妻宫、桃花与当前岁运引动/);
  assert.match(source, /创业合作问题先看财星、官杀、印星、食伤、比劫在原局与当前岁运中的受力/);
  assert.match(source, /关系去留问题先看配偶星、夫妻宫、桃花与当前岁运是否继续形成支撑或消耗/);
  assert.match(source, /搬家置业问题先看印星、财星、驿马、日支与年柱月柱根基/);
  assert.match(source, /考证进修问题先看印星、食伤、官杀与当前岁运引动/);
  assert.match(source, /投资合作问题先看财星、比劫、官杀、印星、食伤与当前岁运引动/);
  assert.match(source, /复合判断问题先看配偶星、夫妻宫、桃花、合冲刑害与当前岁运引动/);
  assert.match(source, /定居换城问题先看印星、财星、官杀、驿马、日支与当前岁运引动/);
  assert.match(source, /考试上岸问题先看印星、食伤、官杀、文凭考试与当前岁运引动/);
});

test('八字单盘空问题会按所选方向补默认问题，不把内置任务塞进问题栏', () => {
  const result = baziCalculator.calculateBazi({
    year: 1990,
    month: 5,
    day: 15,
    timeIndex: 1,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const prompt = buildPromptFromConfig(
    '',
    {
      id: 'ai-career',
      prompt:
        '判断命局更适合守成、开拓、技术、管理还是经营，再说明当前阶段的赚钱方式、职业方向和风险点。',
      scene: 'career',
    },
    result,
    null,
    'career',
    { isCustomQuestion: false },
  );

  assert.match(prompt.user, /【问题】\n请先从事业方向、工作模式和当前风险开始分析。/);
  assert.match(
    prompt.user,
    /【任务】\n判断命局更适合守成、开拓、技术、管理还是经营，再说明当前阶段的赚钱方式、职业方向和风险点。/,
  );
  assert.doesNotMatch(prompt.user, /【问题】\n判断命局更适合守成、开拓、技术、管理还是经营/);
});

test('八字提示词写入年限选择后应补充年限解读规则', () => {
  const result = baziCalculator.calculateBazi({
    year: 1990,
    month: 5,
    day: 15,
    timeIndex: 1,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });
  const fortuneContext = buildFortuneSelectionContext(result, {
    scope: 'year',
    cycleIndex: 0,
  });

  assert.ok(fortuneContext);

  const prompt = buildPromptFromConfig(
    '今年适合换工作吗？',
    {
      id: 'ai-job-change',
      prompt:
        '结合当前大运、流年、流月与命局主线，判断现在更适合留在原岗位、试探新机会、直接跳槽还是先蓄力转方向，并说明平台、收入、成长空间和短期风险的取舍重点。',
      scene: 'job-change',
    },
    result,
    fortuneContext,
    'job-change',
    { isCustomQuestion: false },
  );

  assert.match(prompt.user, /【分析对象】/);
  assert.match(prompt.user, /【年限触发摘要】/);
  assert.match(prompt.user, /【主证】用户已选择年限运限/);
  assert.match(prompt.user, /【主证】流年干支与十神/);
  assert.match(prompt.user, /【辅证】上层岁运背景/);
  assert.match(prompt.user, /【限制】断事层级限制/);
  assert.doesNotMatch(prompt.user, /该流年包含的流月/);
  assert.doesNotMatch(prompt.user, /交下节/);
  assert.match(prompt.user, /【年限解读规则】/);
  assert.match(prompt.user, /当前已选流年：回答以该年年度触发为主，必须承接所属大运背景/);
  assert.match(prompt.user, /大运层：看十年阶段的环境、身份、资源、压力和机会方向/);
  assert.match(prompt.user, /流月层：看月份窗口、推进节奏、临门一脚和短期反复/);
  assert.match(prompt.user, /流日层：看当日执行、沟通、签约、出行、冲突和避险/);
  assert.ok(prompt.user.indexOf('【分析对象】') < prompt.user.indexOf('【年限触发摘要】'));
  assert.ok(prompt.user.indexOf('【年限触发摘要】') < prompt.user.indexOf('【年限解读规则】'));
  assert.ok(prompt.user.indexOf('【年限解读规则】') < prompt.user.indexOf('【分析对象优先级】'));
});

test('八字提示词未选择年限时不输出年限触发摘要', () => {
  const result = baziCalculator.calculateBazi({
    year: 1990,
    month: 5,
    day: 15,
    timeIndex: 1,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const prompt = buildPromptFromConfig(
    '请分析事业方向。',
    {
      id: 'ai-career',
      prompt:
        '判断命局更适合守成、开拓、技术、管理还是经营，再说明当前阶段的赚钱方式、职业方向和风险点。',
      scene: 'career',
    },
    result,
    null,
    'career',
    { isCustomQuestion: false },
  );

  assert.doesNotMatch(prompt.user, /【年限触发摘要】/);
  assert.doesNotMatch(prompt.user, /【年限解读规则】/);
});

test('合盘提示词不应误要求使用单盘核心用神句式', () => {
  const source = readFileSync(resolve('src/utils/ai/aiPrompts.ts'), 'utf8');
  const compatibilityBlock = source.match(/compatibility:\s*\[[\s\S]*?\]/)?.[0] || '';

  assert.doesNotMatch(compatibilityBlock, /核心用神：……，辅助喜用：……，主忌：……/);
});

test('八字提示词各场景默认保留规则与取用路径信息', () => {
  const source = readFileSync(resolve('src/utils/bazi/baziAnalysisFormatter.ts'), 'utf8');
  const includeRulesTrueCount = (source.match(/includeRules: true/g) || []).length;

  assert.ok(includeRulesTrueCount >= 5);
  assert.doesNotMatch(source, /includeRules: false/);
});

test('八字提示词会压缩大运信息并关闭重复的当前时令段落', () => {
  const source = readFileSync(resolve('src/utils/bazi/baziAnalysisFormatter.ts'), 'utf8');

  assert.match(source, /formatPromptLuckOverview/);
  assert.match(source, /当前大运:/);
  assert.match(source, /前运:/);
  assert.match(source, /后运:/);
  assert.doesNotMatch(source, /const cycles = baziResult\.luckInfo\.cycles\.slice\(0, 8\)/);
  assert.match(source, /includeCurrentTiming: false/);
  assert.match(source, /includeShenShaAnalysis: true/);
});

test('五行分布计算不再派生独立的旺衰与用忌结论', () => {
  const typesSource = readFileSync(resolve('src/utils/bazi/baziTypes.ts'), 'utf8');
  const calculatorSource = readFileSync(resolve('src/utils/bazi/WuxingCalculator.ts'), 'utf8');
  const resultPageSource = readFileSync(resolve('src/pages/ResultPage/index.tsx'), 'utf8');
  const wuxingStrengthDetailsBlock =
    typesSource.match(/export interface WuxingStrengthDetails \{[\s\S]*?\n\}/)?.[0] || '';

  assert.doesNotMatch(wuxingStrengthDetailsBlock, /yongShen:/);
  assert.doesNotMatch(wuxingStrengthDetailsBlock, /jiShen:/);
  assert.doesNotMatch(wuxingStrengthDetailsBlock, /suggestions:/);
  assert.doesNotMatch(wuxingStrengthDetailsBlock, /status: string;/);
  assert.doesNotMatch(calculatorSource, /_determineStrengthStatus/);
  assert.doesNotMatch(calculatorSource, /_determineYongShen/);
  assert.doesNotMatch(resultPageSource, /wuxingStrength\.status/);
});

test('分析结果结构不再保留重复字段', () => {
  const typesSource = readFileSync(resolve('src/utils/bazi/baziTypes.ts'), 'utf8');
  const pipelineSource = readFileSync(resolve('src/utils/bazi/baziAnalysisPipeline.ts'), 'utf8');
  const resultPageSource = readFileSync(resolve('src/pages/ResultPage/index.tsx'), 'utf8');
  const analysisResultBlock =
    typesSource.match(/export interface BaziAnalysisResult \{[\s\S]*?\n\}/)?.[0] || '';

  assert.doesNotMatch(analysisResultBlock, /^\s{2}dayMasterStatus:/m);
  assert.doesNotMatch(analysisResultBlock, /^\s{2}patternType:/m);
  assert.doesNotMatch(analysisResultBlock, /^\s{2}patternDescription:/m);
  assert.doesNotMatch(analysisResultBlock, /^\s{2}favorableElements:/m);
  assert.doesNotMatch(analysisResultBlock, /^\s{2}unfavorableElements:/m);
  assert.doesNotMatch(analysisResultBlock, /^\s{2}rootAnalysis:/m);
  assert.doesNotMatch(analysisResultBlock, /^\s{2}supportAnalysis:/m);
  assert.doesNotMatch(analysisResultBlock, /^\s{2}seasonalStatus:/m);
  assert.doesNotMatch(analysisResultBlock, /^\s{2}avoidGod:/m);
  assert.doesNotMatch(analysisResultBlock, /^\s{2}circulation:/m);
  assert.doesNotMatch(analysisResultBlock, /dayMasterStatus:/);
  assert.doesNotMatch(pipelineSource, /dayMasterStatus:\s*state\.dayMasterStrength\.status/);
  assert.doesNotMatch(pipelineSource, /dayMasterStatus:\s*state\.seasonalStatus/);
  assert.doesNotMatch(pipelineSource, /patternType:\s*state\.pattern\.type/);
  assert.doesNotMatch(pipelineSource, /patternDescription:\s*state\.pattern\.description/);
  assert.doesNotMatch(pipelineSource, /favorableElements:\s*state\.usefulGod\.favorableWuxing/);
  assert.doesNotMatch(pipelineSource, /unfavorableElements:\s*state\.usefulGod\.unfavorableWuxing/);
  assert.doesNotMatch(pipelineSource, /rootAnalysis:\s*state\.rootAnalysis/);
  assert.doesNotMatch(pipelineSource, /supportAnalysis:\s*state\.supportAnalysis/);
  assert.doesNotMatch(pipelineSource, /seasonalStatus:\s*\{/);
  assert.doesNotMatch(pipelineSource, /avoidGod:\s*state\.usefulGod\.avoid/);
  assert.doesNotMatch(pipelineSource, /circulation:\s*state\.usefulGod\.circulation/);
  assert.doesNotMatch(resultPageSource, /analysis\.avoidGod/);
  assert.doesNotMatch(resultPageSource, /analysis\.favorableElements/);
  assert.doesNotMatch(resultPageSource, /analysis\.unfavorableElements/);
});

test('日主旺衰只保留 status 字段且管道不暴露未使用阶段接口', () => {
  const typesSource = readFileSync(resolve('src/utils/bazi/baziTypes.ts'), 'utf8');
  const formatterSource = readFileSync(resolve('src/utils/bazi/baziAnalysisFormatter.ts'), 'utf8');
  const pipelineSource = readFileSync(resolve('src/utils/bazi/baziAnalysisPipeline.ts'), 'utf8');
  const usefulGodBlock =
    typesSource.match(/export interface UsefulGodAnalysis \{[\s\S]*?\n\}/)?.[0] || '';
  const dayMasterStrengthBlock =
    typesSource.match(/export interface DayMasterStrengthAnalysis \{[\s\S]*?\n\}/)?.[0] || '';

  assert.match(dayMasterStrengthBlock, /^\s{2}status:\s*string;/m);
  assert.doesNotMatch(dayMasterStrengthBlock, /^\s{2}strength:\s*string;/m);
  assert.doesNotMatch(usefulGodBlock, /^\s{2}circulation:\s*string;/m);
  assert.doesNotMatch(usefulGodBlock, /^\s{2}matchedRuleIds:/m);
  assert.match(formatterSource, /dayMasterStrength\.status/);
  assert.doesNotMatch(formatterSource, /dayMasterStrength\.strength/);
  assert.doesNotMatch(pipelineSource, /runStages\s*\(/);
});

test('八字提示词在病药结论与正式主忌冲突时应隐藏病药法片段', () => {
  const result = baziCalculator.calculateBazi({
    year: 1995,
    month: 5,
    day: 20,
    timeIndex: 5,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const prompt = buildPromptFromConfig(
    '请分析我的事业发展方向和风险。',
    { id: 'ai-career', prompt: '测试', scene: 'career' },
    result,
    null,
    'career',
    { isCustomQuestion: false },
  );

  assert.match(prompt.user, /主忌火/);
  assert.doesNotMatch(prompt.user, /【病药法】/);
});

test('八字提示词在病药结论与正式喜忌一致时仍可保留病药法片段', () => {
  const result = baziCalculator.calculateBazi({
    year: 1988,
    month: 1,
    day: 1,
    timeIndex: 0,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const prompt = buildPromptFromConfig(
    '请分析整体命局。',
    { id: 'ai-mingge-zonglun', prompt: '测试', scene: 'general' },
    result,
    null,
    'general',
    { isCustomQuestion: false },
  );

  assert.match(prompt.user, /喜忌五行: 火、水、土、金 \| 木/);
  assert.match(prompt.user, /【病药法】病:金过弱为病 \| 药:土/);
});

test('八字提示词中的经典格局片段不应再单列独立喜忌，避免与正式主线冲突', () => {
  const result = baziCalculator.calculateBazi({
    year: 1990,
    month: 1,
    day: 1,
    timeIndex: 3,
    gender: 'female',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const prompt = buildPromptFromConfig(
    '请分析整体命局。',
    { id: 'ai-mingge-zonglun', prompt: '测试', scene: 'general' },
    result,
    null,
    'general',
    { isCustomQuestion: false },
  );

  assert.match(prompt.user, /【经典格局】丙辛化水格\(极品\) \| 丙辛合化水/);
  assert.doesNotMatch(prompt.user, /【经典格局】[^\n]* \| 喜:/);
  assert.doesNotMatch(prompt.user, /【经典格局】[^\n]* 忌:/);
});

test('八字提示词中的经典格局片段应收起传统强断语，避免直接带偏在线 AI', () => {
  const result = baziCalculator.calculateBazi({
    year: 1988,
    month: 2,
    day: 7,
    timeIndex: 0,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const prompt = buildPromptFromConfig(
    '请分析整体命局。',
    { id: 'ai-mingge-zonglun', prompt: '测试', scene: 'general' },
    result,
    null,
    'general',
    { isCustomQuestion: false },
  );

  assert.match(prompt.user, /【经典格局】壬骑龙背格\(极品\)/);
  assert.match(prompt.user, /传统多视为层次较高，仍需结合原局成败与岁运同看/);
  assert.doesNotMatch(prompt.user, /主大富大贵/);
});

test('八字提示词资料包中的取用路径应保留证据轨迹，不直出内部成格强断语', () => {
  const result = baziCalculator.calculateBazi({
    year: 1988,
    month: 1,
    day: 7,
    timeIndex: 4,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const prompt = buildPromptFromConfig(
    '请分析整体命局。',
    { id: 'ai-mingge-zonglun', prompt: '测试', scene: 'general' },
    result,
    null,
    'general',
    { isCustomQuestion: false },
  );

  assert.match(prompt.user, /取用路径:/);
  assert.match(prompt.user, /调候优先:火 -> 水/);
  assert.match(prompt.user, /最终取用:火 -> 水 -> 土 -> 金/);
  assert.doesNotMatch(prompt.user, /成格层次:/);
  assert.doesNotMatch(prompt.user, /病药提示:/);
  assert.doesNotMatch(prompt.user, /命中规则:/);
  assert.doesNotMatch(prompt.user, /贱而且贫/);
});

test('八字提示词在通关结论落入正式主忌时应隐藏通关法片段', () => {
  const result = baziCalculator.calculateBazi({
    year: 1988,
    month: 1,
    day: 8,
    timeIndex: 0,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const prompt = buildPromptFromConfig(
    '请分析整体命局。',
    { id: 'ai-mingge-zonglun', prompt: '测试', scene: 'general' },
    result,
    null,
    'general',
    { isCustomQuestion: false },
  );

  assert.match(prompt.user, /主忌木\+次土/);
  assert.doesNotMatch(prompt.user, /【通关法】/);
});

test('八字提示词在通关结论不与正式主忌冲突时仍可保留通关法片段', () => {
  const result = baziCalculator.calculateBazi({
    year: 1988,
    month: 1,
    day: 3,
    timeIndex: 6,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const prompt = buildPromptFromConfig(
    '请分析整体命局。',
    { id: 'ai-mingge-zonglun', prompt: '测试', scene: 'general' },
    result,
    null,
    'general',
    { isCustomQuestion: false },
  );

  assert.match(prompt.user, /主忌土\+次水/);
  assert.match(prompt.user, /【通关法】水与火相战，以木通关调和/);
});

test('柱位出现桃花时即使全局神煞没有桃花也应生成桃花详解', () => {
  const result = baziCalculator.calculateBazi({
    year: 1988,
    month: 1,
    day: 1,
    timeIndex: 0,
    gender: 'female',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  assert.equal(result.shensha.global?.length ?? 0, 0);
  assert.ok(result.shensha.month.includes('桃花'));
  assert.ok(result.shensha.hour.includes('桃花'));

  const prompt = buildPromptFromConfig(
    '请分析我的婚恋。',
    { id: 'ai-marriage', prompt: '测试', scene: 'marriage' },
    result,
    null,
    'marriage',
    { isCustomQuestion: false },
  );

  assert.match(prompt.user, /【桃花详解】命盘见桃花：月柱、时柱/);
  assert.match(prompt.user, /月柱:墙外桃花/);
  assert.match(prompt.user, /时柱:墙外桃花/);
  assert.doesNotMatch(prompt.user, /【桃花详解】[\s\S]*利:/);
  assert.doesNotMatch(prompt.user, /【桃花详解】[\s\S]*忌:/);
  assert.match(prompt.user, /【桃花详解】[\s\S]*提示:/);
  assert.match(prompt.user, /【桃花详解】[\s\S]*留意:/);
});

test('八字提示词的空亡详解应按实际空亡柱位显隐并写明证据', () => {
  const withKongWang = baziCalculator.calculateBazi({
    year: 1988,
    month: 1,
    day: 1,
    timeIndex: 0,
    gender: 'female',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const withPrompt = buildPromptFromConfig(
    '请分析我的婚恋。',
    { id: 'ai-marriage', prompt: '测试', scene: 'marriage' },
    withKongWang,
    null,
    'marriage',
    { isCustomQuestion: false },
  );

  assert.match(withPrompt.user, /【空亡详解】命盘见空亡：月柱、时柱。/);

  const withoutKongWang = baziCalculator.calculateBazi({
    year: 1995,
    month: 5,
    day: 20,
    timeIndex: 5,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const withoutPrompt = buildPromptFromConfig(
    '请分析我的婚恋。',
    { id: 'ai-marriage', prompt: '测试', scene: 'marriage' },
    withoutKongWang,
    null,
    'marriage',
    { isCustomQuestion: false },
  );

  assert.doesNotMatch(withoutPrompt.user, /【空亡详解】/);
});

test('八字提示词的伏吟反吟段应按实际证据显隐', () => {
  const withFuxin = baziCalculator.calculateBazi({
    year: 1988,
    month: 1,
    day: 1,
    timeIndex: 0,
    gender: 'female',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const withPrompt = buildPromptFromConfig(
    '请分析我的婚恋。',
    { id: 'ai-marriage', prompt: '测试', scene: 'marriage' },
    withFuxin,
    null,
    'marriage',
    { isCustomQuestion: false },
  );

  assert.match(withPrompt.user, /【伏吟反吟】命盘见伏吟：/);
  assert.match(withPrompt.user, /年柱与日柱地支同为卯/);
  assert.match(withPrompt.user, /月柱与时柱地支同为子/);

  const withoutFuxin = baziCalculator.calculateBazi({
    year: 1988,
    month: 1,
    day: 7,
    timeIndex: 0,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const withoutPrompt = buildPromptFromConfig(
    '请分析我的婚恋。',
    { id: 'ai-marriage', prompt: '测试', scene: 'marriage' },
    withoutFuxin,
    null,
    'marriage',
    { isCustomQuestion: false },
  );

  assert.doesNotMatch(withoutPrompt.user, /【伏吟反吟】/);
});

test('八字提示词的刑冲合会破段应直接写入盘面证据', () => {
  const result = baziCalculator.calculateBazi({
    year: 1988,
    month: 1,
    day: 1,
    timeIndex: 0,
    gender: 'female',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const prompt = buildPromptFromConfig(
    '请分析我的婚恋。',
    { id: 'ai-marriage', prompt: '测试', scene: 'marriage' },
    result,
    null,
    'marriage',
    { isCustomQuestion: false },
  );

  assert.match(prompt.user, /【刑冲合会破】命盘见：/);
  assert.match(prompt.user, /年柱丁与月柱壬合/);
  assert.match(prompt.user, /年柱卯与月柱子刑/);
});

test('高风险旁证提示改为辅助研判框架，避免直接断语', () => {
  assert.match(generateAnalysisDimensionHints('fuxin'), /辅助观察/);
  assert.match(generateAnalysisDimensionHints('fuxin'), /不可脱离原局主线单独定吉凶/);

  assert.match(generateAnalysisDimensionHints('kongwang'), /只作旁证/);
  assert.match(generateAnalysisDimensionHints('kongwang'), /不可单凭空亡直接定吉凶/);
  assert.doesNotMatch(generateAnalysisDimensionHints('kongwang'), /祖上无缘/);

  assert.match(generateAnalysisDimensionHints('xingchong'), /不可见一项就直接下吉凶结论/);
  assert.doesNotMatch(generateAnalysisDimensionHints('xingchong'), /主变动拖延/);

  assert.match(generateAnalysisDimensionHints('lifespan'), /不得直接推断寿数/);
  assert.doesNotMatch(generateAnalysisDimensionHints('lifespan'), /晚年孤寂/);
});

test('婚姻子女父母兄弟专项提示改为传统框架加证据约束', () => {
  assert.match(generateMarriageMatchHints(), /先定关系主轴/);
  assert.doesNotMatch(generateMarriageMatchHints(), /配偶缘浅/);

  assert.match(generateCareerPartnershipHints(), /先看双方命局重心与合作分工是否顺手/);
  assert.match(generateCareerPartnershipHints(), /不可只凭表面投缘就判断适合长期合伙/);

  assert.match(generateFriendshipHints(), /先看双方气势是否投契/);
  assert.match(generateFriendshipHints(), /不可把一时投缘直接当成长期稳定/);

  assert.match(generateChildrenFateHints(), /不可只凭单一符号判断/);
  assert.match(generateChildrenFateHints(), /分开说明证据强弱/);
  assert.doesNotMatch(generateChildrenFateHints(), /子女缘薄/);

  assert.match(generateParentsAnalysisHints(), /神煞与刑冲只作旁证/);
  assert.match(generateParentsAnalysisHints(), /不可单凭一星定应/);
  assert.doesNotMatch(generateParentsAnalysisHints(), /祖上无缘/);

  assert.match(generateSiblingsAnalysisHints(), /避免只按比劫多少直接下结论/);
});

test('合盘提示词会按不同主题使用对应专项框架与任务口径', () => {
  const result1 = baziCalculator.calculateBazi({
    year: 1988,
    month: 1,
    day: 1,
    timeIndex: 0,
    gender: 'female',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });
  const result2 = baziCalculator.calculateBazi({
    year: 1990,
    month: 6,
    day: 15,
    timeIndex: 5,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const careerPrompt = getCompatibilityPrompt(
    '请分析我们适不适合长期合伙。',
    result1,
    result2,
    'career',
  );
  assert.match(careerPrompt.user, /【合盘分析框架】\n【合作合伙】/);
  assert.match(careerPrompt.user, /先判断合作主轴，再说明分工互补、利益风险、沟通成本和长期建议。/);
  assert.match(
    careerPrompt.user,
    /【输出要求】\n先直接回答【问题】，再展开最关键的 2 到 4 个重点。/,
  );
  assert.doesNotMatch(careerPrompt.user, /关系主基调/);

  const friendshipPrompt = getCompatibilityPrompt(
    '请分析我们两人的朋友相处模式。',
    result1,
    result2,
    'friendship',
  );
  assert.match(friendshipPrompt.user, /【合盘分析框架】\n【友情往来】/);
  assert.match(friendshipPrompt.user, /先判断相处主轴，再说明投缘点、边界风险、相处节奏和建议。/);
  assert.doesNotMatch(friendshipPrompt.user, /关系主基调/);

  const childrenPrompt = getCompatibilityPrompt(
    '请分析我们的子女缘。',
    result1,
    result2,
    'children',
  );
  assert.match(childrenPrompt.user, /【合盘分析框架】\n【子女缘分】/);
  assert.match(childrenPrompt.user, /先说明子女议题的主线，再分证据强弱展开重点。/);
  assert.match(
    childrenPrompt.user,
    /【输出要求】\n先直接回答【问题】，再展开最关键的 2 到 4 个重点，并分清证据强弱。/,
  );

  const parentsPrompt = getCompatibilityPrompt('请分析双方父母情况。', result1, result2, 'parents');
  assert.match(parentsPrompt.user, /【合盘分析框架】\n【父母研判】/);
  assert.match(
    parentsPrompt.user,
    /先说明父母议题主线，再分健康风险、照护压力、关系边界与建议展开。/,
  );
});

test('八字合盘自定义问题不应额外拼接框架任务书', () => {
  const result1 = baziCalculator.calculateBazi({
    year: 1988,
    month: 1,
    day: 1,
    timeIndex: 0,
    gender: 'female',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });
  const result2 = baziCalculator.calculateBazi({
    year: 1990,
    month: 6,
    day: 15,
    timeIndex: 5,
    gender: 'male',
    isLunar: false,
    isLeapMonth: false,
    useTrueSolarTime: false,
  });

  const prompt = getCompatibilityPrompt(
    '我们现在更适合继续推进合作，还是先保持距离？',
    result1,
    result2,
    'career',
    { isCustomQuestion: true },
  );

  assert.match(prompt.user, /【问题】\n我们现在更适合继续推进合作，还是先保持距离？/);
  assert.doesNotMatch(prompt.user, /【合盘分析框架】/);
  assert.doesNotMatch(prompt.user, /【任务】/);
  assert.doesNotMatch(prompt.user, /【输出要求】/);
});

test('格局结构不再保留未消费的成功标记字段', () => {
  const typesSource = readFileSync(resolve('src/utils/bazi/baziTypes.ts'), 'utf8');
  const patternSource = readFileSync(resolve('src/utils/bazi/baziPatternStrategy.ts'), 'utf8');
  const calculatorSource = readFileSync(resolve('src/utils/bazi/baziCalculator.ts'), 'utf8');
  const patternBlock =
    typesSource.match(/export interface PatternAnalysis \{[\s\S]*?\n\}/)?.[0] || '';

  assert.doesNotMatch(patternBlock, /success:/);
  assert.doesNotMatch(patternBlock, /successReason:/);
  assert.doesNotMatch(patternBlock, /type:/);
  assert.doesNotMatch(patternBlock, /description:/);
  assert.doesNotMatch(patternSource, /successReason/);
  assert.doesNotMatch(patternSource, /success:\s*true/);
  assert.doesNotMatch(patternSource, /type:\s*['"]/);
  assert.doesNotMatch(patternSource, /description\s*=/);
  assert.doesNotMatch(
    patternSource,
    /tenGod\s*===\s*['"]比肩['"]\s*\)\s*\{\s*return\s*\{\s*[^}]*success:\s*true/,
  );
  assert.doesNotMatch(calculatorSource, /successReason:/);
  assert.doesNotMatch(calculatorSource, /success:\s*false/);
  assert.doesNotMatch(calculatorSource, /mingGe:\s*\{\s*pattern:\s*'未知',\s*type:/);
});
