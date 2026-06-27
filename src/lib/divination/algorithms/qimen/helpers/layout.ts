import { qimen } from '../../../../../config/divination-data.ts';
import { getDunJiaStem } from './palace-utils';

const { diPanPalaces, palaceStars, palaceDoors, yangGods, yinGods, ninePositions } = qimen;

export type QimenMethod = 'zhuanpan' | 'feipan';

export function arrangeJiuGongGe(
  isYangDun: boolean,
  juShu: number,
  zhiFu: string,
  zhiShi: string,
  ganzhi: { hour: string },
  method: QimenMethod = 'zhuanpan',
) {
  const jiuGong = Array.from({ length: 9 }, (_, i) => ({
    gong: i + 1,
    name: ninePositions[i].name,
    direction: ninePositions[i].direction,
    element: ninePositions[i].element,
    tianPan: { star: '', stem: '' },
    diPan: { stem: '' },
    renPan: { door: '' },
    shenPan: { god: '' },
  }));

  //【核心修正：重构整个排盘逻辑】
  // 奇门排盘需严格遵循“地、天、人、神”四盘的顺序和法理，原算法多处错乱。
  // 以下为拨乱反正后的正确步骤：

  // 步骤一：排地盘三奇六仪 (Di Pan)
  // 法理：三奇六仪按固定顺序，根据阳遁顺行、阴遁逆行的方式，从局数对应的宫位开始排布。
  const sanQiLiuYi = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
  let centerJiGongStem = '';

  // 先按正常顺序排布
  for (let i = 0; i < 9; i++) {
    const palaceNum = isYangDun ? ((juShu + i - 1 + 9) % 9) + 1 : ((juShu - i - 1 + 9) % 9) + 1;
    jiuGong[palaceNum - 1].diPan.stem = sanQiLiuYi[i];
  }

  // 法理：戊土居中宫，需寄于坤二宫。
  // 但要注意：只有当戊土确实在中五宫时才需要寄宫
  if (jiuGong[4].diPan.stem === '戊') {
    // 如果中五宫有戊土
    centerJiGongStem = '戊';
    jiuGong[4].diPan.stem = ''; // 中五宫地盘不布干
  }

  // 步骤二：定值符与值使的落宫
  // 法理：值符（星）追随时干，值使（门）追随时支。
  const hourZhi = ganzhi.hour.charAt(1);
  const hourGanForFind = getDunJiaStem(ganzhi.hour);

  let zhiFuLandingPalace = -1; // 值符星所落之宫

  // 修复时干落宫查找逻辑
  // 需要考虑戊土寄宫的情况：戊土既可能在中五宫，也可能寄在坤二宫
  for (let i = 0; i < 9; i++) {
    if (jiuGong[i].diPan.stem === hourGanForFind) {
      zhiFuLandingPalace = i + 1;
      break;
    }
  }

  // 如果没找到，可能是特殊情况，需要进一步处理
  if (zhiFuLandingPalace === -1) {
    if (centerJiGongStem && hourGanForFind === centerJiGongStem) {
      zhiFuLandingPalace = 2;
    }

    // 如果还是找不到，抛出详细的错误信息
    if (zhiFuLandingPalace === -1) {
      throw new Error(`找不到时干${hourGanForFind}落宫，请检查地盘排布逻辑`);
    }
  }

  const zhiShiLandingPalace = diPanPalaces[hourZhi as keyof typeof diPanPalaces]; // 值使门所落之宫
  if (zhiShiLandingPalace === undefined) {
    throw new Error(`找不到时支 "${hourZhi}" 对应的地盘宫位。`);
  }

  // 步骤三：排天盘九星与天干 (Tian Pan)
  // 法理：天盘九星由值符星带领，从值符落宫开始，按九宫顺序（阳顺阴逆）飞布。
  // 天盘天干则随其所附之星飞布，即“星带干飞”。
  const zhiFuStarIndex = palaceStars.indexOf(zhiFu);
  const luoShuPathForTian = [1, 8, 3, 4, 9, 2, 7, 6]; // 洛书轨迹

  if (method === 'feipan') {
    // 飞盘法：天盘九星按洛书轨迹飞布
    const zhiFuLuoShuIndex = luoShuPathForTian.indexOf(zhiFuLandingPalace);
    for (let i = 0; i < 8; i++) {
      const starIndex = (zhiFuStarIndex + i + 8) % 8;
      const luoShuIndex = (zhiFuLuoShuIndex + (isYangDun ? i : -i) + 8) % 8;
      const palaceNum = luoShuPathForTian[luoShuIndex];
      const star = palaceStars[starIndex];
      jiuGong[palaceNum - 1].tianPan.star = star;

      // 天盘之干，是该星在地盘的”老家”的那个干
      let originalStarPalaceIndex = starIndex;
      if (star === '天禽' && centerJiGongStem) {
        jiuGong[palaceNum - 1].tianPan.stem = centerJiGongStem;
        continue;
      }
      if (star === '天禽' && !jiuGong[4].diPan.stem) {
        originalStarPalaceIndex = 1;
      }
      jiuGong[palaceNum - 1].tianPan.stem = jiuGong[originalStarPalaceIndex].diPan.stem;
    }
  } else {
    // 转盘法：天盘九星整体旋转
    for (let i = 0; i < 9; i++) {
      const palaceIndex = (zhiFuLandingPalace - 1 + (isYangDun ? i : -i) + 9) % 9;
      const starIndex = (zhiFuStarIndex + i + 9) % 9;
      const star = palaceStars[starIndex];
      jiuGong[palaceIndex].tianPan.star = star;

      // 关键：天盘之干，是该星在地盘的”老家”的那个干。
      let originalStarPalaceIndex = starIndex;
      if (star === '天禽' && centerJiGongStem) {
        jiuGong[palaceIndex].tianPan.stem = centerJiGongStem;
        continue;
      }
      // 天禽星的老家是中五宫，但中五宫无干时采用寄宫。
      if (star === '天禽' && !jiuGong[4].diPan.stem) {
        originalStarPalaceIndex = 1;
      }
      jiuGong[palaceIndex].tianPan.stem = jiuGong[originalStarPalaceIndex].diPan.stem;
    }
  }

  // 步骤四：排神盘八神 (Shen Pan)
  // 法理：八神分阴阳遁有不同顺序。小值符（八神之首）永远追随大值符（天盘值符星）。
  const currentGods = isYangDun ? yangGods : yinGods;
  const shenPanPalaces: number[] = [];
  for (let offset = 0; shenPanPalaces.length < 8; offset++) {
    const palaceNum = ((zhiFuLandingPalace - 1 + (isYangDun ? offset : -offset) + 18) % 9) + 1;
    if (palaceNum === 5) {
      continue;
    }
    shenPanPalaces.push(palaceNum);
  }
  currentGods.forEach((god, index) => {
    const palaceNum = shenPanPalaces[index];
    jiuGong[palaceNum - 1].shenPan.god = god;
  });

  // 步骤五：排人盘八门 (Ren Pan)
  // 法理：八门由值使门带领，从值使落宫开始，严格遵循“洛书九宫”的飞行轨迹（1->8->3->4->9->2->7->6）排布。
  const zhiShiDoorIndex = palaceDoors.indexOf(zhiShi);
  const luoShuPath = [1, 8, 3, 4, 9, 2, 7, 6]; // 洛书轨迹，不含中五
  const zhiShiLuoShuIndex = luoShuPath.indexOf(zhiShiLandingPalace);

  for (let i = 0; i < 8; i++) {
    const doorIndex = (zhiShiDoorIndex + i + 8) % 8;
    const luoShuIndex = (zhiShiLuoShuIndex + (isYangDun ? i : -i) + 8) % 8;
    const palaceNum = luoShuPath[luoShuIndex];
    jiuGong[palaceNum - 1].renPan.door = palaceDoors[doorIndex];
  }

  return jiuGong;
}
