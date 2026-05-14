import type { AnalysisPayloadV1 } from '@/types/analysis';
import { formatPalaceName } from './labels';
import {
  buildScopeFocusPalaces,
  dedupePalaces,
  getBodyPalace,
  getOppositePalace,
  getPalaceByIndex,
  getPalaceByName,
  getSurroundedPalaces,
} from './palace-helpers';
import type { PromptContext } from './types';

export function buildFocusTaskBundle(payload: AnalysisPayloadV1, reportContext: PromptContext) {
  const activePalace = getPalaceByIndex(payload, payload.active_scope.palace_index);
  const bodyPalace = getBodyPalace(payload);
  const mingPalace = getPalaceByName(payload, '命宫');
  const spousePalace = getPalaceByName(payload, '夫妻');
  const childrenPalace = getPalaceByName(payload, '子女');
  const wealthPalace = getPalaceByName(payload, '财帛');
  const travelPalace = getPalaceByName(payload, '迁移');
  const careerPalace = getPalaceByName(payload, '官禄');
  const housePalace = getPalaceByName(payload, '田宅');
  const fortunePalace = getPalaceByName(payload, '福德');

  switch (`${reportContext.selected_topic}:${reportContext.report_type}`) {
    case 'destiny:destiny-overview':
      return {
        focusSummary: '概括命盘底色、核心驱动力、主要优势与人生主线。',
        focusPalaces: dedupePalaces([
          mingPalace,
          bodyPalace,
          fortunePalace,
          careerPalace,
          wealthPalace,
          travelPalace,
        ]),
        outputFocus: [
          '先判断整张命盘的底色与主导力量。',
          '再提炼最值得优先关注的 1 到 3 条人生主轴。',
          '每个结论都要能对应到具体宫位、主星、四化或运限触发。',
        ],
        avoid: ['保持命局综述视角，围绕主线组织内容。'],
      };
    case 'destiny:palace': {
      const selectedPalace = reportContext.palace_name
        ? getPalaceByName(payload, reportContext.palace_name)
        : null;
      return {
        focusSummary: `只解读${formatPalaceName(
          selectedPalace?.name ?? reportContext.palace_name ?? '当前宫位',
        )}本身，以及它的对宫与三方四正如何共同作用。`,
        focusPalaces: dedupePalaces([
          selectedPalace,
          getOppositePalace(payload, selectedPalace),
          ...getSurroundedPalaces(payload, selectedPalace),
        ]),
        outputFocus: [
          '先说明当前宫位的核心主题、主导星曜和关键标签。',
          '再结合对宫、三方四正说明支持、放大或牵制关系。',
          '建议只能围绕这一组宫位结构，不要跳去别的专题。',
        ],
        avoid: ['围绕当前宫位及其关联结构给出结论与建议。'],
      };
    }
    case 'destiny:scope':
      return {
        focusSummary: `聚焦${payload.active_scope.label}对本命主线的实际触发，判断这一阶段的重点变化与优先级。`,
        focusPalaces: dedupePalaces([
          activePalace,
          ...buildScopeFocusPalaces(payload),
          mingPalace,
          fortunePalace,
          careerPalace,
          travelPalace,
        ]).slice(0, 6),
        outputFocus: [
          '先判断这一阶段最强的触发点。',
          '说明它如何影响本命主线和原有格局。',
          '把结论落到阶段机会、阻力与行动优先级。',
        ],
        avoid: ['聚焦当前阶段触发，围绕阶段变化与优先级作答。'],
      };
    case 'relationship:relationship':
      return {
        focusSummary: '只解读婚姻感情、亲密关系、相处模式与当前阶段触发。',
        focusPalaces: dedupePalaces([
          spousePalace,
          mingPalace,
          fortunePalace,
          childrenPalace,
          travelPalace,
          activePalace,
        ]),
        outputFocus: [
          '优先判断关系模式、推进阻力与情绪互动。',
          '说明哪些结论来自夫妻宫、命宫、福德宫、子女宫或当前运限触发。',
          '建议要贴合当前阶段，不要空泛劝说。',
        ],
        avoid: ['围绕关系议题作答，并保持证据对应。'],
      };
    case 'career-wealth:career-wealth':
      return {
        focusSummary: '只解读事业路径、财运抓手、资源配置与执行节奏。',
        focusPalaces: dedupePalaces([
          careerPalace,
          wealthPalace,
          mingPalace,
          fortunePalace,
          housePalace,
          travelPalace,
          activePalace,
        ]),
        outputFocus: [
          '区分事业发展、赚钱方式和资源落点。',
          '说明当前运限在哪些宫位形成机会或阻力。',
          '建议要体现先后顺序和风险控制。',
        ],
        avoid: ['围绕事业与财务议题作答，财务判断用趋势与条件表述。'],
      };
    case 'life:life':
      return {
        focusSummary: '聚焦人生主线、阶段重点、长期方向与短期动作的衔接。',
        focusPalaces: dedupePalaces([
          mingPalace,
          bodyPalace,
          fortunePalace,
          careerPalace,
          wealthPalace,
          travelPalace,
          activePalace,
        ]),
        outputFocus: [
          '先概括主线，再区分长期与短期重点。',
          '如果当前有运限触发，要说明它如何改变节奏。',
          '建议必须能够落到当前阶段的行动次序。',
        ],
        avoid: ['围绕人生主线作答，并体现当前运限对节奏的影响。'],
      };
    case 'chat:chat':
      return {
        focusSummary: '以用户问题为中心，在全盘范围内自由问答，必要时结合当前运限给出可执行建议。',
        focusPalaces: dedupePalaces([
          mingPalace,
          bodyPalace,
          fortunePalace,
          careerPalace,
          wealthPalace,
          spousePalace,
          travelPalace,
          activePalace,
        ]).slice(0, 8),
        outputFocus: [
          '先直接回答问题，再补充关键依据。',
          '优先使用宫位、主星、四化、运限命中、证据摘要来支撑结论。',
          '建议要具体可执行，避免空泛表述。',
        ],
        avoid: ['以用户问题为中心，结论基于盘面证据。'],
      };
    default:
      return {
        focusSummary: '根据用户问题，结合盘面与运限进行问答与建议。',
        focusPalaces: dedupePalaces([
          mingPalace,
          bodyPalace,
          careerPalace,
          wealthPalace,
          spousePalace,
          activePalace,
        ]).slice(0, 6),
        outputFocus: ['先回答用户问题，再说明盘面依据。', '给出可操作建议，并区分短期与中期。'],
        avoid: ['保持证据驱动，建议具体可执行。'],
      };
  }
}
