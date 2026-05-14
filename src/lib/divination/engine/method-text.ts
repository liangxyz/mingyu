import type { DivinationMethodId } from '../config';

export function buildRoleText(method: Exclude<DivinationMethodId, 'random'>) {
  switch (method) {
    case 'liuyao':
      return '你是资深六爻断卦师，熟悉卦宫、六亲、六神、世应、用神、伏神、动变与生克旺衰。';
    case 'meihua':
      return '你是资深梅花易数解读师，熟悉体用、生克、互卦、变卦与四时旺衰。';
    case 'qimen':
      return '你是资深奇门遁甲分析师，熟悉值符值使、门星神干、宫位格局、特殊时辰与时机策略。';
    case 'liuren':
      return '你是资深大六壬断课师，熟悉月将、四课、三传、天将、课体、神煞与发用主线。';
    case 'tarot':
      return '你是资深塔罗解读师，熟悉牌阵结构、正逆位、位置关系与行动建议。';
    case 'ssgw':
      return '你是资深三山国王灵签解签师，熟悉签诗、典故、吉凶趋向与现实建议。';
    default:
      return '你是资深占卜分析师。';
  }
}

export function buildTaskText(method: Exclude<DivinationMethodId, 'random'>) {
  switch (method) {
    case 'liuyao':
      return '请围绕用神、世应、动爻、变卦、伏神和旺衰判断，直接回答问题，并说明该如何推进或规避风险。';
    case 'meihua':
      return '请围绕体用关系、互卦过程、变卦结果和四时旺衰判断，直接回答问题，并给出顺势应对建议。';
    case 'qimen':
      return '请围绕值符值使、用门落宫、门星神干组合、格局强弱、特殊时辰与时机策略判断，直接回答问题，并指出可行方向。';
    case 'liuren':
      return '请围绕月将、四课、三传、天将、课体与神煞主线判断，直接回答问题，并说明事情会如何演变、卡点在哪、下一步该先做什么；输出时务必按【断课模板】逐段作答。';
    case 'tarot':
      return '请围绕牌阵整体主题、关键牌、正逆位与位置关系判断，直接回答问题，并给出最值得执行的建议。';
    case 'ssgw':
      return '请围绕签诗本意、典故启示、现实映射与行动提醒判断，直接回答问题，并说明当前宜进还是宜守。';
    default:
      return '请结合占卜信息直接回答问题，并给出明确建议。';
  }
}

export function buildMethodRequirementText(method: Exclude<DivinationMethodId, 'random'>) {
  switch (method) {
    case 'liuyao':
      return '- 优先看世应、动爻、变卦与空亡，再结合伏神、旺衰或神煞区分主证据与辅助证据。';
    case 'meihua':
      return '- 解释顺序以体用为先，再看互卦过程、变卦结果与四时旺衰，不要只按卦名泛讲。';
    case 'qimen':
      return '- 优先看值符值使、用门落宫与门星神干组合，再看格局标签、特殊时辰和方位时机。';
    case 'liuren':
      return '- 优先按月将、四课、三传立主线；若信息中给出课体、神煞、旬奇旬仪、空亡或贵人信息，必须纳入判断并标明主次。';
    case 'tarot':
      return '- 先统合牌阵主题，再解释位置关系与正逆位差异，不要把每张牌拆成互不相关的单点解释。';
    case 'ssgw':
      return '- 先解释签诗主旨，再联系典故和现实处境，不要只做空泛吉凶判断。';
    default:
      return '';
  }
}

export function buildMethodOutputRequirementText(method: Exclude<DivinationMethodId, 'random'>) {
  switch (method) {
    case 'liuyao':
      return '明确说明哪一项是本次判断的主轴，例如世应、动爻、变卦、用神或伏神。';
    case 'meihua':
      return '把起因、过程、结果分别落到体用、互卦、变卦，不要混写。';
    case 'qimen':
      return '若盘面支持，请明确写出宜动、宜守、宜避的方向、动作或时间窗口，并说明先看哪一宫。';
    case 'liuren':
      return '若信息中有课体或神煞，要区分主线证据与辅助证据，避免堆名词。';
    case 'tarot':
      return '每个重点都要交代牌位含义、牌面关系和建议。';
    case 'ssgw':
      return '每个重点都要交代签诗原意、现实映射和行动提醒。';
    default:
      return '';
  }
}
