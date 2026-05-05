# Snake Retro

Projeto pessoal do jogo da cobrinha modernizado com visual retrô, mantendo base simples em HTML, CSS, JavaScript e [p5.js](https://p5js.org/).

## Recursos da versao atual
- Visual arcade retrô com HUD de score, recorde, nivel e estado do jogo.
- Estados de jogo: tela inicial, jogando e game over.
- Seletor de dificuldade: Facil, Medio e Dificil.
- Recorde salvo em `localStorage`.
- Feedback visual ao coletar comida e ao perder.
- Suporte a teclado e touch (botoes e swipe).
- Layout responsivo para desktop e mobile.

## Controles
- `Setas` para mover a cobra.
- `Espaco` para iniciar o jogo.
- `R` para reiniciar na tela de game over.
- No mobile: swipe na area do jogo ou botoes de direcao.

## Regras
- Coma a comida para aumentar o score e crescer.
- A cada comida, a velocidade aumenta levemente.
- Bater na parede ou no proprio corpo encerra a partida.

## Como executar
Nao precisa instalar dependencias de build.

1. Clone o repositório ou baixe os arquivos.
2. Abra `index.html` no navegador.
3. Opcional: rode com servidor local, por exemplo `npx http-server`, para facilitar desenvolvimento.

## Estrutura
```
index.html        # Estrutura da interface e carregamento dos scripts
scripts/sketch.js # Lógica do jogo e interações
css/style.css     # Tema retrô, HUD, overlays e responsividade
img/              # Recursos visuais
biblioteca_p5/    # Bibliotecas locais do p5 (não obrigatórias nesta versão)
```
