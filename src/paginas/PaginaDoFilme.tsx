import { Bookmark, BookmarkCheck, Check, ExternalLink, Play, Star, UserRound } from 'lucide-react';
import { useParams } from 'react-router';
import { ano, duracao, IMAGEM, type Filme, type Provedor } from '../api.ts';
import { Aviso, CartaoDeFilme, Nota, Poster } from '../componentes/comuns.tsx';
import { useConsulta } from '../ganchos.ts';
import { darNota, marcar, useMinhaLista } from '../minhaLista.ts';

function ListaDeProvedores({ titulo, provedores }: { titulo: string; provedores: Provedor[] }) {
  if (provedores.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm text-suave">{titulo}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {provedores.map((p) => (
          <li key={p.id} className="flex items-center gap-2 rounded-xl bg-elevada py-1.5 pr-3 pl-1.5 text-sm">
            <img src={IMAGEM(p.logo, 'w185')} alt="" className="size-8 rounded-lg" />
            {p.nome}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MinhaAvaliacao({ filme }: { filme: Filme }) {
  const lista = useMinhaLista();
  const item = lista.find((i) => i.id === filme.id);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => marcar(filme, 'quero-ver')}
        aria-pressed={item?.estado === 'quero-ver'}
        className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${item?.estado === 'quero-ver' ? 'bg-destaque text-sobre-destaque' : 'bg-elevada'}`}
      >
        {item?.estado === 'quero-ver' ? <BookmarkCheck size={17} aria-hidden="true" /> : <Bookmark size={17} aria-hidden="true" />}
        Quero ver
      </button>
      <button
        type="button"
        onClick={() => marcar(filme, 'ja-vi')}
        aria-pressed={item?.estado === 'ja-vi'}
        className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${item?.estado === 'ja-vi' ? 'bg-destaque text-sobre-destaque' : 'bg-elevada'}`}
      >
        <Check size={17} aria-hidden="true" />
        Já vi
      </button>
      {item?.estado === 'ja-vi' ? (
        <div role="radiogroup" aria-label="Minha nota" className="flex items-center">
          {[1, 2, 3, 4, 5].map((valor) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={item.minhaNota === valor}
              aria-label={`${valor} de 5`}
              onClick={() => darNota(filme.id, valor)}
              className="grid size-9 place-items-center text-destaque"
            >
              <Star size={20} fill={(item.minhaNota ?? 0) >= valor ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PaginaDoFilme() {
  const { id = '' } = useParams();
  const resultado = useConsulta<{ filme: Filme }>(/^\d+$/.test(id) ? { id } : null);

  if (!/^\d+$/.test(id)) return <Aviso texto="Filme não encontrado." />;
  if (!resultado) return <p role="status" className="py-16 text-center text-suave">Carregando...</p>;
  if (resultado.tipo === 'erro') return <Aviso texto={resultado.mensagem} />;

  const { filme } = resultado.dados;
  const onde = filme.ondeAssistir;
  const temOnde = onde && (onde.assinatura.length || onde.aluguel.length || onde.compra.length);

  return (
    <article>
      <div className="relative -mx-4 -mt-6 overflow-hidden px-4 pt-6 pb-8">
        {filme.backdrop_path ? (
          <img src={IMAGEM(filme.backdrop_path, 'w1280')} alt="" className="absolute inset-0 size-full object-cover opacity-25" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-fundo/40 via-fundo/80 to-fundo" />
        <div className="relative grid gap-6 sm:grid-cols-[220px_1fr]">
          <div className="mx-auto w-44 sm:w-full">
            <Poster filme={filme} tamanho="w500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">
              {filme.title} {filme.release_date ? <span className="font-normal text-suave">({ano(filme.release_date)})</span> : null}
            </h1>
            {filme.original_title && filme.original_title !== filme.title ? (
              <p className="mt-1 text-sm text-suave">Título original: {filme.original_title}</p>
            ) : null}
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-suave">
              <Nota valor={filme.vote_average} />
              <span>{filme.vote_count.toLocaleString('pt-BR')} votos</span>
              {filme.classificacao ? (
                <span className="rounded border border-linha px-1.5 py-0.5 text-xs font-semibold text-texto" title="Classificação indicativa">
                  {filme.classificacao === 'L' ? 'Livre' : `${filme.classificacao} anos`}
                </span>
              ) : null}
              {filme.runtime ? <span>{duracao(filme.runtime)}</span> : null}
              {filme.generos.length ? <span>{filme.generos.map((g) => g.nome).join(', ')}</span> : null}
            </p>
            {filme.tagline ? <p className="mt-4 text-lg text-texto/90 italic">{filme.tagline}</p> : null}
            <p className="mt-3 max-w-2xl leading-relaxed">{filme.overview ?? 'Sem sinopse em português.'}</p>
            {filme.direcao.length ? (
              <p className="mt-3 text-sm">
                <span className="text-suave">Direção:</span> {filme.direcao.join(', ')}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {filme.trailer ? (
                <a
                  href={`https://www.youtube.com/watch?v=${encodeURIComponent(filme.trailer.chave)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-texto px-4 text-sm font-semibold text-fundo"
                >
                  <Play size={16} fill="currentColor" aria-hidden="true" />
                  Ver trailer
                </a>
              ) : null}
              <MinhaAvaliacao filme={filme} />
            </div>
          </div>
        </div>
      </div>

      <section aria-labelledby="titulo-onde" className="rounded-2xl bg-superficie p-5">
        <h2 id="titulo-onde" className="text-lg font-bold">
          Onde assistir no Brasil
        </h2>
        {temOnde && onde ? (
          <div className="mt-3 space-y-4">
            <ListaDeProvedores titulo="Na assinatura" provedores={onde.assinatura} />
            <ListaDeProvedores titulo="Para alugar" provedores={onde.aluguel} />
            <ListaDeProvedores titulo="Para comprar" provedores={onde.compra} />
            <p className="text-xs text-suave">
              Fonte: JustWatch.{' '}
              <a href={onde.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
                Ver links no TMDB <ExternalLink size={12} aria-hidden="true" />
              </a>
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-suave">Não está disponível em nenhum serviço no Brasil agora.</p>
        )}
      </section>

      {filme.elenco.length ? (
        <section aria-labelledby="titulo-elenco" className="mt-8">
          <h2 id="titulo-elenco" className="text-lg font-bold">
            Elenco
          </h2>
          <ul className="sem-barra mt-3 flex gap-4 overflow-x-auto pb-2">
            {filme.elenco.map((pessoa) => (
              <li key={pessoa.id} className="w-28 shrink-0">
                {pessoa.foto ? (
                  <img src={IMAGEM(pessoa.foto, 'w185')} alt="" loading="lazy" className="aspect-[2/3] w-full rounded-xl bg-elevada object-cover" />
                ) : (
                  <div className="grid aspect-[2/3] w-full place-items-center rounded-xl bg-elevada text-suave">
                    <UserRound size={28} aria-hidden="true" />
                  </div>
                )}
                <p className="mt-1.5 text-sm font-semibold leading-tight">{pessoa.nome}</p>
                <p className="text-xs text-suave">{pessoa.personagem}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {filme.semelhantes.length ? (
        <section aria-labelledby="titulo-semelhantes" className="mt-8">
          <h2 id="titulo-semelhantes" className="text-lg font-bold">
            Quem gostou também viu
          </h2>
          <ul className="sem-barra mt-3 flex gap-4 overflow-x-auto pb-2">
            {filme.semelhantes.map((outro) => (
              <li key={outro.id} className="w-36 shrink-0">
                <CartaoDeFilme filme={outro} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
