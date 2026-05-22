// js/storage.js

const STORAGE_KEY = "wegames_favorites";

/**
 * Recupera os itens favoritados do localStorage
 */
function obterFavoritos() {
    const favs = localStorage.getItem(STORAGE_KEY);
    return favs ? JSON.parse(favs) : [];
}

/**
 * Salva ou remove um jogo do array de favoritos no localStorage
 */
function alternarFavorito(jogo) {
    let favoritos = obterFavoritos();
    // Verifica se o jogo já está nos favoritos pelo ID da Oferta (dealID)
    const index = favoritos.findIndex(item => item.dealID === jogo.dealID);

    if (index === -1) {
        // Se não existir, adiciona
        favoritos.push(jogo);
    } else {
        // Se existir, remove
        favoritos.splice(index, 1);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritos));
}

/**
 * Verifica se um jogo específico está favoritado
 */
function estaFavoritado(dealID) {
    const favoritos = obterFavoritos();
    return favoritos.some(item => item.dealID === dealID);
}