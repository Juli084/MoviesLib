// Função de servidor (Vercel): consulta o TMDB com a chave guardada em
// TMDB_API_KEY. O navegador só conhece /api/filmes, com três consultas
// fechadas: melhores avaliados, detalhe por id e busca por título.
const TMDB = 'https://api.themoviedb.org/3';
const LIMITE_BUSCA = 100;

const resumo = ({ id, title, poster_path, vote_average }) => ({ id, title, poster_path, vote_average });

function json(corpo, status, cabecalhos = {}) {
  return Response.json(corpo, { status, headers: cabecalhos });
}

function montarConsulta(params) {
  if (params.get('lista') === 'melhores') {
    return { caminho: '/movie/top_rated', extra: {}, formatar: (d) => ({ filmes: (d.results ?? []).map(resumo) }) };
  }

  const id = params.get('id');
  if (id !== null) {
    if (!/^\d{1,10}$/.test(id)) return { erro: 'Identificador de filme inválido.' };
    return {
      caminho: `/movie/${id}`,
      extra: {},
      formatar: (d) => ({
        filme: { ...resumo(d), tagline: d.tagline, budget: d.budget, revenue: d.revenue, runtime: d.runtime, overview: d.overview },
      }),
    };
  }

  const busca = (params.get('busca') ?? '').trim().slice(0, LIMITE_BUSCA);
  if (busca) {
    return { caminho: '/search/movie', extra: { query: busca }, formatar: (d) => ({ filmes: (d.results ?? []).map(resumo) }) };
  }

  return { erro: 'Consulta não reconhecida.' };
}

export async function GET(request) {
  const chave = process.env.TMDB_API_KEY;
  if (!chave) {
    return json({ erro: 'A consulta de filmes não está configurada neste ambiente.' }, 503);
  }

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
