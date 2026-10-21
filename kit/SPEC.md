# Como escrever uma dica (spec JSON)
Veja `specs/espaco-disco.json` (completo, com botão final e aviso "NÃO MARQUE") e `specs/teste.json` (mínimo, janela com menu lateral e sem botão final).

Campos (todos os textos em português do Brasil, exatamente como aparecem no Windows 11 em português):
- `id`: "AAAA-MM-DD-slug" (vira o nome dos arquivos).
- `chip` (opcional): selo sobre a tela, ex. "EXEMPLO · valores variam por PC". Use quando houver números inventados/ilustrativos.
- `desktop` (opcional): 3 nomes de pastas na área de trabalho.
- `hook`: {title (até ~27 caracteres), sub (até ~46), toast opcional {title, body}} – abertura de 4 s.
- `reassure` (opcional): {title, sub} – 4 s, mostra "seus arquivos ficam salvos" com 3 vistos nas pastas. Se a dica não tiver a ver com arquivos, troque o texto (ex.: "Não precisa instalar nada.") .
- `window`: {title: nome da janela (ex. "Configurações", "Gerenciador de Tarefas"), nav: lista do menu lateral (até 8 itens)}.
- `keys`: {keys: ["win","I"] ou ["Ctrl","Shift","Esc"]..., title, sub} – passo 1: atalho que abre a janela (6 s).
- `pages`: lista de páginas da janela. Página: {title, nav (índice do item do menu ativo, opcional), subtitle (opcional), card (opcional) {title, tag, pct, text}, final (opcional) {button, total, done}, rows: [...]}.
  Linha: {name, desc?, size?, chev? (seta ›), color?} ou, em listas com caixa de seleção, {name, desc?, size, checked: true/false, warn?: "NÃO MARQUE"}.
  A página 0 é a que aparece quando a janela abre.
- `steps`: lista de passos (cada um vira "PASSO n DE N"). Passo: {title (até ~27 caracteres), sub (até ~46), click, warn?, final?, sub2?}.
  `click`: {"nav": i} (item do menu lateral), {"row": j} (linha da página atual) ou {"button": true} (botão da página com `final`); pode ser uma lista de cliques (cada um avança uma página, na ordem de `pages`). Cada clique leva para a página seguinte (`goto` opcional no clique).
  `warn: true`: depois do clique, destaca em âmbar a linha com `warn` da página aberta (6 s extras).
  `final: true`: clique no botão da página com `final`; barra de progresso e mensagem `done`; `sub2` troca a legenda no fim.
- `cover`: {eyebrow?, l1, l2 (destacada em azul), sub, cta?}. l1/l2 até ~26 caracteres cada, sub até ~44.
Regras: o vídeo sai com 20–58 s (cada passo com um clique ~6 s, com `warn` ~12 s, `final` 6 s; fixos: 14 s no começo e ~8 s no fim). Total de passos (incluindo o do atalho) entre 3 e 5. O build falha se texto sair da área segura.
