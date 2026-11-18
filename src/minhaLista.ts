import { useSyncExternalStore } from 'react';
import type { Resumo } from './api.ts';

/*
 * "Quero ver" e "Já vi", guardados no navegador. Só os campos do cartão ficam salvos, e
 * tudo que vem do armazenamento é conferido antes de usar: o localStorage pode ter sido
 * editado à mão ou vir de uma versão antiga do site.
 */

export type Estado = 'quero-ver' | 'ja-vi';

export interface ItemDaLista extends Resumo {
  estado: Estado;
  /** Minha nota, de 1 a 5, só para "Já vi". */
  minhaNota: number | null;
  atualizadoEm: string;
}

const CHAVE = 'movieslib:minha-lista:v1';
const ouvintes = new Set<() => void>();
let cache: ItemDaLista[] | null = null;

function valido(item: unknown): item is ItemDaLista {
  if (typeof item !== 'object' || item === null) return false;
  const i = item as Record<string, unknown>;
  return (
    Number.isInteger(i.id) &&
    typeof i.title === 'string' &&
    (i.poster_path === null || typeof i.poster_path === 'string') &&
    typeof i.vote_average === 'number' &&
    (i.release_date === null || typeof i.release_date === 'string') &&
    (i.estado === 'quero-ver' || i.estado === 'ja-vi') &&
    (i.minhaNota === null || (Number.isInteger(i.minhaNota) && (i.minhaNota as number) >= 1 && (i.minhaNota as number) <= 5)) &&
    typeof i.atualizadoEm === 'string'
  );
}

export function lerLista(texto: string | null): ItemDaLista[] {
  try {
    const bruto: unknown = texto ? JSON.parse(texto) : [];
    return Array.isArray(bruto) ? bruto.filter(valido).slice(0, 1000) : [];
  } catch {
    return [];
  }
}

function carregar(): ItemDaLista[] {
  if (cache) return cache;
  try {
    cache = lerLista(localStorage.getItem(CHAVE));
  } catch {
    cache = [];
  }
  return cache;
}

function salvar(lista: ItemDaLista[]) {
  cache = lista;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    // Sem armazenamento, a lista vale só até fechar a aba.
  }
  ouvintes.forEach((ouvir) => ouvir());
}

/** Coloca o filme na lista com o estado escolhido; o mesmo estado de novo tira da lista. */
export function marcar(filme: Resumo, estado: Estado) {
  const lista = carregar();
  const atual = lista.find((item) => item.id === filme.id);
  if (atual?.estado === estado) {
    salvar(lista.filter((item) => item.id !== filme.id));
    return;
  }
  const { id, title, poster_path, vote_average, release_date } = filme;
  const novo: ItemDaLista = {
    id,
    title,
    poster_path,
    vote_average,
    release_date,
    estado,
    minhaNota: estado === 'ja-vi' ? (atual?.minhaNota ?? null) : null,
    atualizadoEm: new Date().toISOString(),
  };
  salvar([novo, ...lista.filter((item) => item.id !== filme.id)]);
}

export function darNota(id: number, valor: number) {
  salvar(carregar().map((item) => (item.id === id ? { ...item, estado: 'ja-vi' as const, minhaNota: valor } : item)));
}

function assinar(ouvir: () => void) {
  ouvintes.add(ouvir);
  // Mudança feita em outra aba do mesmo site.
  const aoMudar = (evento: StorageEvent) => {
    if (evento.key === CHAVE) {
      cache = null;
      ouvir();
    }
  };
  window.addEventListener('storage', aoMudar);
  return () => {
    ouvintes.delete(ouvir);
    window.removeEventListener('storage', aoMudar);
  };
}

export function useMinhaLista(): ItemDaLista[] {
  return useSyncExternalStore(assinar, carregar, () => []);
}
