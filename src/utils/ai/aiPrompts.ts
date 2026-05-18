/**
 * 八字 AI 提示词模块
 *
 * 前端调用链：
 *   单盘 → buildPromptFromConfig()
 *   合盘 → getCompatibilityPrompt()
 *
 * 两者均通过 prompt-engine.ts 统一导出给 ResultPage.tsx
 */

import type { BaziChartResult } from '../bazi/baziTypes';
import { formatBaziForPrompt, type PromptChartScene } from '../bazi/baziAnalysisFormatter';
import type { FortuneSelectionContext } from '../bazi/fortuneSelection';
import {
  getBaziCompatibilityDefaultQuestion,
  getBaziDefaultQuestion,
} from '../../lib/prompt-default-questions';
import { formatPromptCurrentTime } from '../../lib/prompt-time';
import {
  generateEnhancedAnalysisSection,
  generateCompatibilityEnhancedSection,
} from '../bazi/baziPromptEnhancement';
import {
  buildBaziQuestionGuidanceSection,
  resolveBaziQuestionScene,
  type BaziQuestionScene,
} from './baziQuestionScene';

// ─── 类型 ──────────────────────────────────────────

export interface AIPromptOption {
  id: string;
  prompt: string;
  scene?: string;
}

export { BAZI_QUESTION_SCENES, buildBaziQuestionGuidanceSection, resolveBaziQuestionScene };
export type { BaziQuestionScene };

// ─── 系统提示词 ────────────────────────────────────

const BASE_SYSTEM_ROLE = '你是资深八字命理师，熟悉《渊海子平》《滴天髓》《三命通会》《穷通宝鉴》。';

const BASE_SYSTEM_RULES = [
  '只基于提供的命盘、岁运和问题作答',
  '资料包里没有直接写出的额外盘面事实，不得自行补算、脑补或假定',
  '判断喜忌：先旺衰月令→格局调候→取用路径十神→神煞；普通格局按扶抑，专旺从格按顺势；神煞不得单独推翻主体判断',
  '资料包中标注为“传统旁证”的内容只作辅助验证，不得盖过核心判断依据',
  '说清核心用神、辅助喜用与主忌，结论与推理不一致时必须指出冲突点',
  '优先使用命盘中的核心判断依据组织推理，不要平均复述四柱资料',
  '信息不足时说明证据不足，不得强行给确定结论',
  '用通俗中文，不写套话，不复述无关背景',
  '用神优先级：扶抑法为基础，病药法找突出问题，通关法调两神相战，调候法调寒热燥湿，专旺从势法顺势',
];

const COMPAT_SYSTEM_RULES = [
  '只基于提供的双方命盘、岁运和问题作答',
  '资料包里没有直接写出的额外盘面事实，不得自行补算、脑补或假定',
  '双盘先分别判断旺衰、格局、调候和用忌，再汇总双方互动主线、互补点、冲突点、现实压力和建议',
  '判断喜忌仍按旺衰月令→格局调候→取用路径十神→神煞；普通格局按扶抑，专旺从格按顺势；神煞不得单独推翻主体判断',
  '资料包中标注为“传统旁证”的内容只作辅助验证，不得盖过核心判断依据',
  '双盘分析先看命局主线、喜忌互补与岁运节奏，再看十神、宫位、合冲刑害和神煞旁证',
  '优先提炼双方互动主线，不要平均复述两张命盘资料',
  '关系结论若与双方命局主线或岁运节奏不一致，必须指出冲突点',
  '信息不足时说明证据不足，不得强行给确定结论',
  '用通俗中文，不写套话，不复述无关背景',
];

function buildSystemText(rules: readonly string[] = BASE_SYSTEM_RULES): string {
  const normalizedRules = Array.from(new Set(rules.map((line) => line.trim()).filter(Boolean)));
  return [BASE_SYSTEM_ROLE, '要求：', ...normalizedRules.map((line) => `- ${line}`)].join('\n');
}

/** 单盘系统提示词 */
const SYSTEM_PROMPT = buildSystemText();
/** 合盘系统提示词 */
const COMPATIBILITY_SYSTEM_PROMPT = buildSystemText(COMPAT_SYSTEM_RULES);

// ─── 工具函数 ──────────────────────────────────────

function buildPromptSection(title: string, content: string): string {
  return `【${title}】\n${content}`;
}

function joinPromptSections(sections: Array<string | null | undefined>): string {
  return sections.filter(Boolean).join('\n\n');
}

function resolvePromptScene(promptId: string): PromptChartScene {
  // 当前快捷按钮均已走 general 场景格式化，保留 fortune 分支以备将来扩展
  if (
    promptId.startsWith('ai-fortune-') ||
    promptId === 'ai-current-luck' ||
    promptId === 'ai-this-year'
  ) {
    return 'fortune';
  }
  return 'general';
}

function formatFortuneSelectionSection(ctx: FortuneSelectionContext | null | undefined): string {
  if (!ctx) return '';
  const { promptPayload } = ctx;
  const lines = [promptPayload.scopeLabel, ...promptPayload.summaryLines];
  if (promptPayload.breakdownTitle && promptPayload.breakdownLines?.length) {
    lines.push(promptPayload.breakdownTitle);
    lines.push(...promptPayload.breakdownLines.map((line, i) => `${i + 1}. ${line}`));
  }
  return lines.join('\n');
}

function buildFortunePromptAddon(promptId: string, ctx: FortuneSelectionContext | null): string {
  if (!ctx) return '';
  if (promptId === 'ai-fortune-detail') {
    if (ctx.scope === 'dayun') return '按逐年列表依次分析这一步大运，先总后分。';
    if (ctx.scope === 'year') return '按流月列表依次分析这一年，先总后分。';
    if (ctx.scope === 'month') return '按流日列表依次分析这个流月，先总后分。';
    return '聚焦这个流日的主题、机会风险和建议。';
  }
  if (promptId === 'ai-fortune-overview') return '聚焦整体节奏、机会、风险和应对。';
  return '';
}

// ─── 快捷按钮配置 ──────────────────────────────────

export const BAZI_AI_PROMPTS = {
  /** 单盘快捷选项 — 仅保留前端 baziSingleShortcutActions 实际引用的 promptId */
  single: [
    {
      id: 'ai-mingge-zonglun',
      prompt:
        '判断日主旺衰、格局层次、用神喜忌，抓2到3个最有辨识度的影响，讲清命局的病与药，并给出调整建议。',
      scene: 'general',
    },
    {
      id: 'ai-recent',
      prompt:
        '结合当前大运、流年、流月与命局主线，判断现阶段最该优先推进的方向、适合主动出手的事项、需要暂缓的风险和更稳妥的行动节奏。',
      scene: 'recent',
    },
    {
      id: 'ai-career',
      prompt:
        '判断命局更适合守成、开拓、技术、管理还是经营，再说明当前阶段的赚钱方式、职业方向和风险点。',
      scene: 'career',
    },
    {
      id: 'ai-job-change',
      prompt:
        '结合当前大运、流年、流月与命局主线，判断现在更适合留在原岗位、试探新机会、直接跳槽还是先蓄力转方向，并说明平台、收入、成长空间和短期风险的取舍重点。',
      scene: 'job-change',
    },
    {
      id: 'ai-startup-partnership',
      prompt:
        '结合当前大运、流年、流月与命局主线，判断现在更适合创业、找人合作、小范围试跑、继续上班积累还是暂缓，并说明方向选择、资源来源、合作分工、现金流压力和现实风险。',
      scene: 'startup-partnership',
    },
    {
      id: 'ai-investment-partnership',
      prompt:
        '围绕财星、官杀、印星、食伤、比劫与当前岁运引动，判断现在更适合独立投资、合作求财、继续观望还是先守财，并说明资金压力、收益模式、合作分工、风险边界和现实代价。',
      scene: 'investment-partnership',
    },
    {
      id: 'ai-wealth-timing',
      prompt: '判断财运应期，说明财更容易在哪些阶段、年份或环境里起来，再指出机会点和破财情形。',
      scene: 'wealth',
    },
    {
      id: 'ai-marriage',
      prompt:
        '围绕配偶星、夫妻宫和相处模式，判断感情优势、隐患与关系节奏，再说明适合的对象、容易推进的阶段和经营建议。',
      scene: 'marriage',
    },
    {
      id: 'ai-relationship-push',
      prompt:
        '围绕配偶星、夫妻宫、桃花与当前岁运引动，判断这段关系现在更适合主动推进、稳定经营、放慢观察还是及时止损，并说明投入价值、风险边界和接下来的判断标准。',
      scene: 'relationship-push',
    },
    {
      id: 'ai-relationship-decision',
      prompt:
        '围绕配偶星、夫妻宫、桃花与当前岁运引动，判断这段关系现在更适合继续投入、放慢观察、重新建立边界还是及时止损，并说明继续投入的条件、止损信号、现实代价和接下来的判断标准。',
      scene: 'relationship-decision',
    },
    {
      id: 'ai-reconciliation-decision',
      prompt:
        '围绕配偶星、夫妻宫、桃花、旧缘信号与当前岁运引动，判断这段旧关系现在更适合争取复合、保持观察、先立边界还是及时放下，并说明复合条件、现实阻力、风险信号和接下来的判断标准。',
      scene: 'reconciliation-decision',
    },
    {
      id: 'ai-children-fate',
      prompt:
        '判断子女缘分深浅、子女性格倾向和教育相处方式，说明更该关注生育时机、子女互动还是教育重点。',
      scene: 'children',
    },
    {
      id: 'ai-health',
      prompt:
        '判断最需要注意的身体倾向与生活习惯问题，说明风险主要落在哪些系统或体质失衡上，再给出饮食、作息、运动建议。',
      scene: 'health',
    },
    {
      id: 'ai-family',
      prompt:
        '围绕父母、兄弟姐妹、家庭责任和亲缘边界做整体分析，说明六亲对命局的助力、牵制、压力来源和更稳妥的相处方式。',
      scene: 'parents',
    },
    {
      id: 'ai-home',
      prompt:
        '围绕原生家庭、安全感来源、家庭边界、居住秩序和现实责任分工做整体分析，说明哪些地方在支持你，哪些地方在消耗你，并给出更稳妥的调整建议。',
      scene: 'family',
    },
    {
      id: 'ai-home-move',
      prompt:
        '围绕搬家、换城市、买房置业与居住调整做整体分析，判断现在更适合行动还是继续观望，并说明居住稳定性、资金压力、家庭牵动、行动时机和风险控制重点。',
      scene: 'home-move',
    },
    {
      id: 'ai-settle-relocate',
      prompt:
        '围绕长期定居、换城市发展与居住根基做整体分析，判断现在更适合留在当前城市、换城发展、两地过渡还是暂缓决定，并说明稳定性、事业机会、家庭牵动、成本压力和行动顺序。',
      scene: 'settle-relocate',
    },
    {
      id: 'ai-social',
      prompt:
        '围绕社交风格、合作关系、贵人来源、沟通短板和人脉策略做整体分析，说明你更适合怎样筛选关系和使用资源。',
      scene: 'social',
    },
    {
      id: 'ai-emotion',
      prompt:
        '围绕情绪触发点、压力来源、安全感需求、内耗模式和修复方式做整体分析，说明当前最值得先调整的状态与节奏。',
      scene: 'emotion',
    },
    {
      id: 'ai-study',
      prompt:
        '围绕印星、食伤、官杀和学业文凭做整体分析，说明学习吸收力、表达输出、考试压力、进修潜力和最适合的提升方式。',
      scene: 'study',
    },
    {
      id: 'ai-study-advance',
      prompt:
        '围绕考证、读研进修、跨领域学习与当前岁运引动做整体分析，判断现在更适合冲刺、长期准备、换赛道学习还是暂缓，并说明投入产出、执行压力和现实代价。',
      scene: 'study-advance',
    },
    {
      id: 'ai-exam-landing',
      prompt:
        '围绕印星、食伤、官杀、文凭考试与当前岁运引动做整体分析，判断这次考试、面试或申请更适合冲刺上岸、稳住发挥、调整目标还是暂缓重来，并说明发挥短板、竞争压力、准备重点和现实风险。',
      scene: 'exam-landing',
    },
    {
      id: 'ai-growth',
      prompt:
        '围绕命局病药、性格卡点、长期成长课题、反复受阻模式和现实突破方向做整体分析，说明最值得优先调整的主线。',
      scene: 'growth',
    },
    {
      id: 'ai-talent',
      prompt:
        '围绕核心天赋、学习吸收、表达输出、组织执行和资源整合能力做整体分析，说明哪些优势最值得长期放大以及如何落地。',
      scene: 'talent',
    },
  ] as AIPromptOption[],
  /** 合盘快捷选项 — 仅保留前端 baziCompatibilityShortcutActions 实际引用的 promptId */
  combined: [
    {
      id: 'ai-compat-marriage',
      prompt:
        '判断两人的婚恋匹配度是互补、互耗还是强吸引强摩擦，再说明相处优势、冲突来源、长期走向和相处建议。',
      scene: 'marriage',
    },
    {
      id: 'ai-compat-career',
      prompt:
        '判断合作是否顺手、谁主导、谁执行、谁控风险，再说明最强互补点、最大利益冲突点和是否适合长期合伙。',
      scene: 'career',
    },
    {
      id: 'ai-compat-friendship',
      prompt:
        '判断两人的相处模式是容易投缘、容易互补还是容易暗中较劲，再说明适合的距离和相处提醒。',
      scene: 'general',
    },
    {
      id: 'ai-compat-children',
      prompt:
        '从双方食伤星、子女宫和桃花配合角度，判断子女缘分的深浅、子女性格倾向和亲子相处重点。',
      scene: 'children',
    },
    {
      id: 'ai-compat-parents',
      prompt:
        '从双方父母星、父母宫和当前岁运切入，判断双方父母健康状况、需要关注的风险方向和赡养建议。',
      scene: 'parents',
    },
    {
      id: 'ai-compat-siblings',
      prompt:
        '从双方比劫关系、命宫和相处模式切入，判断两人之间兄弟朋友关系的亲疏、助力与牵制、相处建议。',
      scene: 'general',
    },
  ] as AIPromptOption[],
};

// ─── 单盘提示词构建（主入口） ──────────────────────

type SinglePromptConfig = (typeof BAZI_AI_PROMPTS.single)[number];

/**
 * 构建单盘八字提示词
 *
 * 主路径：根据 selectedOption 匹配 BAZI_AI_PROMPTS.single 配置，
 *         注入增强分析（病药法/通关法/经典格局/神煞详解等）
 * fallback：配置匹配不到时走基础拼装
 */
export function buildPromptFromConfig(
  questionText: string,
  selectedOption: AIPromptOption,
  chartResult: BaziChartResult | null,
  fortuneSelectionContext: FortuneSelectionContext | null = null,
  questionScene?: string,
  options: { isCustomQuestion?: boolean } = {},
): { system: string; user: string } {
  const isCustomQuestion = Boolean(options.isCustomQuestion);
  const promptConfig: SinglePromptConfig | null = chartResult?.pillars
    ? (BAZI_AI_PROMPTS.single.find((c) => c.id === selectedOption.id) ?? null)
    : null;
  const scene = resolveBaziQuestionScene(questionScene || promptConfig?.scene);
  const normalizedQuestion =
    questionText.trim() || getBaziDefaultQuestion(scene, { isCustomQuestion });

  // ── 主路径 ──
  if (promptConfig) {
    const chartData = chartResult
      ? formatBaziForPrompt(chartResult, selectedOption, resolvePromptScene(promptConfig.id))
      : '无法获取命盘数据。';
    const fortuneSection = formatFortuneSelectionSection(fortuneSelectionContext);
    const fortuneAddon = buildFortunePromptAddon(promptConfig.id, fortuneSelectionContext);
    const task = [promptConfig.prompt, fortuneAddon].filter(Boolean).join(' ');

    // 增强分析片段
    let enhancedSection = '';
    if (chartResult && !isCustomQuestion) {
      enhancedSection = generateEnhancedAnalysisSection(chartResult, scene);
    }

    return {
      system: SYSTEM_PROMPT,
      user: joinPromptSections([
        buildPromptSection('当前时间', formatPromptCurrentTime()),
        buildPromptSection('排盘信息', [chartData, enhancedSection].filter(Boolean).join('\n')),
        fortuneSection ? buildPromptSection('分析对象', fortuneSection) : '',
        buildPromptSection('问题', normalizedQuestion),
        isCustomQuestion
          ? ''
          : buildPromptSection(
              '问题研判框架',
              buildBaziQuestionGuidanceSection(scene, Boolean(fortuneSection)),
            ),
        isCustomQuestion ? '' : buildPromptSection('任务', task || '请直接判断重点。'),
        isCustomQuestion
          ? ''
          : buildPromptSection(
              '输出要求',
              '先直接回答【问题】，再展开最关键的 2 到 4 个重点；每个重点都要写明命盘依据、触发条件与建议；证据不足处单独说明。',
            ),
      ]),
    };
  }

  // ── fallback ──
  const chartData = chartResult?.pillars
    ? formatBaziForPrompt(chartResult, selectedOption, 'general')
    : '命盘数据格式不支持。';

  return {
    system: SYSTEM_PROMPT,
    user: joinPromptSections([
      buildPromptSection('当前时间', formatPromptCurrentTime()),
      buildPromptSection('排盘信息', chartData),
      buildPromptSection('问题', normalizedQuestion),
      isCustomQuestion
        ? ''
        : buildPromptSection('问题研判框架', buildBaziQuestionGuidanceSection(scene, false)),
      isCustomQuestion ? '' : buildPromptSection('任务', '请直接判断重点。'),
      isCustomQuestion
        ? ''
        : buildPromptSection(
            '输出要求',
            '先直接回答【问题】，再补关键依据、触发条件与建议；证据不足处单独说明。',
          ),
    ]),
  };
}

// ─── 合盘提示词构建（主入口） ──────────────────────

export type CompatType = 'marriage' | 'career' | 'friendship' | 'children' | 'parents' | 'siblings';

function getCompatibilityTask(compatType?: CompatType): string {
  if (compatType === 'career') {
    return '请先判断合作主轴，再说明分工互补、利益风险、沟通成本和长期建议。';
  }
  if (compatType === 'friendship') {
    return '请先判断相处主轴，再说明投缘点、边界风险、相处节奏和建议。';
  }
  if (compatType === 'children') {
    return '请先说明子女议题的主线，再分证据强弱展开重点。';
  }
  if (compatType === 'parents') {
    return '请先说明父母议题主线，再分健康风险、照护压力、关系边界与建议展开。';
  }
  if (compatType === 'siblings') {
    return '请先说明兄弟朋友议题主线，再分亲疏互动、现实助力牵制与边界建议展开。';
  }
  return '请先判断关系主轴，再说明相处模式、互补点、冲突点和建议。';
}

function getCompatibilityOutputRequirement(compatType?: CompatType): string {
  if (compatType === 'children' || compatType === 'parents' || compatType === 'siblings') {
    return '先直接回答【问题】，再展开最关键的 2 到 4 个重点，并分清证据强弱。';
  }
  return '先直接回答【问题】，再展开最关键的 2 到 4 个重点。';
}

/**
 * 构建合盘八字提示词
 *
 * 接受原始 BaziChartResult，内部完成格式化 + 增强分析注入
 */
export function getCompatibilityPrompt(
  questionText: string,
  baziResult1: BaziChartResult | null,
  baziResult2: BaziChartResult | null,
  compatType?: CompatType,
  options: { isCustomQuestion?: boolean } = {},
): { system: string; user: string } {
  const isCustomQuestion = Boolean(options.isCustomQuestion);
  const data1 = baziResult1
    ? formatBaziForPrompt(baziResult1, null, 'compatibility')
    : '无法获取第一人命盘数据。';
  const data2 = baziResult2
    ? formatBaziForPrompt(baziResult2, null, 'compatibility')
    : '无法获取第二人命盘数据。';

  const enhancedSection = compatType ? generateCompatibilityEnhancedSection(compatType) : '';

  return {
    system: COMPATIBILITY_SYSTEM_PROMPT,
    user: joinPromptSections([
      buildPromptSection('当前时间', formatPromptCurrentTime()),
      buildPromptSection('第一人排盘信息', data1),
      buildPromptSection('第二人排盘信息', data2),
      !isCustomQuestion && enhancedSection
        ? buildPromptSection('合盘分析框架', enhancedSection)
        : '',
      buildPromptSection(
        '问题',
        questionText.trim() || getBaziCompatibilityDefaultQuestion(compatType),
      ),
      isCustomQuestion ? '' : buildPromptSection('任务', getCompatibilityTask(compatType)),
      isCustomQuestion
        ? ''
        : buildPromptSection(
            '输出要求',
            `${getCompatibilityOutputRequirement(compatType)} 每个重点都要写明双方盘面依据、触发条件与现实建议；证据不足处单独说明。`,
          ),
    ]),
  };
}
