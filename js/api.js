// ================================================
//  api.js — Consumo da FreeToGame API
//  https://www.freetogame.com/api
// ================================================

const API_BASE = 'https://www.freetogame.com/api';

/**
 * Busca todos os jogos disponíveis
 * @returns {Promise<Array>}
 */
async function carregarJogos() {
  const response = await fetch(`${API_BASE}/games`);
  if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
  return await response.json();
}

/**
 * Extrai gêneros únicos dos jogos
 * @param {Array} jogos
 * @returns {Array<string>}
 */
function extrairGeneros(jogos) {
  const generos = jogos.map(j => j.genre);
  return [...new Set(generos)].sort();
}

/**
 * Filtra jogos por termo de busca (título)
 * @param {Array} jogos
 * @param {string} termo
 * @returns {Array}
 */
function buscarJogos(jogos, termo) {
  const t = termo.toLowerCase().trim();
  return jogos.filter(j => j.title.toLowerCase().includes(t));
}

/**
 * Filtra jogos por gênero
 * @param {Array} jogos
 * @param {string} genero
 * @returns {Array}
 */
function filtrarPorGenero(jogos, genero) {
  return jogos.filter(j => j.genre === genero);
}

/**
 * Filtra jogos por plataforma
 * @param {Array} jogos
 * @param {string} plataforma
 * @returns {Array}
 */
function filtrarPorPlataforma(jogos, plataforma) {
  return jogos.filter(j =>
    j.platform.toLowerCase().includes(plataforma.toLowerCase())
  );
}