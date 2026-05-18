import test from 'node:test';
import assert from 'node:assert/strict';

test('ziwei-prompts 目录化后仍导出公开 API', async () => {
  const mod = await import('../src/lib/ziwei-prompts');

  assert.equal(typeof mod.buildPortablePromptPack, 'function');
});

test('ziwei-prompts 子文件各自导出预期函数', async () => {
  const formatters = await import('../src/lib/ziwei-prompts/formatters');
  const labels = await import('../src/lib/ziwei-prompts/labels');
  const palaceHelpers = await import('../src/lib/ziwei-prompts/palace-helpers');
  const focusBundle = await import('../src/lib/ziwei-prompts/focus-bundle');
  const builders = await import('../src/lib/ziwei-prompts/builders');
  const snapshot = await import('../src/lib/ziwei-prompts/snapshot');

  assert.equal(typeof formatters.formatScalarValue, 'function');
  assert.equal(typeof formatters.formatKeyValueBlock, 'function');
  assert.equal(typeof formatters.formatObjectList, 'function');

  assert.equal(typeof labels.formatPalaceName, 'function');
  assert.equal(typeof labels.normalizePalaceName, 'function');
  assert.equal(typeof labels.mapTopicLabel, 'function');
  assert.equal(typeof labels.mapReportTypeLabel, 'function');
  assert.equal(typeof labels.mapScopeLabel, 'function');

  assert.equal(typeof palaceHelpers.getAllStars, 'function');
  assert.equal(typeof palaceHelpers.getPalaceByName, 'function');
  assert.equal(typeof palaceHelpers.getPalaceByIndex, 'function');
  assert.equal(typeof palaceHelpers.getBodyPalace, 'function');
  assert.equal(typeof palaceHelpers.getOppositePalace, 'function');
  assert.equal(typeof palaceHelpers.getSurroundedPalaces, 'function');
  assert.equal(typeof palaceHelpers.dedupePalaces, 'function');
  assert.equal(typeof palaceHelpers.collectMutagenStars, 'function');
  assert.equal(typeof palaceHelpers.buildScopeFocusPalaces, 'function');

  assert.equal(typeof focusBundle.buildFocusTaskBundle, 'function');
  assert.equal(typeof builders.buildPalaceSummary, 'function');
  assert.equal(typeof builders.buildEvidenceSummary, 'function');
  assert.equal(typeof builders.buildPalaceIndex, 'function');
  assert.equal(typeof snapshot.buildPromptContextSnapshot, 'function');
  assert.equal(typeof snapshot.buildZiweiReadableSnapshot, 'function');
});

test('ziwei-prompts 纯函数模块对常见输入产出稳定文本', async () => {
  const { formatScalarValue, formatKeyValueBlock, formatObjectList } =
    await import('../src/lib/ziwei-prompts/formatters');
  const { formatPalaceName, normalizePalaceName, mapTopicLabel, mapScopeLabel } =
    await import('../src/lib/ziwei-prompts/labels');

  assert.equal(formatScalarValue(undefined), '暂无');
  assert.equal(formatScalarValue(''), '暂无');
  assert.equal(formatScalarValue([]), '暂无');
  assert.equal(formatScalarValue(['甲', '乙']), '甲、乙');
  assert.equal(formatScalarValue(true), '是');
  assert.equal(formatScalarValue(false), '否');
  assert.equal(formatScalarValue(123), '123');

  assert.equal(formatPalaceName('命宫'), '命宫');
  assert.equal(formatPalaceName('命'), '命宫');
  assert.equal(normalizePalaceName('命宫'), '命');
  assert.equal(normalizePalaceName('命'), '命');

  assert.equal(mapTopicLabel('destiny'), '命局解读');
  assert.equal(mapTopicLabel('relationship'), '婚姻感情');
  assert.equal(mapTopicLabel('family'), '六亲家庭');
  assert.equal(mapTopicLabel('health'), '健康养护');
  assert.equal(mapTopicLabel('study'), '学业成长');
  assert.equal(mapTopicLabel('unknown'), '提示词解读');
  assert.equal(mapScopeLabel('origin'), '本命');
  assert.equal(mapScopeLabel('decadal'), '大限');
  assert.equal(mapScopeLabel('yearly'), '流年');

  assert.match(formatKeyValueBlock({ 主题: '命局', 数量: 3 }), /- 主题：命局/);
  assert.match(formatKeyValueBlock({ 主题: '命局', 数量: 3 }), /- 数量：3/);
  assert.equal(formatObjectList([]), '- 暂无');
  assert.match(formatObjectList([{ 名: '甲' }, { 名: '乙' }]), /1\./);
  assert.match(formatObjectList([{ 名: '甲' }, { 名: '乙' }]), /2\./);
});

test('六壬空亡统一为 utils/lunar 实现后保持等价输出', async () => {
  const { getVoidBranches } = await import('../src/utils/lunar');

  assert.deepEqual(getVoidBranches('甲子'), ['戌', '亥']);
  assert.deepEqual(getVoidBranches('甲戌'), ['申', '酉']);
  assert.deepEqual(getVoidBranches('甲申'), ['午', '未']);
  assert.deepEqual(getVoidBranches('甲午'), ['辰', '巳']);
  assert.deepEqual(getVoidBranches('甲辰'), ['寅', '卯']);
  assert.deepEqual(getVoidBranches('甲寅'), ['子', '丑']);
  assert.deepEqual(getVoidBranches('癸亥'), ['子', '丑']);
  assert.deepEqual(getVoidBranches('未知干支'), []);
});

test('六壬源码不再保留私有 getXunKong/JIAZI,改为复用 utils/lunar.getVoidBranches', async () => {
  const { readFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');
  const liurenSource = readFileSync(
    resolve('src/lib/divination/algorithms/liuren/index.ts'),
    'utf8',
  );

  assert.doesNotMatch(liurenSource, /function getXunKong\(/);
  assert.doesNotMatch(liurenSource, /const JIAZI = /);
  assert.doesNotMatch(liurenSource, /HEAVENLY_STEMS/);
  assert.match(liurenSource, /import \{ getVoidBranches \} from/);
  assert.match(liurenSource, /getVoidBranches\(ganzhi\.day\)/);
});

test('InputPage 拆出 useBirthPlace、PersonForm、BirthPlaceModal 三件套', async () => {
  const { readFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  const inputSource = readFileSync(resolve('src/pages/InputPage.tsx'), 'utf8');
  const hookSource = readFileSync(resolve('src/hooks/useBirthPlace.ts'), 'utf8');
  const personFormSource = readFileSync(resolve('src/pages/InputPage.PersonForm.tsx'), 'utf8');
  const modalSource = readFileSync(resolve('src/pages/InputPage.BirthPlaceModal.tsx'), 'utf8');

  assert.match(inputSource, /import \{ useBirthPlace \} from '@\/hooks\/useBirthPlace'/);
  assert.match(inputSource, /import \{ BirthPlaceModal \}/);
  assert.match(
    inputSource,
    /import \{[\s\S]*?PersonForm[\s\S]*?\} from '\.\/InputPage\.PersonForm'/,
  );
  assert.match(inputSource, /<BirthPlaceModal birthPlace=\{birthPlace\} \/>/);

  assert.match(hookSource, /export function useBirthPlace/);
  assert.match(personFormSource, /export const PersonForm/);
  assert.match(modalSource, /export const BirthPlaceModal/);
});

test('ResultPage 已目录化并下沉到独立组件', async () => {
  const { readFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');
  const indexSource = readFileSync(resolve('src/pages/ResultPage/index.tsx'), 'utf8');

  assert.match(indexSource, /from '\.\/components\/BaziChartBoard'/);
  assert.match(indexSource, /from '\.\/components\/ThreePillarsBoard'/);
  assert.match(indexSource, /from '\.\/components\/ZiweiBoard'/);
  assert.match(indexSource, /from '\.\/components\/ZiweiScopeModal'/);
  assert.match(indexSource, /from '\.\/components\/skeletons'/);
  assert.match(indexSource, /from '@\/hooks\/usePromptCopyShare'/);
  assert.match(indexSource, /from '\.\/ResultPage\.helpers'/);
  assert.match(indexSource, /from '\.\/ResultPage\.constants'/);
  assert.match(indexSource, /from '\.\/ResultPage\.types'/);
});

test('climateRules 已按日干拆分为目录,index 拼接全部规则', async () => {
  const { readFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');
  const indexSource = readFileSync(
    resolve('src/utils/bazi/baziTherapeuticRules/climateRules/index.ts'),
    'utf8',
  );

  assert.match(indexSource, /JIA_CLIMATE_RULES/);
  assert.match(indexSource, /YI_CLIMATE_RULES/);
  assert.match(indexSource, /BING_CLIMATE_RULES/);
  assert.match(indexSource, /DING_CLIMATE_RULES/);
  assert.match(indexSource, /WU_CLIMATE_RULES/);
  assert.match(indexSource, /JI_CLIMATE_RULES/);
  assert.match(indexSource, /GENG_CLIMATE_RULES/);
  assert.match(indexSource, /XIN_CLIMATE_RULES/);
  assert.match(indexSource, /REN_CLIMATE_RULES/);
  assert.match(indexSource, /GUI_CLIMATE_RULES/);

  const { CLIMATE_RULES } =
    await import('../src/utils/bazi/baziTherapeuticRules/climateRules/index');
  assert.ok(Array.isArray(CLIMATE_RULES));
  assert.ok(CLIMATE_RULES.length >= 400, `期望规则数大于等于 400,实际 ${CLIMATE_RULES.length}`);
});

test('algorithms/_shared 暴露五行与地支公共工具', async () => {
  const shared = await import('../src/lib/divination/algorithms/_shared');

  assert.equal(typeof shared.isSheng, 'function');
  assert.equal(typeof shared.isKe, 'function');
  assert.equal(typeof shared.getBranchWuxing, 'function');
  assert.equal(typeof shared.getBranchIndex, 'function');
  assert.ok(shared.BRANCH_WUXING);

  assert.equal(shared.isSheng('木', '火'), true);
  assert.equal(shared.isSheng('木', '水'), false);
  assert.equal(shared.isKe('木', '土'), true);
  assert.equal(shared.isKe('木', '火'), false);
  assert.equal(shared.getBranchWuxing('子'), '水');
  assert.equal(shared.getBranchWuxing('午'), '火');
});

test('DivinationPanel 的 getSummaryBlocks 已抽到 lib/divination/summary,UI 组件不再嵌套数据格式化', async () => {
  const { readFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  const summary = await import('../src/lib/divination/summary');
  assert.equal(typeof summary.getDivinationSummaryBlocks, 'function');

  const liuyao = summary.getDivinationSummaryBlocks(
    'liuyao' as never,
    {
      originalName: '乾为天',
      changedName: '坤为地',
      interName: '夬',
      changingYaos: [{ position: 1 }],
      palace: { name: '乾' },
      specialPattern: '',
    } as never,
  );
  assert.equal(liuyao.title, '六爻起卦结果');
  assert.match(liuyao.tags[0], /主卦：乾为天/);
  assert.equal(liuyao.lines[0], '宫位：乾宫');

  const liuyaoWithHidden = summary.getDivinationSummaryBlocks(
    'liuyao' as never,
    {
      originalName: '天雷无妄',
      changedName: '火雷噬嗑',
      interName: '山风蛊',
      changingYaos: [{ position: 2 }],
      palace: { name: '巽', wuxing: '木' },
      specialPattern: '常规卦',
      voidBranches: ['子', '丑'],
      yaosDetail: [
        { position: 1, isWorld: false, isResponse: false, isChanging: false },
        { position: 2, isWorld: true, isResponse: false, isChanging: true },
        { position: 3, isWorld: false, isResponse: false, isChanging: false },
        { position: 4, isWorld: false, isResponse: false, isChanging: false },
        { position: 5, isWorld: false, isResponse: true, isChanging: false },
        { position: 6, isWorld: false, isResponse: false, isChanging: false },
      ],
      hiddenSpirits: [
        {
          sixRelative: '妻财',
          position: 3,
          najiaDizhi: '辰',
          wuxing: '土',
          isVoid: false,
          underYao: {
            position: 3,
            sixRelative: '兄弟',
            najiaDizhi: '寅',
            wuxing: '木',
          },
        },
      ],
    } as never,
  );
  assert.match(liuyaoWithHidden.lines.join('\n'), /空亡：子、丑/);
  assert.match(liuyaoWithHidden.lines.join('\n'), /世应：世爻第2爻，应爻第5爻/);
  assert.match(liuyaoWithHidden.lines.join('\n'), /动变：第2爻/);
  assert.match(liuyaoWithHidden.lines.join('\n'), /伏神：妻财伏第3爻辰土/);
  assert.equal(liuyaoWithHidden.lines[0], '主轴：世应：世爻第2爻，应爻第5爻；动变：第2爻');

  const qimen = summary.getDivinationSummaryBlocks(
    'qimen' as never,
    {
      isYangDun: true,
      juShu: 3,
      zhiFu: '天心',
      zhiShi: '开门',
      timeInfo: { solarTerm: '冬至', epoch: '上元' },
      patternTags: ['值符得地'],
      specialConditions: {
        isLiuJiaHour: false,
        isLiuGuiHour: false,
        isShiGanRuMu: false,
        isWuBuYuShi: true,
        description: '五不遇时，谋事多阻。',
      },
      ganzhi: { year: '甲辰', month: '丙子', day: '辛亥', hour: '丁卯' },
      jiuGongGe: [
        {
          gong: 4,
          name: '巽四宫',
          direction: '东南',
          element: '木',
          tianPan: { star: '天心', stem: '丁' },
          diPan: { stem: '乙' },
          renPan: { door: '杜门' },
          shenPan: { god: '值符' },
        },
        {
          gong: 6,
          name: '乾六宫',
          direction: '西北',
          element: '金',
          tianPan: { star: '天辅', stem: '己' },
          diPan: { stem: '丁' },
          renPan: { door: '开门' },
          shenPan: { god: '六合' },
        },
      ],
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
    } as never,
  );
  assert.equal(qimen.title, '奇门起局结果');
  assert.match(qimen.lines.join('\n'), /旬空：子空落坎一宫、丑空落艮八宫/);
  assert.match(qimen.lines.join('\n'), /马星：卯时驿马在巳，落巽四宫/);
  assert.match(qimen.lines.join('\n'), /主轴：值符天心落巽四宫；值使开门落乾六宫；时干丁见于巽四宫、乾六宫/);
  assert.match(qimen.lines.join('\n'), /时辰：五不遇时，谋事多阻/);
  assert.equal(qimen.lines[0], '主轴：值符天心落巽四宫；值使开门落乾六宫；时干丁见于巽四宫、乾六宫');

  const meihua = summary.getDivinationSummaryBlocks(
    'meihua' as never,
    {
      originalName: '雷风恒',
      interName: '泽天夬',
      changedName: '火山旅',
      movingYao: { position: 4 },
      tiGua: { name: '巽', element: '木' },
      yongGua: { name: '震', element: '木' },
      analysis: {
        season: '春',
        tiYongRelation: '比和',
        tiSeasonState: '旺',
        yongSeasonState: '旺',
        inter1Relation: '生体',
        inter2Relation: '比和',
        changedRelation: '克体',
      },
      calculation: {
        method: '外应起卦法',
        externalSummary: '见南方来人携红色文书，可取离火之象。',
      },
    } as never,
  );
  assert.equal(meihua.title, '梅花起卦结果');
  assert.match(meihua.lines.join('\n'), /四时：春季，体卦旺，用卦旺/);
  assert.match(meihua.lines.join('\n'), /体用：比和；过程：生体、比和；结果：克体/);
  assert.match(meihua.lines.join('\n'), /起卦法：外应起卦法/);
  assert.doesNotMatch(meihua.lines.join('\n'), /起卦法：external/);
  assert.match(meihua.lines.join('\n'), /外应：见南方来人携红色文书/);
  assert.equal(meihua.lines[0], '主轴：体卦巽（木）；用卦震（木）；动爻第4爻');

  const meihuaNumber = summary.getDivinationSummaryBlocks(
    'meihua' as never,
    {
      originalName: '雷火丰',
      interName: '泽风大过',
      changedName: '地火明夷',
      movingYao: { position: 3 },
      tiGua: { name: '离', element: '火' },
      yongGua: { name: '震', element: '木' },
      analysis: {
        season: '春',
        tiYongRelation: '用生体，主有助力',
        tiSeasonState: '相',
        yongSeasonState: '旺',
        inter1Relation: '比和',
        inter2Relation: '生',
        changedRelation: '体生变，后续需付出',
      },
      calculation: {
        method: '数字起卦法',
        methodKey: 'number',
        number: 123,
        externalSummary: '暂无外应，以数字起卦为主。',
      },
    } as never,
  );
  assert.match(meihuaNumber.lines.join('\n'), /起卦法：数字起卦法/);
  assert.doesNotMatch(meihuaNumber.lines.join('\n'), /外应：暂无外应，以数字起卦为主。/);

  const meihuaEnhanced = summary.getDivinationSummaryBlocks(
    'meihua' as never,
    {
      originalName: '雷火丰',
      interName: '泽风大过',
      changedName: '地火明夷',
      movingYao: { position: 3 },
      tiGua: { name: '离', element: '火' },
      yongGua: { name: '震', element: '木' },
      changedTiGua: { name: '坤', element: '土' },
      changedYongGua: { name: '离', element: '火' },
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
      calculation: {
        method: '外应起卦法',
        externalSummary: '见南方来人携红色文书而来，可参离火文明之象。',
      },
    } as never,
  );
  assert.equal(meihuaEnhanced.lines[0], '主轴：体卦离（火）；用卦震（木）；动爻第3爻');
  assert.match(meihuaEnhanced.lines.join('\n'), /变后：体卦坤（土）；用卦离（火）；关系体克用/);
  assert.match(meihuaEnhanced.lines.join('\n'), /结果：体生变，后续需付出/);

  const liuren = summary.getDivinationSummaryBlocks(
    'liuren' as never,
    {
      dayNight: '昼占',
      monthLeader: '亥',
      divinationBranch: '卯',
      noblemanBranch: '申',
      xunKong: ['戌', '亥'],
      transmissionRule: '比用法',
      transmissionPattern: '递传',
      patternTags: ['贵人发用', '顺传'],
      guaTi: ['龙德卦', '连珠卦'],
      shenShaSummary: ['旬奇临初传', '天马并发'],
      transmissionDetail: '比用法取初传子，中传丑，末传寅。',
      lessonSummary: '四课先见比和，后转生扶。',
      transmissionSummary: '初传发用顺行，末传归财。',
      threeTransmissions: [
        { branch: '子', god: '青龙', relation: '比和', note: '主事起于人情与助力' },
        { branch: '丑', god: '六合', relation: '生扶', note: '中途有撮合与协商' },
        { branch: '寅', god: '朱雀', relation: '克出', note: '末传落口舌文书' },
      ],
    } as never,
  );
  assert.equal(liuren.title, '大六壬起课结果');
  assert.match(liuren.lines.join('\n'), /发用：初传子，乘青龙，比和，主事起于人情与助力/);
  assert.match(liuren.lines.join('\n'), /课体：龙德卦、连珠卦/);
  assert.match(liuren.lines.join('\n'), /神煞：旬奇临初传；天马并发/);
  assert.equal(liuren.lines[0], '主轴：发用：初传子，乘青龙，比和，主事起于人情与助力');

  const tarot = summary.getDivinationSummaryBlocks(
    'tarot' as never,
    {
      spreadName: '时间之流',
      cards: [
        { position: '现状', name: '恋人', reversed: false, keywords: ['选择', '连接'] },
        { position: '建议', name: '战车', reversed: true, keywords: ['控制', '节奏'] },
      ],
    } as never,
  );
  assert.equal(tarot.lines[0], '主轴：现状恋人（正位）；建议战车（逆位）');
  assert.match(tarot.lines.join('\n'), /现状：恋人（正位），关键词 选择、连接/);
  assert.match(tarot.lines.join('\n'), /建议：战车（逆位），关键词 控制、节奏/);

  const tarotCareer = summary.getDivinationSummaryBlocks(
    'tarot' as never,
    {
      spreadType: 'career',
      spreadName: '事业牌阵',
      cards: [
        { position: '当前状况', name: '隐士', reversed: false, keywords: ['内省', '寻找'] },
        { position: '优势', name: '力量', reversed: false, keywords: ['勇气', '耐心'] },
        { position: '挑战', name: '恶魔', reversed: true, keywords: ['束缚', '诱惑'] },
        { position: '机会', name: '星星', reversed: false, keywords: ['希望', '指引'] },
        { position: '行动建议', name: '战车', reversed: false, keywords: ['推进', '控制'] },
        { position: '结果', name: '太阳', reversed: false, keywords: ['成功', '喜悦'] },
      ],
    } as never,
  );
  assert.equal(
    tarotCareer.lines[0],
    '主轴：当前状况隐士（正位）；行动建议战车（正位）；结果太阳（正位）',
  );
  assert.match(tarotCareer.lines.join('\n'), /行动建议：战车（正位），关键词 推进、控制/);
  assert.match(tarotCareer.lines.join('\n'), /结果：太阳（正位），关键词 成功、喜悦/);

  const ssgw = summary.getDivinationSummaryBlocks(
    'ssgw' as never,
    {
      number: 18,
      title: '刘备借荆州',
      poem: '前路迢迢莫强求，且看云开月自明。',
      story: '需审时度势，不可急进。',
      details: {
        典故: '刘备借荆州后多方周旋。',
        解签: '宜守正待时，不可躁进。',
      },
    } as never,
  );
  assert.equal(ssgw.lines[0], '主轴：签诗“前路迢迢莫强求，且看云开月自明。”');
  assert.match(ssgw.lines.join('\n'), /签题：刘备借荆州/);
  assert.match(ssgw.lines.join('\n'), /典故：刘备借荆州后多方周旋。/);
  assert.match(ssgw.lines.join('\n'), /解签：宜守正待时，不可躁进。/);

  const ssgwDeduped = summary.getDivinationSummaryBlocks(
    'ssgw' as never,
    {
      number: 8,
      title: '故事去重测试',
      poem: '莫道前途无知己，且凭时运见分明。',
      story: '张良圯桥进履，先受考验，后得真传。',
      details: {
        典故: '张良圯桥进履，先受考验，后得真传。',
        解签: '宜先忍耐蓄势，再图后发。',
      },
    } as never,
  );
  assert.equal(
    ssgwDeduped.lines.filter((line) => line.includes('典故：张良圯桥进履，先受考验，后得真传。'))
      .length,
    1,
  );

  const fallback = summary.getDivinationSummaryBlocks('unknown' as never, {} as never);
  assert.equal(fallback.title, '占卜结果');
  assert.deepEqual(fallback.tags, []);
  assert.deepEqual(fallback.lines, []);

  const panelSource = readFileSync(resolve('src/components/DivinationPanel/index.tsx'), 'utf8');
  assert.match(
    panelSource,
    /import \{ getDivinationSummaryBlocks \} from '@\/lib\/divination\/summary'/,
  );
  assert.match(panelSource, /getDivinationSummaryBlocks\(session\.method, session\.data\)/);
  assert.doesNotMatch(panelSource, /function getSummaryBlocks\(/);
  assert.doesNotMatch(panelSource, /from '@\/types\/divination'/);
});

test('baziEnhancement 已按用神/格局/神煞/提示词拆分,barrel 仍导出 10 个公开 API', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  assert.equal(
    existsSync(resolve('src/utils/bazi/baziEnhancement.ts')),
    false,
    '原 baziEnhancement.ts 应已删除,改用同名目录',
  );

  const indexSource = readFileSync(resolve('src/utils/bazi/baziEnhancement/index.ts'), 'utf8');
  assert.match(indexSource, /export \* from '\.\/useGodRules'/);
  assert.match(indexSource, /export \* from '\.\/classicPatterns'/);
  assert.match(indexSource, /export \* from '\.\/shensha'/);
  assert.match(indexSource, /export \* from '\.\/promptHints'/);

  const useGodRules = await import('../src/utils/bazi/baziEnhancement/useGodRules');
  assert.equal(typeof useGodRules.detectTongguanNeed, 'function');
  assert.equal(typeof useGodRules.detectDiseaseMedicine, 'function');
  assert.equal(typeof useGodRules.getDrainWuxing, 'function');

  const classicPatterns = await import('../src/utils/bazi/baziEnhancement/classicPatterns');
  assert.equal(typeof classicPatterns.identifyClassicPattern, 'function');

  const shensha = await import('../src/utils/bazi/baziEnhancement/shensha');
  assert.equal(typeof shensha.getPeachBlossomDetail, 'function');
  assert.equal(typeof shensha.generatePeriodAnalysis, 'function');

  const promptHints = await import('../src/utils/bazi/baziEnhancement/promptHints');
  assert.equal(typeof promptHints.generateAnalysisDimensionHints, 'function');
  assert.equal(typeof promptHints.generateMarriageMatchHints, 'function');
  assert.equal(typeof promptHints.generateChildrenFateHints, 'function');
  assert.equal(typeof promptHints.generateParentsAnalysisHints, 'function');
  assert.equal(typeof promptHints.generateSiblingsAnalysisHints, 'function');

  const barrel = await import('../src/utils/bazi/baziEnhancement');
  for (const apiName of [
    'detectTongguanNeed',
    'detectDiseaseMedicine',
    'getDrainWuxing',
    'identifyClassicPattern',
    'getPeachBlossomDetail',
    'generatePeriodAnalysis',
    'generateAnalysisDimensionHints',
    'generateMarriageMatchHints',
    'generateChildrenFateHints',
    'generateParentsAnalysisHints',
    'generateSiblingsAnalysisHints',
  ]) {
    assert.equal(
      typeof (barrel as Record<string, unknown>)[apiName],
      'function',
      `barrel 应重新导出 ${apiName}`,
    );
  }
});

test('usePromptCopyShare 抽取后被三处统一使用', async () => {
  const { readFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  const hookSource = readFileSync(resolve('src/hooks/usePromptCopyShare.ts'), 'utf8');
  assert.match(hookSource, /export function usePromptCopyShare/);
  assert.match(hookSource, /navigator\.clipboard\.writeText/);
  assert.match(hookSource, /shareText\(promptText\)/);

  const resultSource = readFileSync(resolve('src/pages/ResultPage/index.tsx'), 'utf8');
  const divinationSource = readFileSync(
    resolve('src/components/DivinationPanel/index.tsx'),
    'utf8',
  );
  const reverseSource = readFileSync(resolve('src/pages/BirthTimeReversePage.tsx'), 'utf8');

  assert.match(resultSource, /usePromptCopyShare\(latestActivePromptText\)/);
  assert.match(divinationSource, /usePromptCopyShare\([\s\S]*?session\?\.prompt \?\? ''[\s\S]*?\)/);
  assert.match(reverseSource, /usePromptCopyShare\(promptText\)/);

  for (const source of [resultSource, divinationSource, reverseSource]) {
    assert.doesNotMatch(source, /navigator\.clipboard\.writeText/);
    assert.doesNotMatch(source, /setCopyState\(/);
    assert.doesNotMatch(source, /setShareState\(/);
  }
});

test('BaziFortuneTools 已目录化,Selector 与 Modal 可独立 lazy import', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  assert.equal(
    existsSync(resolve('src/components/BaziFortuneTools.tsx')),
    false,
    '原 BaziFortuneTools.tsx 应已删除,改用同名目录',
  );

  const helpersSource = readFileSync(resolve('src/components/BaziFortuneTools/helpers.ts'), 'utf8');
  assert.match(helpersSource, /export const baziFortuneScopeLabelMap/);
  assert.match(helpersSource, /export function getCurrentLuckCycle/);
  assert.match(helpersSource, /export function splitGanZhi/);
  assert.match(helpersSource, /export function formatBaziCycleDisplay/);
  assert.match(helpersSource, /export function getWuxingClass/);

  const selectorSource = readFileSync(
    resolve('src/components/BaziFortuneTools/BaziFortuneSelector.tsx'),
    'utf8',
  );
  assert.match(selectorSource, /export function BaziFortuneSelector/);
  assert.match(selectorSource, /from '\.\/helpers'/);

  const modalSource = readFileSync(
    resolve('src/components/BaziFortuneTools/BaziFortuneModal.tsx'),
    'utf8',
  );
  assert.match(modalSource, /export function BaziFortuneModal/);
  assert.match(modalSource, /from '\.\/helpers'/);

  const indexSource = readFileSync(resolve('src/components/BaziFortuneTools/index.ts'), 'utf8');
  assert.match(indexSource, /export \{ BaziFortuneSelector \} from '\.\/BaziFortuneSelector'/);
  assert.match(indexSource, /export \{ BaziFortuneModal \} from '\.\/BaziFortuneModal'/);

  const resultPageSource = readFileSync(resolve('src/pages/ResultPage/index.tsx'), 'utf8');
  assert.match(resultPageSource, /import\('@\/components\/BaziFortuneTools\/BaziFortuneModal'\)/);

  const chartBoardSource = readFileSync(
    resolve('src/pages/ResultPage/components/BaziChartBoard.tsx'),
    'utf8',
  );
  assert.match(
    chartBoardSource,
    /import\('@\/components\/BaziFortuneTools\/BaziFortuneSelector'\)/,
  );
});

test('divination/engine 已目录化,formatters/method-text/liuren-template 各自独立', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  assert.equal(
    existsSync(resolve('src/lib/divination/engine.ts')),
    false,
    '原 engine.ts 应已删除,改用同名目录',
  );

  const indexSource = readFileSync(resolve('src/lib/divination/engine/index.ts'), 'utf8');
  assert.match(indexSource, /from '\.\/formatters'/);
  assert.match(indexSource, /from '\.\/method-text'/);
  assert.match(indexSource, /from '\.\/liuren-template'/);
  assert.match(indexSource, /export type DivinationDraft/);
  assert.match(indexSource, /export type DivinationSession/);
  assert.match(indexSource, /export function buildDivinationPrompt/);
  assert.match(indexSource, /export async function generateDivinationSession/);

  const formatters = await import('../src/lib/divination/engine/formatters');
  assert.equal(typeof formatters.buildTimeInfoText, 'function');
  assert.equal(typeof formatters.formatGanzhi, 'function');
  assert.equal(typeof formatters.formatSupplementaryInfoSection, 'function');
  assert.equal(typeof formatters.buildSection, 'function');
  assert.equal(typeof formatters.formatDivinationInfo, 'function');

  const methodText = await import('../src/lib/divination/engine/method-text');
  assert.equal(typeof methodText.buildRoleText, 'function');
  assert.equal(typeof methodText.buildTaskText, 'function');
  assert.equal(typeof methodText.buildMethodRequirementText, 'function');
  assert.equal(typeof methodText.buildMethodOutputRequirementText, 'function');
  assert.match(methodText.buildRoleText('liuyao'), /六爻断卦师/);
  assert.match(methodText.buildTaskText('qimen'), /值符值使/);

  const liurenTemplate = await import('../src/lib/divination/engine/liuren-template');
  assert.equal(typeof liurenTemplate.getLiurenPatternHint, 'function');
  assert.equal(typeof liurenTemplate.buildLiurenTemplateText, 'function');
  assert.match(liurenTemplate.getLiurenPatternHint('伏吟'), /传态伏吟/);

  const liuyaoTemplate = await import('../src/lib/divination/engine/liuyao-template');
  assert.equal(typeof liuyaoTemplate.buildLiuyaoTemplateText, 'function');
  assert.match(liuyaoTemplate.buildLiuyaoTemplateText('guaishen', '最近家里总觉得不安'), /鬼神怪异/);
});

test('birth-time-reverse 已目录化,fields/three-pillars/prompts 各自独立', async () => {
  const { existsSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  assert.equal(
    existsSync(resolve('src/lib/birth-time-reverse.ts')),
    false,
    '原 birth-time-reverse.ts 应已删除,改用同名目录',
  );

  const barrel = await import('../src/lib/birth-time-reverse');
  assert.equal(barrel.UNKNOWN_TIME_INDEX, -1);
  assert.equal(typeof barrel.isUnknownTimeIndex, 'function');
  assert.equal(barrel.isUnknownTimeIndex(-1), true);
  assert.equal(barrel.isUnknownTimeIndex(0), false);
  assert.equal(typeof barrel.buildThreePillarsProfile, 'function');
  assert.equal(typeof barrel.formatThreePillarsForPrompt, 'function');
  assert.equal(typeof barrel.buildUnknownTimeBaziPrompt, 'function');
  assert.equal(typeof barrel.buildReverseBirthTimePrompt, 'function');
  assert.ok(Array.isArray(barrel.REVERSE_BIRTH_TIME_SELECT_FIELDS));
  assert.ok(Array.isArray(barrel.REVERSE_BIRTH_TIME_TEXT_FIELDS));
  assert.equal(barrel.REVERSE_BIRTH_TIME_SELECT_FIELDS.length, 14);
  assert.equal(barrel.REVERSE_BIRTH_TIME_TEXT_FIELDS.length, 9);
  assert.equal(barrel.DEFAULT_REVERSE_BIRTH_TIME_FORM_DATA.bodyBuild, '未选择');

  const fields = await import('../src/lib/birth-time-reverse/fields');
  assert.ok(Array.isArray(fields.REVERSE_BIRTH_TIME_SELECT_FIELDS));
  assert.ok(Array.isArray(fields.REVERSE_BIRTH_TIME_TEXT_FIELDS));

  const threePillars = await import('../src/lib/birth-time-reverse/three-pillars');
  assert.equal(typeof threePillars.buildThreePillarsProfile, 'function');
  assert.equal(typeof threePillars.formatThreePillarsForPrompt, 'function');

  const prompts = await import('../src/lib/birth-time-reverse/prompts');
  assert.equal(typeof prompts.buildUnknownTimeBaziPrompt, 'function');
  assert.equal(typeof prompts.buildReverseBirthTimePrompt, 'function');
});

test('ssgw-data 已目录化,61 签按 20 签一组拆成 3 个分片', async () => {
  const { existsSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  assert.equal(
    existsSync(resolve('src/utils/ssgw-data.ts')),
    false,
    '原 ssgw-data.ts 应已删除,改用同名目录',
  );

  const barrel = await import('../src/utils/ssgw-data');
  assert.ok(Array.isArray(barrel.SSGW_SIGNS));
  assert.equal(barrel.SSGW_SIGNS.length, 61);
  assert.equal(barrel.SSGW_SIGNS[0].id, 1);
  assert.equal(barrel.SSGW_SIGNS[60].id, 61);
  assert.match(barrel.SSGW_SIGNS[0].title, /第一签/);
  assert.match(barrel.SSGW_SIGNS[60].title, /第六十一签/);

  const s1 = await import('../src/utils/ssgw-data/signs-01');
  const s2 = await import('../src/utils/ssgw-data/signs-02');
  const s3 = await import('../src/utils/ssgw-data/signs-03');
  assert.equal(s1.SIGNS_01.length, 20);
  assert.equal(s2.SIGNS_02.length, 20);
  assert.equal(s3.SIGNS_03.length, 21);
  assert.equal(s1.SIGNS_01[0].id, 1);
  assert.equal(s1.SIGNS_01[19].id, 20);
  assert.equal(s2.SIGNS_02[0].id, 21);
  assert.equal(s2.SIGNS_02[19].id, 40);
  assert.equal(s3.SIGNS_03[0].id, 41);
  assert.equal(s3.SIGNS_03[20].id, 61);
});

test('build-analysis-payload 已目录化,scope/lookup/mapper/builders 拆为独立子模块', async () => {
  const { existsSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  assert.equal(
    existsSync(resolve('src/lib/iztro/build-analysis-payload.ts')),
    false,
    '原 build-analysis-payload.ts 应已删除,改用同名目录',
  );

  const barrel = await import('../src/lib/iztro/build-analysis-payload');
  assert.equal(typeof barrel.buildAnalysisPayloadV1, 'function');

  const scope = await import('../src/lib/iztro/build-analysis-payload/helpers/scope');
  assert.equal(typeof scope.mapScopeLabel, 'function');
  assert.equal(typeof scope.resolveScopeLabel, 'function');
  assert.equal(typeof scope.getCurrentScopeItem, 'function');
  assert.equal(scope.mapScopeLabel('origin'), '本命');
  assert.equal(scope.mapScopeLabel('decadal'), '大限');
  assert.equal(scope.mapScopeLabel('yearly'), '流年');

  const lookup = await import('../src/lib/iztro/build-analysis-payload/helpers/palace-lookup');
  assert.equal(typeof lookup.findPalaceByIndex, 'function');
  assert.equal(typeof lookup.findPalaceByBranch, 'function');
  assert.equal(typeof lookup.findStarPalaceIndex, 'function');
  assert.equal(lookup.LIU_HE_BRANCH['子'], '丑');
  assert.equal(lookup.LIU_HE_BRANCH['寅'], '亥');
  assert.equal(lookup.LIU_HE_BRANCH['辰'], '酉');

  const mappers = await import('../src/lib/iztro/build-analysis-payload/helpers/mappers');
  assert.equal(typeof mappers.mapScopeMutagenMap, 'function');
  assert.equal(typeof mappers.mapStarFact, 'function');
  assert.deepEqual(mappers.MUTAGEN_ORDER, ['禄', '权', '科', '忌']);

  const builders = await import('../src/lib/iztro/build-analysis-payload/helpers/builders');
  assert.equal(typeof builders.buildBasicInfo, 'function');
  assert.equal(typeof builders.buildActiveScope, 'function');
  assert.equal(typeof builders.buildPalaceFacts, 'function');
});

test('algorithms/qimen 已目录化,按 jushu/palace-utils/patterns/layout 分组', async () => {
  const { existsSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  assert.equal(
    existsSync(resolve('src/lib/divination/algorithms/qimen.ts')),
    false,
    '原 qimen.ts 应已删除,改用同名目录',
  );

  const barrel = await import('../src/lib/divination/algorithms/qimen');
  assert.equal(typeof barrel.generateQimen, 'function');

  const jushu = await import('../src/lib/divination/algorithms/qimen/helpers/jushu');
  assert.equal(typeof jushu.getQimenJuShu, 'function');
  assert.equal(typeof jushu.checkSpecialHourConditions, 'function');
  assert.equal(typeof jushu.getZhiFuZhiShi, 'function');
  const sc = jushu.checkSpecialHourConditions('甲子');
  assert.equal(sc.isLiuJiaHour, true);

  const palaceUtils = await import('../src/lib/divination/algorithms/qimen/helpers/palace-utils');
  assert.equal(typeof palaceUtils.getDunJiaStem, 'function');
  assert.equal(typeof palaceUtils.getOppositePalace, 'function');
  assert.equal(typeof palaceUtils.getDoorElement, 'function');
  assert.equal(palaceUtils.getDunJiaStem('甲子'), '戊');
  assert.equal(palaceUtils.getDunJiaStem('乙丑'), '乙');
  assert.equal(palaceUtils.getOppositePalace(1), 9);
  assert.equal(palaceUtils.getOppositePalace(5), null);
  assert.equal(palaceUtils.getDoorElement('休门'), '水');
  assert.equal(palaceUtils.getDoorElement('开门'), '金');

  const patterns = await import('../src/lib/divination/algorithms/qimen/helpers/patterns');
  assert.equal(typeof patterns.getQimenPatternTags, 'function');
  assert.equal(typeof patterns.buildPatternDetails, 'function');
  assert.equal(typeof patterns.buildPalaceInsights, 'function');

  const layout = await import('../src/lib/divination/algorithms/qimen/helpers/layout');
  assert.equal(typeof layout.arrangeJiuGongGe, 'function');
});

test('algorithms/meihua 已目录化,起卦法与卦象工具拆为独立 helpers', async () => {
  const { existsSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  assert.equal(
    existsSync(resolve('src/lib/divination/algorithms/meihua.ts')),
    false,
    '原 meihua.ts 应已删除,改用同名目录',
  );

  const barrel = await import('../src/lib/divination/algorithms/meihua');
  assert.equal(typeof barrel.generateMeihua, 'function');

  const methods = await import('../src/lib/divination/algorithms/meihua/helpers/methods');
  assert.equal(typeof methods.resolveTimeMethod, 'function');
  assert.equal(typeof methods.resolveNumberMethod, 'function');
  assert.equal(typeof methods.resolveRandomMethod, 'function');
  assert.equal(typeof methods.resolveExternalMethod, 'function');
  const numResult = methods.resolveNumberMethod(123);
  assert.equal(numResult.calculation.methodKey, 'number');
  assert.equal(numResult.upperTrigramIndex, 123 % 8 || 8);

  const hex = await import('../src/lib/divination/algorithms/meihua/helpers/hexagram');
  assert.equal(typeof hex.findHexagramByTrigrams, 'function');
  assert.equal(typeof hex.resolveTiYongByMovingYao, 'function');
  const tiYong = hex.resolveTiYongByMovingYao(
    { name: 'A', element: '金', nature: '阳' },
    { name: 'B', element: '木', nature: '阴' },
    4,
  );
  assert.equal(tiYong.tiGua.name, 'B');
  assert.equal(tiYong.yongGua.name, 'A');
  const tiYong2 = hex.resolveTiYongByMovingYao(
    { name: 'A', element: '金', nature: '阳' },
    { name: 'B', element: '木', nature: '阴' },
    1,
  );
  assert.equal(tiYong2.tiGua.name, 'A');
  assert.equal(tiYong2.yongGua.name, 'B');
});

test('algorithms/liuren 已目录化,天盘/四课/三传拆为独立 helpers', async () => {
  const { existsSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  assert.equal(
    existsSync(resolve('src/lib/divination/algorithms/liuren.ts')),
    false,
    '原 liuren.ts 应已删除,改用同名目录',
  );

  const barrel = await import('../src/lib/divination/algorithms/liuren');
  assert.equal(typeof barrel.generateLiuren, 'function');

  const plate = await import('../src/lib/divination/algorithms/liuren/helpers/plate');
  assert.equal(typeof plate.describeRelation, 'function');
  assert.equal(typeof plate.isBranchKe, 'function');
  assert.equal(typeof plate.getNoblemanBranch, 'function');
  assert.equal(typeof plate.buildHeavenlyPlate, 'function');
  assert.equal(plate.getNoblemanBranch('甲', '昼占'), '丑');
  assert.equal(plate.getNoblemanBranch('甲', '夜占'), '未');
  assert.equal(plate.describeRelation('子', '子'), '比和');
  assert.equal(plate.isBranchKe('子', '巳'), true);

  const lessons = await import('../src/lib/divination/algorithms/liuren/helpers/lessons');
  assert.equal(typeof lessons.buildLessonNote, 'function');
  assert.equal(typeof lessons.resolveInitialTransmission, 'function');

  const transmission = await import('../src/lib/divination/algorithms/liuren/helpers/transmission');
  assert.equal(typeof transmission.buildTransmissionNote, 'function');
  assert.equal(typeof transmission.getTransmissionPattern, 'function');
  assert.equal(typeof transmission.getPatternTag, 'function');
  assert.equal(typeof transmission.buildTransmissionDetail, 'function');
  assert.equal(transmission.getTransmissionPattern('子', '子', '子'), '伏吟');
  assert.equal(transmission.getTransmissionPattern('子', '丑', '午'), '反吟');
  assert.equal(transmission.getTransmissionPattern('子', '丑', '子'), '回环');
  assert.equal(transmission.getTransmissionPattern('子', '丑', '寅'), '递传');
  assert.equal(transmission.getPatternTag('反吟'), '反吟');
});

test('utils/bazi/fortuneSelection 已目录化,resolvers 与 breakdown 拆为独立 helpers', async () => {
  const { existsSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  assert.equal(
    existsSync(resolve('src/utils/bazi/fortuneSelection.ts')),
    false,
    '原 fortuneSelection.ts 应已删除,改用同名目录',
  );

  const barrel = await import('../src/utils/bazi/fortuneSelection');
  assert.equal(typeof barrel.normalizeFortuneSelection, 'function');
  assert.equal(typeof barrel.buildFortuneSelectionContext, 'function');

  const resolvers = await import('../src/utils/bazi/fortuneSelection/helpers/resolvers');
  assert.equal(typeof resolvers.formatCycleLabel, 'function');
  assert.equal(typeof resolvers.formatYearLabel, 'function');
  assert.equal(typeof resolvers.resolveCycleIndex, 'function');
  assert.equal(typeof resolvers.resolveSelectedYear, 'function');
  assert.equal(typeof resolvers.resolveSelectedMonth, 'function');
  assert.equal(typeof resolvers.resolveSelectedDay, 'function');
  assert.equal(resolvers.formatCycleLabel({ isXiaoyun: true, ganZhi: '小运' } as never), '童运');
  assert.equal(resolvers.formatCycleLabel({ isXiaoyun: false, ganZhi: '甲子' } as never), '甲子运');
  assert.equal(resolvers.formatYearLabel({ year: 2024, ganZhi: '甲辰' } as never), '2024年 甲辰');

  const breakdown = await import('../src/utils/bazi/fortuneSelection/helpers/breakdown');
  assert.equal(typeof breakdown.getDayHourBreakdown, 'function');
});

test('utils/bazi/baziShenSha 已目录化,5 类规则拆为独立 helpers', async () => {
  const { existsSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  assert.equal(
    existsSync(resolve('src/utils/bazi/baziShenSha.ts')),
    false,
    '原 baziShenSha.ts 应已删除,改用同名目录',
  );

  const barrel = await import('../src/utils/bazi/baziShenSha');
  assert.equal(typeof barrel.ShenShaCalculator, 'function');

  const noble = await import('../src/utils/bazi/baziShenSha/helpers/nobleRules');
  assert.equal(typeof noble.buildNobleRules, 'function');

  const lu = await import('../src/utils/bazi/baziShenSha/helpers/luRules');
  assert.equal(typeof lu.buildLuRules, 'function');

  const day = await import('../src/utils/bazi/baziShenSha/helpers/dayRules');
  assert.equal(typeof day.buildDayRules, 'function');

  const marriage = await import('../src/utils/bazi/baziShenSha/helpers/marriageRules');
  assert.equal(typeof marriage.buildMarriageRules, 'function');

  const disaster = await import('../src/utils/bazi/baziShenSha/helpers/disasterRules');
  assert.equal(typeof disaster.buildDisasterRules, 'function');

  const global = await import('../src/utils/bazi/baziShenSha/helpers/globalRules');
  assert.equal(typeof global.calculateGlobalShenSha, 'function');
  assert.equal(typeof global.analyzeGlobalShenSha, 'function');

  const tenGod = await import('../src/utils/bazi/baziShenSha/helpers/tenGodAnalysis');
  assert.equal(typeof tenGod.analyzeShenShaWithTenGod, 'function');
});

test('utils/bazi/baziTherapeuticRules/climateRules 已按月支二次拆分为子目录', async () => {
  const { existsSync, readdirSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  const stems = ['jia', 'yi', 'bing', 'ding', 'wu', 'ji', 'geng', 'xin', 'ren', 'gui'];

  for (const stem of stems) {
    const oldFile = resolve(`src/utils/bazi/baziTherapeuticRules/climateRules/${stem}.ts`);
    assert.equal(existsSync(oldFile), false, `原 ${stem}.ts 应已删除,改用同名目录`);

    const barrel = await import(`../src/utils/bazi/baziTherapeuticRules/climateRules/${stem}`);
    const varName = `${stem.toUpperCase()}_CLIMATE_RULES`;
    assert.ok(Array.isArray(barrel[varName]), `${stem} barrel 应导出数组`);

    const dirPath = resolve(`src/utils/bazi/baziTherapeuticRules/climateRules/${stem}`);
    const months = readdirSync(dirPath)
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
      .map((f) => f.replace('.ts', ''));

    for (const m of months) {
      const mod = await import(`../src/utils/bazi/baziTherapeuticRules/climateRules/${stem}/${m}`);
      const subVar = `${stem.toUpperCase()}_${m.toUpperCase()}_CLIMATE_RULES`;
      assert.ok(Array.isArray(mod[subVar]), `${stem}/${m} 应导出数组`);
    }
  }
});

test('full-chart-engine 已按八字/紫微拆分为目录,barrel 仍导出全部公开 API', async () => {
  const { existsSync, readFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  assert.equal(
    existsSync(resolve('src/lib/full-chart-engine.ts')),
    false,
    '原 full-chart-engine.ts 应已删除,改用同名目录',
  );

  const barrelSource = readFileSync(resolve('src/lib/full-chart-engine/index.ts'), 'utf8');
  assert.match(barrelSource, /export type \{ ZiweiRuntime \} from '\.\/ziwei'/);
  assert.match(barrelSource, /from '\.\/bazi'/);
  assert.match(barrelSource, /from '\.\/ziwei'/);
  assert.match(barrelSource, /buildPersonFromInput/);
  assert.match(barrelSource, /calculateFullBaziChart/);
  assert.match(barrelSource, /buildZiweiPayloadByScope/);
  assert.match(barrelSource, /calculateFullZiweiChart/);
  assert.match(barrelSource, /calculateZiweiPayloadByScope/);
  assert.match(barrelSource, /calculateZiweiDisplayPayload/);
  assert.match(barrelSource, /buildZiweiChartInput/);
  assert.match(barrelSource, /buildCombinedZiweiPrompt/);
  assert.match(barrelSource, /buildCombinedZiweiCompatibilityPrompt/);

  const baziSource = readFileSync(resolve('src/lib/full-chart-engine/bazi.ts'), 'utf8');
  assert.match(baziSource, /export function buildPersonFromInput/);
  assert.match(baziSource, /export function calculateFullBaziChart/);

  const ziweiSource = readFileSync(resolve('src/lib/full-chart-engine/ziwei.ts'), 'utf8');
  assert.match(ziweiSource, /export function buildZiweiPayloadByScope/);
  assert.match(ziweiSource, /export async function calculateFullZiweiChart/);
  assert.match(ziweiSource, /export async function calculateZiweiPayloadByScope/);
  assert.match(ziweiSource, /export async function calculateZiweiDisplayPayload/);
  assert.match(ziweiSource, /export function buildZiweiChartInput/);
  assert.match(ziweiSource, /export function buildCombinedZiweiPrompt/);
  assert.match(ziweiSource, /export function buildCombinedZiweiCompatibilityPrompt/);
});
