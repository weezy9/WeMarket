const WeMarketStorage = (() => {
  const FAVORITES_KEY = "wemarket:favoritos";
  const LEGACY_FAVORITES_KEYS = ["wegames:favoritos", "favoritos"];

  function carregarFavoritos() {
    try {
      const favoritosSalvos = localStorage.getItem(FAVORITES_KEY)
        || LEGACY_FAVORITES_KEYS.map((chave) => localStorage.getItem(chave)).find(Boolean);
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
