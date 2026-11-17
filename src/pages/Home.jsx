import { useEffect, useState } from 'react';
import MovieCard from '../components/MovieCard';
import { consultar } from '../servicos/filmes';

import './MoviesGrid.css';

export default function Home() {
  const [estado, setEstado] = useState({ tipo: 'carregando' });

  useEffect(() => {
    let ignorar = false;
    consultar({ lista: 'melhores' }).then((proximo) => {
      if (!ignorar) setEstado(proximo);
    });
    return () => {
      ignorar = true;
    };
  }, []);

  return (
    <div className="container">
      <h1 className="title">Melhores filmes</h1>
      {estado.tipo === 'carregando' && <p role="status" className="mensagem">Carregando...</p>}
      {estado.tipo === 'erro' && <p role="alert" className="mensagem">{estado.mensagem}</p>}
      {estado.tipo === 'ok' && (
        <div className="movies-container">
          {estado.filmes.map((filme) => (
            <MovieCard key={filme.id} movie={filme} />
          ))}
        </div>
      )}
    </div>
  );
}
