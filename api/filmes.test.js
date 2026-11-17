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
  poster_path: '/p.jpg',
  vote_average: 8.7,
  tagline: 'Medo pode prender você.',
  budget: 25000000,
  revenue: 28341469,
  runtime: 142,
  overview: 'Descrição.',
  homepage: 'ignorar',
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

  it('lista os melhores avaliados em português, só com os campos usados', async () => {
    simularTmdb(Response.json({ results: [filmeCompleto] }));
    const resposta = await pedir({ lista: 'melhores' });
    const corpo = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.equal(chamadas[0].pathname, '/3/movie/top_rated');
    assert.equal(chamadas[0].searchParams.get('language'), 'pt-BR');
    assert.deepEqual(corpo.filmes, [{ id: 278, title: 'Um Sonho de Liberdade', poster_path: '/p.jpg', vote_average: 8.7 }]);
    assert.ok(!JSON.stringify(corpo).includes(CHAVE), 'a chave não volta na resposta');
  });

  it('busca pelo termo informado, já codificado', async () => {
    simularTmdb(Response.json({ results: [] }));
    await pedir({ busca: 'Velozes & Furiosos #9' });
    assert.equal(chamadas[0].pathname, '/3/search/movie');
    assert.equal(chamadas[0].searchParams.get('query'), 'Velozes & Furiosos #9');
  });

  it('devolve o detalhe do filme pelo id', async () => {
    simularTmdb(Response.json(filmeCompleto));
    const corpo = await (await pedir({ id: '278' })).json();
    assert.equal(chamadas[0].pathname, '/3/movie/278');
    assert.equal(corpo.filme.runtime, 142);
    assert.equal(corpo.filme.homepage, undefined);
  });

  it('recusa id que não é número, sem chamar o TMDB', async () => {
    simularTmdb(Response.json({}));
    for (const id of ['../account', '1/videos', 'abc', '']) {
      assert.equal((await pedir({ id })).status, 400, `id "${id}"`);
    }
    assert.equal(chamadas.length, 0);
  });

  it('recusa consulta fora das três previstas', async () => {
    simularTmdb(Response.json({}));
    assert.equal((await pedir({ caminho: '/account' })).status, 400);
    assert.equal((await pedir({ busca: '   ' })).status, 400);
    assert.equal(chamadas.length, 0);
  });

  it('repassa 404 do TMDB como filme não encontrado', async () => {
    simularTmdb(() => new Response('{}', { status: 404 }));
    assert.equal((await pedir({ id: '999999999' })).status, 404);
  });

  it('responde 502 quando o TMDB recusa ou a rede falha', async () => {
    simularTmdb(() => new Response('{}', { status: 401 }));
    assert.equal((await pedir({ lista: 'melhores' })).status, 502);
    simularTmdb(new TypeError('fetch failed'));
    assert.equal((await pedir({ lista: 'melhores' })).status, 502);
  });
});
