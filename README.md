# Cloudflare AI Worker

Cloudflare Workers 原生 GraphQL API，转发聊天请求到 DeepSeek。可独立部署，也可作为 `lesson-cloudflare-web` 前端的后端。

## 开发

```bash
pnpm install   # 或 npm install / yarn install
pnpm dev       # 等价 wrangler dev
```

本地默认暴露 `http://127.0.0.1:8787/api/graphql`，与前端默认设置一致。

## 部署

```bash
pnpm deploy    # wrangler deploy
```

在 Cloudflare 上设置以下环境变量/Secrets：

- `DEEPSEEK_API_KEY` (secret) – DeepSeek API 密钥
- 可选 `DEEPSEEK_MODEL`, `DEEPSEEK_TIMEOUT_MS`, `DEEPSEEK_BASE_URL`

## GraphQL

```graphql
mutation SendMessage($input: SendMessageInput!) {
  sendMessage(input: $input) {
    message {
      id
      role
      content
    }
  }
}
```

或直接访问 `GET /api/graphql?query={_health}` 做健康检查。