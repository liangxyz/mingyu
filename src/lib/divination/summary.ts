/**
 * 占卜结果摘要:把不同卦种的输出统一格式化为标签+明细行,供 UI 渲染。
 */

import type { DivinationDraft } from './engine';
import type { DivinationData } from '@/types/divination';

export interface DivinationSummaryBlocks {
  title: string;
  tags: string[];
  lines: string[];
}

export function getDivinationSummaryBlocks(
  method: DivinationDraft['method'],
  data: DivinationData,
): DivinationSummaryBlocks {
  switch (method) {
    case 'liuyao':
      return {
        title: '六爻起卦结果',
        tags: [
          `主卦：${'originalName' in data ? data.originalName : '未知'}`,
          `变卦：${'changedName' in data ? data.changedName || '无' : '无'}`,
          `互卦：${'interName' in data ? data.interName || '无' : '无'}`,
          `动爻：${'changingYaos' in data ? data.changingYaos.map((item) => item.position).join('、') || '无' : '无'}`,
        ],
        lines: [
          `宫位：${'palace' in data ? `${data.palace.name}宫` : '未知'}`,
          `特殊卦式：${'specialPattern' in data && data.specialPattern ? data.specialPattern : '常规卦'}`,
        ],
      };
    case 'meihua':
      return {
        title: '梅花起卦结果',
        tags: [
          `主卦：${'originalName' in data ? data.originalName : '未知'}`,
          `互卦：${'interName' in data ? data.interName || '无' : '无'}`,
          `变卦：${'changedName' in data ? data.changedName || '无' : '无'}`,
          `动爻：${'movingYao' in data ? `第${data.movingYao.position}爻` : '未知'}`,
        ],
        lines: [
          `体卦：${'tiGua' in data ? `${data.tiGua.name}（${data.tiGua.element}）` : '未知'}`,
          `用卦：${'yongGua' in data ? `${data.yongGua.name}（${data.yongGua.element}）` : '未知'}`,
        ],
      };
    case 'qimen':
      return {
        title: '奇门起局结果',
        tags: [
          `局数：${'isYangDun' in data ? `${data.isYangDun ? '阳遁' : '阴遁'}${data.juShu}局` : '未知'}`,
          `值符：${'zhiFu' in data ? data.zhiFu : '未知'}`,
          `值使：${'zhiShi' in data ? data.zhiShi : '未知'}`,
        ],
        lines: [
          `节气：${'timeInfo' in data ? data.timeInfo.solarTerm : '未知'}`,
          `格局标签：${'patternTags' in data && data.patternTags?.length ? data.patternTags.join('、') : '无明显标签'}`,
        ],
      };
    case 'liuren':
      return {
        title: '大六壬起课结果',
        tags: [
          `时段：${'dayNight' in data && data.dayNight ? data.dayNight : '未知'}`,
          `月将：${'monthLeader' in data ? data.monthLeader : '未知'}`,
          `占时：${'divinationBranch' in data ? data.divinationBranch : '未知'}`,
          `初传：${'threeTransmissions' in data ? data.threeTransmissions[0]?.branch || '未知' : '未知'}`,
          `末传：${'threeTransmissions' in data ? data.threeTransmissions[2]?.branch || '未知' : '未知'}`,
        ],
        lines: [
          `贵人落地：${'noblemanBranch' in data && data.noblemanBranch ? data.noblemanBranch : '未知'}`,
          `旬空：${'xunKong' in data && data.xunKong?.length ? data.xunKong.join('、') : '未知'}`,
          `取传法：${'transmissionRule' in data && data.transmissionRule ? data.transmissionRule : '未标注'}`,
          `传态：${'transmissionPattern' in data && data.transmissionPattern ? data.transmissionPattern : '未标注'}`,
          `课体标签：${'patternTags' in data && data.patternTags?.length ? data.patternTags.join('、') : '无明显标签'}`,
          'transmissionDetail' in data && data.transmissionDetail
            ? `取传说明：${data.transmissionDetail}`
            : '',
          'lessonSummary' in data && data.lessonSummary ? `四课：${data.lessonSummary}` : '',
          'transmissionSummary' in data && data.transmissionSummary
            ? `三传：${data.transmissionSummary}`
            : '',
        ],
      };
    case 'tarot':
      return {
        title: '塔罗抽牌结果',
        tags: [
          `牌阵：${'spreadName' in data ? data.spreadName : '未知'}`,
          `张数：${'cards' in data ? `${data.cards.length} 张` : '未知'}`,
        ],
        lines:
          'cards' in data
            ? data.cards.map(
                (card) =>
                  `${card.position}：${card.name}${card.reversed ? '（逆位）' : ''}，关键词 ${card.keywords.join('、')}`,
              )
            : [],
      };
    case 'ssgw':
      return {
        title: '灵签结果',
        tags: [
          `签号：${'number' in data ? `第 ${data.number} 签` : '未知'}`,
          `签题：${'title' in data ? data.title : '未知'}`,
        ],
        lines: ['poem' in data ? `签诗：${data.poem}` : ''],
      };
    default:
      return {
        title: '占卜结果',
        tags: [],
        lines: [],
      };
  }
}
