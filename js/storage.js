// ================================================
//  storage.js — Persistência de favoritos
//  Usa localStorage para salvar entre sessões
// ================================================

const STORAGE_KEY = 'wegames_favoritos';

/** Retorna array de IDs favoritados */
function getFavoritos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/** Verifica se um jogo está favoritado */
function isFavoritado(id) {
  return getFavoritos().includes(Number(id));
}

/**
 * Alterna favorito de um jogo
 * @returns {boolean} true = favoritou | false = desfavoritou
 */
function toggleFavorito(id) {
  let favs = getFavoritos();
  id = Number(id);
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    return false;
  } else {
    favs.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    return true;
  }
}

/** Retorna apenas os jogos favoritados */
function getJogosFavoritados(jogos) {
  const favs = getFavoritos();
  return jogos.filter(j => favs.includes(Number(j.id)));
}

/** Quantidade atual de favoritos */
function totalFavoritos() {
  return getFavoritos().length;
}