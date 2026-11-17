const FALHA = 'Não foi possível carregar os filmes agora.';

export const POSTER = 'https://image.tmdb.org/t/p/w500';

// Devolve o próximo estado da tela; não mexe em estado do React.
export async function consultar(params) {
  try {
    const resposta = await fetch(`/api/filmes?${new URLSearchParams(params)}`);
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) return { tipo: 'erro', mensagem: dados.erro ?? FALHA };
    return { tipo: 'ok', ...dados };
  } catch {
    return { tipo: 'erro', mensagem: FALHA };
  }
}
