import { useSearchParams } from 'react-router';
import { Aviso, Grade, GradeCarregando } from '../componentes/comuns.tsx';
import { useListaDeFilmes } from '../ganchos.ts';

export function Busca() {
  const [parametros] = useSearchParams();
  const termo = (parametros.get('q') ?? '').trim();
  return termo ? <Resultados termo={termo} /> : <Aviso texto="Digite o nome de um filme na busca." />;
}

function Resultados({ termo }: { termo: string }) {
  const { estado, carregarMais, temMais } = useListaDeFilmes({ busca: termo });
  return (
    <div>
      <h1 className="text-2xl font-bold">Resultados para "{termo}"</h1>
      <div className="mt-6">
        {!estado ? (
          <GradeCarregando />
        ) : estado.erro && estado.filmes.length === 0 ? (
          <Aviso texto={estado.erro} />
        ) : estado.filmes.length === 0 ? (
          <Aviso texto="Nenhum filme encontrado. Tente o título original ou menos palavras." />
        ) : (
          <>
            <Grade filmes={estado.filmes} />
            {temMais ? (
              <div className="mt-8 flex justify-center">
                <button type="button" onClick={carregarMais} className="rounded-full border border-linha px-6 py-2.5 text-sm font-semibold hover:border-destaque">
                  Carregar mais
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
