import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { GET as filmes } from './api/filmes.js';

// Em `npm run dev` e `npm run preview`, o próprio Vite responde a
// /api/filmes com a mesma função usada em produção.
function apiLocal() {
  const tratar = async (req, res, next) => {
    if (!req.url.startsWith('/api/filmes')) return next();
    const resposta = await filmes(new Request(`http://localhost${req.url}`));
    res.statusCode = resposta.status;
    resposta.headers.forEach((valor, nome) => res.setHeader(nome, valor));
    res.end(await resposta.text());
  };
  return {
    name: 'api-local',
    configureServer(server) {
      server.middlewares.use(tratar);
    },
    configurePreviewServer(server) {
      server.middlewares.use(tratar);
    },
  };
}

export default defineConfig(({ mode }) => {
  // Lê TMDB_API_KEY do .env sem o prefixo VITE_, que a exporia no bundle.
  const env = loadEnv(mode, process.cwd(), '');
  if (env.TMDB_API_KEY) process.env.TMDB_API_KEY = env.TMDB_API_KEY;

  return {
    plugins: [react(), apiLocal()],
  };
});
