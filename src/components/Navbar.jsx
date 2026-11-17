import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BiCameraMovie, BiSearchAlt2 } from 'react-icons/bi';

import './Navbar.css';

export default function Navbar() {
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();
  const idCampo = useId();

  function enviar(event) {
    event.preventDefault();
    const termo = busca.trim();
    if (!termo) return;
    navigate(`/search?${new URLSearchParams({ q: termo })}`);
    setBusca('');
  }

  return (
    <nav id="navbar">
      <h2>
        <Link to="/">
          <BiCameraMovie aria-hidden="true" /> MoviesLib
        </Link>
      </h2>
      <form onSubmit={enviar} role="search">
        <label htmlFor={idCampo} className="sr-only">
          Buscar filme
        </label>
        <input
          id={idCampo}
          type="text"
          placeholder="Busque um filme"
          onChange={(event) => setBusca(event.target.value)}
          value={busca}
        />
        <button type="submit" aria-label="Buscar">
          <BiSearchAlt2 aria-hidden="true" />
        </button>
      </form>
    </nav>
  );
}
