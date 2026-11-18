import { expect, test, type Page } from '@playwright/test';

const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

const resumo = (id: number, title: string, vote_average = 7.5, release_date = '2024-03-01') => ({
  id,
  title,
  poster_path: `/p${id}.jpg`,
  vote_average,
  release_date,
});

const FILME = {
  ...resumo(278, 'Um Sonho de Liberdade', 8.7, '1994-09-23'),
  original_title: 'The Shawshank Redemption',
  backdrop_path: '/fundo.jpg',
  vote_count: 28000,
  tagline: 'Medo pode prender você.',
  overview: 'Dois presos criam uma amizade ao longo dos anos.',
  runtime: 142,
  generos: [{ id: 18, nome: 'Drama' }],
  classificacao: '14',
  direcao: ['Frank Darabont'],
  elenco: [{ id: 504, nome: 'Tim Robbins', personagem: 'Andy Dufresne', foto: '/t.jpg' }],
  trailer: { chave: 'abc123', nome: 'Trailer' },
  ondeAssistir: {
    link: 'https://www.themoviedb.org/movie/278/watch?locale=BR',
    assinatura: [{ id: 8, nome: 'Serviço A', logo: '/a.jpg' }],
    aluguel: [],
    compra: [{ id: 2, nome: 'Loja B', logo: '/b.jpg' }],
  },
  semelhantes: [resumo(680, 'Pulp Fiction', 8.5, '1994-09-10')],
};

/** Simula a função /api/filmes e as imagens do TMDB, e registra as consultas feitas. */
async function simular(page: Page) {
  const consultas: URLSearchParams[] = [];
  await page.route('https://image.tmdb.org/**', (rota) => rota.fulfill({ contentType: 'image/png', body: PNG_1X1 }));
  await page.route('**/api/filmes?**', (rota) => {
    const p = new URL(rota.request().url()).searchParams;
    consultas.push(p);
    const pagina = Number(p.get('pagina') ?? '1');
    if (p.get('lista') === 'generos') return rota.fulfill({ json: { generos: [{ id: 18, nome: 'Drama' }, { id: 35, nome: 'Comédia' }] } });
    if (p.get('lista') === 'servicos') return rota.fulfill({ json: { servicos: [{ id: 8, nome: 'Serviço A', logo: '/a.jpg' }] } });
    if (p.get('id') === '278') return rota.fulfill({ json: { filme: FILME } });
    if (p.get('id')) return rota.fulfill({ status: 404, json: { erro: 'Filme não encontrado.' } });
    if (p.get('busca') === 'nada') return rota.fulfill({ json: { filmes: [], pagina: 1, totalPaginas: 1 } });
    const base = p.get('lista') === 'em-cartaz' ? 100 : p.get('busca') ? 300 : 500;
    const filmes = Array.from({ length: 4 }, (_, i) => resumo(base + (pagina - 1) * 10 + i, `Filme ${base + (pagina - 1) * 10 + i}`));
    if (p.get('lista') === 'em-cartaz' && pagina === 1) filmes[0] = resumo(278, 'Um Sonho de Liberdade', 8.7, '1994-09-23');
    return rota.fulfill({ json: { filmes, pagina, totalPaginas: 2 } });
  });
  return consultas;
}

test('descobre, carrega mais e filtra no Explorar', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  page.on('console', (mensagem) => {
    if (mensagem.type() === 'error') erros.push(mensagem.text());
  });
  const consultas = await simular(page);

  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Um Sonho de Liberdade, 1994' })).toBeVisible();
  await page.getByRole('button', { name: 'Carregar mais' }).click();
  await expect(page.getByRole('link', { name: /^Filme 110/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Carregar mais' })).toHaveCount(0);

  await page.getByRole('tab', { name: 'Explorar' }).click();
  await page.getByLabel('Gênero').selectOption({ label: 'Drama' });
  await page.getByLabel('Ordenar por').selectOption('nota');
  await page.getByRole('button', { name: 'Serviço A' }).click();
  await expect(page).toHaveURL(/aba=explorar/);
  await expect.poll(() => consultas.some((p) => p.get('descobrir') && p.get('genero') === '18' && p.get('ordem') === 'nota' && p.get('servico') === '8')).toBe(true);

  // Os filtros ficam no endereço: recarregar mantém a mesma busca.
  await page.reload();
  await expect(page.getByLabel('Gênero')).toHaveValue('18');
  expect(erros).toEqual([]);
});

test('mostra onde assistir, elenco e trailer, e guarda na minha lista', async ({ page }) => {
  await simular(page);
  await page.goto('/filme/278');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Um Sonho de Liberdade');
  await expect(page.getByText('14 anos')).toBeVisible();
  await expect(page.getByText('2 h 22 min')).toBeVisible();
  await expect(page.getByText('Direção:')).toBeVisible();
  const onde = page.getByRole('region', { name: 'Onde assistir no Brasil' });
  await expect(onde.getByText('Serviço A')).toBeVisible();
  await expect(onde.getByText('Para comprar')).toBeVisible();
  await expect(onde.getByText('Fonte: JustWatch.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver trailer' })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=abc123');
  await expect(page.getByText('Tim Robbins')).toBeVisible();

  await page.getByRole('button', { name: 'Já vi', exact: true }).click();
  await page.getByRole('radio', { name: '4 de 5' }).click();
  await page.goto('/minha-lista');
  await page.getByRole('tab', { name: /Já vi \(1\)/ }).click();
  await expect(page.getByLabel('Minha nota: 4 de 5')).toBeVisible();
  await expect(page.getByText(/1 filme visto, nota média 4,0/)).toBeVisible();
});

test('busca, avisa quando não acha e mantém os endereços antigos', async ({ page }) => {
  await simular(page);
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar filme' }).fill('matrix');
  await page.getByRole('searchbox', { name: 'Buscar filme' }).press('Enter');
  await expect(page.getByRole('heading', { name: 'Resultados para "matrix"' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Filme 300/ })).toBeVisible();

  await page.goto('/busca?q=nada');
  await expect(page.getByText(/Nenhum filme encontrado/)).toBeVisible();

  await page.goto('/movie/278');
  await expect(page).toHaveURL(/\/filme\/278$/);
  await page.goto('/filme/999');
  await expect(page.getByRole('alert')).toHaveText('Filme não encontrado.');
});

test('marcador do cartão leva o filme para "Quero ver"', async ({ page }) => {
  await simular(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Adicionar Um Sonho de Liberdade a "Quero ver"' }).click();
  await expect(page.getByRole('link', { name: /Minha lista/ })).toContainText('1');
  await page.getByRole('link', { name: /Minha lista/ }).click();
  await expect(page.getByRole('link', { name: 'Um Sonho de Liberdade, 1994' })).toBeVisible();
  const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(sobra).toBeLessThanOrEqual(0);
});
