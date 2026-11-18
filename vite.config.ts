/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
// @ts-expect-error a função de servidor é JavaScript puro, sem tipos.
import { GET as filmes } from './api/filmes.js';

// Em `npm run dev` e `npm run preview`, o próprio Vite responde a /api/filmes com a
// mesma função usada em produção.
function apiLocal() {
  const tratar = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/filmes')) return next();
    const resposta: Response = await filmes(new Request(`http://localhost${req.url}`));
    res.statusCode = resposta.status;
    resposta.headers.forEach((valor, nome) => res.setHeader(nome, valor));
    res.end(await resposta.text());
  };
  return {
    name: 'api-local',
    configureServer(server: { middlewares: { use: (f: typeof tratar) => void } }) {
      server.middlewares.use(tratar);
    },
    configurePreviewServer(server: { middlewares: { use: (f: typeof tratar) => void } }) {
      server.middlewares.use(tratar);
    },
  };
}

/** Cabeçalhos da Vercel também no `vite preview`, para os testes rodarem sob a mesma CSP. */
function cabecalhosDeProducao(): Record<string, string> {
  const config = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf-8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const geral = config.headers.find((regra) => regra.source === '/(.*)');
  return Object.fromEntries((geral?.headers ?? []).map(({ key, value }) => [key, value]));
}

export default defineConfig(({ mode }) => {
  // Lê TMDB_API_KEY do .env sem o prefixo VITE_, que a exporia no bundle.
  const env = loadEnv(mode, process.cwd(), '');
  if (env.TMDB_API_KEY) process.env.TMDB_API_KEY = env.TMDB_API_KEY;
  return {
    plugins: [react(), tailwindcss(), apiLocal()],
    preview: { headers: cabecalhosDeProducao() },
    test: { include: ['tests/**/*.test.ts'], environment: 'node' },
  };
});
