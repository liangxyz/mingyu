import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateQimen } from '../../../src/lib/divination/algorithms/qimen/index.js';
import { PROMPT_MODES } from '../../../src/lib/public-api/prompt-builders.js';
import { promptOutputSchema, resultOutputSchema } from '../schemas.js';
import { createErrorToolResult, createStructuredToolResult, getErrorMessage } from '../tool-results.js';
import { buildDivinationPromptText } from './prompt-helpers.js';

const qimenSchema = z.object({
  customDate: z.string().optional().describe('自定义排盘时间（ISO 8601 格式），不提供则使用当前时间'),
});

const qimenPromptSchema = qimenSchema.extend({
  question: z.string().describe('用户希望围绕奇门盘解读的问题'),
  promptMode: z
    .enum(PROMPT_MODES)
    .optional()
    .describe('提示词模式：framework=内置完整框架, custom=只围绕用户问题自由作答'),
});

export function registerQimenTool(server: McpServer) {
  server.registerTool(
    'divine_qimen',
    {
      description:
        '奇门遁甲排盘：基于转盘奇门法生成时家奇门盘，包含天地人神四盘、九宫格、值符值使、格局标签与宫位洞察',
      inputSchema: qimenSchema.shape,
      outputSchema: resultOutputSchema,
    },
    async (args) => {
      try {
        const customDate = args.customDate ? new Date(args.customDate) : undefined;
        const result = generateQimen(customDate);
        return createStructuredToolResult({ result });
      } catch (error) {
        return createErrorToolResult(getErrorMessage(error, '排盘失败'));
      }
    },
  );

  server.registerTool(
    'qimen_prompt',
    {
      description: '奇门遁甲排盘并生成结构化 AI 解读提示词：一次调用返回奇门盘和可直接复制给 AI 的提示词',
      inputSchema: qimenPromptSchema.shape,
      outputSchema: promptOutputSchema,
    },
    async (args) => {
      try {
        const customDate = args.customDate ? new Date(args.customDate) : undefined;
        const result = generateQimen(customDate);
        return createStructuredToolResult({
          result,
          prompt: buildDivinationPromptText({
            method: 'qimen',
            question: args.question,
            data: result,
            promptMode: args.promptMode,
          }),
        });
      } catch (error) {
        return createErrorToolResult(getErrorMessage(error, '生成奇门提示词失败'));
      }
    },
  );
}
