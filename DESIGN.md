---
version: beta
name: Thrift Brechó
description: Sistema visual da loja (storefront/) e do painel (dashboard/) em Next.js — editorial e acolhedor na loja, denso e calmo no painel, com a mesma identidade.
colors:
  paper: "#F7F2EA"
  admin-ground: "#F4EFE8"
  card: "#FFFDF9"
  sand: "#EFE6DA"
  line: "#E3D8CA"
  ink: "#2A1F1E"
  ink-2: "#3A2D2B"
  muted: "#6B5A54"
  terra: "#A9493A"
  terra-dark: "#8C3A2D"
  blush: "#EBCFC4"
  sage: "#4F6B55"
  warn-surface: "#FBEBDD"
  warn-text: "#8A4B12"
  info-surface: "#E3ECF7"
  info-text: "#1E4A7A"
  teal-surface: "#DDEFEC"
  teal-text: "#1F5E57"
  ok-surface: "#E7EDE4"
  ok-text: "#3E5844"
  bad-surface: "#F6E0DC"
  bad-text: "#8C2F22"
typography:
  display:
    fontFamily: Fraunces Variable
    use: títulos de página e de seção, números grandes do drop; itálico para a palavra em destaque
    weight: 400–500
    letterSpacing: -0.02em a -0.03em
  body:
    fontFamily: DM Sans Variable
    use: todo o resto (texto, botões, tabelas, formulários)
    sizes: 13px (meta), 14px (painel), 15–18px (loja)
  eyebrow:
    fontFamily: DM Sans Variable
    fontSize: 13px
    fontWeight: 700
    letterSpacing: 0.22em
    transform: uppercase
    color: "{colors.terra}"
  numbers:
    fontFeature: "tnum"
rounded:
  control-admin: 10px
  control-store: 12px
  card: 14–18px
  pill: 9999px
spacing:
  base: 4px
  page-x: 20px (celular) / 32px (desktop)
  section-y-store: 64–88px
components:
  button-primary: "fundo {colors.terra}, texto {colors.card}, hover {colors.terra-dark}; pílula na loja (52px), 10px de raio no painel (42px)"
  button-ghost: "loja: borda 1.5px {colors.ink}, hover invertido; painel: borda {colors.line} em {colors.card}, hover {colors.sand}"
  field: "altura 48px (loja) / 42px (painel), borda #D9CCBC, foco com contorno {colors.terra}"
  panel: "fundo {colors.card}, borda 1px {colors.line}, raio 16px"
  sidebar: "fundo {colors.ink}, item ativo {colors.ink-2} com texto {colors.card}, grupos em caixa-alta 11px"
  status-pill: "par de superfície e texto semânticos + texto sempre visível"
---

# Thrift Brechó — sistema visual

Este arquivo vale para as interfaces Next.js: `storefront/` (loja) e `dashboard/` (painel). Os tokens estão implementados em `src/app/globals.css` de cada app (bloco `@theme` do Tailwind CSS 4). A referência visual aprovada fica no canvas de design do projeto.

As telas Razor antigas (`web/` e o painel em `admin/Presentation/ASPNET/FrontEnd`) seguem com o visual anterior até serem desligadas; não aplique este sistema nelas.

## Princípios

- **Loja: editorial e acolhedora.** Cada peça é única — muito respiro, fotos grandes, serifa nos títulos, terracota só onde há ação.
- **Painel: denso e calmo.** Mesma paleta, menos ar. A primeira coisa da tela é o que precisa ser feito hoje.
- **Nada inventado.** Se a API não tem o dado (marca, estado da peça, favoritos), a interface não finge que tem.

## Cores

- Fundo da loja `paper`, do painel `admin-ground`; cartões e painéis em `card` com borda `line`.
- Texto principal `ink`; secundário `muted` (passa AA sobre `paper` e `card`).
- `terra` é a cor de ação (botão principal, preço em destaque, aba ativa, link de hover). Uma ação primária por região.
- `blush` só sobre fundo `ink` (rótulos do drop, avatar). `sage` para confirmações e chaves ligadas.
- Status usam os pares semânticos (`warn`, `info`, `teal`, `ok`, `bad`) e **sempre** levam texto.

Etapas de pedido no painel: aguardando pagamento = warn; pagamento confirmado = info; preparando embalagem = sand; etiqueta gerada = lilás `#EDE4F3/#5B3A75`; postado/em transporte = teal; entregue = ok; cancelado = bad.

## Tipografia

- Fraunces (variável, eixo `opsz`) para títulos; uma palavra em itálico `terra` por título, no máximo.
- DM Sans para todo o resto. Números comparáveis com `font-variant-numeric: tabular-nums` (classe `.num`).
- Rótulo acima de título ("eyebrow"): classe `.eyebrow`.
- As fontes vêm de `@fontsource-variable/*` (self-hosted, sem chamada ao Google Fonts).

## Layout

- Loja: largura máxima 1280px; em telas pequenas, barra de atalhos fixa no rodapé (Início, Carrinho, Ajuda, Conta).
- Painel: menu lateral de 248px (vira menu recolhível em telas pequenas), conteúdo até 1280px. Lista + painel de detalhe lado a lado; o detalhe desce para baixo da lista quando não cabe.
- Tabelas largas ficam dentro de uma caixa com rolagem horizontal.

## Componentes

- Classes base em `@layer components` (`.field`, `.btn-primary`, `.btn-ghost`, `.panel`, `.eyebrow`, `.num`) para que utilitários do Tailwind possam sobrescrevê-las.
- Imagem de produto sem foto: bloco em tom neutro da paleta (sem texto em miniaturas).
- Formulários: rótulo sempre visível, erro abaixo do campo, botão desabilitado com texto de progresso ("Gerando seu Pix...").
- Ações irreversíveis ou que gastam dinheiro (pagar etiqueta, fechar sacolinha) pedem confirmação.

## Faça / não faça

- Faça alvos de toque de pelo menos 44px, foco visível (`terra`) e contraste AA.
- Faça estados vazio, carregando e erro em toda lista.
- Não use gradientes decorativos, emoji como ícone ou sombras em todo cartão (só em elementos flutuantes).
- Não crie cores, raios ou fontes fora destes tokens sem atualizar este arquivo.
