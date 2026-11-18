import { useSearchParams } from 'react-router';
import { IMAGEM, type Provedor } from '../api.ts';
import { Aviso, Grade, GradeCarregando } from '../componentes/comuns.tsx';
import { useConsulta, useListaDeFilmes } from '../ganchos.ts';

const ABAS = [
  { id: 'em-cartaz', nome: 'Em cartaz' },
  { id: 'populares', nome: 'Populares' },
  { id: 'melhores', nome: 'Mais bem avaliados' },
  { id: 'explorar', nome: 'Explorar' },
] as const;

type Aba = (typeof ABAS)[number]['id'];

const ANO_ATUAL = new Date().getFullYear();
const ANOS = Array.from({ length: ANO_ATUAL - 1949 }, (_, i) => String(ANO_ATUAL - i));

const seletor = 'h-10 rounded-lg border border-linha bg-superficie px-3 text-sm';

export function Descobrir() {
  // Filtros no endereço: dá para voltar, recarregar e compartilhar a mesma busca.
  const [parametros, setParametros] = useSearchParams();
  const aba = (ABAS.some((a) => a.id === parametros.get('aba')) ? parametros.get('aba') : 'em-cartaz') as Aba;
  const genero = parametros.get('genero') ?? '';
  const ano = parametros.get('ano') ?? '';
  const servico = parametros.get('servico') ?? '';
  const ordem = parametros.get('ordem') ?? 'popularidade';

  function mudar(mudanca: Record<string, string>) {
    const novos = new URLSearchParams(parametros);
    for (const [chave, valor] of Object.entries(mudanca)) {
      if (valor) novos.set(chave, valor);
      else novos.delete(chave);
    }
    setParametros(novos, { replace: true });
  }

  const explorar = aba === 'explorar';
  const generos = useConsulta<{ generos: { id: number; nome: string }[] }>(explorar ? { lista: 'generos' } : null);
  const servicos = useConsulta<{ servicos: Provedor[] }>(explorar ? { lista: 'servicos' } : null);
  const { estado, carregarMais, temMais } = useListaDeFilmes(
    explorar ? { descobrir: 1, genero, ano, servico, ordem } : { lista: aba },
  );

  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">Descobrir filmes</h1>
      <div role="tablist" aria-label="Listas" className="sem-barra mt-4 flex gap-2 overflow-x-auto">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={aba === item.id}
            onClick={() => mudar({ aba: item.id === 'em-cartaz' ? '' : item.id })}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${aba === item.id ? 'bg-destaque text-sobre-destaque' : 'bg-superficie text-suave hover:text-texto'}`}
          >
            {item.nome}
          </button>
        ))}
      </div>

      {explorar ? (
        <section aria-label="Filtros" className="mt-4 space-y-3 rounded-2xl bg-superficie p-4">
          <div className="flex flex-wrap gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-suave">Gênero</span>
              <select value={genero} onChange={(e) => mudar({ genero: e.target.value })} className={seletor}>
                <option value="">Todos</option>
                {generos?.tipo === 'ok'
                  ? generos.dados.generos.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome}
                      </option>
                    ))
                  : null}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-suave">Ano</span>
              <select value={ano} onChange={(e) => mudar({ ano: e.target.value })} className={seletor}>
                <option value="">Qualquer</option>
                {ANOS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-suave">Ordenar por</span>
              <select value={ordem} onChange={(e) => mudar({ ordem: e.target.value })} className={seletor}>
                <option value="popularidade">Popularidade</option>
                <option value="nota">Nota</option>
                <option value="lancamento">Lançamento</option>
              </select>
            </label>
          </div>
          {servicos?.tipo === 'ok' && servicos.dados.servicos.length > 0 ? (
            <fieldset>
              <legend className="mb-1.5 text-sm text-suave">Na assinatura de</legend>
              <div className="flex flex-wrap gap-2">
                {servicos.dados.servicos.map((s) => {
                  const ativo = servico === String(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => mudar({ servico: ativo ? '' : String(s.id) })}
                      className={`inline-flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm ${ativo ? 'border-destaque bg-destaque/15' : 'border-linha'}`}
                    >
                      <img src={IMAGEM(s.logo, 'w185')} alt="" className="size-7 rounded-full" />
                      {s.nome}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
        </section>
      ) : null}

      <div className="mt-6">
        {!estado ? (
          <GradeCarregando />
        ) : estado.erro && estado.filmes.length === 0 ? (
          <Aviso texto={estado.erro} />
        ) : estado.filmes.length === 0 ? (
          <Aviso texto="Nenhum filme com esses filtros." />
        ) : (
          <>
            <Grade filmes={estado.filmes} />
            {temMais ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={carregarMais}
                  disabled={estado.carregandoMais}
                  className="rounded-full border border-linha px-6 py-2.5 text-sm font-semibold hover:border-destaque disabled:opacity-50"
                >
                  {estado.carregandoMais ? 'Carregando...' : 'Carregar mais'}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
