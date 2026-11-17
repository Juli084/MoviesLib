import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { BsGraphUp, BsWallet2, BsHourglassSplit, BsFillFileEarmarkTextFill } from 'react-icons/bs';
import MovieCard from '../components/MovieCard';
import { consultar } from '../servicos/filmes';

import './Movie.css';

const dolar = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' });
const valor = (numero) => (numero > 0 ? dolar.format(numero) : 'Não informado');

export default function Movie() {
  const { id } = useParams();
  const [resultado, setResultado] = useState({ id: null });

  // Depende do id: abrir outro filme recarrega os dados.
  useEffect(() => {
    let ignorar = false;
    consultar({ id }).then((proximo) => {
      if (!ignorar) setResultado({ id, ...proximo });
    });
    return () => {
      ignorar = true;
    };
  }, [id]);

  const estado = resultado.id === id ? resultado : { tipo: 'carregando' };

  if (estado.tipo === 'carregando') return <p role="status" className="mensagem">Carregando...</p>;
  if (estado.tipo === 'erro') return <p role="alert" className="mensagem">{estado.mensagem}</p>;

  const { filme } = estado;
  return (
    <div className="movie-page">
      <MovieCard movie={filme} showLink={false} />
      {filme.tagline && <p className="tagline">{filme.tagline}</p>}
      <div className="info">
        <h3>
          <BsWallet2 aria-hidden="true" /> Orçamento:
        </h3>
        <p>{valor(filme.budget)}</p>
      </div>
      <div className="info">
        <h3>
          <BsGraphUp aria-hidden="true" /> Receita:
        </h3>
        <p>{valor(filme.revenue)}</p>
      </div>
      <div className="info">
        <h3>
          <BsHourglassSplit aria-hidden="true" /> Duração:
        </h3>
        <p>{filme.runtime ? `${filme.runtime} minutos` : 'Não informada'}</p>
      </div>
      <div className="info description">
        <h3>
          <BsFillFileEarmarkTextFill aria-hidden="true" /> Descrição:
        </h3>
        <p>{filme.overview || 'Sem descrição em português.'}</p>
      </div>
    </div>
  );
}
