import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const toolCalls: Array<[string, Record<string, unknown>]> = [
  ['divine_liuyao', {}],
  ['divine_meihua', { method: 'number', number: 42 }],
  ['divine_xiaoliuren', { xiaoliurenMethod: 'number', xiaoliurenNumber: 18 }],
  ['divine_qimen', {}],
  ['divine_liuren', {}],
  ['divine_tarot', { spreadType: 'single' }],
  ['divine_ssgw', {}],
  [
    'bazi_calculate',
    { gender: 'male', year: 1990, month: 5, day: 15, timeIndex: 1, dateType: 'solar' },
  ],
  [
    'ziwei_calculate',
    { gender: 'male', dateType: 'solar', year: '1990', month: '5', day: '15', timeIndex: 1 },
  ],
];

const promptToolCalls: Array<[string, Record<string, unknown>, RegExp]> = [
  [
    'bazi_prompt',
    {
      gender: 'male',
      year: 1990,
      month: 5,
      day: 15,
      timeIndex: 1,
      dateType: 'solar',
      question: '我适合创业还是上班？',
      promptTopic: 'career',
    },
    /【排盘信息】/,
  ],
  [
    'ziwei_prompt',
    {
      gender: 'female',
      dateType: 'solar',
      year: '1992',
      month: '8',
      day: '21',
      timeIndex: 4,
      question: '我的感情关系要注意什么？',
      promptTopic: 'relationship',
      promptScope: 'origin',
    },
    /【问题】/,
  ],
  [
    'liuyao_prompt',
    {
      customDate: '2025-01-01T08:00:00+08:00',
      liuyaoTemplate: 'shiye',
      question: '今年事业如何？',
    },
    /【占卜信息】/,
  ],
  ['meihua_prompt', { method: 'number', number: 42, question: '今年事业如何？' }, /【占卜信息】/],
  [
    'xiaoliuren_prompt',
    { xiaoliurenMethod: 'number', xiaoliurenNumber: 18, question: '今年事业如何？' },
    /【占卜信息】/,
  ],
  [
    'qimen_prompt',
    { customDate: '2025-01-01T08:00:00+08:00', question: '今年事业如何？' },
    /【占卜信息】/,
  ],
  [
    'liuren_prompt',
    {
      customDate: '2025-01-01T08:00:00+08:00',
      liurenTemplate: 'shiye',
      question: '今年事业如何？',
    },
    /【占卜信息】/,
  ],
  ['tarot_prompt', { spreadType: 'single', question: '今年事业如何？' }, /【占卜信息】/],
  ['ssgw_prompt', { question: '今年事业如何？' }, /【占卜信息】/],
];

async function withMcpClient<T>(callback: (client: Client) => Promise<T>) {
  const client = new Client({ name: 'mcp-structured-output-test', version: '0.0.1' });
  const transport = new StdioClientTransport({
    command: 'npm',
    args: ['run', 'mcp'],
    cwd: process.cwd(),
    stderr: 'pipe',
  });

  await client.connect(transport);

  try {
    return await callback(client);
  } finally {
    await client.close();
  }
}

test('MCP 工具列表应声明输出结构', async () => {
  await withMcpClient(async (client) => {
    const { tools } = await client.listTools();

    assert.equal(tools.length, 18);
    tools.forEach((tool) => {
      assert.equal(tool.outputSchema?.type, 'object', `${tool.name} 缺少 outputSchema`);
    });

    const ziweiTool = tools.find((tool) => tool.name === 'ziwei_calculate');
    assert.ok(ziweiTool?.outputSchema?.properties?.payloadByScope);

    assert.equal(
      tools.some((tool) => tool.name === 'build_divination_prompt'),
      false,
    );
    for (const [name] of promptToolCalls) {
      assert.ok(tools.find((tool) => tool.name === name)?.outputSchema?.properties?.result);
      assert.ok(tools.find((tool) => tool.name === name)?.outputSchema?.properties?.prompt);
    }
  });
});

test('MCP 工具调用应同时返回 structuredContent 和文本 JSON', async () => {
  await withMcpClient(async (client) => {
    for (const [name, args] of toolCalls) {
      const result = await client.callTool({ name, arguments: args });
      assert.equal(result.isError, undefined, `${name} 不应返回错误`);
      assert.ok(result.structuredContent, `${name} 缺少 structuredContent`);
      assert.equal(result.content[0]?.type, 'text', `${name} 缺少文本兼容输出`);
      assert.equal(
        'prompt' in result.structuredContent,
        false,
        `${name} 不应通过旧排盘工具返回提示词`,
      );

      const text = result.content[0]?.type === 'text' ? result.content[0].text : '';
      assert.deepEqual(JSON.parse(text), result.structuredContent);
    }
  });
});

test('MCP 一站式提示词工具应同时返回结果和 prompt', async () => {
  await withMcpClient(async (client) => {
    for (const [name, args, promptPattern] of promptToolCalls) {
      const result = await client.callTool({ name, arguments: args });

      assert.equal(result.isError, undefined, `${name} 不应返回错误`);
      assert.ok(result.structuredContent?.result, `${name} 应返回 result`);
      assert.match(
        String(result.structuredContent?.prompt),
        promptPattern,
        `${name} prompt 格式不正确`,
      );

      const text = result.content[0]?.type === 'text' ? result.content[0].text : '';
      assert.deepEqual(JSON.parse(text), result.structuredContent);
    }
  });
});

test('MCP 提示词工具应支持 custom 模式，并与页面和 API 保持一致口径', async () => {
  await withMcpClient(async (client) => {
    const baziResult = await client.callTool({
      name: 'bazi_prompt',
      arguments: {
        gender: 'male',
        year: 1990,
        month: 5,
        day: 15,
        timeIndex: 1,
        dateType: 'solar',
        question: '我更适合继续现在的工作，还是主动换方向？',
        promptMode: 'custom',
      },
    });
    assert.equal(baziResult.isError, undefined, 'bazi_prompt custom 不应返回错误');
    assert.doesNotMatch(String(baziResult.structuredContent?.prompt), /【任务】/);
    assert.doesNotMatch(String(baziResult.structuredContent?.prompt), /【输出要求】/);

    const tarotResult = await client.callTool({
      name: 'tarot_prompt',
      arguments: {
        spreadType: 'single',
        question: '这件事我现在该不该继续推进？',
        promptMode: 'custom',
      },
    });
    assert.equal(tarotResult.isError, undefined, 'tarot_prompt custom 不应返回错误');
    assert.doesNotMatch(String(tarotResult.structuredContent?.prompt), /【任务】/);
    assert.doesNotMatch(String(tarotResult.structuredContent?.prompt), /【输出要求】/);

    const ziweiFrameworkResult = await client.callTool({
      name: 'ziwei_prompt',
      arguments: {
        gender: 'female',
        dateType: 'solar',
        year: '1992',
        month: '8',
        day: '21',
        timeIndex: 4,
        question: '请先做整体解读。',
        promptMode: 'framework',
      },
    });
    assert.equal(ziweiFrameworkResult.isError, undefined, 'ziwei_prompt framework 不应返回错误');
    assert.match(
      String(ziweiFrameworkResult.structuredContent?.prompt),
      /人生解析按“命身定位、长期课题、能力资源、关系模式、关键转折、当前阶段策略”展开。/,
    );
    assert.doesNotMatch(
      String(ziweiFrameworkResult.structuredContent?.prompt),
      /自由问答先判断问题落在哪些宫位/,
    );
  });
});

test('MCP 六爻与大六壬提示词工具应区分专项模板字段', async () => {
  await withMcpClient(async (client) => {
    const liuyaoResult = await client.callTool({
      name: 'liuyao_prompt',
      arguments: {
        customDate: '2025-01-01T08:00:00+08:00',
        question: '最近家里总觉得不安，这是不是鬼神怪异或冲犯？',
        liuyaoTemplate: 'guaishen',
      },
    });
    assert.equal(liuyaoResult.isError, undefined, 'liuyao_prompt 不应返回错误');
    assert.match(String(liuyaoResult.structuredContent?.prompt), /【断卦模板】/);
    assert.match(String(liuyaoResult.structuredContent?.prompt), /断卦类型：鬼神怪异/);

    const liurenResult = await client.callTool({
      name: 'liuren_prompt',
      arguments: {
        customDate: '2025-01-01T08:00:00+08:00',
        question: '我现在要不要换工作？',
        liurenTemplate: 'shiye',
      },
    });
    assert.equal(liurenResult.isError, undefined, 'liuren_prompt 不应返回错误');
    assert.match(String(liurenResult.structuredContent?.prompt), /【断课模板】/);
    assert.match(String(liurenResult.structuredContent?.prompt), /断课类型：事业断课/);
  });
});
