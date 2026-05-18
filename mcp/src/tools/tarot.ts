import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { drawSingleCard, drawSpreadCards, getCardKeywords } from '../../../src/utils/tarot.js';
import { PROMPT_MODES } from '../../../src/lib/public-api/prompt-builders.js';
import { promptOutputSchema, resultOutputSchema } from '../schemas.js';
import { createErrorToolResult, createStructuredToolResult, getErrorMessage } from '../tool-results.js';
import { buildDivinationPromptText } from './prompt-helpers.js';

const tarotSchema = z.object({
  spreadType: z
    .enum(['single', 'three', 'love', 'career', 'decision'])
    .optional()
    .describe('牌阵类型：single=单牌指引, three=时间流, love=爱情, career=事业, decision=选择'),
});

const tarotPromptSchema = tarotSchema.extend({
  question: z.string().describe('用户希望围绕牌阵解读的问题'),
  promptMode: z
    .enum(PROMPT_MODES)
    .optional()
    .describe('提示词模式：framework=内置完整框架, custom=只围绕用户问题自由作答'),
});

export function registerTarotTool(server: McpServer) {
  server.registerTool(
    'divine_tarot',
    {
      description: '塔罗牌抽牌：从 78 张塔罗牌中洗牌抽牌，支持单牌指引和多种牌阵，含正逆位与关键词',
      inputSchema: tarotSchema.shape,
      outputSchema: resultOutputSchema,
    },
    async (args) => {
      try {
        const spreadType = args.spreadType || 'single';
        let result;
        if (spreadType === 'single') {
          const draw = drawSingleCard();
          result = {
            spreadType: 'single',
            spreadName: '单牌指引',
            cards: [
              {
                id: draw.card.number,
                name: draw.card.name,
                position: draw.position,
                reversed: draw.isReversed,
                keywords: getCardKeywords(draw.card.name).split(','),
              },
            ],
            timestamp: draw.timestamp,
          };
        } else {
          const draw = drawSpreadCards(spreadType);
          result = {
            spreadType: draw.spreadType,
            spreadName: draw.spreadName,
            cards: draw.cards.map((item) => ({
              id: item.card.number,
              name: item.card.name,
              position: item.position,
              reversed: item.isReversed,
              keywords: getCardKeywords(item.card.name).split(','),
            })),
            timestamp: draw.timestamp,
          };
        }
        return createStructuredToolResult({ result });
      } catch (error) {
        return createErrorToolResult(getErrorMessage(error, '抽牌失败'));
      }
    },
  );

  server.registerTool(
    'tarot_prompt',
    {
      description: '塔罗抽牌并生成结构化 AI 解读提示词：一次调用返回牌阵数据和可直接复制给 AI 的提示词',
      inputSchema: tarotPromptSchema.shape,
      outputSchema: promptOutputSchema,
    },
    async (args) => {
      try {
        const spreadType = args.spreadType || 'single';
        const result =
          spreadType === 'single'
            ? (() => {
                const draw = drawSingleCard();
                return {
                  spreadType: 'single',
                  spreadName: '单牌指引',
                  cards: [
                    {
                      id: draw.card.number,
                      name: draw.card.name,
                      position: draw.position,
                      reversed: draw.isReversed,
                      keywords: getCardKeywords(draw.card.name).split(','),
                    },
                  ],
                  timestamp: draw.timestamp,
                };
              })()
            : (() => {
                const draw = drawSpreadCards(spreadType);
                return {
                  spreadType: draw.spreadType,
                  spreadName: draw.spreadName,
                  cards: draw.cards.map((item) => ({
                    id: item.card.number,
                    name: item.card.name,
                    position: item.position,
                    reversed: item.isReversed,
                    keywords: getCardKeywords(item.card.name).split(','),
                  })),
                  timestamp: draw.timestamp,
                };
              })();

        return createStructuredToolResult({
          result,
          prompt: buildDivinationPromptText({
            method: 'tarot',
            question: args.question,
            data: result,
            promptMode: args.promptMode,
          }),
        });
      } catch (error) {
        return createErrorToolResult(getErrorMessage(error, '生成塔罗提示词失败'));
      }
    },
  );
}
