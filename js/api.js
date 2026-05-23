const WeGamesAPI = (() => {
  const API_URL = "https://www.cheapshark.com/api/1.0/deals";
  const PAGE_SIZE = 60;

  async function buscarJogos({ pagina = 0, termo = "", signal } = {}) {
    const parametros = new URLSearchParams({
      pageNumber: String(pagina),
      pageSize: String(PAGE_SIZE),
      sortBy: "Savings",
    });

    if (termo) {
      parametros.set("title", termo);
    }

    const resposta = await fetch(`${API_URL}?${parametros}`, { signal });

    if (!resposta.ok) {
      throw new Error(`Erro ${resposta.status} ao buscar ofertas.`);
    }

    const dados = await resposta.json();
    const produtos = Array.isArray(dados) ? dados : [];

    return {
      produtos,
      chegouAoFim: produtos.length < PAGE_SIZE,
    };
  }

  return {
    buscarJogos,
  };
})();
