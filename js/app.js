const SEARCH_DEBOUNCE_MS = 350;
const COTACAO_DOLAR_REAL = 5;

const listaProdutos = document.getElementById("listaProdutos");
const listaFavoritos = document.getElementById("listaFavoritos");
const statusProdutos = document.getElementById("statusProdutos");
const contadorProdutos = document.getElementById("contadorProdutos");
const contadorFavoritos = document.getElementById("contadorFavoritos");
const precoForzaCarousel = document.getElementById("forzaCarouselPrice");
const carregarMais = document.getElementById("carregarMais");
const botaoVoltarTopo = document.getElementById("scrollTopButton");
const botaoSidebar = document.getElementById("sidebarToggle");
const busca = document.getElementById("busca");
const formularioBusca = document.querySelector(".search-form");
const linksMenu = document.querySelectorAll(".menu a[href^='#']");
const carrosselHero = document.getElementById("heroCarousel");
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
const detalheLoja = document.getElementById("gameDetailStore");
const detalheTitulo = document.getElementById("gameDetailTitle");
const detalheSubtitulo = document.getElementById("gameDetailSubtitle");
const detalhePreco = document.getElementById("gameDetailPrice");
const detalhePrecoAntigo = document.getElementById("gameDetailOldPrice");
const detalheSteam = document.getElementById("gameDetailSteam");
const detalheMetacritic = document.getElementById("gameDetailMetacritic");
const detalheAvaliacaoOferta = document.getElementById("gameDetailRating");
const detalheLancamento = document.getElementById("gameDetailRelease");
const detalheFavorito = document.getElementById("gameDetailFavorite");
const detalheOferta = document.getElementById("gameDetailDeal");

let produtos = [];
let produtosGerais = [];
let resultadosBusca = [];
let favoritos = mesclarProdutosUnicos([], WeGamesStorage.carregarFavoritos().filter(produtoValido));
let paginaGeral = 0;
let paginaBusca = 0;
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
let jogoForzaCarousel = null;

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function produtoValido(produto) {
  return produto && typeof produto.dealID === "string" && typeof produto.title === "string";
}

function mesclarProdutosUnicos(produtosAtuais, novosProdutos) {
  const mapaProdutos = new Map();

  [...produtosAtuais, ...novosProdutos].forEach((produto) => {
    const chave = chaveProduto(produto);
    const produtoExistente = mapaProdutos.get(chave);

    mapaProdutos.set(chave, escolherMelhorOferta(produtoExistente, produto));
  });

  return [...mapaProdutos.values()];
}

function chaveProduto(produto) {
  return produto.gameID ? String(produto.gameID) : produto.title.trim().toLowerCase().replace(/\s+/g, " ");
}

function escolherMelhorOferta(produtoAtual, novoProduto) {
  if (!produtoAtual) {
    return novoProduto;
  }

  const precoAtual = precoProduto(produtoAtual);
  const novoPreco = precoProduto(novoProduto);

  if (novoPreco < precoAtual) {
    return novoProduto;
  }

  if (novoPreco === precoAtual && descontoProduto(novoProduto) > descontoProduto(produtoAtual)) {
    return novoProduto;
  }

  return produtoAtual;
}

function precoProduto(produto) {
  const preco = Number(produto.salePrice);
  return Number.isFinite(preco) ? preco : Number.POSITIVE_INFINITY;
}

function descontoProduto(produto) {
  const desconto = Number(produto.savings);
  return Number.isFinite(desconto) ? desconto : 0;
}

function steamAppId(produto) {
  const id = String(produto.steamAppID || "").trim();
  return id && id !== "0" ? id : "";
}

function fontesImagemProduto(produto, tipo = "card") {
  const id = steamAppId(produto);
  const fontes = [];

  if (id && tipo === "detalhe") {
    fontes.push(`https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/library_hero.jpg`);
    fontes.push(`https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/capsule_616x353.jpg`);
  }

  if (id) {
    fontes.push(`https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`);
  }

  if (produto.thumb) {
    fontes.push(produto.thumb);
  }

  fontes.push("images/WeGames.png");

  return [...new Set(fontes)];
}

function carregarImagemComFallback(imagem, fontes, alt, aoTrocarFonte) {
  let indiceFonte = 0;

  function aplicarFonte() {
    const fonte = fontes[indiceFonte] || "images/WeGames.png";

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
    imagem.src = "images/WeGames.png";
    imagem.alt = "Capa indisponível";
  };

  aplicarFonte();
}

async function carregarProdutos({ novaBusca = false } = {}) {
  const termo = termoBuscaAtual;
  const emBusca = Boolean(termo);
  const chegouAoFim = emBusca ? chegouAoFimBusca : chegouAoFimGeral;
  const paginaAtual = emBusca ? paginaBusca : paginaGeral;
  const produtosDoModo = emBusca ? resultadosBusca : produtosGerais;

  if ((!novaBusca && carregandoProdutos) || (!novaBusca && chegouAoFim)) {
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

  if (produtosDoModo.length === 0) {
    definirStatus(emBusca ? `Buscando "${termo}"...` : "Carregando ofertas...");
  }

  try {
    const resposta = await WeGamesAPI.buscarJogos({
      pagina: paginaAtual,
      termo,
      signal: controladorProdutos.signal,
    });
    const produtosValidos = resposta.produtos.filter(produtoValido);
    const produtosUnicos = mesclarProdutosUnicos(produtosDoModo, produtosValidos);

    if (idRequisicao !== requisicaoAtual) {
      return;
    }

    if (emBusca) {
      resultadosBusca = produtosUnicos;
      produtos = resultadosBusca;
      paginaBusca += 1;
      chegouAoFimBusca = resposta.chegouAoFim;
    } else {
      produtosGerais = produtosUnicos;
      produtos = produtosGerais;
      paginaGeral += 1;
      chegouAoFimGeral = resposta.chegouAoFim;
    }

    renderProdutos(produtos);
    renderFavoritos();
    atualizarPrecoForzaCarousel();
  } catch (erro) {
    if (erro.name === "AbortError") {
      return;
    }

    definirStatus(produtosDoModo.length === 0
      ? "Não foi possível carregar as ofertas. Tente novamente mais tarde."
      : "Não foi possível carregar mais jogos agora. Tente novamente em alguns instantes.", true);
    console.error(erro);
  } finally {
    if (idRequisicao === requisicaoAtual) {
      carregandoProdutos = false;
      controladorProdutos = null;
      atualizarBotaoCarregarMais();
    }
  }
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

  contadorProdutos.textContent = termoBuscaAtual
    ? formatarContadorBusca(lista.length)
    : `${produtosGerais.length} jogos carregados`;

  if (lista.length === 0) {
    definirStatus(termoBuscaAtual
      ? `Nenhum jogo encontrado para "${termoBuscaAtual}".`
      : "Nenhuma oferta disponível no momento.");
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
  contadorFavoritos.textContent = favoritos.length === 1 ? "1 favorito" : `${favoritos.length} favoritos`;

  if (favoritos.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "empty";
    vazio.textContent = "Nenhum jogo favoritado ainda.";
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
    ? `1 resultado para "${termoBuscaAtual}"`
    : `${total} resultados para "${termoBuscaAtual}"`;
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
  botaoRemover.dataset.favoriteId = produto.dealID;
  botaoRemover.textContent = "Remover dos favoritos";

  corpo.append(criarTitulo(produto.title), criarLinhaPreco(produto), botaoRemover);

  return card;
}

function criarBaseCard(produto) {
  const card = document.createElement("article");
  const imagem = document.createElement("img");
  const corpo = document.createElement("div");

  card.className = "card-game";
  card.dataset.dealId = produto.dealID;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Abrir detalhes de ${produto.title}`);

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

function criarLinhaPreco(produto) {
  const linha = document.createElement("div");
  const preco = document.createElement("span");

  linha.className = "price-row";

  preco.className = "price";
  preco.textContent = formatarPreco(produto.salePrice);

  linha.append(preco);

  if (temDesconto(produto)) {
    const precoAntigo = document.createElement("span");

    precoAntigo.className = "old-price";
    precoAntigo.textContent = formatarPreco(produto.normalPrice);
    linha.appendChild(precoAntigo);
  }

  return linha;
}

function criarAcoesProduto(produto, favoritado) {
  const acoes = document.createElement("div");
  const desconto = document.createElement("span");
  const botoes = document.createElement("div");
  const linkOferta = document.createElement("a");
  const favorito = document.createElement("button");

  acoes.className = "game-actions";

  if (temDesconto(produto)) {
    desconto.className = "discount";
    desconto.textContent = `-${Math.round(Number(produto.savings) || 0)}%`;
  } else {
    desconto.className = "discount-placeholder";
    desconto.setAttribute("aria-hidden", "true");
  }

  botoes.className = "card-buttons";

  linkOferta.className = "deal-link";
  linkOferta.href = `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(produto.dealID)}`;
  linkOferta.target = "_blank";
  linkOferta.rel = "noopener noreferrer";
  linkOferta.textContent = "Ver oferta";

  favorito.type = "button";
  favorito.className = `favorite${favoritado ? " active" : ""}`;
  favorito.dataset.favoriteId = produto.dealID;
  favorito.setAttribute("aria-pressed", String(favoritado));
  favorito.setAttribute("aria-label", favoritado ? `Remover ${produto.title} dos favoritos` : `Adicionar ${produto.title} aos favoritos`);
  favorito.title = favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos";
  favorito.textContent = favoritado ? "★" : "☆";

  botoes.append(linkOferta, favorito);
  acoes.append(desconto, botoes);

  return acoes;
}

function formatarPreco(valor) {
  return formatadorMoeda.format((Number(valor) || 0) * COTACAO_DOLAR_REAL);
}

function encontrarForzaHorizon5(lista) {
  return lista.find((produto) => produto.title.toLowerCase() === "forza horizon 5")
    || lista.find((produto) => produto.title.toLowerCase().includes("forza horizon 5"));
}

function atualizarPrecoForzaCarousel(jogoForza = null) {
  if (!precoForzaCarousel) {
    return;
  }

  if (jogoForza) {
    jogoForzaCarousel = jogoForza;
  }

  const jogosCarregados = [...produtosGerais, ...resultadosBusca];
  const forza = jogoForzaCarousel || encontrarForzaHorizon5(jogosCarregados);

  if (forza) {
    jogoForzaCarousel = forza;
  }

  precoForzaCarousel.textContent = forza
    ? `Por apenas ${formatarPreco(forza.salePrice)}`
    : precoForzaCarousel.textContent || "Carregando oferta...";
}

async function carregarPrecoForzaCarousel() {
  if (!precoForzaCarousel) {
    return;
  }

  try {
    const resposta = await WeGamesAPI.buscarJogos({ termo: "Forza Horizon 5" });
    const jogoForza = encontrarForzaHorizon5(resposta.produtos.filter(produtoValido));

    atualizarPrecoForzaCarousel(jogoForza);
  } catch (erro) {
    console.error(erro);
  }
}

function temDesconto(produto) {
  const precoAtual = Number(produto.salePrice);
  const precoNormal = Number(produto.normalPrice);
  const desconto = Number(produto.savings);

  return Number.isFinite(precoAtual)
    && Number.isFinite(precoNormal)
    && precoNormal > precoAtual
    && desconto >= 1;
}

function abrirDetalheJogo(id) {
  abrirDetalheProduto(encontrarProdutoPorId(id));
}

function abrirDetalheProduto(produto) {
  produtoEmDetalhe = produto;

  if (!produtoEmDetalhe) {
    return;
  }

  preencherDetalheJogo(produto);

  if (!modalDetalhe) {
    modalDetalhe = new bootstrap.Modal(detalheModal);
  }

  modalDetalhe.show();
}

async function abrirDetalheJogoPorTitulo(titulo) {
  const produtoLocal = encontrarProdutoPorTitulo(titulo);

  if (produtoLocal) {
    abrirDetalheProduto(produtoLocal);
    return;
  }

  try {
    const resposta = await WeGamesAPI.buscarJogos({ termo: titulo });
    const produtosValidos = resposta.produtos.filter(produtoValido);
    const produto = encontrarProdutoPorTitulo(titulo, produtosValidos) || produtosValidos[0];

    abrirDetalheProduto(produto);
  } catch (erro) {
    console.error(erro);
  }
}

function encontrarProdutoPorId(id) {
  return produtos.find((produto) => produto.dealID === id)
    || produtosGerais.find((produto) => produto.dealID === id)
    || resultadosBusca.find((produto) => produto.dealID === id)
    || favoritos.find((produto) => produto.dealID === id)
    || (produtoEmDetalhe?.dealID === id ? produtoEmDetalhe : null);
}

function encontrarProdutoPorTitulo(
  titulo,
  lista = [...produtos, ...produtosGerais, ...resultadosBusca, ...favoritos, ...(jogoForzaCarousel ? [jogoForzaCarousel] : [])]
) {
  const tituloNormalizado = titulo.trim().toLowerCase();

  return lista.find((produto) => produto.title.toLowerCase() === tituloNormalizado)
    || lista.find((produto) => produto.title.toLowerCase().includes(tituloNormalizado));
}

function preencherDetalheJogo(produto) {
  const fontesImagem = fontesImagemProduto(produto, "detalhe");

  carregarImagemComFallback(detalheImagem, fontesImagem, produto.title, (fonte) => {
    detalheBackdrop.style.backgroundImage = `url("${fonte}")`;
  });
  detalheTitulo.textContent = produto.title;
  detalheSubtitulo.textContent = criarResumoJogo(produto);
  detalhePreco.textContent = formatarPreco(produto.salePrice);
  detalheOferta.href = `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(produto.dealID)}`;

  preencherDescontoDetalhe(produto);
  preencherPrecoAntigoDetalhe(produto);
  preencherEstatisticasDetalhe(produto);
  atualizarFavoritoDetalhe(produto);
}

function preencherDescontoDetalhe(produto) {
  const produtoComDesconto = temDesconto(produto);

  detalheDesconto.hidden = !produtoComDesconto;
  detalheLoja.hidden = !produtoComDesconto;
  detalheDesconto.textContent = produtoComDesconto
    ? `-${Math.round(Number(produto.savings) || 0)}%`
    : "";
}

function preencherPrecoAntigoDetalhe(produto) {
  detalhePrecoAntigo.hidden = !temDesconto(produto);
  detalhePrecoAntigo.textContent = temDesconto(produto) ? formatarPreco(produto.normalPrice) : "";
}

function preencherEstatisticasDetalhe(produto) {
  detalheSteam.textContent = formatarAvaliacaoSteam(produto);
  detalheMetacritic.textContent = formatarMetacritic(produto);
  detalheAvaliacaoOferta.textContent = formatarAvaliacaoOferta(produto);
  detalheLancamento.textContent = formatarDataLancamento(produto.releaseDate);
}

function criarResumoJogo(produto) {
  if (produto.steamRatingText && produto.steamRatingText !== "0") {
    return `Oferta com avaliação "${produto.steamRatingText}" na Steam.`;
  }

  return "Confira a melhor oferta encontrada para este jogo.";
}

function formatarAvaliacaoSteam(produto) {
  const percentual = Number(produto.steamRatingPercent);

  if (produto.steamRatingText && produto.steamRatingText !== "0" && Number.isFinite(percentual)) {
    return `${produto.steamRatingText} (${percentual}%)`;
  }

  if (produto.steamRatingText && produto.steamRatingText !== "0") {
    return produto.steamRatingText;
  }

  return "Sem avaliação";
}

function formatarMetacritic(produto) {
  const nota = Number(produto.metacriticScore);
  return Number.isFinite(nota) && nota > 0 ? `${nota}/100` : "Sem nota";
}

function formatarAvaliacaoOferta(produto) {
  const nota = Number(produto.dealRating);
  return Number.isFinite(nota) && nota > 0 ? `${nota.toFixed(1)}/10` : "Não informada";
}

function formatarDataLancamento(valor) {
  const timestamp = Number(valor);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR").format(new Date(timestamp * 1000));
}

function atualizarFavoritoDetalhe(produto) {
  const favoritado = estaFavoritado(produto);
  const icone = document.createElement("i");

  icone.className = `bi ${favoritado ? "bi-star-fill" : "bi-star"} me-2`;
  detalheFavorito.dataset.favoriteId = produto.dealID;
  detalheFavorito.classList.toggle("active", favoritado);
  detalheFavorito.setAttribute("aria-pressed", String(favoritado));
  detalheFavorito.replaceChildren(icone, document.createTextNode(favoritado ? "Favoritado" : "Favoritar"));
}

function estaFavoritado(produto) {
  const chave = typeof produto === "string" ? chaveFavoritoPorId(produto) : chaveProduto(produto);
  return favoritos.some((favorito) => chaveProduto(favorito) === chave);
}

function alternarFavorito(id) {
  const produto = encontrarProdutoPorId(id);
  const chave = produto ? chaveProduto(produto) : chaveFavoritoPorId(id);
  const existe = favoritos.some((favorito) => chaveProduto(favorito) === chave);

  if (existe) {
    favoritos = favoritos.filter((favorito) => chaveProduto(favorito) !== chave);
  } else {
    if (!produto) {
      return;
    }

    favoritos = [...favoritos, produto];
  }

  WeGamesStorage.salvarFavoritos(favoritos);
  renderProdutos(produtos);
  renderFavoritos();
}

function chaveFavoritoPorId(id) {
  const produto = produtos.find((item) => item.dealID === id)
    || favoritos.find((item) => item.dealID === id);

  return produto ? chaveProduto(produto) : id;
}

function textoBusca() {
  return busca.value.trim().toLowerCase();
}

function prepararBusca() {
  const termo = textoBusca();

  clearTimeout(temporizadorBusca);
  cancelarRequisicaoAtual();

  if (!termo) {
    termoBuscaAtual = "";
    resultadosBusca = [];
    paginaBusca = 0;
    chegouAoFimBusca = true;
    produtos = produtosGerais;
    renderProdutos(produtos);

    if (produtosGerais.length === 0) {
      carregarProdutos();
    }

    return;
  }

  termoBuscaAtual = termo;
  resultadosBusca = [];
  paginaBusca = 0;
  chegouAoFimBusca = false;
  produtos = resultadosBusca;

  limparElemento(listaProdutos);
  contadorProdutos.textContent = `Buscando "${termo}"...`;
  definirStatus(`Buscando "${termo}"...`);
  atualizarBotaoCarregarMais();

  temporizadorBusca = setTimeout(() => {
    carregarProdutos({ novaBusca: true });
  }, SEARCH_DEBOUNCE_MS);
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
  const totalAtual = emBusca ? resultadosBusca.length : produtosGerais.length;
  const chegouAoFim = emBusca ? chegouAoFimBusca : chegouAoFimGeral;

  carregarMais.hidden = totalAtual === 0 || chegouAoFim;
  carregarMais.disabled = carregandoProdutos;
  carregarMais.textContent = carregandoProdutos
    ? "Carregando..."
    : emBusca ? "Carregar mais resultados" : "Carregar mais jogos";
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
  botaoSidebar.setAttribute("aria-label", menuVisivel ? "Esconder menu" : "Mostrar menu");
}

function alternarSidebar() {
  document.body.classList.toggle("sidebar-hidden");
  atualizarEstadoSidebar();
  atualizarMenuPorScroll();
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

  const card = evento.target.closest(".card-game[data-deal-id]");

  if (card) {
    abrirDetalheJogo(card.dataset.dealId);
  }
}

function abrirCardComTeclado(evento) {
  if (evento.key !== "Enter" && evento.key !== " ") {
    return;
  }

  if (alvoInterativo(evento.target)) {
    return;
  }

  const card = evento.target.closest(".card-game[data-deal-id]");

  if (card) {
    evento.preventDefault();
    abrirDetalheJogo(card.dataset.dealId);
  }
}

function abrirDetalheDoCarrossel(evento) {
  if (evento.target.closest(".carousel-control-prev, .carousel-control-next, .carousel-indicators")) {
    return;
  }

  const slide = evento.target.closest(".banner-slide[data-carousel-game]");

  if (!slide) {
    return;
  }

  evento.preventDefault();
  abrirDetalheJogoPorTitulo(slide.dataset.carouselGame);
}

function configurarEventos() {
  formularioBusca.addEventListener("submit", (evento) => {
    evento.preventDefault();
  });

  busca.addEventListener("input", () => {
    prepararBusca();
  });

  carregarMais.addEventListener("click", () => {
    carregarProdutos();
  });

  botaoSidebar.addEventListener("click", alternarSidebar);

  carrosselHero.addEventListener("click", abrirDetalheDoCarrossel);

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
    const botao = evento.target.closest("[data-favorite-id]");

    if (botao) {
      alternarFavorito(botao.dataset.favoriteId);
      return;
    }

    abrirCardDoEvento(evento);
  });

  listaProdutos.addEventListener("keydown", abrirCardComTeclado);

  listaFavoritos.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-favorite-id]");

    if (botao) {
      alternarFavorito(botao.dataset.favoriteId);
      return;
    }

    abrirCardDoEvento(evento);
  });

  listaFavoritos.addEventListener("keydown", abrirCardComTeclado);

  detalheFavorito.addEventListener("click", () => {
    if (!produtoEmDetalhe) {
      return;
    }

    alternarFavorito(produtoEmDetalhe.dealID);
    atualizarFavoritoDetalhe(produtoEmDetalhe);
  });

}

configurarEventos();
atualizarMenuAtivo(window.location.hash || hashMenuPorScroll());
atualizarEstadoSidebar();
atualizarBotaoVoltarTopo();
renderFavoritos();
carregarProdutos();
carregarPrecoForzaCarousel();
