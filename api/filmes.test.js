import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from './filmes.js';

const CHAVE = 'chave-de-teste-123';
const fetchOriginal = globalThis.fetch;
let chamadas;

function simularTmdb(resposta) {
  globalThis.fetch = async (url) => {
    chamadas.push(new URL(url));
    if (resposta instanceof Error) throw resposta;
    return typeof resposta === 'function' ? resposta() : resposta;
  };
}

const pedir = (params) => GET(new Request(`http://localhost/api/filmes?${new URLSearchParams(params)}`));

const filmeCompleto = {
  id: 278,
  title: 'Um Sonho de Liberdade',
  original_title: 'The Shawshank Redemption',
  poster_path: '/p.jpg',
  backdrop_path: '/b.jpg',
  vote_average: 8.7,
  vote_count: 28000,
  release_date: '1994-09-23',
  tagline: 'Medo pode prender você.',
  runtime: 142,
  overview: 'Descrição.',
  homepage: 'ignorar',
  genres: [{ id: 18, name: 'Drama' }],
  credits: {
    cast: [{ id: 504, name: 'Tim Robbins', character: 'Andy Dufresne', profile_path: '/t.jpg', popularity: 1 }],
    crew: [
      { name: 'Frank Darabont', job: 'Director' },
      { name: 'Roger Deakins', job: 'Director of Photography' },
    ],
  },
  videos: {
    results: [
      { site: 'YouTube', type: 'Teaser', key: 'teaser', iso_639_1: 'pt', name: 'Teaser' },
      { site: 'YouTube', type: 'Trailer', key: 'en1', iso_639_1: 'en', name: 'Trailer' },
      { site: 'YouTube', type: 'Trailer', key: 'pt1', iso_639_1: 'pt', name: 'Trailer legendado' },
    ],
  },
  'watch/providers': {
    results: {
      US: { flatrate: [{ provider_id: 1, provider_name: 'Só nos EUA', logo_path: '/us.jpg' }] },
      BR: {
        link: 'https://www.themoviedb.org/movie/278/watch?locale=BR',
        flatrate: [{ provider_id: 8, provider_name: 'Serviço A', logo_path: '/a.jpg', display_priority: 1 }],
        rent: [{ provider_id: 2, provider_name: 'Loja B', logo_path: '/b.jpg', display_priority: 2 }],
      },
    },
  },
  recommendations: { results: [{ id: 680, title: 'Pulp Fiction', poster_path: '/pf.jpg', vote_average: 8.5, release_date: '1994-09-10' }] },
  release_dates: { results: [{ iso_3166_1: 'BR', release_dates: [{ certification: '' }, { certification: '14' }] }] },
};

describe('GET /api/filmes', () => {
  beforeEach(() => {
    chamadas = [];
    process.env.TMDB_API_KEY = CHAVE;
  });

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    delete process.env.TMDB_API_KEY;
  });

  it('responde 503 quando a chave não está configurada', async () => {
    delete process.env.TMDB_API_KEY;
    assert.equal((await pedir({ lista: 'melhores' })).status, 503);
  });

  it('lista em cartaz no Brasil, com página e só os campos usados', async () => {
    simularTmdb(Response.json({ page: 2, total_pages: 900, results: [filmeCompleto] }));
    const resposta = await pedir({ lista: 'em-cartaz', pagina: '2' });
    const corpo = await resposta.json();
    assert.equal(resposta.status, 200);
    assert.equal(chamadas[0].pathname, '/3/movie/now_playing');
    assert.equal(chamadas[0].searchParams.get('region'), 'BR');
    assert.equal(chamadas[0].searchParams.get('page'), '2');
    assert.equal(chamadas[0].searchParams.get('language'), 'pt-BR');
    assert.deepEqual(corpo, {
      filmes: [{ id: 278, title: 'Um Sonho de Liberdade', poster_path: '/p.jpg', vote_average: 8.7, release_date: '1994-09-23' }],
      pagina: 2,
      totalPaginas: 50,
    });
    assert.ok(!JSON.stringify(corpo).includes(CHAVE), 'a chave não volta na resposta');
  });

  it('descobre por gênero, ano, serviço e nota com mínimo de votos', async () => {
    simularTmdb(Response.json({ results: [] }));
    await pedir({ descobrir: '1', genero: '18', ano: '1994', servico: '8', ordem: 'nota' });
    const parametros = chamadas[0].searchParams;
    assert.equal(chamadas[0].pathname, '/3/discover/movie');
    assert.equal(parametros.get('with_genres'), '18');
    assert.equal(parametros.get('primary_release_year'), '1994');
    assert.equal(parametros.get('with_watch_providers'), '8');
    assert.equal(parametros.get('watch_region'), 'BR');
    assert.equal(parametros.get('sort_by'), 'vote_average.desc');
    assert.equal(parametros.get('vote_count.gte'), '300');
  });

  it('recusa parâmetros fora do formato sem chamar o TMDB', async () => {
    for (const params of [
      { descobrir: '1', genero: '18,99' },
      { descobrir: '1', ano: '94' },
      { descobrir: '1', ordem: 'aleatoria' },
      { descobrir: '1', servico: '8|9' },
      { lista: 'em-cartaz', pagina: '0' },
      { lista: 'em-cartaz', pagina: '51' },
      { lista: 'tudo' },
      { id: '278/credits' },
      { caminho: '/account' },
    ]) {
      assert.equal((await pedir(params)).status, 400, JSON.stringify(params));
    }
    assert.equal(chamadas.length, 0);
  });

  it('busca pelo termo informado, já codificado e limitado', async () => {
    simularTmdb(Response.json({ results: [] }));
    await pedir({ busca: '  o poderoso & chefão ' });
    assert.equal(chamadas[0].pathname, '/3/search/movie');
    assert.equal(chamadas[0].searchParams.get('query'), 'o poderoso & chefão');
    await pedir({ busca: 'x'.repeat(300) });
    assert.equal(chamadas[1].searchParams.get('query').length, 100);
  });

  it('monta o detalhe com elenco, direção, trailer em português, onde assistir no Brasil e classificação', async () => {
    simularTmdb(Response.json(filmeCompleto));
    const { filme } = await (await pedir({ id: '278' })).json();
    assert.equal(chamadas[0].searchParams.get('append_to_response'), 'credits,videos,watch/providers,recommendations,release_dates');
    assert.deepEqual(filme.direcao, ['Frank Darabont']);
    assert.deepEqual(filme.elenco, [{ id: 504, nome: 'Tim Robbins', personagem: 'Andy Dufresne', foto: '/t.jpg' }]);
    assert.deepEqual(filme.trailer, { chave: 'pt1', nome: 'Trailer legendado' });
    assert.deepEqual(filme.ondeAssistir, {
      link: 'https://www.themoviedb.org/movie/278/watch?locale=BR',
      assinatura: [{ id: 8, nome: 'Serviço A', logo: '/a.jpg' }],
      aluguel: [{ id: 2, nome: 'Loja B', logo: '/b.jpg' }],
      compra: [],
    });
    assert.equal(filme.classificacao, '14');
    assert.deepEqual(filme.generos, [{ id: 18, nome: 'Drama' }]);
    assert.equal(filme.semelhantes[0].title, 'Pulp Fiction');
    assert.equal(filme.homepage, undefined);
  });

  it('deixa trailer e onde assistir nulos quando o TMDB não tem', async () => {
    simularTmdb(Response.json({ ...filmeCompleto, videos: { results: [] }, 'watch/providers': { results: {} } }));
    const { filme } = await (await pedir({ id: '278' })).json();
    assert.equal(filme.trailer, null);
    assert.equal(filme.ondeAssistir, null);
  });

  it('lista os serviços de streaming do Brasil pela prioridade de exibição', async () => {
    simularTmdb(
      Response.json({
        results: [
          { provider_id: 2, provider_name: 'Segundo', logo_path: '/2.jpg', display_priorities: { BR: 5 } },
          { provider_id: 1, provider_name: 'Primeiro', logo_path: '/1.jpg', display_priorities: { BR: 1 } },
        ],
      }),
    );
    const { servicos } = await (await pedir({ lista: 'servicos' })).json();
    assert.deepEqual(servicos.map((s) => s.nome), ['Primeiro', 'Segundo']);
  });

  it('repassa 404 do TMDB como filme não encontrado', async () => {
    simularTmdb(new Response('{}', { status: 404 }));
    assert.equal((await pedir({ id: '999999' })).status, 404);
  });

  it('responde 502 quando o TMDB recusa ou a rede falha', async () => {
    simularTmdb(new Response('{}', { status: 500 }));
    assert.equal((await pedir({ lista: 'populares' })).status, 502);
    simularTmdb(new Error('rede'));
    assert.equal((await pedir({ lista: 'populares' })).status, 502);
  });
});
