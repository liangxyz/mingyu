import { tiangan, jiazi, qimen } from '../../../../../config/divination-data.ts';

const { dizhi, diPanPalaces, palaceStars, palaceDoorMap, jieQiJuShuMap } = qimen;
const tenStems = tiangan;

/**
 * 定局数
 * @param timeInfo 时间信息，包含节气和日干支
 * @returns 返回{阴阳遁, 局数}
 */
export function getQimenJuShu(timeInfo: { jieQi: string; ganzhi: { day: string } }) {
  const { jieQi, ganzhi } = timeInfo;
  const dayGanZhi = ganzhi.day;

  const rule = jieQiJuShuMap[jieQi as keyof typeof jieQiJuShuMap];
  if (!rule) {
    throw new Error(`找不到节气 "${jieQi}" 对应的局数规则。`);
  }

  // 阴阳遁严格按节气划分
  const isYangDun = rule.dun === '阳';

  // 拆补法按五日一元轮转：上元、中元、下元循环。
  const dayIndex = jiazi.indexOf(dayGanZhi);
  if (dayIndex === -1) {
    throw new Error(`无法识别日干支 "${dayGanZhi}" 的三元归属。`);
  }
  const yuanIndex = Math.floor(dayIndex / 5) % 3;
  const yuan = ['上元', '中元', '下元'][yuanIndex];

  const juShu = rule.ju[yuanIndex];

  return { isYangDun, juShu, yuan };
}

/**
 * 检查特殊时辰情况
 * @param hourGanZhi 时辰干支
 * @returns 返回特殊时辰信息
 */
export function checkSpecialHourConditions(hourGanZhi: string) {
  const hourGan = hourGanZhi.charAt(0);
  const hourZhi = hourGanZhi.charAt(1);

  const specialConditions = {
    isLiuJiaHour: false, // 六甲时辰
    isLiuGuiHour: false, // 六癸时辰
    isShiGanRuMu: false, // 时干入墓
    isWuBuYuShi: false, // 五不遇时
    description: '',
  };

  // 1. 检查六甲时辰（甲子、甲戌、甲申、甲午、甲辰、甲寅）
  const liuJiaHours = ['甲子', '甲戌', '甲申', '甲午', '甲辰', '甲寅'];
  if (liuJiaHours.includes(hourGanZhi)) {
    specialConditions.isLiuJiaHour = true;
    specialConditions.description += '六甲时辰（甲时），甲遁于六仪之下；';
  }

  // 2. 检查六癸时辰（癸未、癸巳、癸卯、癸丑、癸亥、癸酉）
  const liuGuiHours = ['癸未', '癸巳', '癸卯', '癸丑', '癸亥', '癸酉'];
  if (liuGuiHours.includes(hourGanZhi)) {
    specialConditions.isLiuGuiHour = true;
    specialConditions.description += '六癸时辰，癸为阴干之末；';
  }

  // 3. 检查时干入墓
  // 时干入墓规则：乙入坤宫（未），丙戊入乾宫（戌），丁入艮宫（丑），己入巽宫（辰），庚入坤宫（未），辛入艮宫（丑），壬入巽宫（辰），癸入离宫（午）
  const ruMuMap: { [key: string]: { palace: number; branch: string } } = {
    乙: { palace: 2, branch: '未' }, // 坤二宫
    丙: { palace: 6, branch: '戌' }, // 乾六宫
    戊: { palace: 6, branch: '戌' }, // 乾六宫
    丁: { palace: 8, branch: '丑' }, // 艮八宫
    己: { palace: 4, branch: '辰' }, // 巽四宫
    庚: { palace: 2, branch: '未' }, // 坤二宫
    辛: { palace: 8, branch: '丑' }, // 艮八宫
    壬: { palace: 4, branch: '辰' }, // 巽四宫
    癸: { palace: 9, branch: '午' }, // 离九宫
  };

  const ruMuInfo = ruMuMap[hourGan];
  if (ruMuInfo && hourZhi === ruMuInfo.branch) {
    specialConditions.isShiGanRuMu = true;
    specialConditions.description += `时干${hourGan}入墓（${ruMuInfo.branch}支）；`;
  }

  // 4. 检查五不遇时
  // 五不遇时：时干克时支，且时干为阳干、时支为阳支，或时干为阴干、时支为阴支
  // 具体组合：甲申、乙酉、丙子、丁亥、戊寅、己卯、庚午、辛巳、壬辰、癸未
  const wuBuYuShiHours = [
    '甲申',
    '乙酉',
    '丙子',
    '丁亥',
    '戊寅',
    '己卯',
    '庚午',
    '辛巳',
    '壬辰',
    '癸未',
  ];
  if (wuBuYuShiHours.includes(hourGanZhi)) {
    specialConditions.isWuBuYuShi = true;
    specialConditions.description += '五不遇时（时干克时支），凶时；';
  }

  return specialConditions;
}

/**
 * 寻值符与值使
 * @param hourGanZhi 时辰干支
 * @returns 返回{值符, 值使, 值符所在宫, 特殊时辰情况}
 */
export function getZhiFuZhiShi(hourGanZhi: string) {
  // 法理：值符与值使由时辰干支所属的"旬"来决定。
  // 旬首（如甲子）所在的地盘宫位，其对应的星为值符，门为值使。
  const hourGan = hourGanZhi.charAt(0);
  const hourZhi = hourGanZhi.charAt(1);

  const hourGanIndex = tenStems.indexOf(hourGan);
  const hourZhiIndex = dizhi.indexOf(hourZhi);

  const xunShouZhiIndex = (hourZhiIndex - hourGanIndex + 12) % 12;
  const xunShouZhi = dizhi[xunShouZhiIndex];

  const xunShouPalace = diPanPalaces[xunShouZhi as keyof typeof diPanPalaces];

  const zhiFu = palaceStars[xunShouPalace - 1];
  const zhiShi = palaceDoorMap[xunShouPalace as keyof typeof palaceDoorMap];

  // 检查特殊时辰情况
  const specialConditions = checkSpecialHourConditions(hourGanZhi);

  return { zhiFu, zhiShi, zhiFuPalace: xunShouPalace, specialConditions };
}
