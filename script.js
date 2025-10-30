// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, updateDoc, doc,
  onSnapshot, serverTimestamp, orderBy, query
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ================= CONFIGURAÇÃO FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyCmZBxRVcmTPJFLdWWcNd07LZPJYZnR5N0",
  authDomain: "portaria-e22ae.firebaseapp.com",
  projectId: "portaria-e22ae",
  storageBucket: "portaria-e22ae.firebasestorage.app",
  messagingSenderId: "663485115589",
  appId: "1:663485115589:web:4b2f860ede7f0f7b5854ac",
  measurementId: "G-QEGQN6CTBB"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const registrosRef = collection(db, "registros_portaria");

// ================= FUNÇÕES =================

// Registrar entrada
async function registrarEntrada() {
  const nome = nomeEl.value.trim();
  const documento = documentoEl.value.trim();
  if (!nome || !documento) return alert("⚠️ Nome e Documento são obrigatórios!");

  const dados = {
    nome,
    documento,
    veiculo: veiculoEl.value || null,
    destino: destinoEl.value || null,
    motivo: motivoEl.value || null,
    horarioEntrada: new Date().toLocaleString("pt-BR"),
    horarioSaida: null,
    status: "Entrada",
    criadoEm: serverTimestamp()
  };

  await addDoc(registrosRef, dados);
  alert("✅ Entrada registrada!");
  limparCampos();
}

// Registrar saída
async function registrarSaida(id) {
  const docRef = doc(db, "registros_portaria", id);
  await updateDoc(docRef, {
    horarioSaida: new Date().toLocaleString("pt-BR"),
    status: "Saída"
  });
  alert("🚪 Saída registrada!");
}

// Atualizar em tempo real
let todosRegistros = [];
function carregarRegistros() {
  const q = query(registrosRef, orderBy("criadoEm", "desc"));
  onSnapshot(q, (snapshot) => {
    todosRegistros = [];
    snapshot.forEach((docSnap) => todosRegistros.push({ id: docSnap.id, ...docSnap.data() }));
    renderizarTabela();
  });
}

// ================= FILTROS =================
let filtroStatus = "Todos";
let filtroBusca = "";
let filtroData = "todos";
let dataInicio = null;
let dataFim = null;

function renderizarTabela() {
  const tabela = document.getElementById("listaRegistros");
  tabela.innerHTML = "";

  const agora = new Date();
  const hojeInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const seteDiasAtras = new Date(agora.getTime() - 7 * 86400000);

  const filtrados = todosRegistros.filter(r => {
    const combinaBusca = r.nome?.toLowerCase().includes(filtroBusca) || r.documento?.toLowerCase().includes(filtroBusca);
    const combinaStatus = filtroStatus === "Todos" || r.status === filtroStatus;

    // Conversão segura para data
    const dataEntrada = r.horarioEntrada ? new Date(r.horarioEntrada.split("/").reverse().join("-")) : null;

    let combinaData = true;
    if (filtroData === "hoje") combinaData = dataEntrada >= hojeInicio;
    if (filtroData === "7dias") combinaData = dataEntrada >= seteDiasAtras;
    if (filtroData === "personalizado" && dataInicio && dataFim) {
      combinaData = dataEntrada >= new Date(dataInicio) && dataEntrada <= new Date(dataFim);
    }

    return combinaBusca && combinaStatus && combinaData;
  });

  if (filtrados.length === 0) {
    tabela.innerHTML = `<tr><td colspan="8" class="text-muted">Nenhum registro encontrado</td></tr>`;
    return;
  }

  filtrados.forEach((r) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${r.nome || ""}</td>
      <td>${r.documento || ""}</td>
      <td>${r.veiculo || ""}</td>
      <td>${r.destino || ""}</td>
      <td>${r.motivo || ""}</td>
      <td><span class="badge ${r.status === "Entrada" ? "bg-success" : "bg-secondary"}">${r.status}</span></td>
      <td>${r.horarioEntrada || ""}</td>
      <td>${r.horarioSaida ? r.horarioSaida : `<button class="btn btn-warning btn-sm" onclick="registrarSaida('${r.id}')">Registrar Saída</button>`}</td>
    `;
    tabela.appendChild(linha);
  });
}

// ================= UTILITÁRIOS =================
const nomeEl = document.getElementById("nome");
const documentoEl = document.getElementById("documento");
const veiculoEl = document.getElementById("veiculo");
const destinoEl = document.getElementById("destino");
const motivoEl = document.getElementById("motivo");

function limparCampos() {
  [nomeEl, documentoEl, veiculoEl, destinoEl, motivoEl].forEach(el => el.value = "");
}

// ================= EVENTOS =================
document.getElementById("btnRegistrar").onclick = registrarEntrada;
document.getElementById("btnLimpar").onclick = limparCampos;

// Filtros básicos
document.getElementById("filtroTodos").onclick = () => { filtroStatus = "Todos"; renderizarTabela(); };
document.getElementById("filtroEntrada").onclick = () => { filtroStatus = "Entrada"; renderizarTabela(); };
document.getElementById("filtroSaida").onclick = () => { filtroStatus = "Saída"; renderizarTabela(); };
document.getElementById("filtroBusca").oninput = e => { filtroBusca = e.target.value.toLowerCase(); renderizarTabela(); };

// Filtro de data
const filtroDataEl = document.getElementById("filtroData");
const intervaloDatasEl = document.getElementById("intervaloDatas");
const dataInicioEl = document.getElementById("dataInicio");
const dataFimEl = document.getElementById("dataFim");

filtroDataEl.onchange = () => {
  filtroData = filtroDataEl.value;
  intervaloDatasEl.classList.toggle("d-none", filtroData !== "personalizado");
  if (filtroData !== "personalizado") renderizarTabela();
};

document.getElementById("btnAplicarData").onclick = () => {
  dataInicio = dataInicioEl.value;
  dataFim = dataFimEl.value;
  renderizarTabela();
};

// ================= INICIALIZA =================
window.registrarSaida = registrarSaida;
carregarRegistros();
