import { useCallback, useEffect, useState } from 'react';
import { consultar, type PaginaDeFilmes, type Resultado, type Resumo } from './api.ts';

type Parametros = Record<string, string | number | undefined>;

/** Uma consulta simples. O resultado fica marcado com a chave em que foi feito. */
export function useConsulta<T>(parametros: Parametros | null): Resultado<T> | null {
  const chave = parametros ? JSON.stringify(parametros) : null;
  const [estado, setEstado] = useState<{ chave: string; resultado: Resultado<T> } | null>(null);

  useEffect(() => {
    if (!chave) return;
    let cancelado = false;
    consultar<T>(JSON.parse(chave) as Parametros).then((resultado) => {
      if (!cancelado) setEstado({ chave, resultado });
    });
    return () => {
      cancelado = true;
    };
  }, [chave]);

  return estado && estado.chave === chave ? estado.resultado : null;
}

interface Acumulado {
  chave: string;
  filmes: Resumo[];
  pagina: number;
  totalPaginas: number;
  erro: string | null;
  carregandoMais: boolean;
}

/** Lista paginada: trocar os filtros recomeça; "carregar mais" soma a próxima página. */
export function useListaDeFilmes(parametros: Parametros) {
  const chave = JSON.stringify(parametros);
  const [estado, setEstado] = useState<Acumulado | null>(null);

  useEffect(() => {
    let cancelado = false;
    consultar<PaginaDeFilmes>({ ...(JSON.parse(chave) as Parametros), pagina: 1 }).then((resultado) => {
      if (cancelado) return;
      setEstado(
        resultado.tipo === 'ok'
          ? { chave, ...resultado.dados, erro: null, carregandoMais: false }
          : { chave, filmes: [], pagina: 0, totalPaginas: 0, erro: resultado.mensagem, carregandoMais: false },
      );
    });
    return () => {
      cancelado = true;
    };
  }, [chave]);

  const atual = estado?.chave === chave ? estado : null;

  const carregarMais = useCallback(() => {
    if (!atual || atual.carregandoMais || atual.pagina >= atual.totalPaginas) return;
    setEstado({ ...atual, carregandoMais: true });
    consultar<PaginaDeFilmes>({ ...(JSON.parse(chave) as Parametros), pagina: atual.pagina + 1 }).then((resultado) => {
      setEstado((anterior) => {
        if (!anterior || anterior.chave !== chave) return anterior;
        if (resultado.tipo === 'erro') return { ...anterior, carregandoMais: false, erro: resultado.mensagem };
        // A mesma obra pode aparecer em duas páginas quando a ordem muda entre as consultas.
        const vistos = new Set(anterior.filmes.map((f) => f.id));
        return {
          ...anterior,
          filmes: [...anterior.filmes, ...resultado.dados.filmes.filter((f) => !vistos.has(f.id))],
          pagina: resultado.dados.pagina,
          totalPaginas: resultado.dados.totalPaginas,
          carregandoMais: false,
        };
      });
    });
  }, [atual, chave]);

  return { estado: atual, carregarMais, temMais: Boolean(atual && atual.pagina < atual.totalPaginas) };
}
