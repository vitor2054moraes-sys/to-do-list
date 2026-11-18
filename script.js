"use strict";
// Tique — lista de tarefas em HTML, CSS e JavaScript puro. Não há servidor: as tarefas ficam só neste navegador
// (localStorage). Organização: dados (ler e gravar) → regras (filtrar, ordenar, prazo) → tela (montada pelo DOM:
// o texto digitado entra sempre como texto, nunca como HTML — assim ninguém injeta código pela lista).

const CHAVE = "tarefas";   // a mesma chave da versão anterior: as tarefas já salvas continuam aparecendo
const PRIORIDADES = { alta: { nome: "Alta", peso: 0 }, media: { nome: "Média", peso: 1 }, baixa: { nome: "Baixa", peso: 2 } };
const CATEGORIAS = { trabalho: "Trabalho", pessoal: "Pessoal", estudos: "Estudos" };

const estado = { tarefas: [], busca: "", categoria: "todas", status: "todas", removida: null };

// ---------------------------------------------------------------- dados
const DATA = /^\d{4}-\d{2}-\d{2}$/;

// Tarefa lida do armazenamento: confere cada campo (dado mexido ou de versão antiga não quebra a página).
function normalizar(t) {
  if (!t || typeof t.texto !== "string" || !t.texto.trim()) return null;
  return {
    id: Number.isFinite(Number(t.id)) ? Number(t.id) : 0,
    texto: t.texto.trim(),
    concluida: Boolean(t.concluida),
    prioridade: PRIORIDADES[t.prioridade] ? t.prioridade : "media",
    categoria: CATEGORIAS[t.categoria] ? t.categoria : "pessoal",
    vencimento: DATA.test(t.vencimento || "") ? t.vencimento : null,
  };
}

function carregar() {
  try {
    const lidas = JSON.parse(localStorage.getItem(CHAVE) || "[]");
    return Array.isArray(lidas) ? lidas.map(normalizar).filter(Boolean) : [];
  } catch {
    return [];   // conteúdo estragado: começa vazia em vez de travar
  }
}

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado.tarefas));
  } catch {
    avisar("Não deu para salvar neste navegador (armazenamento cheio ou bloqueado).");
  }
}

const novoId = () => Math.max(Date.now(), ...estado.tarefas.map((t) => t.id + 1));

// ---------------------------------------------------------------- regras
const hojeISO = () => new Date().toLocaleDateString("sv-SE");   // "AAAA-MM-DD" no fuso do aparelho
const diasAte = (iso) => Math.round((new Date(iso + "T12:00") - new Date(hojeISO() + "T12:00")) / 864e5);
const formatarData = (iso) => iso.split("-").reverse().join("/");
const estaAtrasada = (t) => Boolean(t.vencimento) && !t.concluida && diasAte(t.vencimento) < 0;

// O prazo em palavras: "Atrasada (16/11)", "Hoje", "Amanhã" ou a data.
function textoDoPrazo(t) {
  const dias = diasAte(t.vencimento);
  if (estaAtrasada(t)) return `Atrasada (${formatarData(t.vencimento)})`;
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return formatarData(t.vencimento);
}

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function visiveis() {
  const termo = semAcento(estado.busca.trim());
  return estado.tarefas
    .filter((t) => !termo || semAcento(t.texto).includes(termo))
    .filter((t) => estado.categoria === "todas" || t.categoria === estado.categoria)
    .filter((t) => estado.status === "todas" || (estado.status === "concluidas") === t.concluida)
    // pendentes antes; depois a prioridade, o prazo mais perto e a mais antiga
    .sort((a, b) => a.concluida - b.concluida
      || PRIORIDADES[a.prioridade].peso - PRIORIDADES[b.prioridade].peso
      || (a.vencimento || "9999").localeCompare(b.vencimento || "9999")
      || a.id - b.id);
}

// ---------------------------------------------------------------- ações
function adicionar(texto, prioridade, categoria, vencimento) {
  estado.tarefas.push(normalizar({ id: novoId(), texto, prioridade, categoria, vencimento, concluida: false }));
  salvar();
  desenhar();
}

function alternar(id) {
  const t = estado.tarefas.find((x) => x.id === id);
  if (t) t.concluida = !t.concluida;
  salvar();
  desenhar();
}

function remover(id) {
  const posicao = estado.tarefas.findIndex((x) => x.id === id);
  if (posicao < 0) return;
  estado.removida = { tarefa: estado.tarefas[posicao], posicao };
  estado.tarefas.splice(posicao, 1);
  salvar();
  desenhar();
  avisar(`Tarefa removida: "${estado.removida.tarefa.texto}"`, true);
}

function desfazerRemocao() {
  if (!estado.removida) return;
  estado.tarefas.splice(estado.removida.posicao, 0, estado.removida.tarefa);
  estado.removida = null;
  salvar();
  desenhar();
  esconderAviso();
}

function apagarConcluidas() {
  const quantas = estado.tarefas.filter((t) => t.concluida).length;
  if (!quantas || !confirm(`Apagar ${plural(quantas, "tarefa concluída", "tarefas concluídas")}? Não dá para desfazer.`)) return;
  estado.tarefas = estado.tarefas.filter((t) => !t.concluida);
  salvar();
  desenhar();
}

// ---------------------------------------------------------------- tela
// Cria um elemento com atributos e filhos; texto vira nó de texto (nunca HTML).
function el(tag, atributos = {}, ...filhos) {
  const no = document.createElement(tag);
  for (const [nome, valor] of Object.entries(atributos)) {
    if (valor === false || valor === null || valor === undefined) continue;
    if (nome.startsWith("on")) no.addEventListener(nome.slice(2), valor);
    else if (nome === "class") no.className = valor;
    else no.setAttribute(nome, valor === true ? "" : valor);
  }
  no.append(...filhos.filter((f) => f !== null && f !== undefined && f !== false));
  return no;
}

function iconeX() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const traco = document.createElementNS(ns, "path");
  traco.setAttribute("d", "M6 6l12 12M18 6L6 18");
  svg.append(traco);
  return svg;
}

function itemDaLista(t) {
  const atrasada = estaAtrasada(t);
  const classes = ["tarefa", `prioridade-${t.prioridade}`, t.concluida && "concluida", atrasada && "atrasada"];
  return el("li", { class: classes.filter(Boolean).join(" ") },
    el("input", { type: "checkbox", checked: t.concluida, "aria-label": `Concluída: ${t.texto}`, onchange: () => alternar(t.id) }),
    el("div", { class: "corpo" },
      el("p", { class: "texto" }, t.texto),
      el("p", { class: "etiquetas" },
        el("span", { class: "etiqueta" }, CATEGORIAS[t.categoria]),
        el("span", { class: `etiqueta prioridade ${t.prioridade}` }, PRIORIDADES[t.prioridade].nome),
        t.vencimento ? el("span", { class: `etiqueta prazo${atrasada ? " atrasada" : ""}` }, textoDoPrazo(t)) : null)),
    el("button", { type: "button", class: "remover", "aria-label": `Remover: ${t.texto}`, title: "Remover", onclick: () => remover(t.id) },
      iconeX()));
}

function desenhar() {
  const lista = visiveis();
  document.getElementById("lista-tarefas").replaceChildren(...lista.map(itemDaLista));

  const pendentes = estado.tarefas.filter((t) => !t.concluida).length;
  const atrasadas = estado.tarefas.filter(estaAtrasada).length;
  const concluidas = estado.tarefas.length - pendentes;
  document.getElementById("resumo").textContent = estado.tarefas.length
    ? [plural(pendentes, "pendente", "pendentes"), atrasadas ? plural(atrasadas, "atrasada", "atrasadas") : null,
      plural(concluidas, "concluída", "concluídas")].filter(Boolean).join(" · ") : "";

  const vazio = document.getElementById("vazio");
  vazio.hidden = lista.length > 0;
  vazio.textContent = estado.tarefas.length ? "Nenhuma tarefa com esses filtros."
    : "Nada por fazer. Escreva a primeira tarefa acima e toque em Adicionar.";
  document.getElementById("limpar-concluidas").hidden = concluidas === 0;
}

// Aviso que some sozinho; com "Desfazer" depois de remover.
function avisar(texto, comDesfazer = false) {
  const aviso = document.getElementById("aviso");
  document.getElementById("aviso-texto").textContent = texto;
  document.getElementById("aviso-desfazer").hidden = !comDesfazer;
  aviso.hidden = false;
  clearTimeout(avisar.tempo);
  avisar.tempo = setTimeout(esconderAviso, 6000);
}
function esconderAviso() {
  document.getElementById("aviso").hidden = true;
}

// ---------------------------------------------------------------- ligação com a página
document.addEventListener("DOMContentLoaded", () => {
  estado.tarefas = carregar();
  desenhar();

  const form = document.getElementById("form-tarefa");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = document.getElementById("input-texto").value.trim();
    if (!texto) return;
    adicionar(texto, document.getElementById("select-prioridade").value, document.getElementById("select-categoria").value,
      document.getElementById("input-vencimento").value);
    form.reset();
    document.getElementById("input-texto").focus();
  });

  document.getElementById("input-busca").addEventListener("input", (e) => { estado.busca = e.target.value; desenhar(); });
  document.getElementById("filtro-categoria").addEventListener("change", (e) => { estado.categoria = e.target.value; desenhar(); });
  for (const botao of document.querySelectorAll(".status button")) {
    botao.addEventListener("click", () => {
      estado.status = botao.dataset.status;
      for (const b of document.querySelectorAll(".status button")) b.setAttribute("aria-pressed", String(b === botao));
      desenhar();
    });
  }
  document.getElementById("limpar-concluidas").addEventListener("click", apagarConcluidas);
  document.getElementById("aviso-desfazer").addEventListener("click", desfazerRemocao);
});
