import type {
  AlmanacData,
  AstrolabeData,
  DivinationData,
  LenormandData,
  LiurenData,
  LiuyaoData,
  MeihuaData,
  QimenData,
  SsgwData,
  SupplementaryInfo,
  TarotData,
  XiaoliurenData,
} from '../../../types/divination';
import { LunarUtil } from '../../../utils/lunar';
import { getDivinationTime } from '../../../utils/timeManager';
import { resolveSsgwStoryContent } from '../ssgw-content';
import { formatTarotCardLabel, getTarotFocusCards } from '../tarot-focus';
import {
  createQimenPriorityPalaces,
  createQimenQuestionHints,
} from '../../../utils/qimen-guidance';
import type { DivinationMethodId } from '../config';

function resolveDivinationTimestamp(data?: DivinationData): number | null {
  if (!data || typeof data.timestamp !== 'number' || !Number.isFinite(data.timestamp)) {
    return null;
  }

  return data.timestamp;
}

export function buildTimeInfoText(data?: DivinationData) {
  const timestamp = resolveDivinationTimestamp(data);
  const timeInfo =
    timestamp === null
      ? getDivinationTime().timeInfo
      : getDivinationTime(new Date(timestamp)).timeInfo;
  const display = LunarUtil.formatTimeDisplay(timeInfo);
  return [display.solar, display.lunar, display.ganzhi, `节气：${timeInfo.jieQi}`].join('\n');
}

export function buildSolarTimeInfoText(data?: DivinationData) {
  const timestamp = resolveDivinationTimestamp(data);
  const timeInfo =
    timestamp === null
      ? getDivinationTime().timeInfo
      : getDivinationTime(new Date(timestamp)).timeInfo;
  const display = LunarUtil.formatTimeDisplay(timeInfo);
  return display.solar;
}

export function formatGanzhi(ganzhi?: { year: string; month: string; day: string; hour: string }) {
  if (!ganzhi) {
    return '干支：未知';
  }

  return `干支：${ganzhi.year}年 ${ganzhi.month}月 ${ganzhi.day}日 ${ganzhi.hour}时`;
}

export function formatSupplementaryInfoSection(
  method: Exclude<DivinationMethodId, 'random'>,
  supplementaryInfo?: SupplementaryInfo,
) {
  if (!supplementaryInfo) {
    return '';
  }

  const lines: string[] = [];
  if (supplementaryInfo.gender) {
    lines.push(`性别：${supplementaryInfo.gender}`);
  }
  if (
    typeof supplementaryInfo.birthYear === 'number' &&
    Number.isFinite(supplementaryInfo.birthYear)
  ) {
    lines.push(`出生年份：${supplementaryInfo.birthYear}`);
  }
  if (method === 'meihua' && supplementaryInfo.meihuaSettings?.method) {
    const methodLabelMap: Record<string, string> = {
      time: '时间起卦',
      number: '数字起卦',
      random: '随机起卦',
      external: '外应起卦',
    };
    lines.push(
      `起卦方式：${methodLabelMap[supplementaryInfo.meihuaSettings.method] || supplementaryInfo.meihuaSettings.method}`,
    );
  }
  if (method === 'meihua' && typeof supplementaryInfo.meihuaSettings?.number === 'number') {
    lines.push(`起卦数字：${supplementaryInfo.meihuaSettings.number}`);
  }
  if (supplementaryInfo.userSupplement?.trim()) {
    lines.push(
      method === 'almanac'
        ? `择日补充：${supplementaryInfo.userSupplement.trim()}`
        : `用户补充：${supplementaryInfo.userSupplement.trim()}`,
    );
  }

  if (lines.length === 0) {
    return '';
  }

  return lines.join('\n');
}

export function buildSection(title: string, content: string) {
  const body = content.trim();
  if (!body) {
    return '';
  }

  return `${title}\n${body}`;
}

function getMeihuaMethodLabel(
  calculation?: Pick<MeihuaData['calculation'], 'method' | 'methodKey'> | null,
) {
  if (!calculation) {
    return '未知';
  }

  const methodLabelMap: Record<string, string> = {
    time: '年月日时起卦法',
    number: '数字起卦法',
    random: '随机起卦法',
    external: '外应起卦法',
  };

  if (calculation.method?.trim()) {
    return methodLabelMap[calculation.method] || calculation.method;
  }

  return calculation.methodKey
    ? methodLabelMap[calculation.methodKey] || calculation.methodKey
    : '未知';
}

function formatLiuyaoYaoBrief(item: LiuyaoData['yaosDetail'][number]) {
  return `第${item.position}爻${item.sixRelative}${item.najiaDizhi}${item.wuxing}`;
}

function formatHiddenSpirit(item: NonNullable<LiuyaoData['hiddenSpirits']>[number]) {
  return `${item.sixRelative}伏第${item.position}爻${item.najiaDizhi}${item.wuxing}${item.isVoid ? '（空）' : ''}，伏于${item.underYao.sixRelative}${item.underYao.najiaDizhi}${item.underYao.wuxing}下`;
}

function normalizePromptCompareText(text: string) {
  return text.replace(/[：:，,；;。、\s]/g, '');
}

function createLiuyaoUsefulGodHints(
  question: string,
  data: LiuyaoData,
  supplementaryInfo?: SupplementaryInfo,
) {
  const text = question.trim();
  const hints: string[] = [];
  const gender = supplementaryInfo?.gender;

  const addHint = (label: string, relative: string, note: string) => {
    const matchedYaos = data.yaosDetail.filter((item) => item.sixRelative === relative);
    const yaoText = matchedYaos.length
      ? matchedYaos.map(formatLiuyaoYaoBrief).join('、')
      : '本卦未见';
    hints.push(`${label}：以${relative}为用神候选，${note}；盘中${yaoText}`);
  };

  if (/感情|婚姻|恋爱|复合|对象|伴侣|桃花|关系/.test(text)) {
    if (gender === '女') {
      addHint('感情婚姻', '官鬼', '女问感情多先看官鬼，再参世应生克');
    } else if (gender === '男') {
      addHint('感情婚姻', '妻财', '男问感情多先看妻财，再参世应生克');
    } else {
      addHint('感情婚姻', '官鬼', '未给性别时官鬼可作对象/关系压力候选');
      addHint('感情婚姻', '妻财', '未给性别时妻财可作对象/现实互动候选');
    }
  }

  if (/工作|事业|岗位|升职|跳槽|面试|领导|官司|压力|规则/.test(text)) {
    addHint('事业职位', '官鬼', '主职位、压力、约束、领导与风险');
  }

  if (/钱|财|收入|投资|生意|项目|客户|订单|资源/.test(text)) {
    addHint('财务资源', '妻财', '主钱财、资源、客户、收益与可兑现结果');
  }

  if (/考试|合同|证件|房|车|文书|消息|资料|学历|手续/.test(text)) {
    addHint('文书手续', '父母', '主合同、证件、房产、消息、考试文书与保护条件');
  }

  if (/孩子|子女|创作|作品|输出|方案|宠物|药|医生/.test(text)) {
    addHint('子孙产出', '子孙', '主子女、作品、解决方案、舒缓压力与医药线索');
  }

  if (/朋友|同事|竞争|合作|兄弟|伙伴|借钱|分成/.test(text)) {
    addHint('同辈竞争', '兄弟', '主同辈、竞争者、合作者、分财与人际牵扯');
  }

  if (hints.length === 0) {
    const worldYao = data.yaosDetail.find((item) => item.isWorld);
    hints.push(
      worldYao
        ? `未识别专项用神：先以世爻${formatLiuyaoYaoBrief(worldYao)}为我方主轴，再结合应爻、动爻与问题语义取用`
        : '未识别专项用神：先以世应、动爻、六亲旺衰与问题语义取用',
    );
  }

  return hints;
}

function createLiuyaoSpecialFocusHints(question: string) {
  const text = question.trim();
  const hints: string[] = [];

  if (
    /鬼神|怪事|怪异|不干净|冲犯|阴气|附体|家神|祖先|净宅|送替|梦见|噩梦|邪乎|发冷|惊吓|不安/.test(
      text,
    )
  ) {
    hints.push(
      '鬼神怪异：重点看官鬼是否旺动贴世，子孙能否制鬼，并结合玄武、腾蛇、白虎、勾陈、空破入墓判断更偏情绪、环境还是民俗冲犯。',
    );
  }

  if (/感情|婚姻|恋爱|复合|对象|伴侣|桃花|关系/.test(text)) {
    hints.push('感情关系：重点看官鬼/妻财、世应生克、动变合冲，以及关系是否还有推进空间。');
  }

  if (/工作|事业|岗位|升职|跳槽|面试|领导|规则|编制|项目/.test(text)) {
    hints.push('事业工作：重点看官鬼、父母、世应与动爻，判断机会、压力、规则与窗口时机。');
  }

  if (/钱|财|收入|投资|生意|项目|客户|订单|资源|回款|交易/.test(text)) {
    hints.push('财运交易：重点看妻财、兄弟、子孙与世应，判断收益兑现、分财耗财与操作节奏。');
  }

  return hints;
}

function formatLiuyaoInfo(
  question: string,
  data: LiuyaoData,
  supplementaryInfo?: SupplementaryInfo,
) {
  const movingYaos = data.changingYaos?.length
    ? data.changingYaos
        .map((item) => `第${item.position}爻${item.type ? `（${item.type}）` : ''}`)
        .join('、')
    : '无动爻';
  const worldYao = data.yaosDetail.find((item) => item.isWorld);
  const responseYao = data.yaosDetail.find((item) => item.isResponse);
  const usefulGodHints = createLiuyaoUsefulGodHints(question, data, supplementaryInfo);
  const specialFocusHints = createLiuyaoSpecialFocusHints(question);
  const changingLines = data.yaosDetail
    .filter((item) => item.isChanging)
    .map((item) => {
      const changedText = item.changedYao
        ? `化${item.changedYao.liuqin}${item.changedYao.dizhi}${item.changedYao.wuxing}${item.changedYao.isVoid ? '（变空）' : ''}`
        : '无变爻资料';
      return `${formatLiuyaoYaoBrief(item)}${item.isVoid ? '（空）' : ''}${changedText}`;
    });
  const voidYaoText = data.yaosDetail
    .filter((item) => item.isVoid || item.changedYao?.isVoid)
    .map((item) => {
      const parts = [
        item.isVoid ? '本爻空亡' : '',
        item.changedYao?.isVoid ? '变爻空亡' : '',
      ].filter(Boolean);
      return `${formatLiuyaoYaoBrief(item)}（${parts.join('、')}）`;
    });
  const hiddenSpiritText = data.hiddenSpirits?.length
    ? data.hiddenSpirits.map(formatHiddenSpirit).join('；')
    : '本卦六亲齐备或本宫首卦无可伏之神';
  const focusParts = [
    worldYao ? `世爻在第${worldYao.position}爻` : '世爻未知',
    responseYao ? `应爻在第${responseYao.position}爻` : '应爻未知',
    `动爻${movingYaos}`,
    `空亡${data.voidBranches?.join('、') || '无'}`,
    data.specialPattern ? `卦式${data.specialPattern}` : '',
  ].filter(Boolean);
  const yaoLines = [...data.yaosDetail]
    .sort((a, b) => b.position - a.position)
    .map((item) => {
      const flags = [
        item.isWorld ? '世' : '',
        item.isResponse ? '应' : '',
        item.isVoid ? '空' : '',
        item.isChanging ? `动变${item.changeType}` : '',
      ].filter(Boolean);
      const changedYaoText = item.changedYao
        ? `；变爻${item.changedYao.dizhi}${item.changedYao.wuxing}，六亲${item.changedYao.liuqin}${item.changedYao.isVoid ? '，变爻空亡' : ''}`
        : '';
      return `- 第${item.position}爻：${item.yaoType}爻，六亲${item.sixRelative}，六神${item.sixGod}，纳甲${item.najiaDizhi}${item.wuxing}${flags.length ? `，${flags.join(' / ')}` : ''}${changedYaoText}`;
    });

  return [
    '占法：六爻',
    `时间干支：${formatGanzhi(data.ganzhi).replace('干支：', '')}`,
    `核心结构：主卦${data.originalName}${data.palace?.name ? `（${data.palace.name}宫）` : ''}；变卦${data.changedName || '无'}；互卦${data.interName || '无'}`,
    `关键提示：空亡${data.voidBranches?.join('、') || '无'}；动爻${movingYaos}；世应${worldYao ? `世爻在第${worldYao.position}爻` : '世爻未知'}、${responseYao ? `应爻在第${responseYao.position}爻` : '应爻未知'}；特殊卦式${data.specialPattern || '常规卦'}`,
    `断卦抓手：${focusParts.join('；')}`,
    `用神候选：${usefulGodHints.join('；')}`,
    specialFocusHints.length ? `专项抓手：${specialFocusHints.join('；')}` : '',
    `主轴证据：${worldYao ? `世爻${formatLiuyaoYaoBrief(worldYao)}` : '世爻未知'}；${responseYao ? `应爻${formatLiuyaoYaoBrief(responseYao)}` : '应爻未知'}；${changingLines.length ? `动变${changingLines.join('、')}` : '无动变，以静卦世应用神为主'}`,
    `辅助证据：${voidYaoText.length ? `空亡爻位${voidYaoText.join('、')}` : `空亡${data.voidBranches?.join('、') || '无'}未直接落到本卦爻位`}；伏神${hiddenSpiritText}`,
    data.specialAdvice ? `补充提示：${data.specialAdvice}` : '',
    '结构明细：',
    ...yaoLines,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatMeihuaInfo(data: MeihuaData) {
  const isExternalMethod = data.calculation?.methodKey === 'external';
  const hasExternalSummary = Boolean(data.calculation?.externalSummary?.trim());
  const methodLabel = getMeihuaMethodLabel(data.calculation);
  const processHexagram = data.interHexagram?.name || data.interName || '无';
  const resultHexagram = data.changedHexagram?.name || data.changedName || '无';
  const changedTiYongText =
    data.changedTiGua && data.changedYongGua
      ? `；变后体卦${data.changedTiGua.name}（${data.changedTiGua.element}）；变后用卦${data.changedYongGua.name}（${data.changedYongGua.element}）；变后体用${data.analysis.changedTiYongRelation}`
      : '';
  const externalMappedText = data.calculation?.externalMappedOmens?.length
    ? data.calculation.externalMappedOmens
        .map((item) => `${item.label}->${item.trigram}卦（${item.trigramIndex}）`)
        .join('；')
    : '';
  const externalDetailParts = [
    data.calculation?.externalOmens?.direction
      ? `方向${data.calculation.externalOmens.direction}`
      : '',
    data.calculation?.externalOmens?.person ? `人物${data.calculation.externalOmens.person}` : '',
    data.calculation?.externalOmens?.animal ? `动物${data.calculation.externalOmens.animal}` : '',
    data.calculation?.externalOmens?.object ? `物象${data.calculation.externalOmens.object}` : '',
    data.calculation?.externalOmens?.sound ? `声音${data.calculation.externalOmens.sound}` : '',
    data.calculation?.externalOmens?.color ? `颜色${data.calculation.externalOmens.color}` : '',
    typeof data.calculation?.externalOmens?.count === 'number'
      ? `数量${data.calculation.externalOmens.count}`
      : '',
  ].filter(Boolean);
  const yaoLines = [...data.yaosDetail]
    .sort((a, b) => b.position - a.position)
    .map(
      (item) =>
        `- 第${item.position}爻：${item.yaoType}爻，属${item.tiYong}${item.isChanging ? '，动' : '，静'}`,
    );

  return [
    '占法：梅花易数',
    `时间干支：${formatGanzhi(data.ganzhi).replace('干支：', '')}`,
    `核心结构：主卦${data.originalName}；互卦${data.interName || '无'}；变卦${data.changedName || '无'}`,
    '断卦抓手：先定体用，再看互卦过程、变卦结果与四时旺衰',
    `主轴证据：体卦${data.tiGua.name}（${data.tiGua.element}）；用卦${data.yongGua.name}（${data.yongGua.element}）；动爻第${data.movingYao.position}爻；体用关系${data.analysis.tiYongRelation}`,
    `过程证据：互卦${processHexagram}；互下${data.analysis.inter1Relation}；互上${data.analysis.inter2Relation}`,
    `结果证据：变卦${resultHexagram}${changedTiYongText}；结果关系${data.analysis.changedRelation}`,
    `辅助证据：四时${data.analysis.season}季，体卦${data.analysis.tiSeasonState}，用卦${data.analysis.yongSeasonState}；起卦法${methodLabel}${typeof data.calculation?.number === 'number' ? `；起卦数字${data.calculation.number}` : ''}`,
    isExternalMethod && hasExternalSummary ? `外应：${data.calculation.externalSummary}` : '',
    externalMappedText ? `外应映射：${externalMappedText}` : '',
    externalDetailParts.length ? `外应明细：${externalDetailParts.join('；')}` : '',
    '结构明细：',
    `- 四时旺衰：${data.analysis.season}季，体卦${data.analysis.tiSeasonState}，用卦${data.analysis.yongSeasonState}`,
    `- 体用关系：${data.analysis.tiYongRelation}`,
    `- 过程关系：互下${data.analysis.inter1Relation}，互上${data.analysis.inter2Relation}`,
    `- 结果关系：${data.analysis.changedRelation}`,
    data.changedTiGua && data.changedYongGua
      ? `- 变后体用：体卦${data.changedTiGua.name}（${data.changedTiGua.element}），用卦${data.changedYongGua.name}（${data.changedYongGua.element}），关系${data.analysis.changedTiYongRelation}`
      : '',
    ...yaoLines,
    !isExternalMethod && hasExternalSummary ? `补充提示：${data.calculation.externalSummary}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function formatXiaoliurenInfo(data: XiaoliurenData) {
  const sequence = data.sequence;

  return [
    '占法：小六壬',
    `时间干支：以【当前时间】为准；农历${data.lunarMonth}月${data.lunarDay}日，${data.hourLabel}`,
    `核心结构：起因${sequence.start.name}；过程${sequence.process.name}；结果${sequence.result.name}`,
    `关键提示：起课方式${data.methodLabel}；主判断${data.primary.name}；倾向${data.tendency}`,
    '断课抓手：先看结果宫位定主判断，再看起因与过程宫位解释事情为何如此、会如何推进。',
    `主轴证据：起因${sequence.start.name}（${sequence.start.keywords.join('、')}）；过程${sequence.process.name}（${sequence.process.keywords.join('、')}）；结果${sequence.result.name}（${sequence.result.keywords.join('、')}）`,
    `辅助证据：起因提示${sequence.start.meaning}；过程提示${sequence.process.meaning}；结果提示${sequence.result.meaning}`,
    `现实映射：${data.questionHint}`,
    '结构明细：',
    `- 起课方式：${data.methodLabel}`,
    `- 起因：${sequence.start.name}，关键词：${sequence.start.keywords.join('、')}；建议：${sequence.start.advice}`,
    `- 过程：${sequence.process.name}，关键词：${sequence.process.keywords.join('、')}；建议：${sequence.process.advice}`,
    `- 结果：${sequence.result.name}，关键词：${sequence.result.keywords.join('、')}；建议：${sequence.result.advice}`,
  ].join('\n');
}

function formatQimenInfo(question: string, data: QimenData, supplementaryInfo?: SupplementaryInfo) {
  const zhiFuPalace = data.jiuGongGe.find((item) => item.tianPan.star === data.zhiFu);
  const zhiShiPalace = data.jiuGongGe.find((item) => item.renPan.door === data.zhiShi);
  const hourStem = data.ganzhi.hour.charAt(0);
  const hourStemPalaces = data.jiuGongGe.filter(
    (item) => item.tianPan.stem === hourStem || item.diPan.stem === hourStem,
  );
  const voidText = data.voidPalaces?.length
    ? data.voidPalaces.map((item) => `${item.branch}空落${item.name}`).join('、')
    : data.voidBranches?.length
      ? `${data.voidBranches.join('、')}空，落宫未定位`
      : '无';
  const horseText = data.horseStar
    ? `${data.horseStar.sourceBranch}时驿马在${data.horseStar.branch}，落${data.horseStar.name}`
    : '未定位';
  const palaceLines = data.jiuGongGe
    .map(
      (item) =>
        `- ${item.name}（${item.direction}，五行${item.element}）：天盘${item.tianPan.stem}${item.tianPan.star}，地盘${item.diPan.stem}，人盘${item.renPan.door}，神盘${item.shenPan.god}`,
    )
    .join('\n');
  const patternSummary =
    data.patternDetails?.map((item) => `${item.tag}：${item.summary}`).join('；') || '';
  const palaceSummary =
    data.palaceInsights?.map((item) => `${item.name}${item.level}，${item.summary}`).join('；') ||
    '';
  const questionHints = createQimenQuestionHints(question, data, supplementaryInfo);
  const priorityPalaces = createQimenPriorityPalaces(question, data, supplementaryInfo).slice(0, 3);
  const specialConditionsText = data.specialConditions?.description?.trim();
  const questionHintText =
    questionHints.length > 0
      ? questionHints.map((item) => `${item.label}：${item.value}`).join('；')
      : '';
  const priorityPalaceText = priorityPalaces
    .map((item) => `${item.name}（${item.score}分，${item.reasons.join('、')}）`)
    .join('；');
  const normalizedPalaceSummary = normalizePromptCompareText(palaceSummary);
  const dedupedPalaceSummary = palaceSummary
    ? priorityPalaces.some(
        (item) =>
          normalizedPalaceSummary.includes(normalizePromptCompareText(item.name)) &&
          item.reasons.some((reason) =>
            normalizedPalaceSummary.includes(normalizePromptCompareText(reason)),
          ),
      )
      ? ''
      : palaceSummary
    : '';
  const focusParts = [
    `值符${data.zhiFu}`,
    `值使${data.zhiShi}`,
    `${data.isYangDun ? '阳遁' : '阴遁'}${data.juShu}局`,
    data.patternTags?.length ? `格局${data.patternTags.join('、')}` : '',
    priorityPalaces[0] ? `先看${priorityPalaces[0].name}` : '',
  ].filter(Boolean);

  return [
    '占法：奇门遁甲',
    `时间干支：${formatGanzhi(data.ganzhi).replace('干支：', '')}`,
    `核心结构：${data.isYangDun ? '阳遁' : '阴遁'}${data.juShu}局；值符${data.zhiFu}；值使${data.zhiShi}`,
    `关键提示：节令${`${data.timeInfo?.solarTerm || '未知'} ${data.timeInfo?.epoch || ''}`.trim()}；格局标签${data.patternTags?.join('、') || '无'}`,
    `起局抓手：${focusParts.join('；')}`,
    `主轴证据：值符${data.zhiFu}${zhiFuPalace ? `落${zhiFuPalace.name}` : '落宫未定位'}；值使${data.zhiShi}${zhiShiPalace ? `落${zhiShiPalace.name}` : '落宫未定位'}；时干${hourStem}${hourStemPalaces.length ? `见于${hourStemPalaces.map((item) => item.name).join('、')}` : '落宫未定位'}`,
    `用神宫候选：${priorityPalaceText || '未根据问题识别出优先宫，先以值符值使、时干和值事宫为主'}`,
    `辅助证据：旬空${voidText}；马星${horseText}`,
    specialConditionsText ? `特殊时辰：${specialConditionsText}` : '',
    questionHintText ? `问事参考：${questionHintText}` : '',
    patternSummary ? `判断依据：${patternSummary}` : '',
    dedupedPalaceSummary ? `补充提示：${dedupedPalaceSummary}` : '',
    '结构明细：',
    palaceLines,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatLiurenInfo(data: LiurenData) {
  const lessonLines = data.fourLessons.map(
    (item) =>
      `- ${item.name}：天盘${item.upper}临地盘${item.lower}，天将${item.god}，关系${item.relation}，提示${item.note}`,
  );
  const transmissionLines = data.threeTransmissions.map(
    (item) =>
      `- ${item.stage}：${item.branch}，天将${item.god}，关系${item.relation}，提示${item.note}`,
  );
  const plateLines = data.heavenlyPlate
    .slice(0, 6)
    .map((item) => `- ${item.under}位见${item.branch}，天将${item.god}`)
    .join('\n');
  const firstTransmission = data.threeTransmissions[0];
  const transmissionEvidence = data.threeTransmissions.map(
    (item) => `${item.stage}${item.branch}乘${item.god}，${item.relation}，${item.note}`,
  );
  const lessonEvidence = data.fourLessons.map(
    (item) => `${item.name}${item.upper}临${item.lower}乘${item.god}，${item.relation}`,
  );
  const auxiliaryEvidence = [
    data.guaTi?.length ? `课体${data.guaTi.join('、')}` : '',
    data.patternTags?.length ? `课体标签${data.patternTags.join('、')}` : '',
    data.shenShaSummary?.length ? `神煞${data.shenShaSummary.join('；')}` : '',
    data.xunKong?.length ? `旬空${data.xunKong.join('、')}` : '',
  ].filter(Boolean);
  const focusParts = [
    firstTransmission
      ? `发用${firstTransmission.branch}乘${firstTransmission.god}，先看${firstTransmission.note}`
      : '',
    data.transmissionPattern ? `传态${data.transmissionPattern}` : '',
    data.xunKong?.length ? `旬空${data.xunKong.join('、')}` : '',
    data.transmissionRule ? `取传${data.transmissionRule}` : '',
  ].filter(Boolean);

  return [
    '占法：大六壬',
    `时间干支：${formatGanzhi(data.ganzhi).replace('干支：', '')}`,
    `核心结构：月将${data.monthLeader}；占时${data.divinationBranch}；发用${data.threeTransmissions[0]?.branch || '未知'}；末传${data.threeTransmissions[2]?.branch || '未知'}`,
    `关键提示：${data.dayNight || '未知时段'}；贵人落${data.noblemanBranch || '未知'}；旬空${data.xunKong?.join('、') || '未知'}；取传法${data.transmissionRule || '未标注'}；传态${data.transmissionPattern || '未标注'}；课体标签${data.patternTags?.join('、') || '无'}`,
    focusParts.length ? `断课抓手：${focusParts.join('；')}` : '',
    transmissionEvidence.length ? `主线证据：${transmissionEvidence.join('；')}` : '',
    lessonEvidence.length ? `四课证据：${lessonEvidence.join('；')}` : '',
    auxiliaryEvidence.length
      ? `辅助证据：${auxiliaryEvidence.join('；')}；辅证若与三传主线冲突，先以发用与三传演变为准`
      : '',
    data.lessonSummary ? `判断依据：${data.lessonSummary}` : '',
    data.transmissionDetail ? `取传说明：${data.transmissionDetail}` : '',
    data.transmissionSummary ? `传变依据：${data.transmissionSummary}` : '',
    '结构明细：',
    ...lessonLines,
    ...transmissionLines,
    plateLines ? '天盘摘要：' : '',
    plateLines,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatTarotInfo(data: TarotData) {
  const focusCards = getTarotFocusCards(data);
  const focusParts = focusCards.map((card) => formatTarotCardLabel(card));
  const auxiliaryParts = [
    `牌阵${data.spreadName}`,
    ...focusCards.map((card) => `${card.position}关键词${card.keywords.join('、')}`),
  ].filter(Boolean);
  const cardLines = data.cards.map(
    (card) =>
      `- ${card.position}：${card.name}${card.reversed ? '（逆位）' : '（正位）'}，关键词：${card.keywords.join('、')}`,
  );
  const relationText =
    focusCards.length >= 2
      ? focusCards
          .slice(0, 3)
          .map((card, index) => {
            if (index === 0) {
              return `${card.position}先提示${card.keywords.join('与')}`;
            }
            if (index === 1) {
              return `${card.position}位再看如何调整${card.keywords.join('与')}`;
            }
            return `${card.position}位再看后续${card.keywords.join('与')}`;
          })
          .join('，')
      : focusCards[0]
        ? `${focusCards[0].position}是当前主轴，先围绕这张牌回答问题`
        : '';

  return [
    '占法：塔罗',
    '时间干支：以【当前时间】为准',
    `核心结构：牌阵${data.spreadName}；共${data.cards.length}张牌`,
    '断牌抓手：先统合牌阵主轴，再看关键位置、正逆位变化与牌面呼应',
    `主轴证据：${focusParts.join('；') || '牌面主轴未定位'}`,
    `辅助证据：${auxiliaryParts.join('；') || '暂无辅助证据'}`,
    relationText ? `位置关系：${relationText}` : '',
    '结构明细：',
    ...cardLines,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatSsgwInfo(data: SsgwData) {
  const { canonicalStory, extraStory } = resolveSsgwStoryContent(data);
  const detailLines = data.details
    ? Object.entries(data.details)
        .filter(([key]) => key !== '典故')
        .map(([key, value]) => `- ${key}：${value}`)
    : [];
  const detailMap = data.details || {};
  const auxiliaryParts = [
    `签题《${data.title}》`,
    canonicalStory ? `典故${canonicalStory}` : '',
    detailMap.解签 ? `解签${detailMap.解签}` : '',
  ].filter(Boolean);
  const realityHint = detailMap.解签
    ? detailMap.解签.includes('守正待时')
      ? '当前更宜先守正待时，再等局势转明，不宜躁进强求'
      : `当前更宜依签意行事，先稳住节奏，再看后续变化`
    : '';

  return [
    '占法：三山国王灵签',
    `时间干支：${formatGanzhi(data.ganzhi).replace('干支：', '')}`,
    `核心结构：第${data.number}签；签题《${data.title}》`,
    '断签抓手：先定签诗主旨，再看典故映射、现实处境与宜进宜守',
    `主轴证据：签诗“${data.poem}”`,
    `辅助证据：${auxiliaryParts.join('；') || '暂无辅助证据'}`,
    realityHint ? `现实映射：${realityHint}` : '',
    '结构明细：',
    `- 签号：第${data.number}签`,
    `- 签题：${data.title}`,
    canonicalStory ? `- 典故：${canonicalStory}` : '',
    extraStory ? `补充提示：${extraStory}` : '',
    ...detailLines,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatAlmanacInfo(data: AlmanacData) {
  const topDays = data.days.slice(0, 8);
  const participantLines = data.participants.map((item) => {
    const useful = item.usefulGods.length ? item.usefulGods.join('、') : '未标注';
    const avoid = item.avoidGods.length ? item.avoidGods.join('、') : '未标注';
    return `- ${item.name}：${item.gender || '性别未填'}，公历${item.solarDate}，农历${item.lunarDate}，生肖${item.zodiac}，日主${item.dayMaster}${item.dayMasterElement}，四柱${item.pillars.year}年 ${item.pillars.month}月 ${item.pillars.day}日 ${item.pillars.hour}时，喜用参考${useful}，忌神参考${avoid}`;
  });
  const dayLines = topDays.map((item, index) => {
    const evidence = [
      `宜${item.recommends.slice(0, 8).join('、') || '无'}`,
      `忌${item.avoids.slice(0, 8).join('、') || '无'}`,
      item.highlights.length ? `加分${item.highlights.join('、')}` : '',
      item.cautions.length ? `风险${item.cautions.join('、')}` : '',
      item.participantNotes.length ? `参与人${item.participantNotes.join('；')}` : '',
    ].filter(Boolean);
    return `- 第${index + 1}候选：${item.date} ${item.weekday}，${item.lunarDate}，${item.ganzhi.year}年 ${item.ganzhi.month}月 ${item.ganzhi.day}日，评分${item.score}；${item.dayOfficer}执日，十二神${item.twelveStar}，二十八宿${item.twentyEightStar}，${item.clash}；${evidence.join('；')}`;
  });
  const bestDay = topDays[0];

  return [
    '占法：黄历择日',
    `核心结构：择日事项：${data.topicLabel}；候选日期：${data.startDate} 至 ${data.endDate}；本地算法先按黄历宜忌、神煞、冲煞与参与人八字做初筛`,
    bestDay
      ? `初筛结论：当前排序第一为${bestDay.date}，评分${bestDay.score}；仍需结合用户现实约束复核，不可只按分数机械决定`
      : '初筛结论：暂无候选日期',
    '择日抓手：先排除直接冲犯和忌项明显命中的日期，再比较宜项、吉神、执日、星宿与参与人日主喜忌。',
    participantLines.length
      ? '参与人八字参考：'
      : '参与人八字参考：未填写，AI 只能按通用黄历规则判断',
    ...participantLines,
    '候选日期明细：',
    ...dayLines,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatLenormandInfo(data: LenormandData) {
  const cardLines = data.cards.map(
    (card) =>
      `- ${card.position}：${card.name}，关键词：${card.keywords.join('、')}；牌义：${card.meaning}`,
  );
  const focus = data.cards
    .slice(0, 3)
    .map((card) => `${card.position}${card.name}`)
    .join('；');

  return [
    '占法：雷诺曼',
    '时间干支：以【当前时间】为准',
    `核心结构：牌阵${data.spreadName}；共${data.cards.length}张牌`,
    '断牌抓手：先看核心牌，再看左右邻牌如何补充事件、人、消息、阻碍或结果。',
    `主轴证据：${focus || '未定位主轴'}`,
    '结构明细：',
    ...cardLines,
  ].join('\n');
}

export function formatAstrolabeInfo(data: AstrolabeData) {
  const planetLines = data.planets.map(
    (item) =>
      `- ${item.label}：${item.formatted}，第${item.house}宫${item.retrograde ? '，逆行' : ''}`,
  );
  const angleLines = data.angles.map((item) => `- ${item.label}：${item.formatted}`);
  const aspectLines = data.aspects.map(
    (item) =>
      `- ${item.body1}${item.symbol}${item.body2}（${item.type}），容许度${item.orb}°，强度${item.strength}%${item.applying === null ? '' : item.applying ? '，入相' : '，出相'}`,
  );
  const sun = data.planets.find((item) => item.name === 'Sun');
  const moon = data.planets.find((item) => item.name === 'Moon');
  const ascendant = data.angles.find((item) => item.name === 'Ascendant');
  const aspectSummary = data.aspects
    .slice(0, 3)
    .map(
      (item) => `${item.body1}${item.symbol}${item.body2}（${item.type}，强度${item.strength}%）`,
    )
    .join('；');

  return [
    '占法：星盘',
    `出生信息：${data.birth.name}，${data.birth.gender || '性别未填'}，${data.birth.dateTime}，位置${data.birth.location}，时区 UTC${data.birth.timezone >= 0 ? '+' : ''}${data.birth.timezone}`,
    `核心结构：太阳${sun?.formatted || '未知'}；月亮${moon?.formatted || '未知'}；上升${ascendant?.formatted || '未知'}；共${data.planets.length}颗星体、${data.houses.length}个宫位、${data.aspects.length}组主要相位`,
    `关键提示：逆行星体${data.summary.retrograde.join('、') || '无'}；格局${data.summary.patterns.join('、') || '未见明显格局'}`,
    `主轴证据：太阳${sun?.formatted || '未知'}；月亮${moon?.formatted || '未知'}；上升${ascendant?.formatted || '未知'}`,
    `辅助证据：${aspectSummary ? `主要相位${aspectSummary}` : '主要相位未见强证据'}；逆行${data.summary.retrograde.join('、') || '无'}；格局${data.summary.patterns.join('、') || '未见明显格局'}`,
    '星体位置：',
    ...planetLines,
    '四轴：',
    ...angleLines,
    '主要相位：',
    ...(aspectLines.length ? aspectLines : ['- 未检测到强度足够的主要相位']),
    `元素分布：火${data.summary.elements.火.join('、') || '无'}；土${data.summary.elements.土.join('、') || '无'}；风${data.summary.elements.风.join('、') || '无'}；水${data.summary.elements.水.join('、') || '无'}`,
    `模式分布：开创${data.summary.modalities.开创.join('、') || '无'}；固定${data.summary.modalities.固定.join('、') || '无'}；变动${data.summary.modalities.变动.join('、') || '无'}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatDivinationInfo(
  method: Exclude<DivinationMethodId, 'random'>,
  data: DivinationData,
  question: string,
  supplementaryInfo?: SupplementaryInfo,
) {
  switch (method) {
    case 'liuyao':
      return formatLiuyaoInfo(question, data as LiuyaoData, supplementaryInfo);
    case 'meihua':
      return formatMeihuaInfo(data as MeihuaData);
    case 'xiaoliuren':
      return formatXiaoliurenInfo(data as XiaoliurenData);
    case 'qimen':
      return formatQimenInfo(question, data as QimenData, supplementaryInfo);
    case 'liuren':
      return formatLiurenInfo(data as LiurenData);
    case 'tarot':
      return formatTarotInfo(data as TarotData);
    case 'ssgw':
      return formatSsgwInfo(data as SsgwData);
    case 'almanac':
      return formatAlmanacInfo(data as AlmanacData);
    case 'lenormand':
      return formatLenormandInfo(data as LenormandData);
    case 'astrolabe':
      return formatAstrolabeInfo(data as AstrolabeData);
    default:
      return '占卜信息暂不可用';
  }
}
