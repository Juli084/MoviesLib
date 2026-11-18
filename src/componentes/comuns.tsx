import { Bookmark, BookmarkCheck, Eye, Film, Star } from 'lucide-react';
import { Link } from 'react-router';
import { ano, IMAGEM, nota, type Resumo } from '../api.ts';
import { marcar, useMinhaLista } from '../minhaLista.ts';

export function Poster({ filme, tamanho = 'w342', className = '' }: { filme: Resumo; tamanho?: 'w185' | 'w342' | 'w500'; className?: string }) {
  return filme.poster_path ? (
    <img src={IMAGEM(filme.poster_path, tamanho)} alt="" loading="lazy" className={`aspect-[2/3] w-full rounded-xl bg-elevada object-cover ${className}`} />
  ) : (
    <div className={`grid aspect-[2/3] w-full place-items-center rounded-xl bg-elevada text-suave ${className}`}>
      <Film size={32} aria-hidden="true" />
    </div>
  );
}

export function Nota({ valor }: { valor: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-destaque">
      <Star size={14} fill="currentColor" aria-hidden="true" />
      {nota(valor)}
    </span>
  );
}

export function CartaoDeFilme({ filme }: { filme: Resumo }) {
  const lista = useMinhaLista();
  const naLista = lista.find((item) => item.id === filme.id);
  return (
    <article className="group relative">
      <Link to={`/filme/${filme.id}`} className="block" aria-label={`${filme.title}${filme.release_date ? `, ${ano(filme.release_date)}` : ''}`}>
        <Poster filme={filme} className="transition group-hover:brightness-110" />
        <h3 className="mt-2 line-clamp-2 text-sm leading-snug font-semibold">{filme.title}</h3>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-suave">
          <Nota valor={filme.vote_average} />
          {ano(filme.release_date)}
        </p>
      </Link>
      <button
        type="button"
        onClick={() => marcar(filme, 'quero-ver')}
        aria-pressed={naLista?.estado === 'quero-ver'}
        aria-label={naLista?.estado === 'quero-ver' ? `Tirar ${filme.title} de "Quero ver"` : `Adicionar ${filme.title} a "Quero ver"`}
        className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-fundo/80 text-texto backdrop-blur hover:text-destaque"
      >
        {naLista?.estado === 'ja-vi' ? (
          <Eye size={17} aria-hidden="true" />
        ) : naLista?.estado === 'quero-ver' ? (
          <BookmarkCheck size={17} className="text-destaque" aria-hidden="true" />
        ) : (
          <Bookmark size={17} aria-hidden="true" />
        )}
      </button>
    </article>
  );
}

export function Grade({ filmes }: { filmes: Resumo[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {filmes.map((filme) => (
        <li key={filme.id}>
          <CartaoDeFilme filme={filme} />
        </li>
      ))}
    </ul>
  );
}

export function GradeCarregando() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <li key={i}>
          <div className="aspect-[2/3] animate-pulse rounded-xl bg-elevada" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-elevada" />
        </li>
      ))}
    </ul>
  );
}

export function Aviso({ texto }: { texto: string }) {
  return (
    <p role="alert" className="rounded-xl bg-superficie px-4 py-6 text-center text-suave">
      {texto}
    </p>
  );
}
