import { Outlet } from 'react-router';
import Navbar from './components/Navbar';

import './App.css';

export default function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="rodape">
        Dados de filmes: <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB</a>.
        Este projeto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
      </footer>
    </div>
  );
}
