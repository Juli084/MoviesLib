import { Link } from 'react-router';
import { FaStar } from 'react-icons/fa';
import { POSTER } from '../servicos/filmes';

export default function MovieCard({ movie, showLink = true }) {
  return (
    <div className="movie-card">
      {movie.poster_path ? (
        <img src={POSTER + movie.poster_path} alt={`Pôster de ${movie.title}`} loading="lazy" />
      ) : (
        <div className="sem-poster">Sem pôster</div>
      )}
      <h2>{movie.title}</h2>
      <p>
        <FaStar aria-hidden="true" /> {movie.vote_average?.toFixed(1) ?? '-'}
      </p>
      {showLink && <Link to={`/movie/${movie.id}`}>Detalhes</Link>}
    </div>
  );
}
