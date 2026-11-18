import { Bookmark, Clapperboard, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router';
import { useMinhaLista } from './minhaLista.ts';
import { Busca } from './paginas/Busca.tsx';
import { Descobrir } from './paginas/Descobrir.tsx';
import { PaginaDoFilme } from './paginas/PaginaDoFilme.tsx';
import { MinhaLista } from './paginas/MinhaLista.tsx';

function CaixaDeBusca() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const [termo, setTermo] = useState(parametros.get('q') ?? '');
  function buscar(evento: FormEvent) {
    evento.preventDefault();
    if (termo.trim()) navegar(`/busca?q=${encodeURIComponent(termo.trim())}`);
  }
  return (
    <form onSubmit={buscar} role="search" className="relative w-full sm:w-72">
      <label htmlFor="busca" className="sr-only">
        Buscar filme
      </label>
      <Search size={17} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-suave" />
      <input
        id="busca"
        type="search"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        placeholder="Buscar filme"
        maxLength={100}
        className="h-10 w-full rounded-full border border-linha bg-superficie pr-4 pl-9 text-sm placeholder:text-suave focus:border-destaque focus:outline-none"
      />
    </form>
  );
}

function Cabecalho() {
  const lista = useMinhaLista();
  const queroVer = lista.filter((item) => item.estado === 'quero-ver').length;
  const link = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium ${isActive ? 'bg-elevada text-texto' : 'text-suave hover:text-texto'}`;
  return (
    <header className="sticky top-0 z-30 border-b border-linha bg-fundo/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link to="/" className="mr-auto inline-flex items-center gap-2 text-lg font-bold">
          <Clapperboard size={22} className="text-destaque" aria-hidden="true" />
          MoviesLib
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          <NavLink to="/" end className={link}>
            Descobrir
          </NavLink>
          <NavLink to="/minha-lista" className={link}>
            <Bookmark size={15} aria-hidden="true" />
            Minha lista
            {queroVer > 0 ? <span className="rounded-full bg-destaque px-1.5 text-xs font-bold text-sobre-destaque">{queroVer}</span> : null}
          </NavLink>
        </nav>
        <CaixaDeBusca />
      </div>
    </header>
  );
}

function Rodape() {
  return (
    <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-suave">
      <p>
        Dados de filmes do{' '}
        <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="underline">
          TMDB
        </a>
        . Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB. Informações de onde assistir
        fornecidas pelo{' '}
        <a href="https://www.justwatch.com/br" target="_blank" rel="noopener noreferrer" className="underline">
          JustWatch
        </a>
        .
      </p>
    </footer>
  );
}

// Endereços da primeira versão continuam funcionando.
function RedirecionarFilmeAntigo() {
  const { id } = useParams();
  return <Navigate to={`/filme/${id}`} replace />;
}

function RedirecionarBuscaAntiga() {
  const [parametros] = useSearchParams();
  return <Navigate to={`/busca?${parametros}`} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Cabecalho />
      <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Descobrir />} />
          <Route path="/busca" element={<Busca />} />
          <Route path="/filme/:id" element={<PaginaDoFilme />} />
          <Route path="/minha-lista" element={<MinhaLista />} />
          <Route path="/movie/:id" element={<RedirecionarFilmeAntigo />} />
          <Route path="/search" element={<RedirecionarBuscaAntiga />} />
          <Route path="*" element={<p className="py-16 text-center text-suave">Página não encontrada.</p>} />
        </Routes>
      </main>
      <Rodape />
    </BrowserRouter>
  );
}
