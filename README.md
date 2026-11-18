# MoviesLib

Para descobrir filmes, saber onde assistir no Brasil e montar a própria lista. Os dados vêm do
[TMDB](https://www.themoviedb.org/), em português, e os serviços de streaming, do JustWatch. React 19,
TypeScript, React Router, Tailwind e Vite.

## O que faz

- **Descobrir.**
  - Listas prontas: em cartaz no Brasil, populares e mais bem avaliados.
  - Aba **Explorar**, que filtra por gênero, ano e serviço de assinatura ("o que tem no serviço
    X") e ordena por popularidade, nota ou lançamento.
  - Na ordem por nota, só entram filmes com 300 votos ou mais, para um filme com dois votos 10
    não ficar no topo.
  - Os filtros ficam no endereço: dá para recarregar, voltar e mandar o link.
- **Página do filme.**
  - Os dados básicos: nota, votos, classificação indicativa brasileira, duração, gêneros, direção,
    sinopse e elenco.
  - O link para o trailer, com preferência pelo trailer em português.
  - **Onde assistir no Brasil**, separado em assinatura, aluguel e compra.
  - "Quem gostou também viu".
- **Minha lista.** Marca o filme como "Quero ver" ou "Já vi", com uma nota sua de 1 a 5 estrelas e
  a média dos vistos. Tudo fica no navegador, e o que vem do armazenamento é conferido antes de
  usar.
- **Busca** com "carregar mais". Os endereços da primeira versão (`/movie/123`, `/search`)
  continuam funcionando.

## A chave da API fica no servidor

O navegador nunca recebe a chave do TMDB. Ele chama `/api/filmes`, e a função em
[`api/filmes.js`](api/filmes.js) faz a consulta com a chave lida de `TMDB_API_KEY`.

A função aceita só uma lista fechada de consultas, com cada parâmetro validado:

| Consulta | Uso |
|---|---|
| `lista=em-cartaz`, `populares`, `melhores` (+ `pagina`) | abas da página inicial |
| `lista=generos`, `lista=servicos` | opções dos filtros |
| `descobrir=1` com `genero`, `ano`, `servico`, `ordem`, `pagina` | aba Explorar |
| `busca=termo` (+ `pagina`) | busca por título, até 100 caracteres |
| `id=123` | página do filme, com elenco, vídeos, onde assistir, semelhantes e classificação numa chamada só |

- **O que é recusado:** gênero com vírgula, ano fora do formato, página 0 ou acima de 50, ordem
  desconhecida e id com barra recebem 400, sem chamar o TMDB.
- **O que volta:** a resposta traz só os campos que a página usa.

- **Na Vercel:** `api/` vira função de servidor. Configure `TMDB_API_KEY` nas variáveis de
  ambiente. O `vercel.json` manda as rotas da aplicação para o `index.html` e define a política de
  segurança: só imagens do próprio site e de `image.tmdb.org`, e nenhum script de fora.
- **Localmente:** o próprio Vite responde a `/api/filmes` com a mesma função, lendo a chave do `.env`.

## Rodando localmente

Requer Node 22.12 ou mais novo.

```bash
cp .env.example .env    # coloque sua chave do TMDB
npm install
npm run dev
```

```bash
npm run lint
npm test            # função de servidor (node:test) e regras da lista (Vitest)
npm run test:e2e    # navegador, com o TMDB simulado
npm run build
```

- **`npm test`**: os testes da função de servidor simulam o TMDB e conferem:
  - os parâmetros enviados para cada consulta;
  - a recusa do que está fora da lista;
  - a montagem da página do filme (trailer em português, onde assistir só do Brasil,
    classificação);
  - as falhas.
- **`npm run test:e2e`**: os testes de navegador também simulam o TMDB, então não precisam de
  chave. Eles rodam no celular e no desktop, com a mesma política de segurança da Vercel.

## Uso dos dados e limitações

- **Uso comercial depende de contrato com o TMDB.** Os termos da API do TMDB permitem o uso sem
  custo só para fins não comerciais. Vender ou cobrar por um app com esses dados exige contrato
  com o TMDB.
- **Atribuição.** O rodapé informa que os dados vêm do TMDB e que este produto não é endossado
  nem certificado por ele. Os dados de "onde assistir" são creditados ao JustWatch, como o TMDB
  exige. Os termos também pedem o logotipo do TMDB, que ainda não foi adicionado.
- **A lista não sincroniza.** "Quero ver" e "Já vi" ficam só no navegador onde foram marcados.
- **Trailer no YouTube.** O link abre o YouTube, em vez de embutir o vídeo, para a página não
  carregar nada de terceiros sem a pessoa pedir.
