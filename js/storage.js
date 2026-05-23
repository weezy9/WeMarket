const WeGamesStorage = (() => {
  const FAVORITES_KEY = "wegames:favoritos";
  const LEGACY_FAVORITES_KEY = "favoritos";

  function carregarFavoritos() {
    try {
      const favoritosSalvos = localStorage.getItem(FAVORITES_KEY) || localStorage.getItem(LEGACY_FAVORITES_KEY);
      const dados = JSON.parse(favoritosSalvos);

      return Array.isArray(dados) ? dados : [];
    } catch {
      return [];
    }
  }

  function salvarFavoritos(favoritos) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritos));
  }

  return {
    carregarFavoritos,
    salvarFavoritos,
  };
})();
