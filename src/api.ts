export const IMAGEM = (caminho: string, tamanho: 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' = 'w342') =>
  `https://image.tmdb.org/t/p/${tamanho}${caminho}`;

export interface Resumo {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string | null;
}

export interface Provedor {
  id: number;
  nome: string;
  logo: string;
}

export interface Filme extends Resumo {
  original_title: string;
  backdrop_path: string | null;
  vote_count: number;
  tagline: string | null;
  overview: string | null;
  runtime: number | null;
  generos: { id: number; nome: string }[];
  classificacao: string | null;
  direcao: string[];
  elenco: { id: number; nome: string; personagem: string; foto: string | null }[];
  trailer: { chave: string; nome: string } | null;
  ondeAssistir: { link: string; assinatura: Provedor[]; aluguel: Provedor[]; compra: Provedor[] } | null;
  semelhantes: Resumo[];
}

export interface PaginaDeFilmes {
  filmes: Resumo[];
  pagina: number;
  totalPaginas: number;
}

export type Resultado<T> = { tipo: 'ok'; dados: T } | { tipo: 'erro'; mensagem: string };

const FALHA = 'Não foi possível carregar os filmes agora.';

export async function consultar<T>(parametros: Record<string, string | number | undefined>): Promise<Resultado<T>> {
  const limpos = Object.entries(parametros).filter((par): par is [string, string | number] => par[1] !== undefined && par[1] !== '');
  try {
    const resposta = await fetch(`/api/filmes?${new URLSearchParams(limpos.map(([k, v]) => [k, String(v)]))}`);
    const dados = (await resposta.json().catch(() => ({}))) as T & { erro?: string };
    if (!resposta.ok) return { tipo: 'erro', mensagem: dados.erro ?? FALHA };
    return { tipo: 'ok', dados };
  } catch {
    return { tipo: 'erro', mensagem: FALHA };
  }
}

export function ano(data: string | null): string {
  return data ? data.slice(0, 4) : '';
}

export function nota(valor: number): string {
  return valor > 0 ? valor.toFixed(1).replace('.', ',') : '–';
}

export function duracao(minutos: number | null): string {
  if (!minutos) return '';
  const horas = Math.floor(minutos / 60);
  return horas ? `${horas} h ${String(minutos % 60).padStart(2, '0')} min` : `${minutos} min`;
}
