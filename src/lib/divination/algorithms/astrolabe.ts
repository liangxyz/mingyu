import { AspectType, calculateChart } from 'celestine';
import type {
  AstrolabeAspect,
  AstrolabeBirthInput,
  AstrolabeData,
  AstrolabePoint,
} from '../../../types/divination';
import { calculateTrueSolarTime } from '../../../utils/bazi/trueSolarTime';

const PLANET_LABELS: Record<string, string> = {
  Sun: '太阳',
  Moon: '月亮',
  Mercury: '水星',
  Venus: '金星',
  Mars: '火星',
  Jupiter: '木星',
  Saturn: '土星',
  Uranus: '天王星',
  Neptune: '海王星',
  Pluto: '冥王星',
};

const ANGLE_LABELS: Record<string, string> = {
  Ascendant: '上升',
  Midheaven: '天顶',
  Descendant: '下降',
  'Imum Coeli': '天底',
};

const SIGN_LABELS: Record<string, string> = {
  Aries: '白羊座',
  Taurus: '金牛座',
  Gemini: '双子座',
  Cancer: '巨蟹座',
  Leo: '狮子座',
  Virgo: '处女座',
  Libra: '天秤座',
  Scorpio: '天蝎座',
  Sagittarius: '射手座',
  Capricorn: '摩羯座',
  Aquarius: '水瓶座',
  Pisces: '双鱼座',
};

const ASPECT_LABELS: Record<string, string> = {
  conjunction: '合相',
  sextile: '六合',
  square: '刑相',
  trine: '拱相',
  opposition: '冲相',
};

function requireNumber(value: string, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`星盘需要填写有效的${label}`);
  }
  return number;
}

function formatPosition(signName: string, degree: number, minute: number) {
  return `${SIGN_LABELS[signName] ?? signName}${degree}°${String(minute).padStart(2, '0')}′`;
}

function mapPlanet(planet: {
  name: string;
  longitude: number;
  signName: string;
  degree: number;
  minute: number;
  house: number;
  isRetrograde: boolean;
}): AstrolabePoint {
  return {
    name: planet.name,
    label: PLANET_LABELS[planet.name] ?? planet.name,
    longitude: planet.longitude,
    sign: SIGN_LABELS[planet.signName] ?? planet.signName,
    degree: planet.degree,
    minute: planet.minute,
    house: planet.house,
    formatted: formatPosition(planet.signName, planet.degree, planet.minute),
    retrograde: planet.isRetrograde,
  };
}

function mapAngle(angle: {
  name: string;
  longitude: number;
  signName: string;
  degree: number;
  minute: number;
}): AstrolabePoint {
  return {
    name: angle.name,
    label: ANGLE_LABELS[angle.name] ?? angle.name,
    longitude: angle.longitude,
    sign: SIGN_LABELS[angle.signName] ?? angle.signName,
    degree: angle.degree,
    minute: angle.minute,
    house: 0,
    formatted: formatPosition(angle.signName, angle.degree, angle.minute),
  };
}

function mapAspect(aspect: {
  body1: string;
  body2: string;
  type: string;
  symbol: string;
  deviation: number;
  strength: number;
  isApplying: boolean | null;
}): AstrolabeAspect {
  return {
    body1: PLANET_LABELS[aspect.body1] ?? aspect.body1,
    body2: PLANET_LABELS[aspect.body2] ?? aspect.body2,
    type: ASPECT_LABELS[aspect.type] ?? aspect.type,
    symbol: aspect.symbol,
    orb: Number(aspect.deviation.toFixed(2)),
    strength: Math.round(aspect.strength),
    applying: aspect.isApplying,
  };
}

function localTimestamp(input: AstrolabeBirthInput) {
  const year = requireNumber(input.year, '出生年份');
  const month = requireNumber(input.month, '出生月份');
  const day = requireNumber(input.day, '出生日期');
  const hour = requireNumber(input.hour, '出生小时');
  const minute = requireNumber(input.minute, '出生分钟');
  return { year, month, day, hour, minute };
}

function formatDateTime(birth: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}) {
  return `${birth.year}-${String(birth.month).padStart(2, '0')}-${String(birth.day).padStart(2, '0')} ${String(birth.hour).padStart(2, '0')}:${String(birth.minute).padStart(2, '0')}`;
}

export function generateAstrolabe(input: AstrolabeBirthInput): AstrolabeData {
  const standardBirth = localTimestamp(input);
  const latitude = requireNumber(input.latitude, '出生地纬度');
  const longitude = requireNumber(input.longitude, '出生地经度');
  const timezone = requireNumber(input.timezone, '时区');
  const trueSolarResult = input.useTrueSolarTime
    ? calculateTrueSolarTime(standardBirth, longitude)
    : null;
  const birth = trueSolarResult?.correctedTime ?? standardBirth;

  const chart = calculateChart(
    {
      ...birth,
      second: 0,
      timezone,
      latitude,
      longitude,
    },
    {
      houseSystem: 'placidus',
      includeAsteroids: false,
      includeChiron: false,
      includeLilith: false,
      includeNodes: false,
      includeLots: false,
      aspectTypes: [
        AspectType.Conjunction,
        AspectType.Sextile,
        AspectType.Square,
        AspectType.Trine,
        AspectType.Opposition,
      ],
      minimumAspectStrength: 30,
    },
  );

  const angles = [
    chart.angles.ascendant,
    chart.angles.midheaven,
    chart.angles.descendant,
    chart.angles.imumCoeli,
  ].map(mapAngle);

  return {
    birth: {
      name: input.name.trim() || '未命名',
      gender: input.gender,
      dateTime: formatDateTime(birth),
      location: input.locationName?.trim()
        ? `${input.locationName.trim()}（${latitude.toFixed(4)}, ${longitude.toFixed(4)}）`
        : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      timezone,
      standardDateTime: formatDateTime(standardBirth),
      trueSolarDateTime: trueSolarResult
        ? formatDateTime(trueSolarResult.correctedTime)
        : undefined,
      isTrueSolarTime: Boolean(trueSolarResult),
    },
    planets: chart.planets.slice(0, 10).map(mapPlanet),
    angles,
    houses: chart.houses.cusps.map((cusp) => ({
      name: `House ${cusp.house}`,
      label: `第${cusp.house}宫`,
      longitude: cusp.longitude,
      sign: SIGN_LABELS[cusp.signName] ?? cusp.signName,
      degree: cusp.degree,
      minute: cusp.minute,
      house: cusp.house,
      formatted: formatPosition(cusp.signName, cusp.degree, cusp.minute),
    })),
    aspects: chart.aspects.all.slice(0, 12).map(mapAspect),
    summary: {
      elements: {
        火: chart.summary.elements.fire.map((item) => PLANET_LABELS[item] ?? item),
        土: chart.summary.elements.earth.map((item) => PLANET_LABELS[item] ?? item),
        风: chart.summary.elements.air.map((item) => PLANET_LABELS[item] ?? item),
        水: chart.summary.elements.water.map((item) => PLANET_LABELS[item] ?? item),
      },
      modalities: {
        开创: chart.summary.modalities.cardinal.map((item) => PLANET_LABELS[item] ?? item),
        固定: chart.summary.modalities.fixed.map((item) => PLANET_LABELS[item] ?? item),
        变动: chart.summary.modalities.mutable.map((item) => PLANET_LABELS[item] ?? item),
      },
      retrograde: chart.summary.retrograde.map((item) => PLANET_LABELS[item] ?? item),
      patterns: chart.summary.patterns,
    },
    timestamp: Date.now(),
  };
}
