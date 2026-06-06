import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: '세이프맵 — 종로 안심 보행경로',
        short_name: '세이프맵',
        description: '종로구 안심 보행경로 추천 서비스. 치안·조도·경사 등 6대 위험지표와 페르소나 가중으로 더 안전한 길을 안내합니다.',
        lang: 'ko',
        theme_color: '#3B82F6',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 앱 셸(JS/CSS/HTML/폰트/아이콘) 프리캐싱 → 오프라인 시 껍데기 로드
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // 지도 타일 이미지는 런타임 캐싱(있으면 빠르게, 없으면 네트워크)
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /tile|tiles|map|openstreetmap|tmap|naver/i.test(url.href) && /\.(png|jpg|jpeg|webp)$/i.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // SPA 라우팅: 오프라인에서도 index.html로 폴백
        navigateFallback: '/index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
})
