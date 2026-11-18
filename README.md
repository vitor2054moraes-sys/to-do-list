# ✓ Tique — suas tarefas em ordem

**Tique** (antes "To-Do List") é uma lista de tarefas feita só com HTML, CSS e JavaScript, sem instalar nada.
O nome vem do "tique" — o visto ✓ que a gente faz quando termina uma tarefa.

## O que faz

- Adiciona tarefas com **prioridade** (alta, média, baixa), **categoria** (trabalho, pessoal, estudos) e **prazo**.
- Marca como concluída (fica riscada) e remove — com **Desfazer** logo depois de remover.
- Mostra quantas estão pendentes, atrasadas e concluídas; a atrasada ganha uma etiqueta vermelha.
- **Busca** (sem diferenciar acento), filtro por **categoria** e por **situação** (todas, pendentes, concluídas).
- A lista vem em ordem: pendentes primeiro, depois a prioridade e o prazo mais perto.
- Feita primeiro para o celular; no computador o formulário fica numa linha.

## Segurança e privacidade

- As tarefas ficam **só no seu navegador** (localStorage). Nada vai para a internet.
- O texto digitado entra na página sempre como **texto**, nunca como HTML: ninguém consegue rodar código
  escrevendo na lista (a versão anterior usava `innerHTML` e permitia isso).
- A página só carrega arquivos dela mesma (Content-Security-Policy).
- Dado estragado no navegador não trava a página: ela começa vazia.

## Como usar

Abra o `index.html` no navegador — ou acesse a versão publicada:
<https://vitor2054moraes-sys.github.io/to-do-list/>

Para baixar o código:

```bash
git clone https://github.com/vitor2054moraes-sys/to-do-list.git
```

## Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | A página: formulário, filtros e a lista. |
| `style.css` | A aparência (cores e medidas no começo do arquivo). |
| `script.js` | Dados (ler e gravar) → regras (filtrar, ordenar, prazo) → tela. |
| `icone.svg` | O ícone (um visto). |
