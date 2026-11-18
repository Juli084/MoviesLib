import { describe, expect, it } from 'vitest';
import { ano, duracao, nota } from '../src/api.ts';
import { lerLista } from '../src/minhaLista.ts';

describe('formatos', () => {
  it('mostra ano, nota com vírgula e duração em horas', () => {
    expect(ano('1994-09-23')).toBe('1994');
    expect(ano(null)).toBe('');
    expect(nota(8.66)).toBe('8,7');
    expect(nota(0)).toBe('–');
    expect(duracao(142)).toBe('2 h 22 min');
    expect(duracao(45)).toBe('45 min');
    expect(duracao(null)).toBe('');
  });
});

describe('lista guardada no navegador', () => {
  const valido = {
    id: 278,
    title: 'Um Sonho de Liberdade',
    poster_path: '/p.jpg',
    vote_average: 8.7,
    release_date: '1994-09-23',
    estado: 'ja-vi',
    minhaNota: 5,
    atualizadoEm: '2026-11-18T12:00:00.000Z',
  };

  it('aceita itens no formato certo', () => {
    expect(lerLista(JSON.stringify([valido]))).toEqual([valido]);
  });

  it('descarta itens adulterados e conteúdo que não é lista', () => {
    const lixo = [
      { ...valido, id: '278' },
      { ...valido, estado: 'favorito' },
      { ...valido, minhaNota: 9 },
      { ...valido, title: { $gt: '' } },
      null,
      'texto',
    ];
    expect(lerLista(JSON.stringify(lixo))).toEqual([]);
    expect(lerLista('{"a":1}')).toEqual([]);
    expect(lerLista('não é json')).toEqual([]);
    expect(lerLista(null)).toEqual([]);
  });
});
