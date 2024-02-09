# AI SFC (Spring Festival Couplets) - AI 春联

Powered by [DeepSeek 开发平台](https://platform.deepseek.com/).

- 字体：[MaShanZheng | Google Fonts](https://fonts.google.com/specimen/Ma+Shan+Zheng)

## Desc

- 横批从右往左，上联在右，下联在左。
- 横批从左往右，上联在左，下联在右。

## Dev

### Config API Key

```bash
cp .env.example .env

# .env
# you can get free tokens from https://platform.deepseek.com/
OPENAI_API_KEY=your_deepseek_api_key
```

```bash
pnpm i
pnpm dev
```

## FAQ

- [Error when opening nuxt3 web link in China's QQ application](https://github.com/nuxt/nuxt/issues/24229)
- `ofetch` in QQ browser: [unjs/ofetch#294](https://github.com/unjs/ofetch/issues/294)
