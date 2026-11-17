# MoviesLib

Lista os filmes mais bem avaliados, busca por título e mostra detalhes de cada filme, com dados do
[TMDB](https://www.themoviedb.org/) em português. React 19, React Router e Vite.

## A chave da API fica no servidor

O navegador nunca recebe a chave do TMDB. Ele chama `/api/filmes`, e a função em
[`api/filmes.js`](api/filmes.js) faz a consulta com a chave lida de `TMDB_API_KEY`. A função aceita
só três consultas, com os parâmetros validados:

| Consulta | Uso |
|---|---|
| `/api/filmes?lista=melhores` | página inicial |
| `/api/filmes?busca=termo` | busca por título (até 100 caracteres) |
| `/api/filmes?id=123` | detalhe do filme (só números) |

Qualquer outra coisa recebe 400, então a função não serve de passagem para o resto da API do TMDB.
As respostas trazem só os campos que a página usa.

- **Na Vercel:** `api/` vira função de servidor; configure `TMDB_API_KEY` nas variáveis de
  ambiente. O `vercel.json` manda as rotas da aplicação (`/movie/123`, `/search`) para o
  `index.html`.
- **Localmente:** o próprio Vite responde a `/api/filmes` com a mesma função, lendo a chave do `.env`.

## Rodando localmente

Requer Node 20.19 ou 22.12 em diante.

```bash
cp .env.example .env
npm install
npm run dev
```

```bash
npm run lint
npm test
npm run build
```

`npm test` cobre a função de servidor com `node:test`: chave ausente, as três consultas, recusa de
id inválido e de consultas fora da lista, 404 e falhas do TMDB.

Este projeto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
