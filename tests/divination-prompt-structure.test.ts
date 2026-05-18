import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDivinationPrompt } from '../src/lib/divination/engine';
import type { DivinationData, DivinationType, LiurenData, SupplementaryInfo } from '../src/types';

function createSupplementaryInfo(): SupplementaryInfo {
  return {
    gender: '男',
    birthYear: 1995,
    meihuaSettings: {
      method: 'number',
      number: 123,
    },
  };
}

function assertStandardPromptStructure(prompt: string) {
  const expectedSections = [
    '【要求】',
    '【当前时间】',
    '【补充信息】',
    '【占卜信息】',
    '【问题】',
    '【任务】',
    '【输出要求】',
  ];

  let lastIndex = -1;
  for (const section of expectedSections) {
    const headingMatches =
      prompt.match(new RegExp(`^${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'gm')) ?? [];
    assert.equal(headingMatches.length, 1, `${section} 不应重复出现`);
    const headingIndex = prompt.search(
      new RegExp(`^${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'),
    );
    assert.notEqual(headingIndex, -1, `缺少 section：${section}`);
    assert.ok(headingIndex > lastIndex, `${section} 顺序不正确`);
    assert.match(
      prompt,
      new RegExp(`${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n(?!\\n)`),
      `${section} 后应直接接正文`,
    );
    lastIndex = headingIndex;
  }

  assert.match(prompt, /^你是资深.+/);
  assert.match(prompt, /占法：/);
  assert.match(prompt, /核心结构：/);
  assert.doesNotMatch(prompt, /\*\*/);
}

function createData(method: Exclude<DivinationType, 'tarot_single'>): DivinationData {
  switch (method) {
    case 'liuyao':
      return {
        originalName: '乾为天',
        changedName: '坤为地',
        interName: '风山渐',
        ganzhi: { year: '甲子', month: '乙丑', day: '丙寅', hour: '丁卯' },
        timestamp: Date.now(),
        yaoArray: [9, 7, 8, 8, 7, 6],
        changingYaos: [
          { position: 1, isChanging: true, type: '老阳' },
          { position: 6, isChanging: true, type: '老阴' },
        ],
        sixGods: ['青龙', '朱雀', '勾陈', '腾蛇', '白虎', '玄武'],
        sixRelatives: ['兄弟', '子孙', '妻财', '官鬼', '父母', '兄弟'],
        najiaDizhi: ['子', '寅', '辰', '午', '申', '戌'],
        wuxing: ['水', '木', '土', '火', '金', '土'],
        worldAndResponse: ['世', '', '', '', '', '应'],
        voidBranches: ['戌', '亥'],
        palace: { name: '乾', wuxing: '金' },
        yaosDetail: [
          {
            position: 1,
            yaoType: '阳',
            isChanging: true,
            rawValue: 9,
            changeType: '老阳',
            sixGod: '青龙',
            sixRelative: '兄弟',
            najiaDizhi: '子',
            wuxing: '水',
            isWorld: true,
            isResponse: false,
            isVoid: false,
            changedYao: null,
          },
          {
            position: 2,
            yaoType: '阳',
            isChanging: false,
            rawValue: 7,
            changeType: '',
            sixGod: '朱雀',
            sixRelative: '子孙',
            najiaDizhi: '寅',
            wuxing: '木',
            isWorld: false,
            isResponse: false,
            isVoid: false,
            changedYao: null,
          },
          {
            position: 3,
            yaoType: '阴',
            isChanging: false,
            rawValue: 8,
            changeType: '',
            sixGod: '勾陈',
            sixRelative: '妻财',
            najiaDizhi: '辰',
            wuxing: '土',
            isWorld: false,
            isResponse: false,
            isVoid: false,
            changedYao: null,
          },
          {
            position: 4,
            yaoType: '阴',
            isChanging: false,
            rawValue: 8,
            changeType: '',
            sixGod: '腾蛇',
            sixRelative: '官鬼',
            najiaDizhi: '午',
            wuxing: '火',
            isWorld: false,
            isResponse: false,
            isVoid: false,
            changedYao: null,
          },
          {
            position: 5,
            yaoType: '阳',
            isChanging: false,
            rawValue: 7,
            changeType: '',
            sixGod: '白虎',
            sixRelative: '父母',
            najiaDizhi: '申',
            wuxing: '金',
            isWorld: false,
            isResponse: false,
            isVoid: false,
            changedYao: null,
          },
          {
            position: 6,
            yaoType: '阴',
            isChanging: true,
            rawValue: 6,
            changeType: '老阴',
            sixGod: '玄武',
            sixRelative: '兄弟',
            najiaDizhi: '戌',
            wuxing: '土',
            isWorld: false,
            isResponse: true,
            isVoid: true,
            changedYao: null,
          },
        ],
        hiddenSpirits: [
          {
            sixRelative: '子孙',
            position: 2,
            najiaDizhi: '寅',
            wuxing: '木',
            isVoid: false,
            underYao: {
              position: 2,
              sixRelative: '子孙',
              najiaDizhi: '寅',
              wuxing: '木',
            },
          },
        ],
        specialPattern: '全动卦',
        specialAdvice: '宜统观全局，不宜逐爻碎断。',
      };
    case 'meihua':
      return {
        originalName: '雷火丰',
        changedName: '地火明夷',
        interName: '泽风大过',
        ganzhi: { year: '甲子', month: '乙丑', day: '丙寅', hour: '丁卯' },
        timestamp: Date.now(),
        tiGua: { name: '离', element: '火', nature: '明' },
        yongGua: { name: '震', element: '木', nature: '动' },
        changedTiGua: { name: '坤', element: '土', nature: '顺' },
        changedYongGua: { name: '离', element: '火', nature: '明' },
        movingYao: { position: 3, description: '三爻发动', yaoName: '九三' },
        analysis: {
          season: '春',
          tiYongRelation: '用生体，主有助力',
          tiSeasonState: '相',
          yongSeasonState: '旺',
          inter1Relation: '比和',
          inter2Relation: '生',
          changedRelation: '体生变，后续需付出',
          changedTiYongRelation: '体克用',
        },
        mainHexagram: {
          name: '雷火丰',
          symbol: '䷶',
          upper: '震',
          lower: '离',
          description: '先盛后谨',
        },
        interHexagram: {
          name: '泽风大过',
          symbol: '䷛',
          upper: '兑',
          lower: '巽',
          description: '中间承压',
        },
        changedHexagram: {
          name: '地火明夷',
          symbol: '䷣',
          upper: '坤',
          lower: '离',
          description: '宜守光待时',
        },
        yaosDetail: [
          { position: 1, yaoType: '阳', isChanging: false, tiYong: '体' },
          { position: 2, yaoType: '阴', isChanging: false, tiYong: '体' },
          { position: 3, yaoType: '阳', isChanging: true, tiYong: '体' },
          { position: 4, yaoType: '阳', isChanging: false, tiYong: '用' },
          { position: 5, yaoType: '阴', isChanging: false, tiYong: '用' },
          { position: 6, yaoType: '阴', isChanging: false, tiYong: '用' },
        ],
        calculation: {
          method: 'number',
          methodKey: 'number',
          number: 123,
          externalSummary: '暂无外应，以数字起卦为主。',
        },
      };
    case 'xiaoliuren':
      return {
        method: 'number',
        methodLabel: '数字起课',
        timestamp: Date.now(),
        lunarMonth: 4,
        lunarDay: 18,
        hourIndex: 6,
        hourLabel: '午时',
        sequence: {
          start: {
            name: '留连',
            index: 1,
            meaning: '事情容易拖延反复，推进时会被旧问题牵扯。',
            keywords: ['拖延', '牵扯', '反复'],
            tendency: '易反复',
            advice: '不要急着定论，先清理卡点与未处理事项。',
          },
          process: {
            name: '赤口',
            index: 3,
            meaning: '容易出现争执、误会、口舌或情绪冲撞。',
            keywords: ['争执', '误会', '情绪'],
            tendency: '易争执',
            advice: '少硬碰硬，先控情绪和表达，再谈结果。',
          },
          result: {
            name: '小吉',
            index: 4,
            meaning: '事情整体可成，常有助力，但更适合渐进推进。',
            keywords: ['助力', '可成', '渐进'],
            tendency: '有助力',
            advice: '可以推进，但要一步一步拿结果，不宜贪快。',
          },
        },
        primary: {
          name: '小吉',
          index: 4,
          meaning: '事情整体可成，常有助力，但更适合渐进推进。',
          keywords: ['助力', '可成', '渐进'],
          tendency: '有助力',
          advice: '可以推进，但要一步一步拿结果，不宜贪快。',
        },
        tendency: '有助力',
        questionHint: '当前整体偏可成，适合稳步推进，慢慢拿结果。',
      };
    case 'qimen':
      return {
        jiuGongGe: [
          {
            gong: 1,
            name: '坎一宫',
            direction: '北',
            element: '水',
            tianPan: { star: '天蓬', stem: '壬' },
            diPan: { stem: '癸' },
            renPan: { door: '休门' },
            shenPan: { god: '值符' },
          },
          {
            gong: 9,
            name: '离九宫',
            direction: '南',
            element: '火',
            tianPan: { star: '天英', stem: '丙' },
            diPan: { stem: '丁' },
            renPan: { door: '景门' },
            shenPan: { god: '九天' },
          },
        ],
        ganzhi: { year: '甲子', month: '乙丑', day: '丙寅', hour: '丁卯' },
        isYangDun: true,
        juShu: 3,
        zhiFu: '天蓬',
        zhiShi: '休门',
        patternTags: ['门生宫', '星旺'],
        patternDetails: [{ tag: '门生宫', summary: '休门得地，利于稳步推进' }],
        palaceInsights: [{ gong: 1, name: '坎一宫', level: '有利', summary: '适合谋划与沟通' }],
        voidBranches: ['子', '丑'],
        voidPalaces: [
          { branch: '子', palace: 1, name: '坎一宫' },
          { branch: '丑', palace: 8, name: '艮八宫' },
        ],
        horseStar: {
          sourceBranch: '卯',
          branch: '巳',
          palace: 4,
          name: '巽四宫',
        },
        timeInfo: { solarTerm: '春分', epoch: '上元' },
        timestamp: Date.now(),
      };
    case 'liuren':
      return {
        ganzhi: { year: '甲子', month: '乙丑', day: '丙寅', hour: '丁卯' },
        timestamp: Date.now(),
        dayNight: '昼占',
        monthLeader: '亥',
        divinationBranch: '卯',
        dayOfficer: '贵人',
        noblemanBranch: '亥',
        xunKong: ['戌', '亥'],
        transmissionRule: '比用法',
        transmissionPattern: '递传',
        transmissionDetail: '取传采用比用法，以一课上神亥为初传发用。',
        fourLessons: [
          {
            name: '一课',
            upper: '亥',
            lower: '卯',
            god: '贵人',
            relation: '水生木',
            note: '外援先动',
          },
          {
            name: '二课',
            upper: '子',
            lower: '辰',
            god: '螣蛇',
            relation: '土克水',
            note: '过程有牵制',
          },
          {
            name: '三课',
            upper: '丑',
            lower: '巳',
            god: '朱雀',
            relation: '火生土',
            note: '沟通带动变化',
          },
          {
            name: '四课',
            upper: '寅',
            lower: '午',
            god: '六合',
            relation: '木生火',
            note: '后续利于协同',
          },
        ],
        threeTransmissions: [
          { stage: '初传', branch: '亥', god: '贵人', relation: '生扶', note: '起因来自外部推动' },
          {
            stage: '中传',
            branch: '丑',
            god: '朱雀',
            relation: '承压',
            note: '中段要处理沟通与执行偏差',
          },
          {
            stage: '末传',
            branch: '寅',
            god: '六合',
            relation: '转合',
            note: '结果更利于合作收束',
          },
        ],
        heavenlyPlate: [
          { branch: '子', under: '丑', god: '青龙' },
          { branch: '丑', under: '寅', god: '天空' },
          { branch: '寅', under: '卯', god: '白虎' },
        ],
        patternTags: ['贵人发用', '顺传', '比用'],
        lessonSummary: '四课由生入克，先得助后承压，再转协同。',
        transmissionSummary: '三传顺传，事情会逐步推进，但中段要过一道沟通关。',
      } satisfies LiurenData;
    case 'tarot':
      return {
        spreadType: 'single',
        spreadName: '单牌指引',
        cards: [
          { id: 1, name: '恋人', position: '现状', reversed: false, keywords: ['选择', '连接'] },
          { id: 2, name: '战车', position: '建议', reversed: true, keywords: ['控制', '节奏'] },
        ],
        timestamp: Date.now(),
      };
    case 'ssgw':
      return {
        number: 18,
        title: '刘备借荆州',
        poem: '前路迢迢莫强求，且看云开月自明。',
        details: {
          典故: '刘备借荆州后多方周旋，需审时度势。',
          解签: '宜守正待时，不可躁进。',
        },
        timestamp: Date.now(),
        ganzhi: { year: '甲子', month: '乙丑', day: '丙寅', hour: '丁卯' },
      };
  }
}

test('各类占卜提示词都使用统一的角色加信息加问题结构', async () => {
  const methods: Exclude<DivinationType, 'tarot_single'>[] = [
    'liuyao',
    'meihua',
    'xiaoliuren',
    'qimen',
    'liuren',
    'tarot',
    'ssgw',
  ];

  for (const method of methods) {
    const prompt = buildDivinationPrompt(
      method,
      '这件事接下来该怎么推进？',
      createData(method),
      createSupplementaryInfo(),
    );
    assertStandardPromptStructure(prompt);
  }
});

test('占卜提示词的输出要求保持统一且精简', async () => {
  const session = buildDivinationPrompt(
    'qimen',
    '这件事接下来该怎么推进？',
    createData('qimen'),
    createSupplementaryInfo(),
  );

  assert.match(session, /先直接回答【问题】，再展开最关键的 2 到 4 个重点/);
  assert.match(session, /最后补一条最值得执行的提醒/);
  assert.doesNotMatch(session, /请直接回答：/);
  assert.doesNotMatch(session, /语气和表达要求/);
});

test('非梅花占法的补充信息不应混入梅花专属的起卦方式和数字', () => {
  const prompt = buildDivinationPrompt(
    'tarot',
    '这件事接下来该怎么推进？',
    createData('tarot'),
    createSupplementaryInfo(),
  );

  assert.match(prompt, /【补充信息】/);
  assert.match(prompt, /性别：男/);
  assert.match(prompt, /出生年份：1995/);
  assert.doesNotMatch(prompt, /起卦方式：数字起卦/);
  assert.doesNotMatch(prompt, /起卦数字：123/);
});

test('占卜提示词的当前时间应来自起盘结果而不是运行环境当前时间', () => {
  const data = {
    ...createData('qimen'),
    timestamp: Date.parse('2025-01-01T08:30:00+08:00'),
  };
  const prompt = buildDivinationPrompt('qimen', '这件事接下来该怎么推进？', data);

  assert.match(prompt, /【当前时间】\n公历：2025年1月1日 8时30分/);
  assert.doesNotMatch(prompt, /年年/);
});

test('奇门提示词会结合问题补充取用参考与优先宫位', () => {
  const prompt = buildDivinationPrompt('qimen', '这次换工作该不该主动推进？', createData('qimen'), {
    gender: '男',
    birthYear: 1995,
  });

  assert.match(prompt, /核心结构：阳遁3局；值符天蓬；值使休门/);
  assert.match(prompt, /起局抓手：/);
  assert.match(prompt, /主轴证据：值符天蓬落坎一宫；值使休门落坎一宫；时干丁见于离九宫/);
  assert.match(prompt, /用神宫候选：/);
  assert.match(prompt, /辅助证据：旬空子空落坎一宫、丑空落艮八宫；马星卯时驿马在巳，落巽四宫/);
  assert.doesNotMatch(prompt, /优先看宫：/);
  assert.doesNotMatch(prompt, /值符值使主轴优先看落宫与门星神干组合/);
  assert.doesNotMatch(prompt, /问事参考：当前问题可先从坎一宫切入/);
  assert.doesNotMatch(prompt, /补充提示：坎一宫有利，适合谋划与沟通/);
  assert.match(prompt, /坎一宫（北，五行水）：天盘壬天蓬，地盘癸，人盘休门，神盘值符/);
});

test('奇门提示词只在命中具体问事线索时输出问事参考', () => {
  const data = {
    ...createData('qimen'),
    jiuGongGe: [
      ...createData('qimen').jiuGongGe,
      {
        gong: 6,
        name: '乾六宫',
        direction: '西北',
        element: '金',
        tianPan: { star: '天心', stem: '辛' },
        diPan: { stem: '庚' },
        renPan: { door: '开门' },
        shenPan: { god: '六合' },
      },
      {
        gong: 8,
        name: '艮八宫',
        direction: '东北',
        element: '土',
        tianPan: { star: '天任', stem: '戊' },
        diPan: { stem: '己' },
        renPan: { door: '生门' },
        shenPan: { god: '九地' },
      },
    ],
  } satisfies DivinationData;

  const prompt = buildDivinationPrompt('qimen', '这次换工作该不该主动推进？', data, {
    gender: '男',
    birthYear: 1995,
  });

  assert.match(prompt, /问事参考：事业参考：首看开门，当前落乾六宫；兼看生门，当前落艮八宫/);
});

test('六爻提示词会给出断卦抓手，先看用神世应动变', () => {
  const prompt = buildDivinationPrompt(
    'liuyao',
    '这件事接下来该怎么推进？',
    createData('liuyao'),
    createSupplementaryInfo(),
  );

  assert.match(prompt, /断卦抓手：/);
  assert.match(prompt, /世爻/);
  assert.match(prompt, /应爻/);
  assert.match(prompt, /动爻/);
  assert.match(prompt, /空亡/);
  assert.match(prompt, /用神候选：/);
  assert.match(prompt, /未识别专项用神：先以世爻第1爻兄弟子水为我方主轴/);
  assert.match(prompt, /主轴证据：世爻第1爻兄弟子水；应爻第6爻兄弟戌土；动变/);
  assert.match(prompt, /辅助证据：空亡爻位第6爻兄弟戌土/);
  assert.match(prompt, /伏神子孙伏第2爻寅木，伏于子孙寅木下/);
});

test('六爻提示词会按问题补充传统用神候选', () => {
  const prompt = buildDivinationPrompt(
    'liuyao',
    '这次换工作有没有机会升职？',
    createData('liuyao'),
    createSupplementaryInfo(),
  );

  assert.match(prompt, /用神候选：事业职位：以官鬼为用神候选/);
  assert.match(prompt, /盘中第4爻官鬼午火/);
});

test('六爻提示词会带专项断卦模板，并把鬼神怪异问题收紧到传统判断口径', () => {
  const prompt = buildDivinationPrompt(
    'liuyao',
    '最近家里总觉得不安，这是不是鬼神怪异或冲犯？',
    createData('liuyao'),
    createSupplementaryInfo(),
    { liuyaoTemplate: 'guaishen' },
  );

  assert.match(prompt, /【断卦模板】/);
  assert.match(prompt, /断卦类型：鬼神怪异/);
  assert.match(prompt, /官鬼与子孙制鬼、世应受冲、玄武腾蛇白虎勾陈、空破入墓与家宅怪异线索/);
  assert.match(prompt, /专项抓手：鬼神怪异：重点看官鬼是否旺动贴世，子孙能否制鬼/);
  assert.match(prompt, /若卦中证据不足，只能说“未见明显鬼神主证”或“更偏情绪\/环境因素”/);
});

test('梅花提示词会给出体用主轴、过程结果与起卦细节', () => {
  const prompt = buildDivinationPrompt(
    'meihua',
    '这件事接下来该怎么推进？',
    createData('meihua'),
    createSupplementaryInfo(),
  );

  assert.match(prompt, /断卦抓手：先定体用，再看互卦过程、变卦结果与四时旺衰/);
  assert.match(prompt, /主轴证据：体卦离（火）；用卦震（木）；动爻第3爻；体用关系用生体，主有助力/);
  assert.match(prompt, /过程证据：互卦泽风大过；互下比和；互上生/);
  assert.match(
    prompt,
    /结果证据：变卦地火明夷；变后体卦坤（土）；变后用卦离（火）；变后体用体克用/,
  );
  assert.match(prompt, /辅助证据：四时春季，体卦相，用卦旺；起卦法数字起卦法；起卦数字123/);
  assert.match(prompt, /补充提示：暂无外应，以数字起卦为主/);
  assert.doesNotMatch(prompt, /关键提示：体卦离（火）；用卦震（木）；动爻第3爻/);
  assert.doesNotMatch(prompt, /外应：暂无外应，以数字起卦为主/);
  assert.doesNotMatch(prompt, /起卦法number/);
  assert.doesNotMatch(prompt, /起卦方式：number/);
  assert.doesNotMatch(prompt, /起卦类别：number/);
  assert.doesNotMatch(prompt, /- 起卦方式：数字起卦法/);
  assert.doesNotMatch(prompt, /- 起卦数字：123/);
  assert.match(prompt, /- 第3爻：阳爻，属体，动/);
});

test('梅花外应起卦会带外应映射与原始外应信息', () => {
  const data = {
    ...createData('meihua'),
    calculation: {
      method: '外应起卦法',
      methodKey: 'external',
      externalSummary: '见南方来人携红色文书而来，可参离火文明之象。',
      externalOmens: {
        direction: '南',
        person: '长女',
        object: '火电文书',
        sound: '清脆笑语',
        color: '赤紫',
        count: 5,
      },
      externalMappedOmens: [
        { source: 'direction', label: '方向南', trigram: '离', trigramIndex: 3 },
        { source: 'person', label: '长女', trigram: '巽', trigramIndex: 4 },
        { source: 'object', label: '火电文书', trigram: '离', trigramIndex: 3 },
      ],
    },
  } satisfies DivinationData;

  const prompt = buildDivinationPrompt(
    'meihua',
    '这件事接下来该怎么推进？',
    data,
    createSupplementaryInfo(),
  );

  assert.match(prompt, /辅助证据：四时春季，体卦相，用卦旺；起卦法外应起卦法/);
  assert.match(prompt, /外应：见南方来人携红色文书而来，可参离火文明之象/);
  assert.match(
    prompt,
    /外应映射：方向南->离卦（3）；长女->巽卦（4）；火电文书->离卦（3）/,
  );
  assert.match(
    prompt,
    /外应明细：方向南；人物长女；物象火电文书；声音清脆笑语；颜色赤紫；数量5/,
  );
  assert.doesNotMatch(prompt, /补充提示：见南方来人携红色文书而来，可参离火文明之象。/);
  assert.doesNotMatch(prompt, /起卦类别：external/);
  assert.doesNotMatch(prompt, /- 起卦方式：外应起卦法/);
  assert.doesNotMatch(prompt, /- 起卦数字：/);
});

test('小六壬提示词会给出三段过程、主判断和现实建议抓手', () => {
  const prompt = buildDivinationPrompt(
    'xiaoliuren',
    '这件事接下来该怎么推进？',
    createData('xiaoliuren'),
    createSupplementaryInfo(),
  );

  assert.match(prompt, /占法：小六壬/);
  assert.match(prompt, /断课抓手：先看结果宫位定主判断，再看起因与过程宫位解释事情为何如此、会如何推进。/);
  assert.match(prompt, /主轴证据：起因留连（拖延、牵扯、反复）；过程赤口（争执、误会、情绪）；结果小吉（助力、可成、渐进）/);
  assert.match(prompt, /辅助证据：起因提示事情容易拖延反复，推进时会被旧问题牵扯。；过程提示容易出现争执、误会、口舌或情绪冲撞。；结果提示事情整体可成，常有助力，但更适合渐进推进。/);
  assert.match(prompt, /现实映射：当前整体偏可成，适合稳步推进，慢慢拿结果。/);
  assert.match(prompt, /- 起课方式：数字起课/);
  assert.match(prompt, /- 起因：留连，关键词：拖延、牵扯、反复；建议：不要急着定论，先清理卡点与未处理事项。/);
  assert.match(prompt, /- 结果：小吉，关键词：助力、可成、渐进；建议：可以推进，但要一步一步拿结果，不宜贪快。/);
});

test('小六壬专项灵感框架会把感情题收紧到关系走向与行动建议', () => {
  const prompt = buildDivinationPrompt(
    'xiaoliuren',
    '这段关系接下来整体会往哪边走？',
    createData('xiaoliuren'),
    createSupplementaryInfo(),
    { xiaoliurenFocus: 'emotion' },
  );

  assert.match(prompt, /【分析框架】/);
  assert.match(prompt, /先以结果宫位定关系走向，再回看起因、过程解释情绪和沟通卡点/);
  assert.match(prompt, /请围绕起因、过程、结果三段宫位变化，判断关系走向、沟通卡点与该主动、缓和还是止损/);
  assert.match(prompt, /要明确写出关系走向、沟通风险，以及现在更适合主动、缓和、等待还是止损。/);
});

test('梅花专项灵感框架会把决策题收紧到顺势方向与风险点', () => {
  const prompt = buildDivinationPrompt(
    'meihua',
    '我现在做这个决定，方向对不对？',
    createData('meihua'),
    createSupplementaryInfo(),
    { meihuaFocus: 'decision' },
  );

  assert.match(prompt, /【分析框架】/);
  assert.match(prompt, /重点比较当前选择是否顺势、最容易忽略的风险在哪里/);
  assert.match(prompt, /请围绕体用关系、互卦过程、变卦结果和四时旺衰，判断当前选择是否顺势、风险点在哪、下一步更适合怎么走/);
  assert.match(prompt, /要明确写出哪个方向更顺、最大风险点在哪里，以及下一步先做什么。/);
});

test('奇门专项灵感框架会把时机题收紧到宜动宜守与时间窗口', () => {
  const prompt = buildDivinationPrompt(
    'qimen',
    '这件事现在是不是合适的行动时机？',
    createData('qimen'),
    createSupplementaryInfo(),
    { qimenFocus: 'timing' },
  );

  assert.match(prompt, /【分析框架】/);
  assert.match(prompt, /先看值符值使与用门落宫判断当前时机，再结合空亡、马星和门星神干判断宜动宜守与更合适的时间窗口。/);
  assert.match(prompt, /请围绕值符值使、用门落宫、门星神干组合、空亡与马星变化，判断当前时机、宜动宜守与更合适的时间窗口/);
  assert.match(prompt, /要明确写出现在是否宜动、宜守或宜等，以及对应的时机依据。/);
});

test('大六壬提示词会带可选断课模板', () => {
  const prompt = buildDivinationPrompt(
    'liuren',
    '我现在要不要换工作？',
    createData('liuren'),
    createSupplementaryInfo(),
    { liurenTemplate: 'shiye' },
  );

  assert.match(prompt, /【断课模板】/);
  assert.match(prompt, /断课类型：事业断课/);
  assert.match(prompt, /建议展开顺序：/);
  assert.match(prompt, /起因判断：/);
  assert.match(prompt, /过程判断：/);
  assert.match(prompt, /结果判断：/);
  assert.match(prompt, /行动建议：/);
});

test('大六壬提示词会给出断课抓手，先提示发用主线再断事', () => {
  const prompt = buildDivinationPrompt(
    'liuren',
    '这件事接下来该怎么推进？',
    createData('liuren'),
    createSupplementaryInfo(),
  );

  assert.match(prompt, /断课抓手：/);
  assert.match(prompt, /发用/);
  assert.match(prompt, /传态/);
  assert.match(prompt, /旬空/);
  assert.match(prompt, /主线证据：/);
  assert.match(prompt, /主线证据：初传亥乘贵人，生扶，起因来自外部推动/);
  assert.match(prompt, /四课证据：一课亥临卯乘贵人，水生木/);
  assert.match(prompt, /取传说明：取传采用比用法，以一课上神亥为初传发用。/);
  assert.match(prompt, /取证顺序：/);
  assert.doesNotMatch(prompt, /取传说明：.*传态为/);
  assert.doesNotMatch(prompt, /取传说明：.*链路为/);
  assert.doesNotMatch(prompt, /传变依据：.*断课模板/);
});

test('大六壬提示词的任务与输出要求应和断课模板口径一致，不重复强制逐段作答', () => {
  const prompt = buildDivinationPrompt(
    'liuren',
    '这件事接下来该怎么推进？',
    createData('liuren'),
    createSupplementaryInfo(),
  );

  assert.doesNotMatch(prompt, /务必按【断课模板】逐段作答/);
  assert.match(
    prompt,
    /【输出要求】\n先直接回答【问题】，再按【断课模板】或主线顺序展开起因、过程、结果与行动建议。\n每一段都要写明对应的课传依据、触发条件与现实建议。/,
  );
  assert.doesNotMatch(prompt, /先直接回答【问题】，再展开最关键的 2 到 4 个重点；每个重点都要写明占卜依据、触发条件与现实建议。/);
});

test('大六壬提示词会吸收课体与神煞补充信息', () => {
  const data = {
    ...createData('liuren'),
    guaTi: ['龙德卦', '连珠卦'],
    shenShaSummary: ['旬奇临初传', '天马并发', '末传逢月德'],
  } satisfies LiurenData;

  const prompt = buildDivinationPrompt(
    'liuren',
    '这件事接下来该怎么推进？',
    data,
    createSupplementaryInfo(),
  );

  assert.match(
    prompt,
    /辅助证据：课体龙德卦、连珠卦；课体标签贵人发用、顺传、比用；神煞旬奇临初传；天马并发；末传逢月德；旬空戌、亥/,
  );
  assert.doesNotMatch(prompt, /课体补充：龙德卦、连珠卦/);
  assert.doesNotMatch(prompt, /神煞补充：旬奇临初传；天马并发；末传逢月德/);
});

test('塔罗提示词会给出牌阵主轴、位置关系与行动建议抓手', () => {
  const prompt = buildDivinationPrompt(
    'tarot',
    '这件事接下来该怎么推进？',
    createData('tarot'),
    createSupplementaryInfo(),
  );

  assert.match(prompt, /断牌抓手：先统合牌阵主轴，再看关键位置、正逆位变化与牌面呼应/);
  assert.match(prompt, /主轴证据：现状恋人（正位）；建议战车（逆位）/);
  assert.match(prompt, /辅助证据：牌阵单牌指引；现状关键词选择、连接；建议关键词控制、节奏/);
  assert.match(prompt, /位置关系：现状先提示选择与连接，建议位再看如何调整控制与节奏/);
  assert.doesNotMatch(prompt, /关键提示：重点关注各位置含义、正逆位变化与牌面之间的呼应关系/);
  assert.match(prompt, /- 现状：恋人（正位），关键词：选择、连接/);
  assert.match(prompt, /- 建议：战车（逆位），关键词：控制、节奏/);
});

test('灵签提示词会给出签诗主旨、典故映射与宜进宜守抓手', () => {
  const prompt = buildDivinationPrompt(
    'ssgw',
    '这件事接下来该怎么推进？',
    createData('ssgw'),
    createSupplementaryInfo(),
  );

  assert.match(prompt, /断签抓手：先定签诗主旨，再看典故映射、现实处境与宜进宜守/);
  assert.match(prompt, /主轴证据：签诗“前路迢迢莫强求，且看云开月自明。”/);
  assert.match(prompt, /辅助证据：签题《刘备借荆州》；典故刘备借荆州后多方周旋，需审时度势。；解签宜守正待时，不可躁进。/);
  assert.match(prompt, /现实映射：当前更宜先守正待时，再等局势转明，不宜躁进强求/);
  assert.doesNotMatch(prompt, /关键提示：签诗“前路迢迢莫强求，且看云开月自明。”/);
  assert.match(prompt, /- 签号：第18签/);
  assert.match(prompt, /- 签题：刘备借荆州/);
  assert.match(prompt, /- 典故：刘备借荆州后多方周旋，需审时度势。/);
  assert.match(prompt, /- 解签：宜守正待时，不可躁进。/);
});

test('灵签提示词会去重重复典故，避免 story 与 details.典故 双写', () => {
  const prompt = buildDivinationPrompt(
    'ssgw',
    '这件事接下来该怎么推进？',
    {
      number: 9,
      title: '典故去重测试',
      poem: '静待云开见月明，不妨暂且敛锋芒。',
      story: '韩信受胯下之辱，先忍后成大业。',
      details: {
        典故: '韩信受胯下之辱，先忍后成大业。',
        解签: '宜暂避锋芒，等待时机。',
      },
      timestamp: Date.now(),
      ganzhi: { year: '甲子', month: '乙丑', day: '丙寅', hour: '丁卯' },
    },
    createSupplementaryInfo(),
  );

  assert.equal((prompt.match(/韩信受胯下之辱，先忍后成大业。/g) ?? []).length, 2);
  assert.match(prompt, /辅助证据：签题《典故去重测试》；典故韩信受胯下之辱，先忍后成大业。；解签宜暂避锋芒，等待时机。/);
  assert.match(prompt, /- 典故：韩信受胯下之辱，先忍后成大业。/);
  assert.doesNotMatch(prompt, /补充提示：韩信受胯下之辱，先忍后成大业。/);
});

test('雷诺曼提示词应以前三张核心牌作为主轴，不额外插入泛化说明', () => {
  const prompt = buildDivinationPrompt(
    'lenormand',
    '这件事接下来该怎么推进？',
    {
      spreadType: 'relationship',
      spreadName: '关系牌阵',
      cards: [
        { position: '现状', name: '骑士', keywords: ['消息', '推进'], meaning: '事情开始动起来。' },
        { position: '阻碍', name: '山', keywords: ['阻碍', '拖延'], meaning: '进程会被卡住。' },
        { position: '结果', name: '太阳', keywords: ['明朗', '成功'], meaning: '后续有机会转明。' },
      ],
      timestamp: Date.now(),
    },
  );

  assert.match(prompt, /断牌抓手：先看核心牌，再看左右邻牌如何补充事件、人、消息、阻碍或结果。/);
  assert.match(prompt, /主轴证据：现状骑士；阻碍山；结果太阳/);
  assert.doesNotMatch(prompt, /关键提示：雷诺曼偏现实事件判断/);
});

test('星盘提示词应直接给出太阳月亮上升和主要相位证据', () => {
  const prompt = buildDivinationPrompt(
    'astrolabe',
    '这件事接下来该怎么推进？',
    {
      birth: {
        name: '本人',
        gender: '女',
        dateTime: '1995-05-20 12:30',
        location: '北京',
        timezone: 8,
      },
      planets: [
        { name: 'Sun', label: '太阳', formatted: '金牛座 29°', house: 10, retrograde: false },
        { name: 'Moon', label: '月亮', formatted: '处女座 08°', house: 2, retrograde: false },
        { name: 'Mercury', label: '水星', formatted: '双子座 10°', house: 11, retrograde: false },
      ],
      houses: Array.from({ length: 12 }, (_, index) => ({ index: index + 1, sign: '白羊座', degree: '0°' })),
      angles: [
        { name: 'Ascendant', label: '上升', formatted: '狮子座 12°' },
        { name: 'MC', label: '天顶', formatted: '金牛座 05°' },
      ],
      aspects: [
        { body1: '太阳', symbol: '△', body2: '月亮', type: '三分', orb: 3.2, strength: 86, applying: true },
        { body1: '太阳', symbol: '合', body2: '水星', type: '合相', orb: 4.1, strength: 74, applying: false },
      ],
      summary: {
        retrograde: [],
        patterns: ['土象偏强'],
        elements: { 火: ['上升'], 土: ['太阳', '月亮'], 风: ['水星'], 水: [] },
        modalities: { 开创: ['上升'], 固定: ['太阳'], 变动: ['月亮', '水星'] },
      },
      timestamp: Date.now(),
    },
  );

  assert.match(prompt, /【分析框架】/);
  assert.match(prompt, /先用太阳、月亮、上升定人格主轴，再补充最关键的落宫与主相位。/);
  assert.match(prompt, /主轴证据：太阳金牛座 29°；月亮处女座 08°；上升狮子座 12°/);
  assert.match(prompt, /辅助证据：主要相位太阳△月亮（三分，强度86%）；太阳合水星（合相，强度74%）；逆行无；格局土象偏强/);
  assert.doesNotMatch(prompt, /解读抓手：先看太阳、月亮、上升建立人格主轴/);
});
