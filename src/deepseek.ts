export type WorkerEnv = Record<string, string | undefined> & {
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string;
  DEEPSEEK_TIMEOUT_MS?: string;
  DEEPSEEK_BASE_URL?: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type DeepseekChatResponse = {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export function readEnvValue(key: keyof WorkerEnv, env?: WorkerEnv) {
  console.log('readEnvValue', key, env);
  
  const value = env?.[key];
  if (value && value.trim() !== '') {
    return value;
  }
  if (typeof process !== 'undefined') {
    const processValue = process.env?.[key as string];
    if (processValue && processValue.trim() !== '') {
      return processValue;
    }
  }
  return undefined;
}

export async function fetchDeepseekCompletion(message: string, env?: WorkerEnv) {
  const apiKey = readEnvValue('DEEPSEEK_API_KEY', env);
  if (!apiKey) {
    console.warn('[chat] Missing DEEPSEEK_API_KEY.');
    return '服务器缺少 DEEPSEEK_API_KEY，请在 Cloudflare Secrets 中配置后再试。';
  }

  const timeoutSetting = readEnvValue('DEEPSEEK_TIMEOUT_MS', env);
  const timeoutParsed = timeoutSetting ? Number(timeoutSetting) : NaN;
  const timeoutMs =
    Number.isFinite(timeoutParsed) && timeoutParsed > 0 ? timeoutParsed : 25_000;

  const baseUrl = readEnvValue('DEEPSEEK_BASE_URL', env) ?? 'https://api.deepseek.com';
  const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: readEnvValue('DEEPSEEK_MODEL', env) ?? 'deepseek-chat',
        temperature: 0.7,
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content:
              '你是一位中英双语的 DeFi 技术助教，帮助用户把想法转换成下一步行动。',
          },
          {
            role: 'user',
            content: message,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`DeepSeek request failed (${response.status}): ${errorBody || 'unknown'}`);
    }

    const data = (await response.json()) as DeepseekChatResponse;
    return (
      data.choices?.[0]?.message?.content?.trim() ?? 'DeepSeek 没有返回内容，请稍后再试。'
    );
  } catch (error) {
    console.error('[chat] DeepSeek request failed', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return `与 DeepSeek 的连接在 ${Math.floor(timeoutMs / 1000)} 秒后超时，请重试。`;
    }
    return `抱歉，调用 DeepSeek 出错：${
      error instanceof Error ? error.message : '未知原因'
    }`;
  } finally {
    clearTimeout(timer);
  }
}
