import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Content Security Policy della demo: la pagina puo' caricare script e stili
// solo da se stessa, chiamare solo le due API delle carte e mostrare solo
// le loro immagini. GitHub Pages non permette header personalizzati, quindi
// la CSP va in un <meta>. Solo in build: in sviluppo Vite inietta script
// inline per l'hot reload, che la CSP bloccherebbe.
const CSP_DEMO = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: https://cards.scryfall.io https://images.ygoprodeck.com",
  "connect-src https://api.scryfall.com https://db.ygoprodeck.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function cspDemo() {
  return {
    name: 'csp-demo',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP_DEMO },
        injectTo: 'head',
      },
    ],
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDemo = mode === 'demo'
  return {
    plugins: [react(), isDemo && cspDemo()],
    // GitHub Pages pubblica il sito in /<nome-repository>/
    base: isDemo ? '/Database-TCG-magic-e-yugioh/' : '/',
    server: {
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
  }
})
