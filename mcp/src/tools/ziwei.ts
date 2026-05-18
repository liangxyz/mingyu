import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  buildZiweiChartInput,
  calculateFullZiweiChart,
} from '../../../src/lib/full-chart-engine/ziwei.js';
import {
  PROMPT_MODES,
  ZIWEI_PROMPT_SCOPES,
  ZIWEI_PROMPT_TOPICS,
  buildSerializableZiweiResult,
  buildZiweiPromptForRuntime,
  type PromptMode,
  type ZiweiPromptScope,
  type ZiweiPromptTopic,
} from '../../../src/lib/public-api/prompt-builders.js';
import { ziweiOutputSchema } from '../schemas.js';
import { createErrorToolResult, createStructuredToolResult, getErrorMessage } from '../tool-results.js';

const ziweiSchema = z.object({
  name: z.string().optional().describe('姓名（可选）'),
  gender: z.enum(['male', 'female']).describe('性别：male 为男，female 为女'),
  dateType: z.enum(['solar', 'lunar']).describe('日期类型：solar 为阳历，lunar 为农历'),
  year: z.string().describe('出生年，如 1990'),
  month: z.string().describe('出生月，如 5'),
  day: z.string().describe('出生日，如 15'),
  timeIndex: z.number().int().min(0).max(12).describe('时辰索引：0=早子时,1=丑时,...,12=晚子时'),
  isLeapMonth: z.boolean().optional().describe('是否为闰月（仅农历有效）'),
});

const ziweiPromptSchema = ziweiSchema.extend({
  question: z.string().describe('用户希望围绕命盘解读的问题'),
  promptTopic: z
    .enum(ZIWEI_PROMPT_TOPICS)
    .optional()
    .describe(
      '提示词主题：destiny=命局, relationship=感情, career-wealth=事业财运, family=六亲家庭, health=健康养护, study=学业成长, life=人生, chat=自由问答',
    ),
  promptScope: z
    .enum(ZIWEI_PROMPT_SCOPES)
    .optional()
    .describe('提示词运限范围：origin=本命, decadal=大限, yearly=流年, monthly=流月, daily=流日, hourly=流时, age=年龄'),
  promptMode: z
    .enum(PROMPT_MODES)
    .optional()
    .describe('提示词模式：framework=内置完整框架, custom=只围绕用户问题自由作答'),
});

export function registerZiweiTool(server: McpServer) {
  server.registerTool(
    'ziwei_calculate',
    {
      description: '紫微斗数排盘：根据出生信息计算完整紫微命盘，包含星曜、宫位、大限、流年等数据',
      inputSchema: ziweiSchema.shape,
      outputSchema: ziweiOutputSchema,
    },
    async (args) => {
      try {
        const input = buildZiweiChartInput({
          name: args.name || '',
          gender: args.gender,
          dateType: args.dateType,
          year: args.year,
          month: args.month,
          day: args.day,
          timeIndex: args.timeIndex,
          isLeapMonth: args.isLeapMonth ?? false,
          useTrueSolarTime: false,
        });

        const result = await calculateFullZiweiChart(input);
        return createStructuredToolResult(buildSerializableZiweiResult(result));
      } catch (error) {
        return createErrorToolResult(getErrorMessage(error, '排盘失败'));
      }
    },
  );

  server.registerTool(
    'ziwei_prompt',
    {
      description: '紫微斗数排盘并生成结构化 AI 解读提示词：一次调用返回命盘数据和可直接复制给 AI 的提示词',
      inputSchema: ziweiPromptSchema.shape,
      outputSchema: {
        result: z.unknown().describe('紫微命盘数据'),
        prompt: z.string().describe('可直接用于 AI 解读的结构化提示词'),
      },
    },
    async (args) => {
      try {
        const input = buildZiweiChartInput({
          name: args.name || '',
          gender: args.gender,
          dateType: args.dateType,
          year: args.year,
          month: args.month,
          day: args.day,
          timeIndex: args.timeIndex,
          isLeapMonth: args.isLeapMonth ?? false,
          useTrueSolarTime: false,
        });

        const result = await calculateFullZiweiChart(input);
        return createStructuredToolResult({
          result: buildSerializableZiweiResult(result),
          prompt: buildZiweiPromptForRuntime({
            result,
            question: args.question,
            topic: args.promptTopic ? (args.promptTopic as ZiweiPromptTopic) : undefined,
            scope: (args.promptScope ?? 'origin') as ZiweiPromptScope,
            mode: (args.promptMode ?? 'framework') as PromptMode,
          }),
        });
      } catch (error) {
        return createErrorToolResult(getErrorMessage(error, '生成紫微提示词失败'));
      }
    },
  );
}
