import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateDivinationSession } from '../src/lib/divination/engine';
import { generateLiuyao } from '../src/lib/divination/algorithms/liuyao';
import { generateQimen } from '../src/lib/divination/algorithms/qimen';

const engineDir = fileURLToPath(new URL('../src/lib/divination/engine/', import.meta.url));
const source = readdirSync(engineDir)
  .filter((name) => name.endsWith('.ts'))
  .map((name) => readFileSync(path.join(engineDir, name), 'utf8'))
  .join('\n');
const srcRoot = fileURLToPath(new URL('../src', import.meta.url));

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(next));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(next);
    }
  }

  return files;
}

test('梅花数字起卦会在本地校验正整数输入', () => {
  assert.match(source, /if \(draft\.method === 'meihua' && draft\.meihuaMethod === 'number'\)/);
  assert.match(source, /throw new Error\('数字起卦需要填写正整数'\);/);
});

test('占卜引擎按卦种动态加载当前项目本地算法与工具模块', () => {
  assert.match(source, /await import\('\.\.\/algorithms\/liuyao'\)/);
  assert.match(source, /await import\('\.\.\/algorithms\/meihua'\)/);
  assert.match(source, /await import\('\.\.\/algorithms\/xiaoliuren'\)/);
  assert.match(source, /await import\('\.\.\/algorithms\/qimen'\)/);
  assert.match(source, /await import\('\.\.\/algorithms\/liuren'\)/);
  assert.match(source, /await import\('\.\.\/algorithms\/ssgw'\)/);
  assert.match(source, /await import\('\.\.\/\.\.\/\.\.\/utils\/tarot'\)/);
  assert.doesNotMatch(source, /sydf/);
});

test('随机模式会先解析成具体占卜类型再继续执行', () => {
  assert.match(source, /function resolveMethod\(method: DivinationMethodId\)/);
  assert.match(source, /if \(method !== 'random'\)/);
  assert.match(source, /Math\.floor\(Math\.random\(\) \* CONCRETE_DIVINATION_METHODS\.length\)/);
});

test('占卜引擎会在当前项目本地统一构建提示词骨架', () => {
  assert.match(source, /function buildRoleText\(method: Exclude<DivinationMethodId, 'random'>\)/);
  assert.match(source, /function formatDivinationInfo\(/);
  assert.match(source, /export type BuildDivinationPromptOptions = \{/);
  assert.match(source, /options: BuildDivinationPromptOptions = \{\}/);
  assert.match(source, /'【要求】'/);
  assert.match(source, /'【当前时间】'/);
  assert.match(source, /'【占卜信息】'/);
  assert.match(source, /'【问题】'/);
  assert.match(source, /'【任务】'/);
  assert.match(source, /'【输出要求】'/);
});

test('统一时间信息文本不再自带重复标题，而是交给最终提示词 section 包装', () => {
  assert.match(source, /return \[\s*display\.solar,/);
  assert.doesNotMatch(source, /return `\*\*时间信息\*\*：/);
  assert.doesNotMatch(source, /return `时间信息：/);
});

test('占卜提示词改为角色加信息加问题的标准架构，并精简重复要求', () => {
  assert.match(source, /你是资深六爻断卦师/);
  assert.match(source, /伏神/);
  assert.match(source, /你是资深梅花易数解读师/);
  assert.match(source, /你是资深小六壬解读师/);
  assert.match(source, /你是资深奇门遁甲分析师/);
  assert.match(source, /值符值使/);
  assert.match(source, /你是资深大六壬断课师/);
  assert.match(source, /课体、神煞/);
  assert.match(source, /你是资深塔罗解读师/);
  assert.match(source, /你是资深三山国王灵签解签师/);
  assert.match(source, /只基于提供的占卜信息与问题作答/);
  assert.match(source, /资料包里没有直接写出的卦象细节、盘局数据、牌位信息或签文条件，不得自行补算或假定/);
  assert.match(source, /不写空话，不重复抄写原始信息/);
  assert.match(source, /先直接回答【问题】，再展开最关键的 2 到 4 个重点/);
});

test('大六壬提示词会引入可选断课模板', () => {
  assert.match(source, /liurenTemplate: LiurenTemplateType/);
  assert.match(source, /function buildLiurenTemplateText/);
  assert.match(source, /'【断课模板】'/);
  assert.match(source, /断课类型：/);
  assert.match(source, /建议展开顺序：/);
});

test('六爻提示词会引入可选专项断卦模板', () => {
  assert.match(source, /liuyaoTemplate: LiuyaoTemplateType/);
  assert.match(source, /function buildLiuyaoTemplateText/);
  assert.match(source, /'【断卦模板】'/);
  assert.match(source, /断卦类型：/);
  assert.match(source, /鬼神怪异/);
});

test('占卜引擎不再附带解读风格和输出长度参数', () => {
  assert.doesNotMatch(source, /interpretationStyle:/);
  assert.doesNotMatch(source, /outputLength:/);
});

test('当前项目源码中不再依赖 sydf 目录', () => {
  const files = collectSourceFiles(srcRoot);

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    assert.doesNotMatch(content, /sydf/, `源码仍包含 sydf 引用：${file}`);
  }
});

test('各占卜方式都可以直接使用当前项目本地算法生成会话', async () => {
  const methods = [
    'liuyao',
    'meihua',
    'xiaoliuren',
    'qimen',
    'liuren',
    'tarot',
    'ssgw',
    'almanac',
    'lenormand',
    'astrolabe',
  ] as const;

  for (const method of methods) {
    const session = await generateDivinationSession({
      method,
      question: '这件事接下来该怎么推进？',
      questionSource: 'inspiration',
      gender: '男',
      birthYear: '1995',
      meihuaMethod: 'number',
      meihuaNumber: '123',
      xiaoliurenMethod: 'time',
      xiaoliurenNumber: '',
      meihuaFocus: 'general',
      xiaoliurenFocus: 'general',
      qimenFocus: 'general',
      liuyaoTemplate: 'general',
      liurenTemplate: 'general',
      tarotSpread: 'three',
      almanacTopic: 'move',
      almanacStartDate: '2026-06-01',
      almanacEndDate: '2026-06-07',
      almanacParticipants: [
        {
          id: 'p1',
          name: '本人',
          gender: '男',
          year: '1995',
          month: '5',
          day: '20',
          timeIndex: '6',
          dateType: 'solar',
        },
      ],
      lenormandSpread: 'three',
      astrolabeName: '本人',
      astrolabeGender: '男',
      astrolabeYear: '1995',
      astrolabeMonth: '5',
      astrolabeDay: '20',
      astrolabeHour: '12',
      astrolabeMinute: '30',
      astrolabeLatitude: '39.9042',
      astrolabeLongitude: '116.4074',
      astrolabeTimezone: '8',
    });

    assert.equal(session.method, method);
    assert.equal(typeof session.prompt, 'string');
    assert.ok(session.prompt.includes('【占卜信息】'));
    assert.ok(session.prompt.includes('【输出要求】'));
    assert.equal(typeof session.data.timestamp, 'number');
  }
});

test('六爻算法会补出伏神结构，供提示词直接引用', () => {
  const data = generateLiuyao(new Date('2025-01-01T08:00:00+08:00'));

  assert.ok(Array.isArray(data.hiddenSpirits));
  assert.ok(
    data.hiddenSpirits.every(
      (item) =>
        item.sixRelative &&
        item.najiaDizhi &&
        item.wuxing &&
        typeof item.position === 'number' &&
        item.underYao,
    ),
  );
});

test('奇门算法会补出时旬空亡与马星落宫', () => {
  const data = generateQimen(new Date('2025-01-01T08:00:00+08:00'));

  assert.ok(data.voidBranches?.length);
  assert.ok(data.voidPalaces?.length);
  assert.ok(data.voidPalaces.every((item) => item.branch && item.palace && item.name));
  assert.ok(data.horseStar?.branch);
  assert.ok(data.horseStar?.palace);
  assert.ok(data.horseStar?.name);
  assert.ok(data.horseStar?.sourceBranch);
});

test('占卜自定义问题只保留基础信息与用户问题，不强塞任务和输出要求', async () => {
  const session = await generateDivinationSession({
    method: 'meihua',
    question: '我自己只想问这个具体情况。',
    questionSource: 'custom',
    gender: '',
    birthYear: '',
    meihuaMethod: 'time',
    meihuaNumber: '',
    xiaoliurenMethod: 'time',
    xiaoliurenNumber: '',
    meihuaFocus: 'general',
    xiaoliurenFocus: 'general',
    qimenFocus: 'general',
    liuyaoTemplate: 'general',
    liurenTemplate: 'general',
    tarotSpread: 'three',
  });

  assert.ok(session.prompt.includes('【占卜信息】'));
  assert.ok(session.prompt.includes('【问题】'));
  assert.ok(session.prompt.includes('我自己只想问这个具体情况。'));
  assert.ok(!session.prompt.includes('【任务】'));
  assert.ok(!session.prompt.includes('【输出要求】'));
});

test('占卜主链应显式按 questionSource 判断是否自定义，避免用宽松排除法误判', () => {
  assert.match(source, /draft\.questionSource === 'custom'/);
  assert.doesNotMatch(source, /draft\.questionSource !== 'inspiration'/);
});

test('黄历择日会结合可选事项、日期范围和多位出生信息生成提示词', async () => {
  const session = await generateDivinationSession({
    method: 'almanac',
    question: '我们准备搬家，想选一个兼顾两个人的日子。',
    questionSource: 'inspiration',
    gender: '',
    birthYear: '',
    meihuaMethod: 'time',
    meihuaNumber: '',
    xiaoliurenMethod: 'time',
    xiaoliurenNumber: '',
    meihuaFocus: 'general',
    xiaoliurenFocus: 'general',
    qimenFocus: 'general',
    liuyaoTemplate: 'general',
    liurenTemplate: 'general',
    tarotSpread: 'three',
    almanacTopic: 'move',
    almanacStartDate: '2026-06-01',
    almanacEndDate: '2026-06-05',
    almanacParticipants: [
      {
        id: 'self',
        name: '本人',
        gender: '男',
        year: '1990',
        month: '1',
        day: '1',
        timeIndex: '12',
        dateType: 'solar',
      },
      {
        id: 'partner',
        name: '伴侣',
        gender: '女',
        year: '1992',
        month: '6',
        day: '8',
        timeIndex: '5',
        dateType: 'solar',
      },
    ],
  });

  assert.equal(session.method, 'almanac');
  assert.match(session.prompt, /占法：黄历择日/);
  assert.match(session.prompt, /择日事项：搬家入宅/);
  assert.match(session.prompt, /候选日期：2026-06-01 至 2026-06-05/);
  assert.match(session.prompt, /初筛结论：当前排序第一为/);
  assert.doesNotMatch(session.prompt, /关键提示：当前排序第一为/);
  assert.match(session.prompt, /参与人八字参考：/);
  assert.match(session.prompt, /本人：男/);
  assert.match(session.prompt, /伴侣：女/);
  assert.ok('days' in session.data && session.data.days.length === 5);
});

test('黄历择日不强制填写问题，空补充时仍生成完整择日提示词和历史标题', async () => {
  const session = await generateDivinationSession({
    method: 'almanac',
    question: '',
    questionSource: 'custom',
    gender: '',
    birthYear: '',
    meihuaMethod: 'time',
    meihuaNumber: '',
    meihuaFocus: 'general',
    xiaoliurenFocus: 'general',
    qimenFocus: 'general',
    liuyaoTemplate: 'general',
    liurenTemplate: 'general',
    tarotSpread: 'three',
    almanacTopic: 'contract',
    almanacStartDate: '2026-06-01',
    almanacEndDate: '2026-06-03',
    almanacParticipants: [],
  });

  assert.equal(session.method, 'almanac');
  assert.equal(session.question, '黄历择日：签约合作（2026-06-01 至 2026-06-03）');
  assert.match(session.prompt, /【占卜信息】/);
  assert.match(session.prompt, /【任务】/);
  assert.match(session.prompt, /【输出要求】/);
  assert.doesNotMatch(session.prompt, /【问题】/);
});

test('雷诺曼与星盘可以生成适合复制给 AI 的结构化提示词', async () => {
  const lenormand = await generateDivinationSession({
    method: 'lenormand',
    question: '这段关系接下来会如何发展？',
    questionSource: 'inspiration',
    gender: '',
    birthYear: '',
    meihuaMethod: 'time',
    meihuaNumber: '',
    xiaoliurenMethod: 'time',
    xiaoliurenNumber: '',
    meihuaFocus: 'general',
    xiaoliurenFocus: 'general',
    qimenFocus: 'general',
    liuyaoTemplate: 'general',
    liurenTemplate: 'general',
    tarotSpread: 'three',
    lenormandSpread: 'relationship',
  });

  assert.equal(lenormand.method, 'lenormand');
  assert.match(lenormand.prompt, /占法：雷诺曼/);
  assert.match(lenormand.prompt, /牌阵/);
  assert.ok('cards' in lenormand.data && lenormand.data.cards.length >= 5);

  const astrolabe = await generateDivinationSession({
    method: 'astrolabe',
    question: '请看我的事业天赋和未来方向。',
    questionSource: 'inspiration',
    gender: '',
    birthYear: '',
    meihuaMethod: 'time',
    meihuaNumber: '',
    meihuaFocus: 'general',
    xiaoliurenFocus: 'general',
    qimenFocus: 'general',
    liuyaoTemplate: 'general',
    liurenTemplate: 'general',
    tarotSpread: 'three',
    astrolabeName: '本人',
    astrolabeGender: '女',
    astrolabeYear: '1995',
    astrolabeMonth: '5',
    astrolabeDay: '20',
    astrolabeHour: '12',
    astrolabeMinute: '30',
    astrolabeLatitude: '39.9042',
    astrolabeLongitude: '116.4074',
    astrolabeTimezone: '8',
  });

  assert.equal(astrolabe.method, 'astrolabe');
  assert.match(astrolabe.prompt, /占法：星盘/);
  assert.match(astrolabe.prompt, /上升/);
  assert.doesNotMatch(astrolabe.prompt, /真太阳时/);
  assert.doesNotMatch(astrolabe.prompt, /干支/);
  assert.doesNotMatch(astrolabe.prompt, /节气：/);
  assert.doesNotMatch(astrolabe.prompt, /农历/);
  assert.ok('planets' in astrolabe.data && astrolabe.data.planets.length >= 10);
  assert.ok('houses' in astrolabe.data && astrolabe.data.houses.length === 12);
});

test('小六壬支持时间起课与数字起课，并生成适合复制给 AI 的提示词', async () => {
  const timeSession = await generateDivinationSession({
    method: 'xiaoliuren',
    question: '这件事现在该不该继续推进？',
    questionSource: 'inspiration',
    gender: '',
    birthYear: '',
    meihuaMethod: 'time',
    meihuaNumber: '',
    xiaoliurenMethod: 'time',
    xiaoliurenNumber: '',
    meihuaFocus: 'general',
    xiaoliurenFocus: 'general',
    qimenFocus: 'general',
    liuyaoTemplate: 'general',
    liurenTemplate: 'general',
    tarotSpread: 'three',
    almanacTopic: 'move',
    almanacStartDate: '',
    almanacEndDate: '',
    almanacParticipants: [],
    lenormandSpread: 'three',
    astrolabeName: '本人',
    astrolabeGender: '',
    astrolabeYear: '',
    astrolabeMonth: '',
    astrolabeDay: '',
    astrolabeHour: '12',
    astrolabeMinute: '00',
    astrolabeLatitude: '39.9042',
    astrolabeLongitude: '116.4074',
    astrolabeTimezone: '8',
  });

  assert.equal(timeSession.method, 'xiaoliuren');
  assert.match(timeSession.prompt, /占法：小六壬/);
  assert.match(timeSession.prompt, /起因/);
  assert.match(timeSession.prompt, /过程/);
  assert.match(timeSession.prompt, /结果/);

  const numberSession = await generateDivinationSession({
    method: 'xiaoliuren',
    question: '这件事现在该不该继续推进？',
    questionSource: 'inspiration',
    gender: '',
    birthYear: '',
    meihuaMethod: 'time',
    meihuaNumber: '',
    xiaoliurenMethod: 'number',
    xiaoliurenNumber: '18',
    meihuaFocus: 'general',
    xiaoliurenFocus: 'general',
    qimenFocus: 'general',
    liuyaoTemplate: 'general',
    liurenTemplate: 'general',
    tarotSpread: 'three',
    almanacTopic: 'move',
    almanacStartDate: '',
    almanacEndDate: '',
    almanacParticipants: [],
    lenormandSpread: 'three',
    astrolabeName: '本人',
    astrolabeGender: '',
    astrolabeYear: '',
    astrolabeMonth: '',
    astrolabeDay: '',
    astrolabeHour: '12',
    astrolabeMinute: '00',
    astrolabeLatitude: '39.9042',
    astrolabeLongitude: '116.4074',
    astrolabeTimezone: '8',
  });

  assert.equal(numberSession.method, 'xiaoliuren');
  assert.match(numberSession.prompt, /起课方式数字起课/);
});
