import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateMeihua } from '../../../src/lib/divination/algorithms/meihua/index.js';
import type { MeihuaSettings } from '../../../src/types/divination.js';
import { resultOutputSchema } from '../schemas.js';
import { createErrorToolResult, createStructuredToolResult, getErrorMessage } from '../tool-results.js';
import { buildCommonDivinationPrompt, extendPromptSchema } from './divination-common.js';

const meihuaSchema = z.object({
  method: z
    .enum(['time', 'number', 'random', 'external'])
    .optional()
    .describe('起卦方式：time=时间起卦, number=数字起卦, random=随机起卦, external=外应起卦'),
  number: z.number().int().positive().optional().describe('数字起卦时使用的正整数'),
  customDate: z.string().optional().describe('自定义起卦时间（ISO 8601 格式），不提供则使用当前时间'),
});

const meihuaPromptSchema = extendPromptSchema(meihuaSchema, '用户希望围绕卦盘解读的问题');

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
        const settings: MeihuaSettings = {
          method: args.method || 'time',
          ...(args.number ? { number: args.number } : {}),
        };
        const result = generateMeihua(args.customDate ? new Date(args.customDate) : undefined, settings);
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
      outputSchema: {
        result: z.unknown().describe('梅花易数卦盘数据'),
        prompt: z.string().describe('可直接用于 AI 解读的结构化提示词'),
      },
    },
    async (args) => {
      try {
        const settings: MeihuaSettings = {
          method: args.method || 'time',
          ...(args.number ? { number: args.number } : {}),
        };
        const result = generateMeihua(args.customDate ? new Date(args.customDate) : undefined, settings);
        return createStructuredToolResult({
          result,
          prompt: buildCommonDivinationPrompt('meihua', args.question, result, args.promptMode),
        });
      } catch (error) {
        return createErrorToolResult(getErrorMessage(error, '生成梅花提示词失败'));
      }
    },
  );
}
