import { baziCalculator } from '../../utils/bazi/baziCalculator';
import type { Person } from '../../utils/bazi/baziTypes';
import { getTimeIndexFromClock } from '../../utils/dateUtils';
import { buildZiweiChartInput, calculateFullZiweiChart } from '../full-chart-engine/ziwei';
import { generateLiuyao } from '../divination/algorithms/liuyao';
import { generateMeihua } from '../divination/algorithms/meihua';
import { generateXiaoliuren } from '../divination/algorithms/xiaoliuren';
import { generateQimen } from '../divination/algorithms/qimen';
import { generateLiuren } from '../divination/algorithms/liuren';
import { generateAlmanacSelection } from '../divination/algorithms/almanac';
import { drawLenormandSpread } from '../divination/algorithms/lenormand';
import { generateAstrolabe } from '../divination/algorithms/astrolabe';
import { drawRandomSign } from '../divination/algorithms/ssgw';
import { buildDivinationPrompt } from '../divination/engine';
import { getDivinationSummaryBlocks } from '../divination/summary';
import { ASTROLABE_PROMPT_TOPICS } from '../astrolabe-prompts';
import type {
  AlmanacParticipantInput,
  AlmanacTopic,
  AstrolabeBirthInput,
  DivinationData,
  LenormandSpreadType,
  LiuyaoTemplateType,
  LiurenTemplateType,
  MeihuaSettings,
  SupplementaryInfo,
  XiaoliurenDivinationMethod,
} from '../../types/divination';
import { drawSingleCard, drawSpreadCards, getCardKeywords } from '../../utils/tarot';
import type { DivinationMethodId } from '../divination/config';
import {
  BAZI_PROMPT_TOPICS,
  PROMPT_MODES,
  ZIWEI_PROMPT_SCOPES,
  ZIWEI_PROMPT_TOPICS,
  buildBaziPromptForResult,
  buildSerializableZiweiResult,
  buildZiweiPromptForRuntime,
  type BaziPromptTopic,
  type PromptMode,
  type ZiweiPromptScope,
  type ZiweiPromptTopic,
} from './prompt-builders';

const API_VERSION = 'v1';
const SERVICE_NAME = 'aov.cc';
const BASE_URL = 'https://aov.cc';

type ApiMeta = {
  service: typeof SERVICE_NAME;
  version: typeof API_VERSION;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta: ApiMeta;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
  meta: ApiMeta;
};

type JsonRecord = Record<string, unknown>;

type RouteContext = {
  request: Request;
  segments: string[];
};

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  'Content-Type': 'application/json; charset=utf-8',
};

const ENDPOINTS = [
  'GET /api/v1/health',
  'GET /api/v1/manifest',
  'GET /api/v1/openapi.json',
  'POST /api/v1/bazi/calculate',
  'POST /api/v1/bazi/prompt',
  'POST /api/v1/ziwei/calculate',
  'POST /api/v1/ziwei/prompt',
  'POST /api/v1/divination/liuyao',
  'POST /api/v1/divination/liuyao/prompt',
  'POST /api/v1/divination/meihua',
  'POST /api/v1/divination/meihua/prompt',
  'POST /api/v1/divination/xiaoliuren',
  'POST /api/v1/divination/xiaoliuren/prompt',
  'POST /api/v1/divination/qimen',
  'POST /api/v1/divination/qimen/prompt',
  'POST /api/v1/divination/liuren',
  'POST /api/v1/divination/liuren/prompt',
  'POST /api/v1/divination/tarot',
  'POST /api/v1/divination/tarot/prompt',
  'POST /api/v1/divination/ssgw',
  'POST /api/v1/divination/ssgw/prompt',
  'POST /api/v1/divination/almanac',
  'POST /api/v1/divination/almanac/prompt',
  'POST /api/v1/divination/lenormand',
  'POST /api/v1/divination/lenormand/prompt',
  'POST /api/v1/divination/astrolabe',
  'POST /api/v1/divination/astrolabe/prompt',
] as const;

export function getPublicApiManifest() {
  return {
    name: 'AOV 命理与占卜公开 API',
    service: SERVICE_NAME,
    version: API_VERSION,
    baseUrl: `${BASE_URL}/api/${API_VERSION}`,
    openapiUrl: `${BASE_URL}/api/${API_VERSION}/openapi.json`,
    skillUrl: `${BASE_URL}/skills/aov-mingyu-api/SKILL.md`,
    endpoints: [...ENDPOINTS],
  };
}

export function getPublicApiOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'AOV 命理与占卜公开 API',
      version: API_VERSION,
      description:
        '提供八字、紫微斗数、六爻、梅花易数、小六壬、奇门遁甲、大六壬、塔罗、三山国王灵签、黄历择日、雷诺曼、星盘和提示词生成能力。',
    },
    servers: [{ url: `${BASE_URL}/api/${API_VERSION}` }],
    paths: {
      '/health': {
        get: {
          summary: '健康检查',
          responses: { '200': { description: '服务可用' } },
        },
      },
      '/manifest': {
        get: {
          summary: '获取 API 元数据',
          responses: { '200': { description: 'API 元数据' } },
        },
      },
      '/openapi.json': {
        get: {
          summary: '获取 OpenAPI 文档',
          responses: { '200': { description: 'OpenAPI JSON' } },
        },
      },
      '/bazi/calculate': {
        post: {
          summary: '八字排盘',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/BaziRequest' } },
            },
          },
          responses: { '200': { description: '八字命盘数据' } },
        },
      },
      '/bazi/prompt': {
        post: {
          summary: '八字排盘并生成 AI 解读提示词',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/BaziPromptRequest' } },
            },
          },
          responses: { '200': { description: '八字命盘数据和结构化提示词' } },
        },
      },
      '/ziwei/calculate': {
        post: {
          summary: '紫微斗数排盘',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ZiweiRequest' } },
            },
          },
          responses: { '200': { description: '紫微命盘数据' } },
        },
      },
      '/ziwei/prompt': {
        post: {
          summary: '紫微斗数排盘并生成 AI 解读提示词',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ZiweiPromptRequest' } },
            },
          },
          responses: { '200': { description: '紫微命盘数据和结构化提示词' } },
        },
      },
      '/divination/liuyao': {
        post: { summary: '六爻起卦', responses: { '200': { description: '六爻卦盘' } } },
      },
      '/divination/meihua': {
        post: { summary: '梅花易数起卦', responses: { '200': { description: '梅花易数卦盘' } } },
      },
      '/divination/xiaoliuren': {
        post: { summary: '小六壬起课', responses: { '200': { description: '小六壬课盘' } } },
      },
      '/divination/qimen': {
        post: { summary: '奇门遁甲排盘', responses: { '200': { description: '奇门盘' } } },
      },
      '/divination/liuren': {
        post: { summary: '大六壬排盘', responses: { '200': { description: '大六壬课盘' } } },
      },
      '/divination/tarot': {
        post: { summary: '塔罗抽牌', responses: { '200': { description: '塔罗牌阵' } } },
      },
      '/divination/ssgw': {
        post: { summary: '三山国王灵签求签', responses: { '200': { description: '灵签结果' } } },
      },
      '/divination/almanac': {
        post: { summary: '黄历择日', responses: { '200': { description: '择日结果' } } },
      },
      '/divination/lenormand': {
        post: { summary: '雷诺曼抽牌', responses: { '200': { description: '雷诺曼牌阵' } } },
      },
      '/divination/astrolabe': {
        post: { summary: '星盘生成', responses: { '200': { description: '星盘结果' } } },
      },
      '/divination/{method}/prompt': {
        post: {
          summary: '起卦、抽牌或求签并生成 AI 解读提示词',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DivinationPromptRequest' },
              },
            },
          },
          responses: { '200': { description: '占卜结果、统一摘要和结构化提示词' } },
        },
      },
    },
    components: {
      schemas: {
        BaziRequest: {
          type: 'object',
          required: ['gender', 'year', 'month', 'day', 'dateType'],
          properties: {
            gender: { enum: ['male', 'female'] },
            year: { type: 'integer', minimum: 1900, maximum: 2100 },
            month: { type: 'integer', minimum: 1, maximum: 12 },
            day: { type: 'integer', minimum: 1, maximum: 31 },
            timeIndex: { type: 'integer', minimum: 0, maximum: 12 },
            dateType: { enum: ['solar', 'lunar'] },
            isLeapMonth: { type: 'boolean' },
            useTrueSolarTime: { type: 'boolean' },
            birthHour: { type: 'integer', minimum: 0, maximum: 23 },
            birthMinute: { type: 'integer', minimum: 0, maximum: 59 },
            birthPlace: { type: 'string' },
            birthLongitude: { type: 'number', minimum: -180, maximum: 180 },
          },
        },
        BaziPromptRequest: {
          allOf: [
            { $ref: '#/components/schemas/BaziRequest' },
            {
              type: 'object',
              required: ['question'],
              properties: {
                question: { type: 'string' },
                promptTopic: { enum: [...BAZI_PROMPT_TOPICS] },
                promptMode: { enum: [...PROMPT_MODES] },
              },
            },
          ],
        },
        ZiweiRequest: {
          type: 'object',
          required: ['gender', 'dateType', 'year', 'month', 'day'],
          properties: {
            name: { type: 'string' },
            gender: { enum: ['male', 'female'] },
            dateType: { enum: ['solar', 'lunar'] },
            year: { type: 'string' },
            month: { type: 'string' },
            day: { type: 'string' },
            timeIndex: { type: 'integer', minimum: 0, maximum: 12 },
            isLeapMonth: { type: 'boolean' },
            useTrueSolarTime: { type: 'boolean' },
            birthHour: { type: 'string' },
            birthMinute: { type: 'string' },
            birthLongitude: { type: 'string' },
          },
        },
        ZiweiPromptRequest: {
          allOf: [
            { $ref: '#/components/schemas/ZiweiRequest' },
            {
              type: 'object',
              required: ['question'],
              properties: {
                question: { type: 'string' },
                promptTopic: { enum: [...ZIWEI_PROMPT_TOPICS] },
                promptScope: { enum: [...ZIWEI_PROMPT_SCOPES] },
                promptMode: { enum: [...PROMPT_MODES] },
              },
            },
          ],
        },
        DivinationPromptRequest: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description: '占卜问题。黄历择日接口中可不填；若填写，会作为择日补充信息处理。',
            },
            customDate: { type: 'string' },
            method: { enum: ['time', 'number', 'random', 'external'] },
            number: { type: 'integer', minimum: 1 },
            xiaoliurenMethod: { enum: ['time', 'number', 'random'] },
            xiaoliurenNumber: { type: 'integer', minimum: 1 },
            spreadType: { enum: ['single', 'three', 'love', 'career', 'decision'] },
            liuyaoTemplate: { enum: ['general', 'ganqing', 'shiye', 'caifu', 'guaishen'] },
            liurenTemplate: { enum: ['general', 'ganqing', 'shiye', 'caifu'] },
            topic: {
              enum: [
                'marriage',
                'move',
                'opening',
                'contract',
                'travel',
                'medical',
                'study',
                'custom',
              ],
            },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            participants: { type: 'array' },
            gender: { enum: ['男', '女', ''] },
            year: { type: 'integer' },
            month: { type: 'integer' },
            day: { type: 'integer' },
            hour: { type: 'integer' },
            minute: { type: 'integer' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            timezone: { type: 'number' },
            locationName: { type: 'string' },
            promptMode: { enum: [...PROMPT_MODES] },
            supplementaryInfo: { type: 'object' },
          },
        },
      },
    },
  };
}

export function normalizeApiPath(pathname: string) {
  return pathname
    .replace(/^\/api\/v1\/?/, '')
    .split('/')
    .filter(Boolean);
}

export async function handlePublicApiRequest(request: Request, segments?: string[]) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  const routeSegments = segments ?? normalizeApiPath(new URL(request.url).pathname);

  try {
    const data = await route({ request, segments: routeSegments });
    return json(success(data));
  } catch (error) {
    return handleError(error);
  }
}

async function route(context: RouteContext) {
  const path = context.segments.join('/');

  if (context.request.method === 'GET') {
    if (path === 'health' || path === '') {
      return {
        status: 'ok',
        service: SERVICE_NAME,
        version: API_VERSION,
        timestamp: new Date().toISOString(),
      };
    }
    if (path === 'manifest') {
      return getPublicApiManifest();
    }
    if (path === 'openapi.json') {
      return getPublicApiOpenApiDocument();
    }
  }

  if (context.request.method !== 'POST') {
    throw new ApiError(405, 'METHOD_NOT_ALLOWED', '当前接口只支持 GET、POST 或 OPTIONS。');
  }

  switch (path) {
    case 'bazi/calculate':
      return calculateBazi(await readJson(context.request));
    case 'bazi/prompt':
      return buildBaziPrompt(await readJson(context.request));
    case 'ziwei/calculate':
      return calculateZiwei(await readJson(context.request));
    case 'ziwei/prompt':
      return buildZiweiPrompt(await readJson(context.request));
    case 'divination/liuyao':
      return calculateLiuyao(await readJson(context.request, true));
    case 'divination/liuyao/prompt':
      return buildDivinationPromptResult('liuyao', await readJson(context.request));
    case 'divination/meihua':
      return calculateMeihua(await readJson(context.request, true));
    case 'divination/meihua/prompt':
      return buildDivinationPromptResult('meihua', await readJson(context.request));
    case 'divination/xiaoliuren':
      return calculateXiaoliuren(await readJson(context.request, true));
    case 'divination/xiaoliuren/prompt':
      return buildDivinationPromptResult('xiaoliuren', await readJson(context.request));
    case 'divination/qimen':
      return calculateQimen(await readJson(context.request, true));
    case 'divination/qimen/prompt':
      return buildDivinationPromptResult('qimen', await readJson(context.request));
    case 'divination/liuren':
      return calculateLiuren(await readJson(context.request, true));
    case 'divination/liuren/prompt':
      return buildDivinationPromptResult('liuren', await readJson(context.request));
    case 'divination/tarot':
      return calculateTarot(await readJson(context.request, true));
    case 'divination/tarot/prompt':
      return buildDivinationPromptResult('tarot', await readJson(context.request));
    case 'divination/ssgw':
      return calculateSsgw(await readJson(context.request, true));
    case 'divination/ssgw/prompt':
      return buildDivinationPromptResult('ssgw', await readJson(context.request));
    case 'divination/almanac':
      return calculateAlmanac(await readJson(context.request));
    case 'divination/almanac/prompt':
      return buildDivinationPromptResult('almanac', await readJson(context.request));
    case 'divination/lenormand':
      return calculateLenormand(await readJson(context.request, true));
    case 'divination/lenormand/prompt':
      return buildDivinationPromptResult('lenormand', await readJson(context.request));
    case 'divination/astrolabe':
      return calculateAstrolabe(await readJson(context.request));
    case 'divination/astrolabe/prompt':
      return buildDivinationPromptResult('astrolabe', await readJson(context.request));
    default:
      throw new ApiError(404, 'NOT_FOUND', '没有找到对应的 API 路径。');
  }
}

function calculateBazi(input: JsonRecord) {
  const gender = readEnum(input, 'gender', ['male', 'female']);
  const useTrueSolarTime = readBoolean(input, 'useTrueSolarTime', false);
  const birthHour = useTrueSolarTime ? readInteger(input, 'birthHour', 0, 23) : undefined;
  const birthMinute = useTrueSolarTime ? readInteger(input, 'birthMinute', 0, 59) : undefined;
  const birthLongitude = useTrueSolarTime
    ? readNumber(input, 'birthLongitude', -180, 180)
    : undefined;
  const derivedTimeIndex =
    useTrueSolarTime && typeof birthHour === 'number' && typeof birthMinute === 'number'
      ? getTimeIndexFromClock(birthHour, birthMinute)
      : -1;
  const person: Person = {
    gender,
    year: readInteger(input, 'year', 1900, 2100),
    month: readInteger(input, 'month', 1, 12),
    day: readInteger(input, 'day', 1, 31),
    timeIndex: useTrueSolarTime ? derivedTimeIndex : readInteger(input, 'timeIndex', 0, 12),
    isLunar: readEnum(input, 'dateType', ['solar', 'lunar']) === 'lunar',
    isLeapMonth: readBoolean(input, 'isLeapMonth', false),
    useTrueSolarTime,
    birthHour,
    birthMinute,
    birthLongitude,
    birthPlace: readString(input, 'birthPlace', ''),
  };

  if (useTrueSolarTime && derivedTimeIndex < 0) {
    throw new ApiError(400, 'BAD_REQUEST', 'birthHour 和 birthMinute 无法换算为有效时辰。');
  }

  const result = baziCalculator.calculateBazi(person);
  return result;
}

function buildBaziPrompt(input: JsonRecord) {
  const result = calculateBazi(input);
  return {
    result,
    prompt: buildBaziPromptForResult({
      result,
      question: readRequiredString(input, 'question'),
      topic: readEnum(input, 'promptTopic', BAZI_PROMPT_TOPICS, 'general') as BaziPromptTopic,
      mode: readEnum(input, 'promptMode', PROMPT_MODES, 'framework') as PromptMode,
    }),
  };
}

async function calculateZiweiRuntime(input: JsonRecord) {
  return calculateFullZiweiChart(
    buildZiweiChartInput({
      name: readString(input, 'name', ''),
      gender: readEnum(input, 'gender', ['male', 'female']),
      dateType: readEnum(input, 'dateType', ['solar', 'lunar']),
      year: readRequiredString(input, 'year'),
      month: readRequiredString(input, 'month'),
      day: readRequiredString(input, 'day'),
      timeIndex: readBoolean(input, 'useTrueSolarTime', false)
        ? ''
        : readInteger(input, 'timeIndex', 0, 12),
      isLeapMonth: readBoolean(input, 'isLeapMonth', false),
      useTrueSolarTime: readBoolean(input, 'useTrueSolarTime', false),
      birthHour: readString(input, 'birthHour', ''),
      birthMinute: readString(input, 'birthMinute', ''),
      birthLongitude: readString(input, 'birthLongitude', ''),
    }),
  );
}

async function calculateZiwei(input: JsonRecord) {
  return buildSerializableZiweiResult(await calculateZiweiRuntime(input));
}

async function buildZiweiPrompt(input: JsonRecord) {
  const result = await calculateZiweiRuntime(input);
  const promptTopic =
    input.promptTopic === undefined
      ? undefined
      : (readEnum(input, 'promptTopic', ZIWEI_PROMPT_TOPICS) as ZiweiPromptTopic);
  return {
    result: buildSerializableZiweiResult(result),
    prompt: buildZiweiPromptForRuntime({
      result,
      question: readRequiredString(input, 'question'),
      topic: promptTopic,
      scope: readEnum(input, 'promptScope', ZIWEI_PROMPT_SCOPES, 'origin') as ZiweiPromptScope,
      mode: readEnum(input, 'promptMode', PROMPT_MODES, 'framework') as PromptMode,
    }),
  };
}

function calculateLiuyao(input: JsonRecord) {
  return generateLiuyao(readCustomDate(input));
}

function calculateQimen(input: JsonRecord) {
  return generateQimen(readCustomDate(input));
}

function calculateMeihua(input: JsonRecord) {
  const method = readEnum(input, 'method', ['time', 'number', 'random', 'external'], 'time');
  const settings: MeihuaSettings = {
    method,
    ...(method === 'number' ? { number: readInteger(input, 'number', 1) } : {}),
    ...(method === 'external' && isRecord(input.externalOmens)
      ? { externalOmens: input.externalOmens as MeihuaSettings['externalOmens'] }
      : {}),
  };

  return generateMeihua(readCustomDate(input), settings);
}

function calculateLiuren(input: JsonRecord) {
  const template = readEnum(
    input,
    'liurenTemplate',
    ['general', 'ganqing', 'shiye', 'caifu'],
    'general',
  );
  return {
    ...generateLiuren(readCustomDate(input)),
    template,
  };
}

function calculateXiaoliuren(input: JsonRecord) {
  const method = readEnum(
    input,
    'xiaoliurenMethod',
    ['time', 'number', 'random'],
    'time',
  ) as XiaoliurenDivinationMethod;
  return generateXiaoliuren({
    method,
    ...(method === 'number' ? { number: readInteger(input, 'xiaoliurenNumber', 1) } : {}),
    customDate: readCustomDate(input),
  });
}

function calculateTarot(input: JsonRecord) {
  const spreadType = readEnum(
    input,
    'spreadType',
    ['single', 'three', 'love', 'career', 'decision'],
    'single',
  );
  if (spreadType === 'single') {
    const drawResult = drawSingleCard();
    const output = {
      spreadType: 'single',
      spreadName: '单牌指引',
      cards: [
        {
          id: drawResult.card.number,
          name: drawResult.card.name,
          position: drawResult.position,
          reversed: drawResult.isReversed,
          keywords: getCardKeywords(drawResult.card.name).split(','),
        },
      ],
      timestamp: drawResult.timestamp,
    };
    return output;
  }

  const result = drawSpreadCards(spreadType);
  const output = {
    spreadType: result.spreadType,
    spreadName: result.spreadName,
    cards: result.cards.map((item) => ({
      id: item.card.number,
      name: item.card.name,
      position: item.position,
      reversed: item.isReversed,
      keywords: getCardKeywords(item.card.name).split(','),
    })),
    timestamp: result.timestamp,
  };
  return output;
}

function calculateSsgw(_input: JsonRecord) {
  return drawRandomSign();
}

function calculateAlmanac(input: JsonRecord) {
  return generateAlmanacSelection({
    topic: readEnum(input, 'topic', [
      'marriage',
      'move',
      'opening',
      'contract',
      'travel',
      'medical',
      'study',
      'custom',
    ]) as AlmanacTopic,
    startDate: readRequiredString(input, 'startDate'),
    endDate: readRequiredString(input, 'endDate'),
    participants: readAlmanacParticipants(input),
  });
}

function calculateLenormand(input: JsonRecord) {
  return drawLenormandSpread(
    readEnum(
      input,
      'spreadType',
      ['single', 'three', 'relationship', 'decision', 'nine'],
      'three',
    ) as LenormandSpreadType,
  );
}

function calculateAstrolabe(input: JsonRecord) {
  const astrolabeInput: AstrolabeBirthInput = {
    name: readString(input, 'name', ''),
    gender: readEnum(input, 'gender', ['男', '女', ''], ''),
    year: String(readInteger(input, 'year', 1900, 2100)),
    month: String(readInteger(input, 'month', 1, 12)),
    day: String(readInteger(input, 'day', 1, 31)),
    hour: String(readInteger(input, 'hour', 0, 23)),
    minute: String(readInteger(input, 'minute', 0, 59)),
    latitude: String(readNumber(input, 'latitude', -90, 90)),
    longitude: String(readNumber(input, 'longitude', -180, 180)),
    timezone: String(readNumber(input, 'timezone', -12, 14)),
    locationName: readString(input, 'locationName', ''),
  };
  return generateAstrolabe(astrolabeInput);
}

function buildDivinationPromptResult(
  method: Exclude<DivinationMethodId, 'random'>,
  input: JsonRecord,
) {
  const question =
    method === 'almanac'
      ? readString(input, 'question', '')
      : readRequiredString(input, 'question');
  const data = calculateDivinationData(method, input);
  return {
    result: data,
    summary: getDivinationSummaryBlocks(method, data),
    prompt: buildDivinationPromptText(method, question, data, input),
  };
}

function calculateDivinationData(method: Exclude<DivinationMethodId, 'random'>, input: JsonRecord) {
  const inputWithoutQuestion = { ...input };
  delete inputWithoutQuestion.question;

  switch (method) {
    case 'liuyao':
      return generateLiuyao(readCustomDate(inputWithoutQuestion));
    case 'meihua':
      return calculateMeihua(inputWithoutQuestion);
    case 'xiaoliuren':
      return calculateXiaoliuren(inputWithoutQuestion);
    case 'qimen':
      return generateQimen(readCustomDate(inputWithoutQuestion));
    case 'liuren':
      return calculateLiuren(inputWithoutQuestion);
    case 'tarot':
      return calculateTarot(inputWithoutQuestion);
    case 'ssgw':
      return drawRandomSign();
    case 'almanac':
      return calculateAlmanac(inputWithoutQuestion);
    case 'lenormand':
      return calculateLenormand(inputWithoutQuestion);
    case 'astrolabe':
      return calculateAstrolabe(inputWithoutQuestion);
  }
}

function buildDivinationPromptText(
  method: Exclude<DivinationMethodId, 'random'>,
  question: string,
  data: unknown,
  input: JsonRecord,
) {
  const baseSupplementaryInfo = isRecord(input.supplementaryInfo)
    ? (input.supplementaryInfo as SupplementaryInfo)
    : undefined;
  const supplementaryInfo =
    method === 'almanac' && question.trim()
      ? {
          ...(baseSupplementaryInfo ?? {}),
          userSupplement: question.trim(),
        }
      : baseSupplementaryInfo;
  const liuyaoTemplate = readEnum(
    input,
    'liuyaoTemplate',
    ['general', 'ganqing', 'shiye', 'caifu', 'guaishen'],
    'general',
  ) as LiuyaoTemplateType;
  const liurenTemplate = readEnum(
    input,
    'liurenTemplate',
    ['general', 'ganqing', 'shiye', 'caifu'],
    'general',
  ) as LiurenTemplateType;

  return buildDivinationPrompt(method, question, data as DivinationData, supplementaryInfo, {
    isCustomQuestion:
      (readEnum(input, 'promptMode', PROMPT_MODES, 'framework') as PromptMode) === 'custom',
    liuyaoTemplate,
    liurenTemplate,
    astrolabeTopic:
      method === 'astrolabe'
        ? readEnum(input, 'astrolabeTopic', ASTROLABE_PROMPT_TOPICS, 'life')
        : undefined,
  });
}

async function readJson(request: Request, optional = false): Promise<JsonRecord> {
  if (optional && !request.headers.get('content-type') && request.body === null) {
    return {};
  }

  try {
    const value = await request.json();
    if (!isRecord(value)) {
      throw new ApiError(400, 'BAD_REQUEST', '请求体必须是 JSON 对象。');
    }
    return value;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (optional) {
      return {};
    }
    throw new ApiError(400, 'BAD_REQUEST', '请求体必须是合法 JSON。');
  }
}

function readCustomDate(input: JsonRecord) {
  const value = input.customDate;
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new ApiError(400, 'BAD_REQUEST', 'customDate 必须是 ISO 8601 时间字符串。');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, 'BAD_REQUEST', 'customDate 不是有效时间。');
  }
  return date;
}

function readInteger(input: JsonRecord, key: string, min?: number, max?: number): number {
  const value = input[key];
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ApiError(400, 'BAD_REQUEST', `${key} 必须是整数。`);
  }
  if (min !== undefined && value < min) {
    throw new ApiError(400, 'BAD_REQUEST', `${key} 不能小于 ${min}。`);
  }
  if (max !== undefined && value > max) {
    throw new ApiError(400, 'BAD_REQUEST', `${key} 不能大于 ${max}。`);
  }
  return value;
}

function readNumber(input: JsonRecord, key: string, min?: number, max?: number): number {
  const value = input[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ApiError(400, 'BAD_REQUEST', `${key} 必须是数字。`);
  }
  if (min !== undefined && value < min) {
    throw new ApiError(400, 'BAD_REQUEST', `${key} 不能小于 ${min}。`);
  }
  if (max !== undefined && value > max) {
    throw new ApiError(400, 'BAD_REQUEST', `${key} 不能大于 ${max}。`);
  }
  return value;
}

function readBoolean(input: JsonRecord, key: string, fallback: boolean) {
  const value = input[key];
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'boolean') {
    throw new ApiError(400, 'BAD_REQUEST', `${key} 必须是布尔值。`);
  }
  return value;
}

function readString(input: JsonRecord, key: string, fallback: string) {
  const value = input[key];
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'string') {
    throw new ApiError(400, 'BAD_REQUEST', `${key} 必须是字符串。`);
  }
  return value;
}

function readRequiredString(input: JsonRecord, key: string) {
  const value = readString(input, key, '');
  if (!value.trim()) {
    throw new ApiError(400, 'BAD_REQUEST', `${key} 不能为空。`);
  }
  return value;
}

function readAlmanacParticipants(input: JsonRecord): AlmanacParticipantInput[] {
  const value = input.participants;
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new ApiError(400, 'BAD_REQUEST', 'participants 必须是数组。');
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new ApiError(400, 'BAD_REQUEST', `participants[${index}] 必须是对象。`);
    }

    const participant: AlmanacParticipantInput = {
      id: readString(item, 'id', `participant-${index + 1}`),
      name: readString(item, 'name', ''),
      gender: readEnum(item, 'gender', ['男', '女', ''], ''),
      year: String(readInteger(item, 'year', 1900, 2100)),
      month: String(readInteger(item, 'month', 1, 12)),
      day: String(readInteger(item, 'day', 1, 31)),
      timeIndex: String(readInteger(item, 'timeIndex', 0, 12)),
      dateType: readEnum(item, 'dateType', ['solar', 'lunar']),
      isLeapMonth: readBoolean(item, 'isLeapMonth', false),
    };

    return participant;
  });
}

function readEnum<const T extends readonly string[]>(
  input: JsonRecord,
  key: string,
  values: T,
  fallback?: T[number],
): T[number] {
  const value = input[key];
  if (value === undefined && fallback !== undefined) {
    return fallback;
  }
  if (typeof value === 'string' && values.includes(value)) {
    return value;
  }
  throw new ApiError(400, 'BAD_REQUEST', `${key} 必须是以下值之一：${values.join('、')}。`);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function success<T>(data: T): ApiSuccess<T> {
  return {
    ok: true,
    data,
    meta: {
      service: SERVICE_NAME,
      version: API_VERSION,
    },
  };
}

function failure(code: string, message: string): ApiFailure {
  return {
    ok: false,
    error: { code, message },
    meta: {
      service: SERVICE_NAME,
      version: API_VERSION,
    },
  };
}

function json(body: ApiSuccess<unknown> | ApiFailure, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return json(failure(error.code, error.message), error.status);
  }

  const message = error instanceof Error ? error.message : '服务内部错误。';
  return json(failure('INTERNAL_ERROR', message), 500);
}
