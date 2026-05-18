/**
 * @file 奇门遁甲排盘算法
 * @description 基于转盘奇门法，实现时家奇门的排盘。
 * @流派 奇门遁甲（转盘法）
 * @核心思想
 * 1. 定局数：根据占测当日的节气，以及日干支所属的“旬”，来确定使用阴阳几局。此为奇门之钥。
 * 2. 排地盘：将三奇六仪（戊己庚辛壬癸丁丙乙）按照阳顺阴逆的规则，从局数宫位开始布满九宫。
 * 3. 寻值符值使：根据时辰干支所属的旬，找到旬首，从而定出此局的“值符”（九星之一）和“值使”（八门之一）。
 * 4. 排天盘：值符星追随时干，找到时干在地盘的落宫，值符星即落此宫，其余八星按原宫位顺序随之旋转。天盘之干则随星飞走。
 * 5. 排人盘：值使门追随时支，找到时支的落宫，值使门即落此宫，其余七门按“洛书轨迹”旋转。
 * 6. 排神盘：八神（或称九神）追随天盘值符星，阳顺阴逆飞布八宫。
 */
import { getDivinationTime } from '../../../../utils/timeManager.ts';
import { getVoidBranches } from '../../../../utils/lunar.ts';
import { qimen } from '../../../../config/divination-data.ts';
import { getQimenJuShu, getZhiFuZhiShi } from './helpers/jushu';
import { getDunJiaStem } from './helpers/palace-utils';
import { arrangeJiuGongGe } from './helpers/layout';
import { buildPalaceInsights, buildPatternDetails, getQimenPatternTags } from './helpers/patterns';

const { diPanPalaces } = qimen;

function getPalaceName(jiuGongGe: ReturnType<typeof arrangeJiuGongGe>, palace: number) {
  return jiuGongGe.find((item) => item.gong === palace)?.name || `${palace}宫`;
}

function resolveQimenBranchPalace(branch: string, jiuGongGe: ReturnType<typeof arrangeJiuGongGe>) {
  const palace = diPanPalaces[branch as keyof typeof diPanPalaces];
  if (!palace) return null;

  return {
    branch,
    palace,
    name: getPalaceName(jiuGongGe, palace),
  };
}

function getHorseBranch(sourceBranch: string) {
  if (['申', '子', '辰'].includes(sourceBranch)) return '寅';
  if (['寅', '午', '戌'].includes(sourceBranch)) return '申';
  if (['亥', '卯', '未'].includes(sourceBranch)) return '巳';
  if (['巳', '酉', '丑'].includes(sourceBranch)) return '亥';
  return '';
}

/**
 * 生成奇门遁甲盘
 * @param customDate 自定义时间，若不提供则使用当前时间
 * @returns 返回一个完整的奇门遁甲盘数据对象
 */
export function generateQimen(customDate?: Date) {
  const { timeInfo, ganzhi, timestamp } = getDivinationTime(customDate);
  const { jieQi } = timeInfo;

  const { isYangDun, juShu, yuan } = getQimenJuShu(timeInfo);
  const { zhiFu, zhiShi, specialConditions } = getZhiFuZhiShi(ganzhi.hour);
  const jiuGongGe = arrangeJiuGongGe(isYangDun, juShu, zhiFu, zhiShi, { hour: ganzhi.hour });
  const hourZhi = ganzhi.hour.charAt(1);
  const hourGanForFind = getDunJiaStem(ganzhi.hour);
  const voidBranches = getVoidBranches(ganzhi.hour);
  const voidPalaces = voidBranches
    .map((branch) => resolveQimenBranchPalace(branch, jiuGongGe))
    .filter(Boolean);
  const horseBranch = getHorseBranch(hourZhi);
  const horsePalace = horseBranch ? resolveQimenBranchPalace(horseBranch, jiuGongGe) : null;
  const zhiFuLandingPalace = jiuGongGe.find((gong) => gong.tianPan.star === zhiFu)?.gong;
  if (zhiFuLandingPalace === undefined) {
    throw new Error(`找不到值符星 "${zhiFu}" 落宫。`);
  }
  const zhiShiLandingPalace = diPanPalaces[hourZhi as keyof typeof diPanPalaces];
  if (zhiShiLandingPalace === undefined) {
    throw new Error(`找不到时支 "${hourZhi}" 对应的地盘宫位。`);
  }
  const patternTags = getQimenPatternTags({
    zhiFu,
    zhiShi,
    zhiFuLandingPalace,
    zhiShiLandingPalace,
    jiuGongGe,
    hourGanForFind,
  });
  const patternDetails = buildPatternDetails(patternTags);
  const palaceInsights = buildPalaceInsights({
    jiuGongGe,
    zhiFu,
    zhiShi,
    patternTags,
  });

  return {
    timeInfo: {
      solarTerm: jieQi,
      epoch: yuan,
    },
    ganzhi,
    isYangDun,
    juShu,
    zhiFu,
    zhiShi,
    patternTags,
    patternDetails,
    palaceInsights,
    voidBranches,
    voidPalaces,
    horseStar: horsePalace
      ? {
          ...horsePalace,
          sourceBranch: hourZhi,
        }
      : undefined,
    specialConditions,
    jiuGongGe,
    timestamp,
  };
}

export { getHorseBranch, resolveQimenBranchPalace };
