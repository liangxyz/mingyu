import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCombinedPromptText,
  buildZiweiMonthAnchorDate,
  findZiweiDayOptionDate,
  findZiweiDecadalIndexByDate,
  findZiweiMonthOptionDate,
  findZiweiYearOptionDate,
  formatGender,
  formatMonthDayLabel,
  formatZiweiPromptScopeSummary,
  joinMultilineText,
  joinText,
  parseOptionalNumber,
  parseZiweiDateParts,
  resolveCompatType,
  splitGanZhi,
} from '../src/pages/ResultPage/ResultPage.helpers';

test('parseZiweiDateParts 正确解析合法日期', () => {
  assert.deepEqual(parseZiweiDateParts('2024-05-13'), { year: 2024, month: 5, day: 13 });
  assert.deepEqual(parseZiweiDateParts('1990-12-01'), { year: 1990, month: 12, day: 1 });
});

test('parseZiweiDateParts 对非法日期返回 null', () => {
  assert.equal(parseZiweiDateParts(''), null);
  assert.equal(parseZiweiDateParts('invalid'), null);
  assert.equal(parseZiweiDateParts('2024--01'), null);
});

test('buildZiweiMonthAnchorDate 返回月中日期', () => {
  assert.equal(buildZiweiMonthAnchorDate('2024-05-13'), '2024-05-15');
  assert.equal(buildZiweiMonthAnchorDate('2024-01-01'), '2024-01-15');
  assert.equal(buildZiweiMonthAnchorDate('invalid'), '');
});

test('findZiweiDecadalIndexByDate 按日期范围查找大限索引', () => {
  const options = [
    { dateStr: '2000-01-01', label: '0-9' },
    { dateStr: '2010-01-01', label: '10-19' },
    { dateStr: '2020-01-01', label: '20-29' },
  ] as Parameters<typeof findZiweiDecadalIndexByDate>[0];

  assert.equal(findZiweiDecadalIndexByDate(options, '2005-06-01', 0), 0);
  assert.equal(findZiweiDecadalIndexByDate(options, '2015-06-01', 0), 1);
  assert.equal(findZiweiDecadalIndexByDate(options, '2025-06-01', 0), 2);
  assert.equal(findZiweiDecadalIndexByDate(options, '1990-01-01', 0), 0);
  assert.equal(findZiweiDecadalIndexByDate([], '2024-01-01', 3), 3);
  assert.equal(findZiweiDecadalIndexByDate(options, '', 1), 1);
});

test('findZiweiYearOptionDate 按年份匹配', () => {
  const options = [
    { year: 2022, dateStr: '2022-01-01' },
    { year: 2023, dateStr: '2023-01-01' },
    { year: 2024, dateStr: '2024-01-01' },
  ];

  assert.equal(findZiweiYearOptionDate(options, '2023-06-15'), '2023-01-01');
  assert.equal(findZiweiYearOptionDate(options, 'invalid'), '2022-01-01');
  assert.equal(findZiweiYearOptionDate([], '2023-01-01'), '');
});

test('findZiweiMonthOptionDate 按年月匹配', () => {
  const options = [
    { dateStr: '2023-01-01', label: '1月' },
    { dateStr: '2023-05-01', label: '5月' },
    { dateStr: '2024-03-01', label: '3月' },
  ] as Parameters<typeof findZiweiMonthOptionDate>[0];

  assert.equal(findZiweiMonthOptionDate(options, '2023-05-15'), '2023-05-01');
  assert.equal(findZiweiMonthOptionDate(options, '2024-03-10'), '2024-03-01');
  assert.equal(findZiweiMonthOptionDate(options, 'invalid'), '2023-01-01');
});

test('findZiweiDayOptionDate 按日匹配', () => {
  const options = [
    { day: 1, dateStr: '2024-05-01' },
    { day: 15, dateStr: '2024-05-15' },
  ];

  assert.equal(findZiweiDayOptionDate(options, '2024-05-15'), '2024-05-15');
  assert.equal(findZiweiDayOptionDate(options, '2024-05-20'), '2024-05-01');
  assert.equal(findZiweiDayOptionDate(options, 'invalid'), '2024-05-01');
});

test('formatZiweiPromptScopeSummary 根据范围和日期格式化摘要', () => {
  assert.equal(formatZiweiPromptScopeSummary('origin', '2024-05-13'), '本命');
  assert.equal(formatZiweiPromptScopeSummary('origin', ''), '本命');
  assert.equal(formatZiweiPromptScopeSummary('decadal', '2024-05-13'), '大限 · 2024-05-13');
  assert.equal(formatZiweiPromptScopeSummary('yearly', '2024-05-13', '流年'), '流年 · 2024-05-13');
  assert.equal(formatZiweiPromptScopeSummary('daily', '2024-05-13'), '流日 · 2024-05-13');
});

test('formatGender 转换性别值', () => {
  assert.equal(formatGender('male'), '男');
  assert.equal(formatGender('female'), '女');
  assert.equal(formatGender(''), '未知');
  assert.equal(formatGender('other'), 'other');
});

test('splitGanZhi 拆分干支字符串', () => {
  assert.deepEqual(splitGanZhi('甲子'), ['甲', '子']);
  assert.deepEqual(splitGanZhi('乙丑'), ['乙', '丑']);
  assert.deepEqual(splitGanZhi(''), ['', '']);
});

test('formatMonthDayLabel 提取月日', () => {
  assert.equal(formatMonthDayLabel('2024-05-13'), '05/13');
  assert.equal(formatMonthDayLabel('2024-12-01'), '12/01');
});

test('joinText 按顺序去重并过滤空值', () => {
  assert.equal(joinText(['甲', '乙', '丙']), '甲、乙、丙');
  assert.equal(joinText(['甲', undefined, '乙']), '甲、乙');
  assert.equal(joinText([]), '暂无');
  assert.equal(joinText([], '无'), '无');
});

test('joinMultilineText 把顿号换成换行', () => {
  assert.equal(joinMultilineText(['甲', '乙', '丙']), '甲\n乙\n丙');
  assert.equal(joinMultilineText([]), '暂无');
});

test('parseOptionalNumber 解析可选数字', () => {
  assert.equal(parseOptionalNumber('42'), 42);
  assert.equal(parseOptionalNumber('0'), 0);
  assert.equal(parseOptionalNumber(''), undefined);
  assert.equal(parseOptionalNumber('  '), undefined);
  assert.equal(parseOptionalNumber('invalid'), undefined);
});

test('resolveCompatType 解析合盘类型', () => {
  assert.equal(resolveCompatType('ai-compat-marriage'), 'marriage');
  assert.equal(resolveCompatType('ai-compat-children'), 'children');
  assert.equal(resolveCompatType('ai-compat-parents'), 'parents');
  assert.equal(resolveCompatType('ai-compat-siblings'), 'siblings');
  assert.equal(resolveCompatType('ai-mingge-zonglun'), undefined);
});

test('buildCombinedPromptText 拼接系统提示和用户提示', () => {
  assert.equal(buildCombinedPromptText('系统', '用户'), '系统\n\n用户');
});
