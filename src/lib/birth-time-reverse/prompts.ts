import { BIRTH_TIME_OPTIONS } from '../birth-time';
import { formatPromptCurrentTime } from '../prompt-time';
import {
  buildBaziQuestionGuidanceSection,
  resolveBaziQuestionScene,
} from '../../utils/ai/baziQuestionScene';
import {
  REVERSE_BIRTH_TIME_SELECT_FIELDS,
  REVERSE_BIRTH_TIME_TEXT_FIELDS,
  type ReverseBirthTimeFormData,
} from './fields';
import type { ThreePillarsProfile } from './three-pillars';

function isOmittedSelectValue(value: string) {
  return (
    value === '未选择' ||
    value === '暂时说不清' ||
    value === '说不清或较复杂' ||
    value === '说不清或不方便回答' ||
    !value.trim()
  );
}

function buildSelectSummary(formData: ReverseBirthTimeFormData) {
  return REVERSE_BIRTH_TIME_SELECT_FIELDS.map((field) => {
    const value = formData[field.id];
    if (isOmittedSelectValue(value)) {
      return '';
    }
    return `${field.label}：${value}`;
  })
    .filter(Boolean)
    .join('\n');
}

function buildTextSummary(formData: ReverseBirthTimeFormData) {
  return REVERSE_BIRTH_TIME_TEXT_FIELDS.map((field) => {
    const value = formData[field.id].trim();
    if (!value) {
      return '';
    }
    return `${field.label}：${value}`;
  })
    .filter(Boolean)
    .join('\n');
}

function buildBirthTimeOptionText() {
  return BIRTH_TIME_OPTIONS.map((item) => `${item.label}（${item.range}）`).join('、');
}

export function buildUnknownTimeBaziPrompt(
  profile: ThreePillarsProfile,
  question: string,
  questionScene?: string,
  options: { isCustomQuestion?: boolean } = {},
) {
  const normalizedQuestion = question.trim() || '请先基于三柱做整体分析。';
  const scene = resolveBaziQuestionScene(questionScene);
  const isCustomQuestion = Boolean(options.isCustomQuestion);

  return [
    '你是资深八字命理师，擅长在出生时辰未知的情况下，先基于三柱做保守、清晰的初步判断。',
    '【要求】',
    '- 只基于提供的三柱信息与问题作答。',
    '- 不得擅自假定时柱，也不要把时柱当成已知事实。',
    '- 三柱资料里没有直接写出的额外盘面事实，不得自行补算、脑补或假定。',
    '- 明确区分哪些结论已经可以判断，哪些地方因为时辰未知还不能定论。',
    '- 如果需要继续缩小时辰范围，可以提出少量最值得补充的线索。',
    '',
    `【当前时间】\n${formatPromptCurrentTime()}`,
    `【排盘信息】\n${profile.promptText}`,
    `【问题】\n${normalizedQuestion}`,
    ...(isCustomQuestion
      ? []
      : [`【问题研判框架】\n${buildBaziQuestionGuidanceSection(scene, false)}`]),
    ...(isCustomQuestion
      ? []
      : [
          '【任务】\n请先基于三柱做初步分析，再指出哪些判断需要通过反推时辰继续确认。',
          '【输出要求】\n先直接回答【问题】，再分成“确定部分”“待确认部分”“建议补充线索”三段；每段都尽量说明对应依据、触发条件与建议；证据不足时直接说明，用简体中文，不写空话。',
        ]),
  ].join('\n');
}

export function buildReverseBirthTimePrompt(params: {
  profile: ThreePillarsProfile;
  formData: ReverseBirthTimeFormData;
}) {
  const selectSummary = buildSelectSummary(params.formData);
  const textSummary = buildTextSummary(params.formData);
  const hasClues = Boolean(selectSummary || textSummary);
  const clueStatusLine = hasClues
    ? '- 先阅读我已经补充的信息，再根据信息设计第一轮问题。'
    : '- 当前还没有补充额外线索，请先仅基于三柱信息设计第一轮问题。';
  const clueTaskLine = hasClues
    ? '请先阅读三柱信息和我已补充的资料，先提炼出当前最有区分度的线索，再设计第一轮问题，帮助后续逐步排除不符合的时辰。'
    : '请先阅读三柱信息，先指出当前最需要补充的区分线索，再设计第一轮问题，帮助后续逐步排除不符合的时辰。';

  return [
    '你是资深八字反推时辰助手，擅长在只有三柱的前提下，通过连续追问逐步缩小最可能的出生时辰范围。',
    '【要求】',
    '- 只基于提供的三柱、已补充资料、后续回答和常识性人生线索推进判断。',
    '- 不要直接假定时柱，不要把任何一个候选时辰提前当成结论。',
    '- 资料里没有直接写出的额外盘面事实，不得自行补算、脑补或假定。',
    clueStatusLine,
    '- 先向我提问，再根据我的回答逐轮缩小时辰范围。',
    '- 每轮问题必须具体、可回忆、可验证，避免空泛提问。',
    '- 每个问题都要直接给出几个清晰选项，让我只回复选项字母、编号或对应文本。',
    '- 优先使用单选题形式，只有确实必要时才使用多选题。',
    '- 每轮优先问最有区分度的问题，控制在 4 到 6 个问题。',
    '- 如果我已经提供了可直接用于排除某些时辰的线索，你要先指出这些线索会影响哪些候选时辰。',
    '- 如果信息仍不足，要明确告诉我下一轮还需要补什么。',
    '- 最终需要给出最可能的 3 个时辰候选，并说明各自依据与置信度。',
    '',
    `【当前时间】\n${formatPromptCurrentTime()}`,
    `【已知出生信息】\n${params.profile.promptText}`,
    `【候选时辰范围】\n${buildBirthTimeOptionText()}`,
    ...(selectSummary ? [`【已知线索】\n${selectSummary}`] : []),
    ...(textSummary ? [`【补充线索】\n${textSummary}`] : []),
    '【问题】\n我想根据三柱反推出更可能的出生时辰，请你先向我提问。',
    `【任务】\n${clueTaskLine}`,
    '【输出要求】\n先输出“已知线索初判”，只点出当前最有区分度的 2 到 4 条线索，并说明它们更可能影响哪些候选时辰；再输出“第一轮问题”；列出 4 到 6 个问题；每个问题都写成带选项的题目，选项建议用 A/B/C/D 或 1/2/3/4 标注；让我只回复选项，不需要展开长叙述；不要解释提问理由；本轮先不要直接下最终结论；用简体中文。',
  ].join('\n');
}
