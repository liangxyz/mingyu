import { getMonthDaysInfo, getYearInfo } from '../calendarTool';
import { BASIC_MAPPINGS } from '../baziMappingsData';
import type { BaziChartResult } from '../baziTypes';
import { getTenGod, getTenGodForBranch } from '../baziUtils';
import { getDayHourBreakdown } from './helpers/breakdown';
import {
  formatCycleLabel,
  formatYearLabel,
  resolveCycleIndex,
  resolveSelectedDay,
  resolveSelectedMonth,
  resolveSelectedYear,
} from './helpers/resolvers';
import type { BaziFortuneSelectionValue, FortuneSelectionContext } from './helpers/types';

export type { BaziFortuneSelectionValue, FortuneSelectionContext } from './helpers/types';

type PillarKey = 'year' | 'month' | 'day' | 'hour';

const PILLAR_LABELS: Record<PillarKey, string> = {
  year: '年柱',
  month: '月柱',
  day: '日柱',
  hour: '时柱',
};

const PILLAR_KEYS: PillarKey[] = ['year', 'month', 'day', 'hour'];

function splitGanZhi(ganZhi: string | undefined) {
  if (!ganZhi || ganZhi.length < 2) return null;
  return {
    gan: ganZhi[0],
    zhi: ganZhi[1],
  };
}

function formatGanZhiTenGod(result: BaziChartResult, ganZhi: string | undefined): string {
  const parts = splitGanZhi(ganZhi);
  if (!parts || !result.dayMaster?.gan) return '未知';

  return `天干${parts.gan}为${getTenGod(parts.gan, result.dayMaster.gan)}，地支${parts.zhi}主气为${getTenGodForBranch(parts.zhi, result.dayMaster.gan)}`;
}

function buildGanZhiTriggerSummary(
  result: BaziChartResult,
  ganZhi: string | undefined,
  scopeLabel: string,
): string {
  const parts = splitGanZhi(ganZhi);
  if (!parts || !result.pillars) return `${scopeLabel}触发：原局资料不足，暂无法判断合冲刑害。`;

  const triggers: string[] = [];

  PILLAR_KEYS.forEach((key) => {
    const pillar = result.pillars[key];
    if (!pillar) return;
    const pillarLabel = PILLAR_LABELS[key];

    if (parts.gan === pillar.gan) {
      triggers.push(`天干${parts.gan}与${pillarLabel}${pillar.gan}伏吟`);
    }
    if (BASIC_MAPPINGS.TIAN_GAN_WU_HE[parts.gan] === pillar.gan) {
      triggers.push(`天干${parts.gan}合${pillarLabel}${pillar.gan}`);
    }
    if (BASIC_MAPPINGS.TIAN_GAN_CHONG[parts.gan] === pillar.gan) {
      triggers.push(`天干${parts.gan}冲${pillarLabel}${pillar.gan}`);
    }

    if (parts.zhi === pillar.zhi) {
      triggers.push(`地支${parts.zhi}与${pillarLabel}${pillar.zhi}伏吟`);
    }
    if (BASIC_MAPPINGS.DI_ZHI_LIU_HE[parts.zhi] === pillar.zhi) {
      triggers.push(`地支${parts.zhi}合${pillarLabel}${pillar.zhi}`);
    }
    if (BASIC_MAPPINGS.DI_ZHI_CHONG[parts.zhi] === pillar.zhi) {
      triggers.push(`地支${parts.zhi}冲${pillarLabel}${pillar.zhi}`);
    }
    if (BASIC_MAPPINGS.DI_ZHI_XING[parts.zhi]?.includes(pillar.zhi)) {
      triggers.push(`地支${parts.zhi}刑${pillarLabel}${pillar.zhi}`);
    }
    if (BASIC_MAPPINGS.DI_ZHI_HAI[parts.zhi] === pillar.zhi) {
      triggers.push(`地支${parts.zhi}害${pillarLabel}${pillar.zhi}`);
    }
    if (BASIC_MAPPINGS.DI_ZHI_PO[parts.zhi] === pillar.zhi) {
      triggers.push(`地支${parts.zhi}破${pillarLabel}${pillar.zhi}`);
    }
  });

  return `${scopeLabel}触发：${triggers.length ? triggers.join('；') : '未见明显合冲刑害破，重点看十神生克、原局喜忌与岁运层级。'}`;
}

export function normalizeFortuneSelection(
  result: BaziChartResult,
  selection: BaziFortuneSelectionValue,
): BaziFortuneSelectionValue {
  if (selection.scope === 'natal' || !result.luckInfo.cycles.length) {
    return { scope: 'natal' };
  }

  const cycleIndex = resolveCycleIndex(result, selection);
  const cycle = result.luckInfo.cycles[cycleIndex];

  if (!cycle) {
    return { scope: 'natal' };
  }

  const year = resolveSelectedYear(cycle, selection);

  if (selection.scope === 'dayun') {
    return {
      scope: 'dayun',
      cycleIndex,
      year,
    };
  }

  if (!year) {
    return {
      scope: 'dayun',
      cycleIndex,
    };
  }

  const month = resolveSelectedMonth(selection);

  if (selection.scope === 'year') {
    return {
      scope: 'year',
      cycleIndex,
      year,
      month,
    };
  }

  const day = resolveSelectedDay(year, month, selection);

  if (selection.scope === 'month') {
    return {
      scope: 'month',
      cycleIndex,
      year,
      month,
      day,
    };
  }

  return {
    scope: 'day',
    cycleIndex,
    year,
    month,
    day,
  };
}

export function buildFortuneSelectionContext(
  result: BaziChartResult,
  selection: BaziFortuneSelectionValue,
): FortuneSelectionContext | null {
  const normalized = normalizeFortuneSelection(result, selection);
  if (normalized.scope === 'natal') {
    return null;
  }

  const cycle = result.luckInfo.cycles[normalized.cycleIndex ?? -1];
  if (!cycle) {
    return null;
  }

  const cycleLabel = formatCycleLabel(cycle);
  const yearItem = cycle.years.find((item) => item.year === normalized.year);
  const monthInfoList = normalized.year ? getYearInfo(normalized.year).months : [];
  const monthInfo = normalized.month ? monthInfoList[normalized.month - 1] : undefined;
  const dayInfoList =
    normalized.year && normalized.month ? getMonthDaysInfo(normalized.year, normalized.month) : [];
  const dayInfo = dayInfoList.find((item) => item.day === normalized.day);

  const baseContext = {
    cycleIndex: normalized.cycleIndex ?? 0,
    cycleLabel,
    cycleGanZhi: cycle.ganZhi,
    cycleStartYear: cycle.year,
    cycleAge: cycle.age,
    cycleType: cycle.type,
    isXiaoyun: cycle.isXiaoyun,
    year: yearItem?.year,
    yearGanZhi: yearItem?.ganZhi,
    yearAge: yearItem?.age,
  };

  if (normalized.scope === 'dayun') {
    const breakdown = cycle.years.map((item) => ({
      year: item.year,
      ganZhi: item.ganZhi,
      age: item.age,
    }));

    return {
      ...baseContext,
      scope: 'dayun',
      yearBreakdown: breakdown,
      displayLabel: cycleLabel,
      displayText: `${cycleLabel}（${cycle.year}年起，${cycle.age}岁交运）`,
      promptPayload: {
        scopeLabel: `分析对象：${cycleLabel}`,
        summaryLines: [
          `大运干支：${cycle.ganZhi}`,
          `大运十神：${formatGanZhiTenGod(result, cycle.ganZhi)}`,
          buildGanZhiTriggerSummary(result, cycle.ganZhi, '大运'),
          `起运年份：${cycle.year}年`,
          `起运年龄：${cycle.age}岁`,
          cycle.isXiaoyun
            ? '类型：未起运，行童运'
            : `类型：${cycle.type === '小运' ? '童运' : cycle.type}`,
        ],
        breakdownTitle: '该大运包含的流年',
        breakdownLines: breakdown.map(
          (item) =>
            `${item.year}年（${item.age}岁） ${item.ganZhi}｜十神 ${formatGanZhiTenGod(result, item.ganZhi)}`,
        ),
      },
    };
  }

  if (!yearItem) {
    return null;
  }

  if (normalized.scope === 'year') {
    const breakdown = monthInfoList.map((item, index) => ({
      month: index + 1,
      label: item.month,
      ganZhi: item.ganZhi,
      startDate: item.startDate,
      endDate: item.endDate,
      startDateTime: item.startDateTime,
      endDateTime: item.endDateTime,
      startTermName: item.startTermName,
      endTermName: item.endTermName,
    }));

    return {
      ...baseContext,
      scope: 'year',
      monthBreakdown: breakdown,
      displayLabel: formatYearLabel(yearItem),
      displayText: `${yearItem.year}年 ${yearItem.ganZhi}（${yearItem.age}岁）`,
      promptPayload: {
        scopeLabel: `分析对象：${yearItem.year}年流年`,
        summaryLines: [
          `所属大运：${cycleLabel}`,
          `流年干支：${yearItem.ganZhi}`,
          `流年十神：${formatGanZhiTenGod(result, yearItem.ganZhi)}`,
          buildGanZhiTriggerSummary(result, yearItem.ganZhi, '流年'),
          `对应年龄：${yearItem.age}岁`,
        ].filter(Boolean) as string[],
        breakdownTitle: '该流年包含的流月',
        breakdownLines: breakdown.map(
          (item) =>
            `${item.month}月（${item.label}） ${item.ganZhi}｜十神 ${formatGanZhiTenGod(result, item.ganZhi)}｜日期范围 ${item.startDate} 至 ${item.endDate}｜交节 ${item.startTermName || ''} ${item.startDateTime || ''} 起，${item.endTermName || ''} ${item.endDateTime || ''} 交下节`,
        ),
      },
    };
  }

  if (!monthInfo || !normalized.month) {
    return null;
  }

  if (normalized.scope === 'month') {
    const breakdown = dayInfoList.map((item) => ({
      date: item.solarDate,
      label: item.solarLabel,
      ganZhi: item.ganZhi,
      startDateTime: item.startDateTime,
      endDateTime: item.endDateTime,
      boundaryNote: item.boundaryNote,
    }));

    return {
      ...baseContext,
      scope: 'month',
      month: normalized.month,
      monthGanZhi: monthInfo.ganZhi,
      monthLabel: monthInfo.month,
      monthBreakdown: [
        {
          month: normalized.month,
          label: monthInfo.month,
          ganZhi: monthInfo.ganZhi,
          startDate: monthInfo.startDate,
          endDate: monthInfo.endDate,
          startDateTime: monthInfo.startDateTime,
          endDateTime: monthInfo.endDateTime,
          startTermName: monthInfo.startTermName,
          endTermName: monthInfo.endTermName,
        },
      ],
      dayBreakdown: breakdown,
      displayLabel: `${yearItem.year}年${monthInfo.month}`,
      displayText: `${yearItem.year}年 ${monthInfo.month}（${monthInfo.ganZhi}，${monthInfo.startDateTime || monthInfo.startDate} 起，至 ${monthInfo.endDateTime || monthInfo.endDate} 交下节）`,
      promptPayload: {
        scopeLabel: `分析对象：${yearItem.year}年${monthInfo.month}流月`,
        summaryLines: [
          `所属大运：${cycleLabel}`,
          `所属流年：${yearItem.year}年 ${yearItem.ganZhi}`,
          `流月：${monthInfo.month} ${monthInfo.ganZhi}`,
          `流月十神：${formatGanZhiTenGod(result, monthInfo.ganZhi)}`,
          buildGanZhiTriggerSummary(result, monthInfo.ganZhi, '流月'),
          `日期范围：${monthInfo.startDate} 至 ${monthInfo.endDate}`,
          `交节时刻：${monthInfo.startTermName || ''} ${monthInfo.startDateTime || ''} 起，${monthInfo.endTermName || ''} ${monthInfo.endDateTime || ''} 交下节`,
        ],
        breakdownTitle: '该流月包含的流日',
        breakdownLines: breakdown.map(
          (item) =>
            `${item.date} ${item.ganZhi}｜十神 ${formatGanZhiTenGod(result, item.ganZhi)}${item.boundaryNote ? `｜${item.boundaryNote}` : ''}`,
        ),
      },
    };
  }

  if (!dayInfo || !normalized.day) {
    return null;
  }

  const actualDate = dayInfo.solarDate;
  const [actualYear, actualMonth, actualDay] = actualDate.split('-').map(Number);
  const hourBreakdown = getDayHourBreakdown(actualYear, actualMonth, actualDay);
  const previousDate = new Date(actualYear, actualMonth - 1, actualDay - 1);
  const ziChuStart = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${String(previousDate.getDate()).padStart(2, '0')} 23:00`;
  const ziChuEnd = `${actualDate} 22:59`;

  return {
    ...baseContext,
    scope: 'day',
    month: normalized.month,
    monthGanZhi: monthInfo.ganZhi,
    monthLabel: monthInfo.month,
    hourBreakdown,
    dayBreakdown: [
      {
        date: actualDate,
        label: dayInfo.solarLabel,
        ganZhi: dayInfo.ganZhi,
      },
    ],
    displayLabel: actualDate,
    displayText: `${actualDate}（${dayInfo.ganZhi}）`,
    promptPayload: {
      scopeLabel: `分析对象：${actualDate}流日`,
      summaryLines: [
        `所属大运：${cycleLabel}`,
        `所属流年：${yearItem.year}年 ${yearItem.ganZhi}`,
        `所属流月：${monthInfo.month} ${monthInfo.ganZhi}`,
        `流日：${actualDate} ${dayInfo.ganZhi}`,
        `流日十神：${formatGanZhiTenGod(result, dayInfo.ganZhi)}`,
        buildGanZhiTriggerSummary(result, dayInfo.ganZhi, '流日'),
        `按子初换日：${ziChuStart} 至 ${ziChuEnd}`,
        ...(dayInfo.boundaryNote ? [`交节提示：${dayInfo.boundaryNote}`] : []),
      ],
      breakdownTitle: '该流日包含的流时',
      breakdownLines: hourBreakdown.map((item) =>
        `${item.label} ${item.timeRange || ''} ${item.ganZhi}`.trim(),
      ),
    },
  };
}
