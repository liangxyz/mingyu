import type {
  DivinationData,
  LiurenData,
  LiuyaoData,
  MeihuaData,
  QimenData,
  SsgwData,
  SupplementaryInfo,
  TarotData,
} from '../../../types/divination';
import { LunarUtil } from '../../../utils/lunar';
import {
  createQimenPriorityPalaces,
  createQimenQuestionHints,
} from '../../../utils/qimen-guidance';
import type { DivinationMethodId } from '../config';

export function buildTimeInfoText() {
  const timeInfo = LunarUtil.getCurrentTimeInfo();
  const display = LunarUtil.formatTimeDisplay(timeInfo);
  return [display.solar, display.lunar, display.ganzhi, `节气：${timeInfo.jieQi}`].join('\n');
}

export function formatGanzhi(ganzhi?: { year: string; month: string; day: string; hour: string }) {
  if (!ganzhi) {
    return '干支：未知';
  }

  return `干支：${ganzhi.year}年 ${ganzhi.month}月 ${ganzhi.day}日 ${ganzhi.hour}时`;
}

export function formatSupplementaryInfoSection(supplementaryInfo?: SupplementaryInfo) {
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
  if (supplementaryInfo.meihuaSettings?.method) {
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
  if (typeof supplementaryInfo.meihuaSettings?.number === 'number') {
    lines.push(`起卦数字：${supplementaryInfo.meihuaSettings.number}`);
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

function formatLiuyaoInfo(data: LiuyaoData) {
  const movingYaos = data.changingYaos?.length
    ? data.changingYaos
        .map((item) => `第${item.position}爻${item.type ? `（${item.type}）` : ''}`)
        .join('、')
    : '无动爻';
  const worldYao = data.yaosDetail.find((item) => item.isWorld);
  const responseYao = data.yaosDetail.find((item) => item.isResponse);
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
    data.specialAdvice ? `补充提示：${data.specialAdvice}` : '',
    '结构明细：',
    ...yaoLines,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatMeihuaInfo(data: MeihuaData) {
  return [
    '占法：梅花易数',
    `时间干支：${formatGanzhi(data.ganzhi).replace('干支：', '')}`,
    `核心结构：主卦${data.originalName}；互卦${data.interName || '无'}；变卦${data.changedName || '无'}`,
    `关键提示：体卦${data.tiGua.name}（${data.tiGua.element}）；用卦${data.yongGua.name}（${data.yongGua.element}）；动爻第${data.movingYao.position}爻`,
    '结构明细：',
    `- 四时旺衰：${data.analysis.season}季，体卦${data.analysis.tiSeasonState}，用卦${data.analysis.yongSeasonState}`,
    `- 体用关系：${data.analysis.tiYongRelation}`,
    `- 过程关系：互上${data.analysis.inter2Relation}体，互下${data.analysis.inter1Relation}体`,
    `- 结果关系：${data.analysis.changedRelation}`,
    data.calculation?.externalSummary ? `补充提示：${data.calculation.externalSummary}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function formatQimenInfo(question: string, data: QimenData, supplementaryInfo?: SupplementaryInfo) {
  const palaceLines = data.jiuGongGe
    .map(
      (item) =>
        `- ${item.name}：天盘${item.tianPan.stem}${item.tianPan.star}，地盘${item.diPan.stem}，人盘${item.renPan.door}，神盘${item.shenPan.god}`,
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
      : priorityPalaces.length > 0
        ? `当前问题可先从${priorityPalaces.map((item) => item.name).join('、')}切入，再回看值符值使与门星神干组合`
        : '';
  const priorityPalaceText = priorityPalaces
    .map((item) => `${item.name}（${item.score}分，${item.reasons.join('、')}）`)
    .join('；');
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
    `核心结构：${data.isYangDun ? '阳遁' : '阴遁'}${data.juShu}局；值符${data.zhiFu}；值使${data.zhiShi}；值符值使主轴优先看落宫与门星神干组合`,
    `关键提示：节令${`${data.timeInfo?.solarTerm || '未知'} ${data.timeInfo?.epoch || ''}`.trim()}；格局标签${data.patternTags?.join('、') || '无'}`,
    `起局抓手：${focusParts.join('；')}`,
    specialConditionsText ? `特殊时辰：${specialConditionsText}` : '',
    questionHintText ? `问事参考：${questionHintText}` : '',
    priorityPalaceText ? `优先看宫：${priorityPalaceText}` : '',
    patternSummary ? `判断依据：${patternSummary}` : '',
    palaceSummary ? `补充提示：${palaceSummary}` : '',
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
    data.guaTi?.length ? `课体补充：${data.guaTi.join('、')}` : '',
    data.shenShaSummary?.length ? `神煞补充：${data.shenShaSummary.join('；')}` : '',
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
  const cardLines = data.cards.map(
    (card) =>
      `- ${card.position}：${card.name}${card.reversed ? '（逆位）' : '（正位）'}，关键词：${card.keywords.join('、')}`,
  );

  return [
    '占法：塔罗',
    '时间干支：以【当前时间】为准',
    `核心结构：牌阵${data.spreadName}；共${data.cards.length}张牌`,
    '关键提示：重点关注各位置含义、正逆位变化与牌面之间的呼应关系',
    '结构明细：',
    ...cardLines,
  ].join('\n');
}

function formatSsgwInfo(data: SsgwData) {
  const detailLines = data.details
    ? Object.entries(data.details).map(([key, value]) => `- ${key}：${value}`)
    : [];

  return [
    '占法：三山国王灵签',
    `时间干支：${formatGanzhi(data.ganzhi).replace('干支：', '')}`,
    `核心结构：第${data.number}签；签题《${data.title}》`,
    `关键提示：签诗“${data.poem}”`,
    '结构明细：',
    `- 签号：第${data.number}签`,
    `- 签题：${data.title}`,
    data.story ? `补充提示：${data.story}` : '',
    ...detailLines,
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
      return formatLiuyaoInfo(data as LiuyaoData);
    case 'meihua':
      return formatMeihuaInfo(data as MeihuaData);
    case 'qimen':
      return formatQimenInfo(question, data as QimenData, supplementaryInfo);
    case 'liuren':
      return formatLiurenInfo(data as LiurenData);
    case 'tarot':
      return formatTarotInfo(data as TarotData);
    case 'ssgw':
      return formatSsgwInfo(data as SsgwData);
    default:
      return '占卜信息暂不可用';
  }
}
