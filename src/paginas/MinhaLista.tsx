import { Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Aviso, Grade } from '../componentes/comuns.tsx';
import { useMinhaLista, type Estado } from '../minhaLista.ts';

export function MinhaLista() {
  const lista = useMinhaLista();
  const [aba, setAba] = useState<Estado>('quero-ver');
  const itens = lista.filter((item) => item.estado === aba);
  const vistos = lista.filter((item) => item.estado === 'ja-vi');
  const notas = vistos.map((item) => item.minhaNota).filter((n): n is number => n !== null);
  const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;

  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">Minha lista</h1>
      <p className="mt-1 text-sm text-suave">
        Fica guardada neste navegador.
        {vistos.length ? ` ${vistos.length} ${vistos.length === 1 ? 'filme visto' : 'filmes vistos'}` : ''}
        {media !== null ? `, nota média ${media.toFixed(1).replace('.', ',')}.` : vistos.length ? '.' : ''}
      </p>
      <div role="tablist" aria-label="Listas" className="mt-4 flex gap-2">
        {(
          [
            { id: 'quero-ver', nome: 'Quero ver' },
            { id: 'ja-vi', nome: 'Já vi' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={aba === item.id}
            onClick={() => setAba(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${aba === item.id ? 'bg-destaque text-sobre-destaque' : 'bg-superficie text-suave hover:text-texto'}`}
          >
            {item.nome} ({lista.filter((i) => i.estado === item.id).length})
          </button>
        ))}
      </div>
      <div className="mt-6">
        {itens.length === 0 ? (
          <Aviso
            texto={
              aba === 'quero-ver'
                ? 'Nada aqui ainda. Toque no marcador de um filme para guardar para depois.'
                : 'Marque "Já vi" na página de um filme para dar sua nota.'
            }
          />
        ) : (
          <>
            <Grade filmes={itens} />
            {aba === 'ja-vi' ? (
              <ul className="mt-6 space-y-1 text-sm text-suave">
                {itens
                  .filter((item) => item.minhaNota)
                  .map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <Link to={`/filme/${item.id}`} className="text-texto hover:underline">
                        {item.title}
                      </Link>
                      <span className="inline-flex items-center gap-0.5 text-destaque" aria-label={`Minha nota: ${item.minhaNota} de 5`}>
                        {Array.from({ length: item.minhaNota ?? 0 }, (_, i) => (
                          <Star key={i} size={12} fill="currentColor" aria-hidden="true" />
                        ))}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
