import type { MeihuaCalculation, MeihuaExternalOmens } from '../../../../../types/divination';
import { dizhi } from '../../../../../config/divination-data';
import {
  meihuaAnimalMap,
  meihuaColorMap,
  meihuaDirectionMap,
  meihuaObjectMap,
  meihuaOmenPriority,
  meihuaPersonMap,
  meihuaSoundMap,
} from '../../../../../config/meihua-omens';
import { MeihuaHelpers } from '../../../../../utils/divination-helpers';
import { getDivinationTime } from '../../../../../utils/timeManager';

export type MappedExternalOmen = {
  source: (typeof meihuaOmenPriority)[number];
  label: string;
  trigramIndex: number;
  trigramName: string;
};

export interface MeihuaMethodResult {
  upperTrigramIndex: number;
  lowerTrigramIndex: number;
  movingYaoIndex: number;
  calculation: MeihuaCalculation;
}

export function resolveTimeMethod(
  ganzhi: ReturnType<typeof getDivinationTime>['ganzhi'],
  lunar: ReturnType<typeof getDivinationTime>['timeInfo']['lunar'],
): MeihuaMethodResult {
  const yearZhi = ganzhi.year.substring(1, 2);
  const month = lunar.monthNumber;
  const day = lunar.dayNumber;
  const timeZhi = ganzhi.hour.substring(1, 2);
  const yearZhiIndex = dizhi.indexOf(yearZhi) + 1;
  const timeZhiIndex = dizhi.indexOf(timeZhi) + 1;
  const upperTrigramIndex = (yearZhiIndex + month + day) % 8 || 8;
  const lowerTrigramIndex = (yearZhiIndex + month + day + timeZhiIndex) % 8 || 8;
  const movingYaoIndex = (yearZhiIndex + month + day + timeZhiIndex) % 6 || 6;

  return {
    upperTrigramIndex,
    lowerTrigramIndex,
    movingYaoIndex,
    calculation: {
      method: '年月日时起卦法',
      methodKey: 'time',
      yearZhi,
      yearZhiIndex,
      month,
      day,
      timeZhi,
      timeZhiIndex,
      upperTrigramIndex,
      lowerTrigramIndex,
      movingYaoIndex,
    },
  };
}

export function resolveNumberMethod(number: number): MeihuaMethodResult {
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error('数字起卦必须提供正整数');
  }

  const upperTrigramIndex = number % 8 || 8;
  const lowerTrigramIndex = Math.floor(number / 8) % 8 || 8;
  const movingYaoIndex = number % 6 || 6;

  return {
    upperTrigramIndex,
    lowerTrigramIndex,
    movingYaoIndex,
    calculation: {
      method: '数字起卦法',
      methodKey: 'number',
      number,
      upperTrigramIndex,
      lowerTrigramIndex,
      movingYaoIndex,
    },
  };
}

export function resolveRandomMethod(): MeihuaMethodResult {
  const upperTrigramIndex = Math.floor(Math.random() * 8) + 1;
  const lowerTrigramIndex = Math.floor(Math.random() * 8) + 1;
  const movingYaoIndex = Math.floor(Math.random() * 6) + 1;

  return {
    upperTrigramIndex,
    lowerTrigramIndex,
    movingYaoIndex,
    calculation: {
      method: '随机起卦法',
      methodKey: 'random',
      upperTrigramIndex,
      lowerTrigramIndex,
      movingYaoIndex,
    },
  };
}

function mapExternalOmens(externalOmens: MeihuaExternalOmens): MappedExternalOmen[] {
  const mapped: MappedExternalOmen[] = [];

  for (const source of meihuaOmenPriority) {
    const value = externalOmens[source];
    if (!value) {
      continue;
    }

    let mappedOmen:
      | {
          trigramIndex: number;
          trigramName: string;
        }
      | undefined;

    switch (source) {
      case 'direction':
        mappedOmen = meihuaDirectionMap[value as keyof typeof meihuaDirectionMap];
        break;
      case 'person':
        mappedOmen = meihuaPersonMap[value as keyof typeof meihuaPersonMap];
        break;
      case 'animal':
        mappedOmen = meihuaAnimalMap[value as keyof typeof meihuaAnimalMap];
        break;
      case 'object':
        mappedOmen = meihuaObjectMap[value as keyof typeof meihuaObjectMap];
        break;
      case 'sound':
        mappedOmen = meihuaSoundMap[value as keyof typeof meihuaSoundMap];
        break;
      case 'color':
        mappedOmen = meihuaColorMap[value as keyof typeof meihuaColorMap];
        break;
    }

    if (!mappedOmen) {
      continue;
    }
    mapped.push({
      source,
      label: value,
      trigramIndex: mappedOmen.trigramIndex,
      trigramName: mappedOmen.trigramName,
    });
  }

  return mapped;
}

export function resolveExternalMethod(externalOmens?: MeihuaExternalOmens): MeihuaMethodResult {
  if (!externalOmens) {
    throw new Error('外应起卦必须提供外应信息');
  }

  const mappedOmens = mapExternalOmens(externalOmens);
  if (mappedOmens.length < 2) {
    throw new Error('外应起卦至少需要两项可映射的外应');
  }
  if (!Number.isInteger(externalOmens.count) || (externalOmens.count || 0) <= 0) {
    throw new Error('外应起卦必须提供数量');
  }

  const upperTrigramIndex = mappedOmens[0].trigramIndex;
  const lowerTrigramIndex = mappedOmens[1].trigramIndex;
  const movingYaoIndex = externalOmens.count! % 6 || 6;
  const externalSummary = mappedOmens
    .map(
      (omen) =>
        `${MeihuaHelpers.getExternalOmenSourceLabel(omen.source)}：${omen.label}（${omen.trigramName}）`,
    )
    .concat(`数量：${externalOmens.count}`)
    .join('；');

  return {
    upperTrigramIndex,
    lowerTrigramIndex,
    movingYaoIndex,
    calculation: {
      method: '外应起卦法',
      methodKey: 'external',
      externalOmens,
      externalSummary,
      externalMappedOmens: mappedOmens.map((omen) => ({
        source: omen.source,
        label: omen.label,
        trigram: omen.trigramName,
        trigramIndex: omen.trigramIndex,
      })),
      upperTrigramIndex,
      lowerTrigramIndex,
      movingYaoIndex,
    },
  };
}
