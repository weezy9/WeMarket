const WeMarketAPI = (() => {
  const API_URL = "https://dummyjson.com/products";
  const PAGE_SIZE = 30;

  async function buscarProdutos({ skip = 0, termo = "", categoria = "", signal } = {}) {
    const usandoBusca = Boolean(termo);
    const usandoCategoria = Boolean(categoria && categoria !== "todos");
    const endpoint = usandoBusca
      ? `${API_URL}/search`
      : usandoCategoria ? `${API_URL}/category/${encodeURIComponent(categoria)}` : API_URL;
    const parametros = new URLSearchParams({
      limit: String(PAGE_SIZE),
      skip: String(skip),
    });

    if (usandoBusca) {
      parametros.set("q", termo);
    }

    const resposta = await fetch(`${endpoint}?${parametros}`, { signal });

    if (!resposta.ok) {
      throw new Error(`Error ${resposta.status} while fetching products.`);
    }

    const dados = await resposta.json();
    const produtos = Array.isArray(dados.products) ? dados.products : [];
    const total = Number(dados.total) || produtos.length;
    const proximoSkip = skip + produtos.length;

    return {
      produtos,
      total,
      skip: proximoSkip,
      chegouAoFim: proximoSkip >= total || produtos.length === 0,
    };
  }

  async function buscarCategorias({ signal } = {}) {
    const resposta = await fetch(`${API_URL}/categories`, { signal });

    if (!resposta.ok) {
      throw new Error(`Error ${resposta.status} while fetching categories.`);
    }

    const dados = await resposta.json();

    return Array.isArray(dados) ? dados : [];
  }

  async function buscarTotalCategoria(categoria, { signal } = {}) {
    const parametros = new URLSearchParams({
      limit: "1",
      skip: "0",
    });
    const resposta = await fetch(`${API_URL}/category/${encodeURIComponent(categoria)}?${parametros}`, { signal });

    if (!resposta.ok) {
      throw new Error(`Error ${resposta.status} while fetching the category total.`);
    }

    const dados = await resposta.json();

    return Number(dados.total) || 0;
  }

  return {
    buscarProdutos,
    buscarCategorias,
    buscarTotalCategoria,
  };
})();
