// Função de servidor (Vercel): consulta o TMDB com a chave guardada em TMDB_API_KEY.
// O navegador só conhece /api/filmes, e cada consulta aceita é uma entrada fechada da
// lista abaixo, com os parâmetros validados. Assim a função não serve de passagem para
// o resto da API do TMDB, e a resposta leva só os campos que a página usa.
const TMDB = 'https://api.themoviedb.org/3';
const LIMITE_BUSCA = 100;
const ULTIMA_PAGINA = 50;

const LISTAS = {
  'em-cartaz': { caminho: '/movie/now_playing', extra: { region: 'BR' } },
  populares: { caminho: '/movie/popular', extra: { region: 'BR' } },
  melhores: { caminho: '/movie/top_rated', extra: {} },
};

// Na ordem por nota, só entram filmes com votos suficientes, para um filme com dois
// votos 10 não ficar no topo.
const ORDENS = {
  popularidade: { sort_by: 'popularity.desc' },
  nota: { sort_by: 'vote_average.desc', 'vote_count.gte': '300' },
  lancamento: { sort_by: 'primary_release_date.desc', 'vote_count.gte': '20' },
};

const resumo = ({ id, title, poster_path, vote_average, release_date }) => ({
  id,
  title,
  poster_path: poster_path ?? null,
  vote_average: vote_average ?? 0,
  release_date: release_date || null,
});

const lista = (d) => ({
  filmes: (d.results ?? []).map(resumo),
  pagina: d.page ?? 1,
  totalPaginas: Math.min(d.total_pages ?? 1, ULTIMA_PAGINA),
});

const provedor = ({ provider_id, provider_name, logo_path }) => ({ id: provider_id, nome: provider_name, logo: logo_path });

function detalhe(d) {
  const brasil = d['watch/providers']?.results?.BR;
  const videos = d.videos?.results ?? [];
  const trailer =
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.iso_639_1 === 'pt') ??
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ??
    null;
  const classificacao = d.release_dates?.results
    ?.find((r) => r.iso_3166_1 === 'BR')
    ?.release_dates?.find((r) => r.certification)?.certification;
  return {
    filme: {
      ...resumo(d),
      original_title: d.original_title,
      backdrop_path: d.backdrop_path ?? null,
      vote_count: d.vote_count ?? 0,
      tagline: d.tagline || null,
      overview: d.overview || null,
      runtime: d.runtime || null,
      generos: (d.genres ?? []).map(({ id, name }) => ({ id, nome: name })),
      classificacao: classificacao || null,
      direcao: (d.credits?.crew ?? []).filter((p) => p.job === 'Director').map((p) => p.name),
      elenco: (d.credits?.cast ?? [])
        .slice(0, 10)
        .map(({ id, name, character, profile_path }) => ({ id, nome: name, personagem: character, foto: profile_path ?? null })),
      trailer: trailer ? { chave: trailer.key, nome: trailer.name } : null,
      ondeAssistir: brasil
        ? {
            link: brasil.link,
            assinatura: (brasil.flatrate ?? []).map(provedor),
            aluguel: (brasil.rent ?? []).map(provedor),
            compra: (brasil.buy ?? []).map(provedor),
          }
        : null,
      semelhantes: (d.recommendations?.results ?? []).slice(0, 12).map(resumo),
    },
  };
}

function pagina(params) {
  const valor = params.get('pagina') ?? '1';
  return /^\d{1,2}$/.test(valor) && Number(valor) >= 1 && Number(valor) <= ULTIMA_PAGINA ? valor : null;
}

function montarConsulta(params) {
  const numeroDaPagina = pagina(params);
  if (numeroDaPagina === null) return { erro: 'Página inválida.' };

  const nomeDaLista = params.get('lista');
  if (nomeDaLista !== null) {
    if (nomeDaLista === 'generos') {
      return { caminho: '/genre/movie/list', extra: {}, formatar: (d) => ({ generos: (d.genres ?? []).map(({ id, name }) => ({ id, nome: name })) }) };
    }
    if (nomeDaLista === 'servicos') {
      return {
        caminho: '/watch/providers/movie',
        extra: { watch_region: 'BR' },
        formatar: (d) => ({
          servicos: (d.results ?? [])
            .sort((a, b) => (a.display_priorities?.BR ?? 999) - (b.display_priorities?.BR ?? 999))
            .slice(0, 12)
            .map(provedor),
        }),
      };
    }
    const definicao = LISTAS[nomeDaLista];
    if (!definicao) return { erro: 'Lista desconhecida.' };
    return { caminho: definicao.caminho, extra: { ...definicao.extra, page: numeroDaPagina }, formatar: lista };
  }

  if (params.get('descobrir') !== null) {
    const extra = { page: numeroDaPagina };
    const genero = params.get('genero');
    if (genero !== null) {
      if (!/^\d{1,6}$/.test(genero)) return { erro: 'Gênero inválido.' };
      extra.with_genres = genero;
    }
    const ano = params.get('ano');
    if (ano !== null) {
      if (!/^(19|20)\d{2}$/.test(ano)) return { erro: 'Ano inválido.' };
      extra.primary_release_year = ano;
    }
    const servico = params.get('servico');
    if (servico !== null) {
      if (!/^\d{1,6}$/.test(servico)) return { erro: 'Serviço inválido.' };
      Object.assign(extra, { with_watch_providers: servico, watch_region: 'BR', with_watch_monetization_types: 'flatrate' });
    }
    const ordem = ORDENS[params.get('ordem') ?? 'popularidade'];
    if (!ordem) return { erro: 'Ordem inválida.' };
    Object.assign(extra, ordem);
    return { caminho: '/discover/movie', extra, formatar: lista };
  }

  const id = params.get('id');
  if (id !== null) {
    if (!/^\d{1,10}$/.test(id)) return { erro: 'Identificador de filme inválido.' };
    return {
      caminho: `/movie/${id}`,
      // Uma chamada só traz elenco, vídeos, onde assistir, semelhantes e classificação.
      extra: { append_to_response: 'credits,videos,watch/providers,recommendations,release_dates', include_video_language: 'pt,en' },
      formatar: detalhe,
    };
  }

  const busca = (params.get('busca') ?? '').trim().slice(0, LIMITE_BUSCA);
  if (busca) return { caminho: '/search/movie', extra: { query: busca, page: numeroDaPagina }, formatar: lista };

  return { erro: 'Consulta não reconhecida.' };
}

function json(corpo, status, cabecalhos = {}) {
  return Response.json(corpo, { status, headers: cabecalhos });
}

export async function GET(request) {
  const chave = process.env.TMDB_API_KEY;
  if (!chave) return json({ erro: 'A consulta de filmes não está configurada neste ambiente.' }, 503);

  const consulta = montarConsulta(new URL(request.url).searchParams);
  if (consulta.erro) return json({ erro: consulta.erro }, 400);

  const url = new URL(TMDB + consulta.caminho);
  url.search = new URLSearchParams({ api_key: chave, language: 'pt-BR', ...consulta.extra });

  try {
    const resposta = await fetch(url);
    if (resposta.status === 404) return json({ erro: 'Filme não encontrado.' }, 404);
    if (!resposta.ok) return json({ erro: 'O serviço de filmes não respondeu. Tente de novo mais tarde.' }, 502);
    const dados = await resposta.json();
    return json(consulta.formatar(dados), 200, { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' });
  } catch {
    return json({ erro: 'O serviço de filmes não respondeu. Tente de novo mais tarde.' }, 502);
  }
}
