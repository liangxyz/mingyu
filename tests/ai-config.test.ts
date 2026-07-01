import test from 'node:test';
import assert from 'node:assert/strict';
import { handleAiModels } from '../src/lib/ai/proxy';
import {
  getDefaultAiSettings,
  getServerBuiltinAiLabel,
  isServerBuiltinAiEnabled,
  isServerDefaultAiEnabled,
} from '../src/lib/ai/settings';

type RuntimeConfigGlobal = typeof globalThis & {
  __MINGYU_RUNTIME_CONFIG__?: {
    aiBuiltinEnabled?: boolean;
    aiDefaultEnabled?: boolean;
    aiProviderName?: string;
  };
};

test('内置 AI 可显示但默认仍保持提示词模式', (t) => {
  const target = globalThis as RuntimeConfigGlobal;
  const originalConfig = target.__MINGYU_RUNTIME_CONFIG__;
  t.after(() => {
    target.__MINGYU_RUNTIME_CONFIG__ = originalConfig;
  });

  target.__MINGYU_RUNTIME_CONFIG__ = {
    aiBuiltinEnabled: true,
    aiDefaultEnabled: false,
    aiProviderName: '内置（不稳定）',
  };

  assert.equal(isServerBuiltinAiEnabled(), true);
  assert.equal(isServerDefaultAiEnabled(), false);
  assert.equal(getServerBuiltinAiLabel(), '内置（不稳定）');
  assert.deepEqual(
    {
      enabled: getDefaultAiSettings().enabled,
      mode: getDefaultAiSettings().mode,
    },
    {
      enabled: false,
      mode: 'builtin',
    },
  );
});

test('主动选择内置 AI 时不受默认关闭影响', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async (url: string | URL | Request) => {
    assert.equal(String(url), 'https://example.com/v1/models');
    return new Response(JSON.stringify({ data: [{ id: 'free/cc' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }) as typeof fetch;

  const response = await handleAiModels(
    new Request('https://example.com/api/v1/ai/models', {
      method: 'POST',
      body: JSON.stringify({ aiConfig: { mode: 'builtin' } }),
    }),
    {
      AI_API_KEY: 'test-key',
      AI_BASE_URL: 'https://example.com/v1',
      AI_MODEL: 'free/cc',
      AI_BUILTIN_ENABLED: 'true',
      AI_DEFAULT_ENABLED: 'false',
    },
  );

  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body, { ok: true, models: ['free/cc'] });
});

test('未开启内置 AI 时拒绝服务端 AI 调用', async () => {
  const response = await handleAiModels(
    new Request('https://example.com/api/v1/ai/models', {
      method: 'POST',
      body: JSON.stringify({ aiConfig: { mode: 'builtin' } }),
    }),
    {
      AI_API_KEY: 'test-key',
      AI_DEFAULT_ENABLED: 'false',
    },
  );

  const body = await response.json();
  assert.equal(response.status, 403);
  assert.equal(body.error.code, 'AI_SERVER_NOT_ENABLED');
});
