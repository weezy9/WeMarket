# WeGames

Catalogo interativo de jogos desenvolvido como projeto front-end. A aplicacao lista produtos em cards, permite busca dinamica, filtros por categoria, visualizacao de detalhes e gerenciamento de favoritos no navegador.

## Integrantes do Grupo

> Preencha esta secao antes da entrega com o RA e o nome completo de todos os integrantes.

| RA | Nome completo |
| --- | --- |
| 823115360 | Alissa Novais Wenceslau Ferreira |
| 823115679 | Carolina Ornelas de Almeida |
| 823113068 | Mayara Borges de Carvalho |
| 823119535 | Támer Issa Ubaid |
| 823113068 | Felipe Menegazzi Garofalo |

## Tecnologias Utilizadas

- HTML
- CSS com Bootstrap
- JavaScript Vanilla
- Bootstrap Icons
- localStorage
- fetch API

## Funcionalidades

- Listagem de jogos em formato de cards
- Exibicao de nome, preco, imagem e categoria
- Busca dinamica por nome
- Filtro por categoria
- Botao para carregar mais jogos
- Favoritar e desfavoritar jogos
- Persistencia dos favoritos com localStorage
- Secao exclusiva para favoritos
- Modal com detalhes do jogo
- Carrossel de jogos em destaque

## API Utilizada

O projeto consome dados da API publica CheapShark:

```text
https://www.cheapshark.com/api/1.0/deals
```

A requisicao e feita diretamente no front-end com `fetch()`, sem backend proprio.

## Estrutura do Projeto

```text
WeGames/
+-- index.html
+-- css/
|   +-- style.css
+-- js/
|   +-- app.js
|   +-- api.js
|   +-- storage.js
+-- images/
    +-- WeGames.png
    +-- playerone.svg
```

## Como Executar

Abra o arquivo `index.html` diretamente no navegador.

Tambem e possivel publicar o projeto em um servico de hospedagem estatica, como GitHub Pages.

## Observacoes

A aplicacao funciona totalmente no front-end. Os dados dos jogos sao carregados por API publica e os favoritos ficam salvos no navegador do usuario usando `localStorage`.
