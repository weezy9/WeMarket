const SEARCH_DEBOUNCE_MS = 350;

const listaProdutos = document.getElementById("listaProdutos");
const listaFavoritos = document.getElementById("listaFavoritos");
const statusProdutos = document.getElementById("statusProdutos");
const contadorProdutos = document.getElementById("contadorProdutos");
const contadorFavoritos = document.getElementById("contadorFavoritos");
const carregarMais = document.getElementById("carregarMais");
const botaoVoltarTopo = document.getElementById("scrollTopButton");
const botaoSidebar = document.getElementById("sidebarToggle");
const busca = document.getElementById("busca");
const formularioBusca = document.querySelector(".search-form");
const linksMenu = document.querySelectorAll(".menu a[href^='#']");
const menuCategorias = document.getElementById("menuCategorias");
const carrosselHero = document.getElementById("heroCarousel");
const heroIndicators = document.getElementById("heroIndicators");
const heroSlides = document.getElementById("heroSlides");
const secoesMenu = [...linksMenu]
  .map((link) => ({
    hash: link.getAttribute("href"),
    elemento: document.querySelector(link.getAttribute("href")),
  }))
  .filter((secao) => secao.elemento);
const detalheModal = document.getElementById("gameDetailModal");
const detalheBackdrop = document.getElementById("gameDetailBackdrop");
const detalheImagem = document.getElementById("gameDetailImage");
const detalheDesconto = document.getElementById("gameDetailDiscount");
const detalheCategoria = document.getElementById("gameDetailStore");
const detalheTitulo = document.getElementById("gameDetailTitle");
const detalheSubtitulo = document.getElementById("gameDetailSubtitle");
const detalhePreco = document.getElementById("gameDetailPrice");
const detalhePrecoAntigo = document.getElementById("gameDetailOldPrice");
const detalheMarca = document.getElementById("productDetailBrand");
const detalheEstoque = document.getElementById("productDetailStock");
const detalheAvaliacao = document.getElementById("productDetailRating");
const detalheStatus = document.getElementById("productDetailStatus");
const detalheFavorito = document.getElementById("gameDetailFavorite");
const detalheApi = document.getElementById("gameDetailDeal");
const perfilToggle = document.getElementById("profileToggle");
const perfilAvatar = document.getElementById("profileAvatar");
const perfilMenuAvatar = document.getElementById("profileMenuAvatar");
const perfilNome = document.getElementById("profileName");
const perfilMenuNome = document.getElementById("profileMenuName");
const perfilStatusDot = document.getElementById("profileStatusDot");
const perfilStatusText = document.getElementById("profileStatusText");
const perfilSair = document.getElementById("profileLogout");
const perfilToast = document.getElementById("profileToast");
const perfilToastBody = document.getElementById("profileToastBody");

let produtos = [];
let produtosGerais = [];
let resultadosBusca = [];
let produtosPorCategoria = new Map();
let favoritos = mesclarProdutosUnicos([], WeMarketStorage.carregarFavoritos().filter(produtoValido));
let categoriasProdutos = [];
let totaisCategorias = new Map();
let totalGeral = 0;
let totalBusca = 0;
let skipGeral = 0;
let skipBusca = 0;
let termoBuscaAtual = "";
let temporizadorBusca = null;
let carregandoProdutos = false;
let chegouAoFimGeral = false;
let chegouAoFimBusca = true;
let requisicaoAtual = 0;
let controladorProdutos = null;
let produtoEmDetalhe = null;
let modalDetalhe = null;
let menuScrollPendente = false;
let menuTravadoHash = "";
let temporizadorMenuTravado = null;
let categoriaAtual = "todos";
let perfilLogado = true;
let carrosselIds = "";

const formatadorMoeda = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const metadadosCategorias = new Map([
  ["beauty", { icone: "bi-stars" }],
  ["fragrances", { icone: "bi-flower1" }],
  ["furniture", { icone: "bi-house" }],
  ["groceries", { icone: "bi-basket" }],
  ["home-decoration", { icone: "bi-lamp" }],
  ["kitchen-accessories", { icone: "bi-cup-hot" }],
  ["laptops", { icone: "bi-laptop" }],
  ["mens-shirts", { icone: "bi-person-standing" }],
  ["mens-shoes", { icone: "bi-backpack" }],
  ["mens-watches", { icone: "bi-watch" }],
  ["mobile-accessories", { icone: "bi-phone" }],
  ["motorcycle", { icone: "bi-bicycle" }],
  ["skin-care", { icone: "bi-droplet" }],
  ["smartphones", { icone: "bi-phone-fill" }],
  ["sports-accessories", { icone: "bi-trophy" }],
  ["sunglasses", { icone: "bi-sunglasses" }],
  ["tablets", { icone: "bi-tablet" }],
  ["tops", { icone: "bi-person" }],
  ["vehicle", { icone: "bi-car-front" }],
  ["womens-bags", { icone: "bi-bag" }],
  ["womens-dresses", { icone: "bi-person-standing-dress" }],
  ["womens-jewellery", { icone: "bi-gem" }],
  ["womens-shoes", { icone: "bi-backpack2" }],
  ["womens-watches", { icone: "bi-watch" }],
]);

categoriasProdutos = categoriasIniciais();

function categoriasIniciais() {
  return [
    { id: "todos", nome: "All", icone: "bi-grid-3x3-gap" },
    ...[...metadadosCategorias.entries()].map(([id, dados]) => ({
      id,
      nome: formatarSlugCategoria(id),
      icone: dados.icone,
    })),
  ];
}

function produtoValido(produto) {
  return produto && produto.id !== undefined && typeof produto.title === "string";
}

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatarSlugCategoria(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

function normalizarCategoriaApi(categoria) {
  const id = typeof categoria === "string" ? categoria : categoria.slug;
  const nomeApi = typeof categoria === "string" ? "" : categoria.name;
  const metadados = metadadosCategorias.get(id);

  return {
    id,
    nome: nomeApi || formatarSlugCategoria(id),
    icone: metadados?.icone || "bi-tag",
  };
}

function categoriaDoProduto(produto) {
  return produto.category || "uncategorized";
}

function nomeCategoria(categoriaId) {
  if (categoriaId === "todos") {
    return "All";
  }

  return categoriasProdutos.find((categoria) => categoria.id === categoriaId)?.nome
    || formatarSlugCategoria(categoriaId)
    || "Category";
}

function emCategoriaSemBusca() {
  return categoriaAtual !== "todos" && !termoBuscaAtual;
}

function estadoCategoria(categoriaId) {
  if (!produtosPorCategoria.has(categoriaId)) {
    produtosPorCategoria.set(categoriaId, {
      produtos: [],
      skip: 0,
      total: 0,
      chegouAoFim: false,
    });
  }

  return produtosPorCategoria.get(categoriaId);
}

function produtosCategoriasCarregados() {
  return [...produtosPorCategoria.values()].flatMap((estado) => estado.produtos);
}

function listaVisivelAtual() {
  if (termoBuscaAtual) {
    return resultadosBusca;
  }

  if (emCategoriaSemBusca()) {
    return estadoCategoria(categoriaAtual).produtos;
  }

  return produtosGerais;
}

function mesclarProdutosUnicos(produtosAtuais, novosProdutos) {
  const mapaProdutos = new Map();

  [...produtosAtuais, ...novosProdutos].filter(produtoValido).forEach((produto) => {
    mapaProdutos.set(chaveProduto(produto), produto);
  });

  return [...mapaProdutos.values()];
}

function chaveProduto(produto) {
  return String(produto.id);
}

function precoProduto(produto) {
  const preco = Number(produto.price);
  return Number.isFinite(preco) ? preco : 0;
}

function descontoProduto(produto) {
  const desconto = Number(produto.discountPercentage);
  return Number.isFinite(desconto) ? desconto : 0;
}

function precoComDesconto(produto) {
  const preco = precoProduto(produto);
  const desconto = descontoProduto(produto);

  return temDesconto(produto) ? preco * (1 - desconto / 100) : preco;
}

function temDesconto(produto) {
  return precoProduto(produto) > 0 && descontoProduto(produto) >= 1;
}

function fontesImagemProduto(produto, tipo = "card") {
  const fontes = [];
  const imagens = Array.isArray(produto.images) ? produto.images : [];

  if (tipo === "detalhe") {
    fontes.push(...imagens);
  }

  if (produto.thumbnail) {
    fontes.push(produto.thumbnail);
  }

  fontes.push(...imagens);
  fontes.push("images/WeMarket.png");

  return [...new Set(fontes.filter(Boolean))];
}

function carregarImagemComFallback(imagem, fontes, alt, aoTrocarFonte) {
  let indiceFonte = 0;

  function aplicarFonte() {
    const fonte = fontes[indiceFonte] || "images/WeMarket.png";

    imagem.src = fonte;
    imagem.alt = alt;

    if (aoTrocarFonte) {
      aoTrocarFonte(fonte);
    }
  }

  imagem.onerror = () => {
    indiceFonte += 1;

    if (indiceFonte < fontes.length) {
      aplicarFonte();
      return;
    }

    imagem.onerror = null;
    imagem.src = "images/WeMarket.png";
    imagem.alt = "Image unavailable";
  };

  aplicarFonte();
}

async function carregarCategorias() {
  montarMenuCategorias();

  try {
    const categoriasApi = await WeMarketAPI.buscarCategorias();
    const categoriasNormalizadas = categoriasApi
      .map(normalizarCategoriaApi)
      .filter((categoria) => categoria.id);

    categoriasProdutos = [
      { id: "todos", nome: "All", icone: "bi-grid-3x3-gap" },
      ...categoriasNormalizadas,
    ];

    montarMenuCategorias();
    atualizarCategorias();
    carregarTotaisCategorias(categoriasNormalizadas);
  } catch (erro) {
    console.error(erro);
  }
}

async function carregarTotaisCategorias(categorias) {
  const resultados = await Promise.allSettled(
    categorias.map(async (categoria) => ({
      id: categoria.id,
      total: await WeMarketAPI.buscarTotalCategoria(categoria.id),
    })),
  );

  resultados.forEach((resultado) => {
    if (resultado.status !== "fulfilled") {
      console.error(resultado.reason);
      return;
    }

    totaisCategorias.set(resultado.value.id, resultado.value.total);
  });

  atualizarCategorias();
}

function montarMenuCategorias() {
  const categoriasDiretas = categoriasProdutos.slice(0, 6);
  const categoriasExtras = categoriasProdutos.slice(6);
  const fragmento = document.createDocumentFragment();

  categoriasDiretas.forEach((categoria) => {
    const item = document.createElement("li");

    item.appendChild(criarBotaoCategoria(categoria, "category-button"));
    fragmento.appendChild(item);
  });

  if (categoriasExtras.length > 0) {
    const itemMais = document.createElement("li");
    const botaoMais = document.createElement("button");
    const iconeMais = document.createElement("i");
    const textoMais = document.createElement("span");
    const menuMais = document.createElement("ul");
    const itemListaMais = document.createElement("li");
    const listaMais = document.createElement("ul");

    itemMais.className = "category-more-item dropdown";

    botaoMais.id = "maisCategoriasToggle";
    botaoMais.className = "category-button dropdown-toggle";
    botaoMais.type = "button";
    botaoMais.setAttribute("data-bs-toggle", "dropdown");
    botaoMais.setAttribute("data-bs-display", "static");
    botaoMais.setAttribute("aria-expanded", "false");

    iconeMais.className = "bi bi-plus-circle";
    iconeMais.setAttribute("aria-hidden", "true");
    textoMais.append(iconeMais, document.createTextNode("More categories"));
    botaoMais.appendChild(textoMais);

    menuMais.id = "maisCategoriasMenu";
    menuMais.className = "dropdown-menu dropdown-menu-dark category-more-menu";
    itemListaMais.className = "category-more-scroll-shell";
    listaMais.className = "category-more-scroll";

    categoriasExtras.forEach((categoria) => {
      const item = document.createElement("li");

      item.appendChild(criarBotaoCategoria(categoria, "dropdown-item"));
      listaMais.appendChild(item);
    });

    itemListaMais.appendChild(listaMais);
    menuMais.appendChild(itemListaMais);
    itemMais.append(botaoMais, menuMais);
    fragmento.appendChild(itemMais);
  }

  menuCategorias.replaceChildren(fragmento);
}

function criarBotaoCategoria(categoria, classe) {
  const botao = document.createElement("button");
  const texto = document.createElement("span");
  const icone = document.createElement("i");
  const contador = document.createElement("small");

  botao.className = classe;
  botao.type = "button";
  botao.dataset.category = categoria.id;
  botao.setAttribute("aria-pressed", "false");

  icone.className = `bi ${categoria.icone || "bi-tag"}`;
  icone.setAttribute("aria-hidden", "true");
  texto.append(icone, document.createTextNode(categoria.nome));

  contador.dataset.categoryCount = "";
  contador.textContent = "0";

  botao.append(texto, contador);
  return botao;
}

function contagemCategoriaMenu(categoriaId, contagensBase) {
  if (categoriaId === "todos") {
    if (termoBuscaAtual) {
      return totalBusca || resultadosBusca.length;
    }

    return totalGeral || produtosGerais.length;
  }

  if (termoBuscaAtual) {
    return contagensBase.get(categoriaId) || 0;
  }

  const estado = produtosPorCategoria.get(categoriaId);

  if (estado?.total) {
    return estado.total;
  }

  if (totaisCategorias.has(categoriaId)) {
    return totaisCategorias.get(categoriaId);
  }

  return contagensBase.get(categoriaId) || 0;
}

async function carregarProdutos({ novaBusca = false } = {}) {
  const modoBusca = Boolean(termoBuscaAtual);
  const modoCategoria = emCategoriaSemBusca();
  const estadoAtual = modoCategoria ? estadoCategoria(categoriaAtual) : null;
  const listaModo = modoBusca ? resultadosBusca : modoCategoria ? estadoAtual.produtos : produtosGerais;
  const chegouAoFim = modoBusca ? chegouAoFimBusca : modoCategoria ? estadoAtual.chegouAoFim : chegouAoFimGeral;

  if ((!novaBusca && carregandoProdutos) || (!novaBusca && chegouAoFim)) {
    return;
  }

  if (novaBusca && listaModo.length > 0 && (modoCategoria || !modoBusca)) {
    produtos = listaVisivelAtual();
    renderProdutos(produtos);
    return;
  }

  if (controladorProdutos) {
    controladorProdutos.abort();
  }

  const idRequisicao = requisicaoAtual + 1;
  requisicaoAtual = idRequisicao;
  controladorProdutos = new AbortController();
  carregandoProdutos = true;
  atualizarBotaoCarregarMais();

  if (listaModo.length === 0) {
    definirStatus(mensagemCarregandoProdutos());
  }

  try {
    const resposta = await WeMarketAPI.buscarProdutos({
      skip: modoBusca ? skipBusca : modoCategoria ? estadoAtual.skip : skipGeral,
      termo: termoBuscaAtual,
      categoria: modoCategoria ? categoriaAtual : "",
      signal: controladorProdutos.signal,
    });
    const produtosValidos = resposta.produtos.filter(produtoValido);

    if (idRequisicao !== requisicaoAtual) {
      return;
    }

    if (modoBusca) {
      resultadosBusca = mesclarProdutosUnicos(resultadosBusca, produtosValidos);
      skipBusca = resposta.skip;
      totalBusca = resposta.total;
      chegouAoFimBusca = resposta.chegouAoFim;
    } else if (modoCategoria) {
      estadoAtual.produtos = mesclarProdutosUnicos(estadoAtual.produtos, produtosValidos);
      estadoAtual.skip = resposta.skip;
      estadoAtual.total = resposta.total;
      estadoAtual.chegouAoFim = resposta.chegouAoFim;
    } else {
      produtosGerais = mesclarProdutosUnicos(produtosGerais, produtosValidos);
      skipGeral = resposta.skip;
      totalGeral = resposta.total;
      chegouAoFimGeral = resposta.chegouAoFim;
      renderCarrosselDestaques(produtosGerais);
    }

    produtos = listaVisivelAtual();
    renderProdutos(produtos);
    renderFavoritos();
  } catch (erro) {
    if (erro.name === "AbortError") {
      return;
    }

    definirStatus(
      listaModo.length === 0
        ? "Unable to load products. Please try again later."
        : "Unable to load more products right now. Please try again shortly.",
      true,
    );
    console.error(erro);
  } finally {
    if (idRequisicao === requisicaoAtual) {
      carregandoProdutos = false;
      controladorProdutos = null;
      atualizarBotaoCarregarMais();
    }
  }
}

function mensagemCarregandoProdutos() {
  if (termoBuscaAtual) {
    return `Searching for "${termoBuscaAtual}"...`;
  }

  if (emCategoriaSemBusca()) {
    return `Loading products from ${nomeCategoria(categoriaAtual)}...`;
  }

  return "Loading products...";
}

function definirStatus(mensagem, erro = false) {
  statusProdutos.hidden = false;
  statusProdutos.textContent = mensagem;
  statusProdutos.classList.toggle("error", erro);
}

function esconderStatus() {
  statusProdutos.hidden = true;
  statusProdutos.textContent = "";
  statusProdutos.classList.remove("error");
}

function limparElemento(elemento) {
  elemento.replaceChildren();
}

function renderProdutos(lista) {
  limparElemento(listaProdutos);
  atualizarCategorias();

  contadorProdutos.textContent = formatarContadorProdutos(lista.length);

  if (lista.length === 0) {
    definirStatus(mensagemProdutosVazios());
    atualizarBotaoCarregarMais();
    atualizarMenuPorScroll();
    return;
  }

  esconderStatus();

  const fragmento = document.createDocumentFragment();

  lista.forEach((produto) => {
    fragmento.appendChild(criarColunaCard(criarCardProduto(produto)));
  });

  listaProdutos.appendChild(fragmento);
  atualizarBotaoCarregarMais();
  atualizarMenuPorScroll();
}

function renderFavoritos() {
  limparElemento(listaFavoritos);
  contadorFavoritos.textContent = favoritos.length === 1 ? "1 favorite" : `${favoritos.length} favorites`;

  if (favoritos.length === 0) {
    const vazio = document.createElement("p");

    vazio.className = "empty";
    vazio.textContent = "No favorite products yet.";
    listaFavoritos.appendChild(vazio);
    atualizarMenuPorScroll();
    return;
  }

  const fragmento = document.createDocumentFragment();

  favoritos.forEach((produto) => {
    fragmento.appendChild(criarColunaCard(criarCardFavorito(produto)));
  });

  listaFavoritos.appendChild(fragmento);
  atualizarMenuPorScroll();
}

function formatarContadorBusca(total) {
  return total === 1
    ? `1 result for "${termoBuscaAtual}"`
    : `${total} results for "${termoBuscaAtual}"`;
}

function formatarQuantidade(total, singular, plural) {
  return total === 1 ? `1 ${singular}` : `${total} ${plural}`;
}

function formatarContadorProdutos(totalVisivel) {
  if (termoBuscaAtual) {
    return formatarContadorBusca(totalBusca || totalVisivel);
  }

  if (categoriaAtual !== "todos") {
    const totalCategoria = estadoCategoria(categoriaAtual).total || totalVisivel;
    return `${totalVisivel} of ${totalCategoria} products in ${nomeCategoria(categoriaAtual)}`;
  }

  return `${produtosGerais.length} of ${totalGeral || produtosGerais.length} products loaded`;
}

function mensagemProdutosVazios() {
  if (termoBuscaAtual) {
    return `No products found for "${termoBuscaAtual}".`;
  }

  if (categoriaAtual !== "todos") {
    return `No products found in ${nomeCategoria(categoriaAtual)}.`;
  }

  return "No products available right now.";
}

function atualizarCategorias() {
  const listaBase = termoBuscaAtual ? resultadosBusca : produtosGerais;
  const contagens = new Map(categoriasProdutos.map((categoria) => [categoria.id, 0]));

  listaBase.forEach((produto) => {
    const categoriaId = categoriaDoProduto(produto);

    contagens.set(categoriaId, (contagens.get(categoriaId) || 0) + 1);
  });

  menuCategorias.querySelectorAll("[data-category]").forEach((botao) => {
    const categoriaId = botao.dataset.category;
    const total = contagemCategoriaMenu(categoriaId, contagens);
    const ativo = categoriaId === categoriaAtual;
    const contador = botao.querySelector("[data-category-count]");

    botao.classList.toggle("active", ativo);
    botao.setAttribute("aria-pressed", String(ativo));

    if (contador) {
      contador.textContent = total;
    }
  });

  const botaoMaisCategorias = document.getElementById("maisCategoriasToggle");

  if (botaoMaisCategorias) {
    const ativoNoDropdown = Boolean(menuCategorias.querySelector(`#maisCategoriasMenu [data-category="${categoriaAtual}"]`));

    botaoMaisCategorias.classList.toggle("active", ativoNoDropdown);
    botaoMaisCategorias.setAttribute("aria-pressed", String(ativoNoDropdown));
  }
}

function criarColunaCard(card) {
  const coluna = document.createElement("div");

  coluna.className = "col-12 col-sm-6 col-md-4 col-xl-3";
  coluna.appendChild(card);

  return coluna;
}

function criarCardProduto(produto) {
  const favoritado = estaFavoritado(produto);
  const card = criarBaseCard(produto);
  const corpo = card.querySelector(".card-body");

  corpo.append(
    criarTitulo(produto.title),
    criarCategoriaProduto(produto),
    criarLinhaPreco(produto),
    criarAcoesProduto(produto, favoritado),
  );

  return card;
}

function criarCardFavorito(produto) {
  const card = criarBaseCard(produto);
  const corpo = card.querySelector(".card-body");
  const botaoRemover = document.createElement("button");

  botaoRemover.type = "button";
  botaoRemover.className = "btn btn-outline-danger btn-sm w-100 remove-favorite";
  botaoRemover.dataset.favoriteId = produto.id;
  botaoRemover.textContent = "Remove from favorites";

  corpo.append(criarTitulo(produto.title), criarCategoriaProduto(produto), criarLinhaPreco(produto), botaoRemover);

  return card;
}

function criarBaseCard(produto) {
  const card = document.createElement("article");
  const imagem = document.createElement("img");
  const corpo = document.createElement("div");

  card.className = "card-game";
  card.dataset.productId = produto.id;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open details for ${produto.title}`);

  imagem.className = "game-cover";
  imagem.loading = "lazy";
  imagem.decoding = "async";
  carregarImagemComFallback(imagem, fontesImagemProduto(produto), produto.title);

  corpo.className = "card-body";

  card.append(imagem, corpo);
  return card;
}

function criarTitulo(titulo) {
  const elemento = document.createElement("h3");

  elemento.className = "game-title";
  elemento.textContent = titulo;
  return elemento;
}

function criarCategoriaProduto(produto) {
  const elemento = document.createElement("span");

  elemento.className = "badge game-category";
  elemento.textContent = `Category: ${nomeCategoria(categoriaDoProduto(produto))}`;

  return elemento;
}

function criarLinhaPreco(produto) {
  const linha = document.createElement("div");
  const preco = document.createElement("span");

  linha.className = "price-row";

  preco.className = "price";
  preco.textContent = formatarPreco(precoComDesconto(produto));

  linha.append(preco);

  if (temDesconto(produto)) {
    const precoAntigo = document.createElement("span");

    precoAntigo.className = "old-price";
    precoAntigo.textContent = formatarPreco(precoProduto(produto));
    linha.appendChild(precoAntigo);
  }

  return linha;
}

function criarAcoesProduto(produto, favoritado) {
  const acoes = document.createElement("div");
  const desconto = document.createElement("span");
  const botoes = document.createElement("div");
  const detalhes = document.createElement("button");
  const favorito = document.createElement("button");

  acoes.className = "game-actions";

  if (temDesconto(produto)) {
    desconto.className = "discount";
    desconto.textContent = `-${Math.round(descontoProduto(produto))}%`;
  } else {
    desconto.className = "discount-placeholder";
    desconto.setAttribute("aria-hidden", "true");
  }

  botoes.className = "card-buttons";

  detalhes.type = "button";
  detalhes.className = "deal-link";
  detalhes.dataset.detailId = produto.id;
  detalhes.textContent = "Details";

  favorito.type = "button";
  favorito.className = `favorite${favoritado ? " active" : ""}`;
  favorito.dataset.favoriteId = produto.id;
  favorito.setAttribute("aria-pressed", String(favoritado));
  favorito.setAttribute("aria-label", favoritado ? `Remove ${produto.title} from favorites` : `Add ${produto.title} to favorites`);
  favorito.title = favoritado ? "Remove from favorites" : "Add to favorites";
  favorito.innerHTML = favoritado
    ? '<i class="bi bi-star-fill" aria-hidden="true"></i>'
    : '<i class="bi bi-star" aria-hidden="true"></i>';

  botoes.append(detalhes, favorito);
  acoes.append(desconto, botoes);

  return acoes;
}

function formatarPreco(valor) {
  return formatadorMoeda.format(Number(valor) || 0);
}

function renderCarrosselDestaques(lista) {
  const destaques = lista.filter((produto) => fontesImagemProduto(produto).length > 1).slice(0, 3);
  const ids = destaques.map((produto) => produto.id).join("-");

  if (destaques.length === 0 || ids === carrosselIds) {
    return;
  }

  carrosselIds = ids;
  heroIndicators.replaceChildren();
  heroSlides.replaceChildren();

  destaques.forEach((produto, indice) => {
    const indicador = document.createElement("button");
    const item = document.createElement("div");
    const slide = document.createElement("div");
    const conteudo = document.createElement("div");
    const badge = document.createElement("span");
    const titulo = document.createElement("h1");
    const descricao = document.createElement("p");
    const preco = document.createElement("strong");
    const botao = document.createElement("button");
    const imagem = fontesImagemProduto(produto, "detalhe")[0];

    indicador.type = "button";
    indicador.dataset.bsTarget = "#heroCarousel";
    indicador.dataset.bsSlideTo = String(indice);
    indicador.setAttribute("aria-label", `Slide ${indice + 1}`);

    if (indice === 0) {
      indicador.className = "active";
      indicador.setAttribute("aria-current", "true");
    }

    item.className = `carousel-item${indice === 0 ? " active" : ""}`;
    slide.className = "banner-slide banner-slide-contain";
    slide.dataset.productId = produto.id;
    slide.style.setProperty("--banner-image", `url("${imagem}")`);

    conteudo.className = "banner-content";
    badge.className = "badge text-bg-primary";
    badge.textContent = indice === 0 ? "Featured" : "Product";
    titulo.textContent = produto.title;
    descricao.textContent = produto.description || "Description unavailable.";
    preco.className = "banner-price";
    preco.textContent = `Only ${formatarPreco(precoComDesconto(produto))}`;
    botao.className = "btn btn-primary";
    botao.type = "button";
    botao.textContent = "View details";

    conteudo.append(badge, titulo, descricao, preco, botao);
    slide.appendChild(conteudo);
    item.appendChild(slide);
    heroIndicators.appendChild(indicador);
    heroSlides.appendChild(item);
  });

  bootstrap.Carousel.getOrCreateInstance(carrosselHero).to(0);
}

function abrirDetalheProduto(produto) {
  produtoEmDetalhe = produto;

  if (!produtoEmDetalhe) {
    return;
  }

  preencherDetalheProduto(produto);

  if (!modalDetalhe) {
    modalDetalhe = new bootstrap.Modal(detalheModal);
  }

  modalDetalhe.show();
}

function encontrarProdutoPorId(id) {
  const idProduto = String(id);

  return produtos.find((produto) => String(produto.id) === idProduto)
    || produtosGerais.find((produto) => String(produto.id) === idProduto)
    || resultadosBusca.find((produto) => String(produto.id) === idProduto)
    || produtosCategoriasCarregados().find((produto) => String(produto.id) === idProduto)
    || favoritos.find((produto) => String(produto.id) === idProduto)
    || (String(produtoEmDetalhe?.id) === idProduto ? produtoEmDetalhe : null);
}

function preencherDetalheProduto(produto) {
  const fontesImagem = fontesImagemProduto(produto, "detalhe");

  carregarImagemComFallback(detalheImagem, fontesImagem, produto.title, (fonte) => {
    detalheBackdrop.style.backgroundImage = `url("${fonte}")`;
  });

  detalheTitulo.textContent = produto.title;
  detalheSubtitulo.textContent = produto.description || "Description unavailable.";
  detalhePreco.textContent = formatarPreco(precoComDesconto(produto));
  detalheCategoria.textContent = nomeCategoria(categoriaDoProduto(produto));
  detalheApi.href = `https://dummyjson.com/products/${encodeURIComponent(produto.id)}`;

  preencherDescontoDetalhe(produto);
  preencherPrecoAntigoDetalhe(produto);
  preencherEstatisticasDetalhe(produto);
  atualizarFavoritoDetalhe(produto);
}

function preencherDescontoDetalhe(produto) {
  const produtoComDesconto = temDesconto(produto);

  detalheDesconto.hidden = !produtoComDesconto;
  detalheDesconto.textContent = produtoComDesconto
    ? `-${Math.round(descontoProduto(produto))}%`
    : "";
}

function preencherPrecoAntigoDetalhe(produto) {
  detalhePrecoAntigo.hidden = !temDesconto(produto);
  detalhePrecoAntigo.textContent = temDesconto(produto) ? formatarPreco(precoProduto(produto)) : "";
}

function preencherEstatisticasDetalhe(produto) {
  detalheMarca.textContent = produto.brand || "No brand";
  detalheEstoque.textContent = Number.isFinite(Number(produto.stock))
    ? `${produto.stock} units`
    : "Not informed";
  detalheAvaliacao.textContent = Number.isFinite(Number(produto.rating))
    ? `${Number(produto.rating).toFixed(1)}/5`
    : "No rating";
  detalheStatus.textContent = produto.availabilityStatus || "Not informed";
}

function atualizarFavoritoDetalhe(produto) {
  const favoritado = estaFavoritado(produto);
  const icone = document.createElement("i");

  icone.className = `bi ${favoritado ? "bi-star-fill" : "bi-star"} me-2`;
  detalheFavorito.dataset.favoriteId = produto.id;
  detalheFavorito.classList.toggle("active", favoritado);
  detalheFavorito.setAttribute("aria-pressed", String(favoritado));
  detalheFavorito.replaceChildren(icone, document.createTextNode(favoritado ? "Favorited" : "Add to favorites"));
}

function estaFavoritado(produto) {
  const chave = typeof produto === "string" || typeof produto === "number"
    ? String(produto)
    : chaveProduto(produto);

  return favoritos.some((favorito) => chaveProduto(favorito) === chave);
}

function alternarFavorito(id) {
  const produto = encontrarProdutoPorId(id);
  const chave = produto ? chaveProduto(produto) : String(id);
  const existe = favoritos.some((favorito) => chaveProduto(favorito) === chave);

  if (existe) {
    favoritos = favoritos.filter((favorito) => chaveProduto(favorito) !== chave);
  } else {
    if (!produto) {
      return;
    }

    favoritos = [...favoritos, produto];
  }

  WeMarketStorage.salvarFavoritos(favoritos);
  renderProdutos(produtos);
  renderFavoritos();

  if (produtoEmDetalhe) {
    atualizarFavoritoDetalhe(produtoEmDetalhe);
  }
}

function textoBusca() {
  return busca.value.trim();
}

function prepararBusca() {
  const termo = textoBusca();
  const termoNormalizado = normalizarTexto(termo);

  clearTimeout(temporizadorBusca);
  cancelarRequisicaoAtual();

  if (!termoNormalizado) {
    termoBuscaAtual = "";
    resultadosBusca = [];
    skipBusca = 0;
    totalBusca = 0;
    chegouAoFimBusca = true;
    produtos = listaVisivelAtual();
    renderProdutos(produtos);

    if (produtosGerais.length === 0) {
      carregarProdutos();
    }

    return;
  }

  categoriaAtual = "todos";
  termoBuscaAtual = termo;
  resultadosBusca = [];
  skipBusca = 0;
  totalBusca = 0;
  chegouAoFimBusca = false;
  produtos = [];

  limparElemento(listaProdutos);
  atualizarCategorias();
  contadorProdutos.textContent = `Searching for "${termo}"...`;
  definirStatus(`Searching for "${termo}"...`);
  atualizarBotaoCarregarMais();

  temporizadorBusca = setTimeout(() => {
    carregarProdutos({ novaBusca: true });
  }, SEARCH_DEBOUNCE_MS);
}

function limparBuscaParaCategoria() {
  if (!termoBuscaAtual && !busca.value.trim()) {
    return;
  }

  clearTimeout(temporizadorBusca);
  cancelarRequisicaoAtual();
  busca.value = "";
  termoBuscaAtual = "";
  resultadosBusca = [];
  skipBusca = 0;
  totalBusca = 0;
  chegouAoFimBusca = true;
}

function cancelarRequisicaoAtual() {
  if (controladorProdutos) {
    controladorProdutos.abort();
    controladorProdutos = null;
  }

  requisicaoAtual += 1;
  carregandoProdutos = false;
}

function atualizarBotaoCarregarMais() {
  const emBusca = Boolean(termoBuscaAtual);
  const emCategoria = emCategoriaSemBusca();
  const totalAtual = emBusca
    ? resultadosBusca.length
    : emCategoria ? estadoCategoria(categoriaAtual).produtos.length : produtosGerais.length;
  const chegouAoFim = emBusca
    ? chegouAoFimBusca
    : emCategoria ? estadoCategoria(categoriaAtual).chegouAoFim : chegouAoFimGeral;

  carregarMais.hidden = totalAtual === 0 || chegouAoFim;
  carregarMais.disabled = carregandoProdutos;
  carregarMais.textContent = carregandoProdutos
    ? "Loading..."
    : emBusca ? "Load more results"
      : emCategoria ? `Load more from ${nomeCategoria(categoriaAtual)}`
        : "Load more products";
}

function selecionarCategoria(categoriaId) {
  if (!categoriasProdutos.some((categoria) => categoria.id === categoriaId)) {
    return;
  }

  limparBuscaParaCategoria();
  categoriaAtual = categoriaId;
  produtos = listaVisivelAtual();

  if (categoriaAtual !== "todos" && produtos.length === 0) {
    limparElemento(listaProdutos);
    atualizarCategorias();
    contadorProdutos.textContent = `Loading products from ${nomeCategoria(categoriaId)}...`;
    definirStatus(`Loading products from ${nomeCategoria(categoriaId)}...`);
    atualizarBotaoCarregarMais();
    carregarProdutos({ novaBusca: true });
  } else {
    renderProdutos(produtos);
  }

  travarMenuNoClique("#produtos");

  document.querySelector("#produtos").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function atualizarMenuAtivo(hash = window.location.hash || "#inicio") {
  const hashAtual = hash || "#inicio";

  linksMenu.forEach((link) => {
    const ativo = link.getAttribute("href") === hashAtual;

    link.classList.toggle("active", ativo);

    if (ativo) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function hashMenuPorScroll() {
  const pontoLeitura = window.scrollY + window.innerHeight * .35;
  const alturaPagina = document.documentElement.scrollHeight;
  const chegouAoFinal = alturaPagina > window.innerHeight + 32
    && window.scrollY + window.innerHeight >= alturaPagina - 8;

  if (chegouAoFinal) {
    return "#favoritos";
  }

  return secoesMenu.reduce((hashAtual, secao) => {
    if (secao.hash === "#inicio") {
      return hashAtual;
    }

    const topoSecao = secao.elemento.getBoundingClientRect().top + window.scrollY;
    return pontoLeitura >= topoSecao ? secao.hash : hashAtual;
  }, "#inicio");
}

function atualizarMenuPorScroll() {
  if (menuScrollPendente) {
    return;
  }

  menuScrollPendente = true;

  requestAnimationFrame(() => {
    atualizarMenuAtivo(menuTravadoHash || hashMenuPorScroll());
    menuScrollPendente = false;
  });
}

function atualizarBotaoVoltarTopo() {
  botaoVoltarTopo.classList.toggle("visible", window.scrollY > 420);
}

function atualizarEstadoSidebar() {
  const menuVisivel = !document.body.classList.contains("sidebar-hidden");

  botaoSidebar.setAttribute("aria-expanded", String(menuVisivel));
  botaoSidebar.setAttribute("aria-label", menuVisivel ? "Hide menu" : "Show menu");
}

function alternarSidebar() {
  document.body.classList.toggle("sidebar-hidden");
  atualizarEstadoSidebar();
  atualizarMenuPorScroll();
}

function atualizarPerfil({ logado }) {
  perfilLogado = logado;

  perfilNome.textContent = logado ? "ClientOne" : "Guest";
  perfilMenuNome.textContent = logado ? "ClientOne" : "Guest";
  perfilStatusText.textContent = logado ? "Active customer" : "Signed out";
  perfilAvatar.alt = logado ? "ClientOne profile picture" : "Guest profile picture";
  perfilAvatar.classList.toggle("opacity-50", !logado);
  perfilMenuAvatar.classList.toggle("opacity-50", !logado);
  perfilStatusDot.classList.toggle("bg-success", logado);
  perfilStatusDot.classList.toggle("bg-secondary", !logado);
  perfilSair.innerHTML = logado
    ? '<i class="bi bi-box-arrow-right me-2"></i>Sign out'
    : '<i class="bi bi-box-arrow-in-right me-2"></i>Sign in again';
}

function alternarPerfil() {
  const novoEstadoLogado = !perfilLogado;

  atualizarPerfil({ logado: novoEstadoLogado });
  perfilToastBody.textContent = novoEstadoLogado
    ? "You signed in again."
    : "You signed out.";

  bootstrap.Dropdown.getOrCreateInstance(perfilToggle).hide();
  bootstrap.Toast.getOrCreateInstance(perfilToast).show();
}

function travarMenuNoClique(hash) {
  menuTravadoHash = hash;
  atualizarMenuAtivo(hash);
  clearTimeout(temporizadorMenuTravado);

  temporizadorMenuTravado = setTimeout(() => {
    menuTravadoHash = "";
    atualizarMenuPorScroll();
  }, 900);
}

function alvoInterativo(elemento) {
  return elemento.closest("a, button");
}

function abrirCardDoEvento(evento) {
  if (alvoInterativo(evento.target)) {
    return;
  }

  const card = evento.target.closest(".card-game[data-product-id]");

  if (card) {
    abrirDetalheProduto(encontrarProdutoPorId(card.dataset.productId));
  }
}

function abrirCardComTeclado(evento) {
  if (evento.key !== "Enter" && evento.key !== " ") {
    return;
  }

  if (alvoInterativo(evento.target)) {
    return;
  }

  const card = evento.target.closest(".card-game[data-product-id]");

  if (card) {
    evento.preventDefault();
    abrirDetalheProduto(encontrarProdutoPorId(card.dataset.productId));
  }
}

function abrirDetalheDoCarrossel(evento) {
  if (evento.target.closest(".carousel-control-prev, .carousel-control-next, .carousel-indicators")) {
    return;
  }

  const slide = evento.target.closest(".banner-slide[data-product-id]");

  if (!slide) {
    return;
  }

  evento.preventDefault();
  abrirDetalheProduto(encontrarProdutoPorId(slide.dataset.productId));
}

function configurarEventos() {
  formularioBusca.addEventListener("submit", (evento) => {
    evento.preventDefault();
  });

  busca.addEventListener("input", prepararBusca);

  carregarMais.addEventListener("click", () => {
    carregarProdutos();
  });

  botaoSidebar.addEventListener("click", alternarSidebar);
  carrosselHero.addEventListener("click", abrirDetalheDoCarrossel);
  perfilSair.addEventListener("click", alternarPerfil);

  menuCategorias.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-category]");

    if (botao) {
      selecionarCategoria(botao.dataset.category);
    }
  });

  linksMenu.forEach((link) => {
    link.addEventListener("click", () => {
      travarMenuNoClique(link.getAttribute("href"));
    });
  });

  window.addEventListener("hashchange", () => {
    atualizarMenuAtivo(menuTravadoHash || window.location.hash || "#inicio");
    atualizarMenuPorScroll();
  });

  window.addEventListener("scroll", () => {
    atualizarMenuPorScroll();
    atualizarBotaoVoltarTopo();
  }, { passive: true });

  window.addEventListener("resize", () => {
    atualizarMenuPorScroll();
    atualizarBotaoVoltarTopo();
  });

  botaoVoltarTopo.addEventListener("click", () => {
    travarMenuNoClique("#inicio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  listaProdutos.addEventListener("click", (evento) => {
    const botaoDetalhe = evento.target.closest("[data-detail-id]");
    const botaoFavorito = evento.target.closest("[data-favorite-id]");

    if (botaoDetalhe) {
      abrirDetalheProduto(encontrarProdutoPorId(botaoDetalhe.dataset.detailId));
      return;
    }

    if (botaoFavorito) {
      alternarFavorito(botaoFavorito.dataset.favoriteId);
      return;
    }

    abrirCardDoEvento(evento);
  });

  listaProdutos.addEventListener("keydown", abrirCardComTeclado);

  listaFavoritos.addEventListener("click", (evento) => {
    const botaoFavorito = evento.target.closest("[data-favorite-id]");

    if (botaoFavorito) {
      alternarFavorito(botaoFavorito.dataset.favoriteId);
      return;
    }

    abrirCardDoEvento(evento);
  });

  listaFavoritos.addEventListener("keydown", abrirCardComTeclado);

  detalheFavorito.addEventListener("click", () => {
    if (!produtoEmDetalhe) {
      return;
    }

    alternarFavorito(produtoEmDetalhe.id);
    atualizarFavoritoDetalhe(produtoEmDetalhe);
  });
}

configurarEventos();
montarMenuCategorias();
atualizarMenuAtivo(window.location.hash || hashMenuPorScroll());
atualizarEstadoSidebar();
atualizarBotaoVoltarTopo();
atualizarCategorias();
renderFavoritos();
carregarCategorias();
carregarProdutos();
