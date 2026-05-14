import type { PalaceFact, PatternFact, StarFact } from '../../types/analysis';

type PatternRule = {
  id: string;
  name: string;
  kind: 'auspicious' | 'inauspicious' | 'neutral';
  description: string;
  priority: number;
  detect: (context: PatternContext) => DetectResult | null;
};

type PatternContext = {
  palaces: PalaceFact[];
  palaceByName: Map<string, PalaceFact>;
  palaceByIndex: Map<number, PalaceFact>;
};

type DetectResult = {
  palaces: PalaceFact[];
  stars: string[];
};

function normalizePalaceName(name: string): string {
  return name.endsWith('宫') ? name.slice(0, -1) : name;
}

function getAllStars(palace: PalaceFact): StarFact[] {
  return [...palace.major_stars, ...palace.minor_stars, ...palace.other_stars];
}

function hasStar(palace: PalaceFact, starName: string): boolean {
  return getAllStars(palace).some((star) => star.name === starName);
}

function hasAllStars(palace: PalaceFact, names: string[]): boolean {
  return names.every((name) => hasStar(palace, name));
}

function getSurroundedPalaces(context: PatternContext, palace: PalaceFact): PalaceFact[] {
  return palace.surrounded_palace_indexes
    .map((index) => context.palaceByIndex.get(index))
    .filter((item): item is PalaceFact => !!item);
}

function getSurroundedStars(context: PatternContext, palace: PalaceFact): string[] {
  const seen = new Set<string>();
  getSurroundedPalaces(context, palace).forEach((target) => {
    getAllStars(target).forEach((star) => seen.add(star.name));
  });
  return Array.from(seen);
}

function getSurroundedMutagens(
  context: PatternContext,
  palace: PalaceFact,
  key: 'birth_mutagen' | 'active_scope_mutagen' | 'horoscope_mutagen',
): string[] {
  const seen = new Set<string>();
  getSurroundedPalaces(context, palace).forEach((target) => {
    getAllStars(target).forEach((star) => {
      const value = star[key];
      if (value) seen.add(value);
    });
  });
  return Array.from(seen);
}

function surroundedHasAll(context: PatternContext, palace: PalaceFact, stars: string[]): boolean {
  const all = new Set(getSurroundedStars(context, palace));
  return stars.every((name) => all.has(name));
}

function surroundedHasOneOf(context: PatternContext, palace: PalaceFact, stars: string[]): boolean {
  const all = new Set(getSurroundedStars(context, palace));
  return stars.some((name) => all.has(name));
}

function getPalaceByName(context: PatternContext, name: string): PalaceFact | undefined {
  return context.palaceByName.get(normalizePalaceName(name));
}

function getOppositePalace(context: PatternContext, palace: PalaceFact): PalaceFact | undefined {
  return context.palaceByIndex.get(palace.opposite_palace_index);
}

function getNeighborPalaces(
  context: PatternContext,
  palace: PalaceFact,
): { prev?: PalaceFact; next?: PalaceFact } {
  const prevIndex = (palace.index + 11) % 12;
  const nextIndex = (palace.index + 1) % 12;
  return {
    prev: context.palaceByIndex.get(prevIndex),
    next: context.palaceByIndex.get(nextIndex),
  };
}

const PATTERN_RULES: PatternRule[] = [
  {
    id: 'ziwei-tianfu-tonggong',
    name: '紫府同宫',
    kind: 'auspicious',
    description: '紫微与天府同坐命宫，主格局稳重、领导力强、人生底盘扎实。',
    priority: 92,
    detect(context) {
      const ming = getPalaceByName(context, '命宫');
      if (!ming) return null;
      if (hasAllStars(ming, ['紫微', '天府'])) {
        return { palaces: [ming], stars: ['紫微', '天府'] };
      }
      return null;
    },
  },
  {
    id: 'sha-po-lang',
    name: '杀破狼',
    kind: 'neutral',
    description: '命宫三方四正见七杀、破军、贪狼，主一生多变化、需以动制静。',
    priority: 90,
    detect(context) {
      const ming = getPalaceByName(context, '命宫');
      if (!ming) return null;
      const required = ['七杀', '破军', '贪狼'];
      if (surroundedHasAll(context, ming, required)) {
        return { palaces: [ming], stars: required };
      }
      return null;
    },
  },
  {
    id: 'ji-yue-tong-liang',
    name: '机月同梁',
    kind: 'auspicious',
    description: '命宫三方四正见天机、太阴、天同、天梁，主温和稳健、适合稳定型职业。',
    priority: 86,
    detect(context) {
      const ming = getPalaceByName(context, '命宫');
      if (!ming) return null;
      const required = ['天机', '太阴', '天同', '天梁'];
      if (surroundedHasAll(context, ming, required)) {
        return { palaces: [ming], stars: required };
      }
      return null;
    },
  },
  {
    id: 'fu-xiang-chao-yuan',
    name: '府相朝垣',
    kind: 'auspicious',
    description: '命宫三方四正见天府与天相同时拱照，主衣食无忧、得贵人扶持。',
    priority: 84,
    detect(context) {
      const ming = getPalaceByName(context, '命宫');
      if (!ming) return null;
      if (surroundedHasAll(context, ming, ['天府', '天相'])) {
        return { palaces: [ming], stars: ['天府', '天相'] };
      }
      return null;
    },
  },
  {
    id: 'ri-yue-bing-ming',
    name: '日月并明',
    kind: 'auspicious',
    description: '命宫三方四正同见太阳与太阴，主才情智慧并济、阴阳调和。',
    priority: 82,
    detect(context) {
      const ming = getPalaceByName(context, '命宫');
      if (!ming) return null;
      if (surroundedHasAll(context, ming, ['太阳', '太阴'])) {
        return { palaces: [ming], stars: ['太阳', '太阴'] };
      }
      return null;
    },
  },
  {
    id: 'ke-quan-lu-gong-ming',
    name: '科权禄拱命',
    kind: 'auspicious',
    description: '命宫三方四正同时见化科、化权、化禄，主功名利禄三全。',
    priority: 95,
    detect(context) {
      const ming = getPalaceByName(context, '命宫');
      if (!ming) return null;
      const birthMutagens = new Set(getSurroundedMutagens(context, ming, 'birth_mutagen'));
      const scopeMutagens = new Set(getSurroundedMutagens(context, ming, 'active_scope_mutagen'));
      const combined = new Set([...birthMutagens, ...scopeMutagens]);
      const required: Array<'禄' | '权' | '科'> = ['禄', '权', '科'];
      if (required.every((item) => combined.has(item))) {
        return { palaces: [ming], stars: required };
      }
      return null;
    },
  },
  {
    id: 'shuang-lu-jiao-liu',
    name: '双禄交流',
    kind: 'auspicious',
    description: '命宫三方四正同时见禄存与化禄，主财源流畅、贵显富厚。',
    priority: 88,
    detect(context) {
      const ming = getPalaceByName(context, '命宫');
      if (!ming) return null;
      const hasLuStar = surroundedHasOneOf(context, ming, ['禄存']);
      const surroundedBirth = getSurroundedMutagens(context, ming, 'birth_mutagen');
      const surroundedScope = getSurroundedMutagens(context, ming, 'active_scope_mutagen');
      const hasHuaLu = surroundedBirth.includes('禄') || surroundedScope.includes('禄');
      if (hasLuStar && hasHuaLu) {
        return { palaces: [ming], stars: ['禄存', '化禄'] };
      }
      return null;
    },
  },
  {
    id: 'ming-lu-an-lu',
    name: '明禄暗禄',
    kind: 'auspicious',
    description: '禄存或化禄坐命，对宫亦见禄星，主明暗皆得财、收入隐稳。',
    priority: 80,
    detect(context) {
      const ming = getPalaceByName(context, '命宫');
      if (!ming) return null;
      const opposite = getOppositePalace(context, ming);
      if (!opposite) return null;
      const mingHasLu =
        hasStar(ming, '禄存') ||
        getAllStars(ming).some(
          (star) => star.birth_mutagen === '禄' || star.active_scope_mutagen === '禄',
        );
      const oppositeHasLu =
        hasStar(opposite, '禄存') ||
        getAllStars(opposite).some(
          (star) => star.birth_mutagen === '禄' || star.active_scope_mutagen === '禄',
        );
      if (mingHasLu && oppositeHasLu) {
        return { palaces: [ming, opposite], stars: ['禄存', '化禄'] };
      }
      return null;
    },
  },
  {
    id: 'yang-tuo-jia-ji',
    name: '羊陀夹忌',
    kind: 'inauspicious',
    description: '化忌坐宫，前一宫见擎羊、后一宫见陀罗夹拱，主该宫主题受双煞夹制。',
    priority: 90,
    detect(context) {
      for (const palace of context.palaces) {
        const hasJi = getAllStars(palace).some(
          (star) => star.birth_mutagen === '忌' || star.active_scope_mutagen === '忌',
        );
        if (!hasJi) continue;
        const { prev, next } = getNeighborPalaces(context, palace);
        if (!prev || !next) continue;
        const prevHasYang = hasStar(prev, '擎羊');
        const nextHasTuo = hasStar(next, '陀罗');
        const prevHasTuo = hasStar(prev, '陀罗');
        const nextHasYang = hasStar(next, '擎羊');
        if ((prevHasYang && nextHasTuo) || (prevHasTuo && nextHasYang)) {
          return {
            palaces: [palace, prev, next],
            stars: ['化忌', '擎羊', '陀罗'],
          };
        }
      }
      return null;
    },
  },
  {
    id: 'ling-chang-tuo-wu',
    name: '铃昌陀武',
    kind: 'inauspicious',
    description: '命宫三方四正同时见铃星、文昌、陀罗与武曲，主限运易出意外波折。',
    priority: 78,
    detect(context) {
      const ming = getPalaceByName(context, '命宫');
      if (!ming) return null;
      const required = ['铃星', '文昌', '陀罗', '武曲'];
      if (surroundedHasAll(context, ming, required)) {
        return { palaces: [ming], stars: required };
      }
      return null;
    },
  },
];

export function detectPatterns(params: { palaces: PalaceFact[] }): PatternFact[] {
  const { palaces } = params;
  if (!palaces.length) return [];

  const palaceByName = new Map<string, PalaceFact>();
  const palaceByIndex = new Map<number, PalaceFact>();

  palaces.forEach((palace) => {
    palaceByName.set(normalizePalaceName(palace.name), palace);
    palaceByIndex.set(palace.index, palace);
  });

  const context: PatternContext = { palaces, palaceByName, palaceByIndex };
  const patterns: PatternFact[] = [];

  PATTERN_RULES.forEach((rule, index) => {
    const matched = rule.detect(context);
    if (!matched) return;

    patterns.push({
      id: `P${index + 1}`,
      name: rule.name,
      kind: rule.kind,
      description: rule.description,
      priority: rule.priority,
      palace_indexes: matched.palaces.map((palace) => palace.index),
      palace_names: matched.palaces.map((palace) => palace.name),
      star_names: matched.stars,
    });
  });

  return patterns.sort((left, right) => right.priority - left.priority);
}
