import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { baziCalculator } from '../../../src/utils/bazi/baziCalculator.js';
import type { Person } from '../../../src/utils/bazi/baziTypes.js';
import {
  BAZI_PROMPT_TOPICS,
  PROMPT_MODES,
  buildBaziPromptForResult,
  type BaziPromptTopic,
  type PromptMode,
} from '../../../src/lib/public-api/prompt-builders.js';
import { promptOutputSchema, resultOutputSchema } from '../schemas.js';
import {
  createErrorToolResult,
  createResultToolResult,
  createStructuredToolResult,
  getErrorMessage,
} from '../tool-results.js';

const baziSchema = z.object({
  gender: z.enum(['male', 'female']).describe('性别：male 为男，female 为女'),
  year: z.number().int().min(1900).max(2100).describe('出生年'),
  month: z.number().int().min(1).max(12).describe('出生月'),
  day: z.number().int().min(1).max(31).describe('出生日'),
  timeIndex: z.number().int().min(0).max(12).describe('时辰索引：0=早子时,1=丑时,...,12=晚子时'),
  dateType: z.enum(['solar', 'lunar']).describe('日期类型：solar 为阳历，lunar 为农历'),
  isLeapMonth: z.boolean().optional().describe('是否为闰月（仅农历有效）'),
});

const baziPromptSchema = baziSchema.extend({
  question: z.string().describe('用户希望围绕命盘解读的问题'),
  promptTopic: z
    .enum(BAZI_PROMPT_TOPICS)
    .optional()
    .describe('提示词主题：general=综合, career=事业, wealth=财运, marriage=婚恋, children=子女, health=健康'),
  promptMode: z
    .enum(PROMPT_MODES)
    .optional()
    .describe('提示词模式：framework=内置完整框架, custom=只围绕用户问题自由作答'),
});

export function registerBaziTool(server: McpServer) {
  server.registerTool(
    'bazi_calculate',
    {
      description: '八字排盘：根据出生信息计算四柱八字、十神、藏干、大运、神煞等完整命盘数据',
      inputSchema: baziSchema.shape,
      outputSchema: resultOutputSchema,
    },
    async (args) => {
      const person: Person = {
        gender: args.gender,
        year: args.year,
        month: args.month,
        day: args.day,
        timeIndex: args.timeIndex,
        isLunar: args.dateType === 'lunar',
        isLeapMonth: args.isLeapMonth ?? false,
      };

      try {
        const result = baziCalculator.calculateBazi(person);
        return createResultToolResult(result);
      } catch (error) {
        return createErrorToolResult(getErrorMessage(error, '排盘失败'));
      }
    },
  );

  server.registerTool(
    'bazi_prompt',
    {
      description: '八字排盘并生成结构化 AI 解读提示词：一次调用返回命盘数据和可直接复制给 AI 的提示词',
      inputSchema: baziPromptSchema.shape,
      outputSchema: promptOutputSchema,
    },
    async (args) => {
      const person: Person = {
        gender: args.gender,
        year: args.year,
        month: args.month,
        day: args.day,
        timeIndex: args.timeIndex,
        isLunar: args.dateType === 'lunar',
        isLeapMonth: args.isLeapMonth ?? false,
      };

      try {
        const result = baziCalculator.calculateBazi(person);
        return createStructuredToolResult({
          result,
          prompt: buildBaziPromptForResult({
            result,
            question: args.question,
            topic: (args.promptTopic ?? 'general') as BaziPromptTopic,
            mode: (args.promptMode ?? 'framework') as PromptMode,
          }),
        });
      } catch (error) {
        return createErrorToolResult(getErrorMessage(error, '生成八字提示词失败'));
      }
    },
  );
}
