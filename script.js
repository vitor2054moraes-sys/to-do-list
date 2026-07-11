// ===== MODELO DE DADOS =====
let tarefas = [];

// Estado dos filtros (só afeta exibição, nunca o array)
let valorDaBusca = "";
let categoriaEscolhida = "todas";
let statusEscolhido = "todas";

const PESO_PRIORIDADE = { alta: 0, media: 1, baixa: 2 };

// ===== CAMADA 0: NÚCLEO =====
function adicionarTarefa(texto, prioridade, categoria, vencimento) {
  tarefas.push({
    id: Date.now(),
    texto,
    concluida: false,
    prioridade,
    categoria,
    vencimento: vencimento || null,
  });
  salvar();
  aplicarFiltrosEOrdenar();
}

function alternarConclusao(id) {
  const t = tarefas.find((t) => t.id === id);
  if (t) t.concluida = !t.concluida;
  salvar();
  aplicarFiltrosEOrdenar();
}

function removerTarefa(id) {
  tarefas = tarefas.filter((t) => t.id !== id);
  salvar();
  aplicarFiltrosEOrdenar();
}

function renderizar(lista) {
  const ul = document.getElementById("lista-tarefas");
  ul.innerHTML = "";

  lista.forEach((tarefa) => {
    const li = document.createElement("li");
    li.className = `tarefa prioridade-${tarefa.prioridade}`;
    if (tarefa.concluida) li.classList.add("concluida");
    if (estaAtrasada(tarefa)) li.classList.add("atrasada");

    li.innerHTML = `
      <input type="checkbox" ${tarefa.concluida ? "checked" : ""}>
      <span class="texto">${tarefa.texto}</span>
      <small class="meta">
        ${tarefa.categoria} · ${tarefa.prioridade}
        ${tarefa.vencimento ? "· " + formatarData(tarefa.vencimento) : ""}
      </small>
      <button class="remover">✕</button>
    `;

    li.querySelector("input").addEventListener("change", () =>
      alternarConclusao(tarefa.id)
    );
    li.querySelector(".remover").addEventListener("click", () =>
      removerTarefa(tarefa.id)
    );

    ul.appendChild(li);
  });
}

// ===== CAMADA 1: PRIORIDADE =====
function ordenarPorPrioridade(lista) {
  return [...lista].sort(
    (a, b) => PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade]
  );
}

// ===== CAMADA 2: VENCIMENTO =====
function estaAtrasada(tarefa) {
  if (!tarefa.vencimento || tarefa.concluida) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(tarefa.vencimento + "T00:00:00");
  return venc < hoje;
}

// ===== CAMADA 3: CATEGORIA =====
function filtrarPorCategoria(lista, categoria) {
  if (categoria === "todas") return lista;
  return lista.filter((t) => t.categoria === categoria);
}

// ===== CAMADA 4: BUSCA + STATUS =====
function filtrarPorTexto(lista, termo) {
  if (!termo) return lista;
  const t = termo.toLowerCase();
  return lista.filter((tarefa) => tarefa.texto.toLowerCase().includes(t));
}

function filtrarPorStatus(lista, status) {
  if (status === "pendentes") return lista.filter((t) => !t.concluida);
  if (status === "concluidas") return lista.filter((t) => t.concluida);
  return lista;
}

// ===== ORQUESTRADOR =====
function aplicarFiltrosEOrdenar() {
  let resultado = tarefas;
  resultado = filtrarPorTexto(resultado, valorDaBusca);
  resultado = filtrarPorCategoria(resultado, categoriaEscolhida);
  resultado = filtrarPorStatus(resultado, statusEscolhido);
  resultado = ordenarPorPrioridade(resultado);
  renderizar(resultado);
}

// ===== PERSISTÊNCIA (localStorage) =====
function salvar() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
}

function carregar() {
  const dados = localStorage.getItem("tarefas");
  if (dados) tarefas = JSON.parse(dados);
}

// ===== UTIL =====
function formatarData(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

// ===== LIGAÇÃO COM O DOM =====
document.addEventListener("DOMContentLoaded", () => {
  carregar();
  aplicarFiltrosEOrdenar();

  // Formulário de adicionar
  const form = document.getElementById("form-tarefa");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = document.getElementById("input-texto").value.trim();
    if (!texto) return;

    adicionarTarefa(
      texto,
      document.getElementById("select-prioridade").value,
      document.getElementById("select-categoria").value,
      document.getElementById("input-vencimento").value
    );
    form.reset();
  });

  // Busca
  document.getElementById("input-busca").addEventListener("input", (e) => {
    valorDaBusca = e.target.value;
    aplicarFiltrosEOrdenar();
  });

  // Filtro categoria
  document
    .getElementById("filtro-categoria")
    .addEventListener("change", (e) => {
      categoriaEscolhida = e.target.value;
      aplicarFiltrosEOrdenar();
    });

  // Filtro status
  document.getElementById("filtro-status").addEventListener("change", (e) => {
    statusEscolhido = e.target.value;
    aplicarFiltrosEOrdenar();
  });
});
