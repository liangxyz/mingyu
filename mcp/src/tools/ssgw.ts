import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { drawRandomSign } from '../../../src/lib/divination/algorithms/ssgw.js';
import { PROMPT_MODES } from '../../../src/lib/public-api/prompt-builders.js';
import { promptOutputSchema, resultOutputSchema } from '../schemas.js';
import { createErrorToolResult, createStructuredToolResult, getErrorMessage } from '../tool-results.js';
import { buildDivinationPromptText } from './prompt-helpers.js';

const ssgwSchema = z.object({});

const ssgwPromptSchema = ssgwSchema.extend({
  question: z.string().describe('用户希望围绕灵签解读的问题'),
  promptMode: z
    .enum(PROMPT_MODES)
    .optional()
    .describe('提示词模式：framework=内置完整框架, custom=只围绕用户问题自由作答'),
});

export function registerSsgwTool(server: McpServer) {
  server.registerTool(
    'divine_ssgw',
    {
      description: '三山国王灵签求签：模拟真实求签过程，从 100 签中随机抽取，含签题、签诗、典故故事及详细解签',
      inputSchema: ssgwSchema.shape,
      outputSchema: resultOutputSchema,
    },
    async (args) => {
      try {
        const result = drawRandomSign();
        return createStructuredToolResult({ result });
      } catch (error) {
        return createErrorToolResult(getErrorMessage(error, '求签失败'));
      }
    },
  );

  server.registerTool(
    'ssgw_prompt',
    {
      description: '三山国王灵签求签并生成结构化 AI 解读提示词：一次调用返回灵签结果和可直接复制给 AI 的提示词',
      inputSchema: ssgwPromptSchema.shape,
      outputSchema: promptOutputSchema,
    },
    async (args) => {
      try {
        const result = drawRandomSign();
        return createStructuredToolResult({
          result,
          prompt: buildDivinationPromptText({
            method: 'ssgw',
            question: args.question,
            data: result,
            promptMode: args.promptMode,
          }),
        });
      } catch (error) {
        return createErrorToolResult(getErrorMessage(error, '生成灵签提示词失败'));
      }
    },
  );
}
