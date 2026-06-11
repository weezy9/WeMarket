# WeMarket

Catalogo interativo de produtos desenvolvido como projeto front-end. A aplicacao lista produtos em cards, permite busca dinamica, filtros por categoria, visualizacao de detalhes e gerenciamento de favoritos no navegador.

## Integrantes do Grupo

| RA | Nome completo |
| --- | --- |
| 823115360 | Alissa Novais Wenceslau Ferreira |
| 823115679 | Carolina Ornelas de Almeida |
| 823113068 | Mayara Borges de Carvalho |
| 823119535 | Támer Issa Ubaid |
| 824152542 | Felipe Menegazzi Garofalo |

## Tecnologias Utilizadas

- HTML
- CSS com Bootstrap
- JavaScript Vanilla
- Bootstrap Icons
- localStorage
- fetch API

## Funcionalidades

- Listagem de produtos em formato de cards
- Exibicao de nome, preco, imagem e categoria
- Busca dinamica por nome
- Filtro por categoria
- Botao para carregar mais produtos
- Favoritar e desfavoritar produtos
- Persistencia dos favoritos com localStorage
- Secao exclusiva para favoritos
- Modal com detalhes do produto
- Carrossel de produtos em destaque

## API Utilizada

O projeto consome dados da API publica DummyJSON:

```text
https://dummyjson.com/products
```

A requisicao e feita diretamente no front-end com `fetch()`, sem backend proprio.

## Estrutura do Projeto

```text
WeMarket/
+-- index.html
+-- css/
|   +-- style.css
+-- js/
|   +-- app.js
|   +-- api.js
|   +-- storage.js
+-- images/
    +-- WeMarket.png
    +-- WM.png
    +-- playerone.svg
```

## Como Executar

Acesse a aplicacao publicada pelo Github Pages:

#### [Acessar site WeMarket](https://weezy9.github.io/WeMarket/)

## Observacoes

A aplicacao funciona totalmente no front-end. Os dados dos produtos sao carregados por API publica e os favoritos ficam salvos no navegador do usuario usando `localStorage`.

A interface utiliza textos em ingles para manter consistencia com os dados retornados pela API DummyJSON.
