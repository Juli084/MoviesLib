import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import MovieCard from '../components/MovieCard';
import { consultar } from '../servicos/filmes';

import './MoviesGrid.css';

export default function Search() {
  const [searchParams] = useSearchParams();
  const busca = searchParams.get('q') ?? '';
  const [resultado, setResultado] = useState({ busca: null });

  useEffect(() => {
    if (!busca) return undefined;
    let ignorar = false;
    consultar({ busca }).then((proximo) => {
      if (!ignorar) setResultado({ busca, ...proximo });
    });
    return () => {
      ignorar = true;
    };
  }, [busca]);

  // Enquanto a resposta da busca atual não chega, a tela mostra "carregando".
  const estado = resultado.busca === busca ? resultado : { tipo: 'carregando' };

  return (
    <div className="container">
      <h1 className="title">
        Resultados para: <span className="query-text">{busca}</span>
      </h1>
      {!busca && <p className="mensagem">Digite o nome de um filme na busca.</p>}
      {busca && estado.tipo === 'carregando' && <p role="status" className="mensagem">Buscando...</p>}
      {busca && estado.tipo === 'erro' && <p role="alert" className="mensagem">{estado.mensagem}</p>}
      {busca && estado.tipo === 'ok' && estado.filmes.length === 0 && (
        <p className="mensagem">Nenhum filme encontrado.</p>
      )}
      {busca && estado.tipo === 'ok' && estado.filmes.length > 0 && (
        <div className="movies-container">
          {estado.filmes.map((filme) => (
            <MovieCard key={filme.id} movie={filme} />
          ))}
        </div>
      )}
    </div>
  );
}
