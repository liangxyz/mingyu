import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateMeihua } from '../../../src/lib/divination/algorithms/meihua/index.js';
import { PROMPT_MODES } from '../../../src/lib/public-api/prompt-builders.js';
import type { MeihuaSettings } from '../../../src/types/divination.js';
import { promptOutputSchema, resultOutputSchema } from '../schemas.js';
import { createErrorToolResult, createStructuredToolResult, getErrorMessage } from '../tool-results.js';
import { buildDivinationPromptText } from './prompt-helpers.js';

const meihuaSchema = z.object({
  method: z
    .enum(['time', 'number', 'random', 'external'])
    .optional()
    .describe('起卦方式：time=时间起卦, number=数字起卦, random=随机起卦, external=外应起卦'),
  number: z.number().int().positive().optional().describe('数字起卦时使用的正整数'),
  customDate: z.string().optional().describe('自定义起卦时间（ISO 8601 格式），不提供则使用当前时间'),
});

const meihuaPromptSchema = meihuaSchema.extend({
  question: z.string().describe('用户希望围绕卦盘解读的问题'),
  promptMode: z
    .enum(PROMPT_MODES)
    .optional()
    .describe('提示词模式：framework=内置完整框架, custom=只围绕用户问题自由作答'),
});

export function registerMeihuaTool(server: McpServer) {
  server.registerTool(
    'divine_meihua',
    {
      description: '梅花易数起卦：支持时间起卦、数字起卦、随机起卦，生成主卦、互卦、变卦及体用生克分析',
      inputSchema: meihuaSchema.shape,
      outputSchema: resultOutputSchema,
    },
    async (args) => {
      try {
        const customDate = args.customDate ? new Date(args.customDate) : undefined;
        const settings: MeihuaSettings = {
          method: args.method || 'time',
          ...(args.number ? { number: args.number } : {}),
        };
        const result = generateMeihua(customDate, settings);
        return createStructuredToolResult({ result });
      } catch (error) {
        return createErrorToolResult(getErrorMessage(error, '起卦失败'));
      }
    },
  );

  server.registerTool(
    'meihua_prompt',
    {
      description: '梅花易数起卦并生成结构化 AI 解读提示词：一次调用返回卦盘数据和可直接复制给 AI 的提示词',
      inputSchema: meihuaPromptSchema.shape,
      outputSchema: promptOutputSchema,
    },
    async (args) => {
      try {
        const customDate = args.customDate ? new Date(args.customDate) : undefined;
        const settings: MeihuaSettings = {
          method: args.method || 'time',
          ...(args.number ? { number: args.number } : {}),
        };
        const result = generateMeihua(customDate, settings);
        return createStructuredToolResult({
          result,
          prompt: buildDivinationPromptText({
            method: 'meihua',
            question: args.question,
            data: result,
            promptMode: args.promptMode,
          }),
        });
      } catch (error) {
        return createErrorToolResult(getErrorMessage(error, '生成梅花提示词失败'));
      }
    },
  );
}
