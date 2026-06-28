import process from 'node:process'
import { pwa } from './app/config/pwa'
import { appDescription } from './app/constants/index'

// add build time to env
import.meta.env.VITE_APP_BUILD_TIME = Date.now().toString()

export default defineNuxtConfig({

  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@vite-pwa/nuxt',
    '@nuxt/eslint',
  ],
  ssr: false,

  devtools: {
    enabled: true,
  },

  app: {
    head: {
      // no scale
      viewport: 'width=device-width,initial-scale=1,user-scalable=no',
      // <link rel="preconnect" href="https://fonts.googleapis.com">
      // <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      // <link href="https://fonts.googleapis.com/css2?family=Zhi+Mang+Xing&display=swap" rel="stylesheet">
      link: [
        // { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/svg+xml', href: '/layout-column-line.svg' },
        { rel: 'apple-touch-icon', href: '/layout-column-line.svg' },

        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        // use local font for load
        // { href: 'https://fonts.googleapis.com/css2?family=Zhi+Mang+Xing&display=swap', rel: 'stylesheet' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: appDescription },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      script: [
        {
          type: 'text/javascript',
          innerHTML: `    (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "kwm5q1tej7");`,
        },
      ],
    },
  },

  css: [
    '@unocss/reset/tailwind.css',
    '~/styles/index.scss',
  ],

  colorMode: {
    classSuffix: '',
  },

  runtimeConfig: {
    // 登录扣云币：服务端把用户 access_token 转给 yunle ai-gateway 计费生成（envId 公开，0 服务端密钥）。
    // 模型 / 模型组由 yunle ai-gateway 服务端按 appId 决定，本侧不再持有（解耦 + 防篡改）。
    costPerGeneration: 1, // 仅供余额 UI 展示「本次消耗」；权威扣费金额以 yunle 为准
    openaiApiKey: '',
    openaiBaseURL: 'https://api.deepseek.com/v1',
    openaiModel: 'deepseek-chat',
    public: {
      cloudbaseEnvId: 'yunlefun-8g7ybcxc7345c490',
      yunleSsoOrigin: 'https://www.yunle.fun',
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  experimental: {
    // when using generate, payload js assets included in sw precache manifest
    // but missing on offline, disabling extraction it until fixed
    payloadExtraction: false,
    renderJsonPayloads: true,
    typedPages: true,
  },

  compatibilityDate: '2024-08-14',

  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
    // CF Pages（CF_PAGES=1）用 static preset：纯静态产物、不生成 _worker.js，
    // 避免与根目录 functions/ 冲突；/api 由 functions/ 作为 CF Pages Functions 承载。
    // EdgeOne 不设 CF_PAGES，preset 为 undefined（自动探测），不受影响。
    preset: process.env.CF_PAGES ? 'static' : undefined,
    prerender: {
      crawlLinks: false,
      routes: ['/'],
      ignore: ['/hi'],
    },
  },

  eslint: {
    config: {
      standalone: false,
      nuxt: {
        sortConfigKeys: true,
      },
    },
  },

  pwa,
})
