# AI SFC (Spring Festival Couplets) - AI 春联

Powered by [云乐坊 YunLeFun](https://www.yunle.fun).

> 登录用户的服务端生成走 [EdgeOne Makers Models AI 网关](https://cloud.tencent.com/document/product/1552/132748)；未登录用户可在「设置」自带兼容 OpenAI 协议的模型接口与 token，浏览器直连、不经过本站服务端。

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

## Functions

### EdgeOne Functions

[Pages Functions](https://edgeone.cloud.tencent.com/document/162936866445025280)

## FAQ

- [Error when opening nuxt3 web link in China's QQ application](https://github.com/nuxt/nuxt/issues/24229)
- `ofetch` in QQ browser: [unjs/ofetch#294](https://github.com/unjs/ofetch/issues/294)
