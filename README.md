# AI SFC (Spring Festival Couplets) - AI 春联

Powered by [云乐坊 YunLeFun](https://www.yunle.fun).

> 两条生成链路：**未登录**在「设置」填兼容 OpenAI 协议的模型接口与 token，浏览器直连、token 只存本地、不经服务端；**登录**走云币计费，服务端用你的云乐坊 access_token 直调 [CloudBase](https://tcb.cloud.tencent.com/) 模型（无服务端密钥），登录复用 [www.yunle.fun](https://www.yunle.fun) 账户（基于 [@yunlefun/sso](https://www.npmjs.com/package/@yunlefun/sso) 跨站 SSO）。

- 字体：[MaShanZheng | Google Fonts](https://fonts.google.com/specimen/Ma+Shan+Zheng)

## Desc

- 横批从右往左，上联在右，下联在左。
- 横批从左往右，上联在左，下联在右。

## Dev

### Config API Key

```bash
cp .env.example .env

# .env
# Use DeepSeek
NUXT_OPENAI_BASE_URL='https://api.deepseek.com/v1'
NUXT_OPENAI_MODEL='deepseek-chat'
# you can get free tokens from https://platform.deepseek.com/
NUXT_OPENAI_API_KEY=your_deepseek_api_key

# Legacy EdgeOne Functions fallback
AI_SERVICE_URL='https://api.deepseek.com/v1'
MODEL_NAME='deepseek-chat'
OPENAI_API_KEY=your_deepseek_api_key
```

```bash
pnpm i
pnpm dev
```

## Deploy

部署在 **EdgeOne Pages**（国内 CDN 加速），自定义域名 <https://ai-sfc.yunle.fun>。

- **SSO 白名单**：登录走 yunle 跨站 SSO，应用 origin 必须在 yunle 的 `NUXT_PUBLIC_SSO_ALLOWED_TARGET_ORIGINS`（当前放行 `https://*.yunle.fun`、`https://*.yunyoujun.cn`）内，否则登录弹窗报「SSO 请求参数无效」。`*.yunle.fun` 子域天然在白名单，故用 `ai-sfc.yunle.fun`（别用未列入的 `*.netlify.app` 等裸域）。本地 dev 端口（`3000`/`5173`/`5174`/`4173` 等）已硬编码在白名单，直接可用。
- **服务端 API**：EdgeOne Pages 跑 V8 边缘函数、**不运行 Nitro**，故登录扣费的服务端逻辑放在 `functions/api/*`（EdgeOne `onRequest`，与 Nitro `server/api/*` 共用 `packages/server` 的计费/CloudBase 编排）。本地 `pnpm dev` 走 Nitro 路由、`edgeone pages dev` 走 EdgeOne 函数，两者等价。

## FAQ

- [Error when opening nuxt3 web link in China's QQ application](https://github.com/nuxt/nuxt/issues/24229)
- `ofetch` in QQ browser: [unjs/ofetch#294](https://github.com/unjs/ofetch/issues/294)
