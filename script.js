// ======================= CONFIGURAÇÃO FIREBASE ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCmZBxRVcmTPJFLdWWcNd07LZPJYZnR5N0",
  authDomain: "portaria-e22ae.firebaseapp.com",
  projectId: "portaria-e22ae",
  storageBucket: "portaria-e22ae.firebasestorage.app",
  messagingSenderId: "663485115589",
  appId: "1:663485115589:web:b1c2fa0c96a2664aa88d7d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const registrosRef = collection(db, "registros_portaria");

// ======================= REGISTRAR ENTRADA ==========================
document.getElementById("formEntrada").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const documento = document.getElementById("documento").value.trim();
  const veiculo = document.getElementById("veiculo").value.trim();
  const destino = document.getElementById("destino").value.trim();
  const motivo = document.getElementById("motivo").value.trim();
  const horarioEntrada = new Date().toLocaleString("pt-BR");

  if (!nome || !documento || !motivo) {
    alert("Preencha pelo menos nome, documento e motivo.");
    return;
  }

  try {
    await addDoc(registrosRef, {
      nome,
      documento,
      veiculo,
      destino,
      motivo,
      status: "Entrada",
      horarioEntrada,
      horarioSaida: "",
      criadoEm: serverTimestamp(),
    });

    document.getElementById("formEntrada").reset();
    alert("Entrada registrada com sucesso!");
  } catch (erro) {
    console.error("Erro ao registrar entrada:", erro);
    alert("Erro ao registrar entrada. Verifique o console.");
  }
});

// ======================= REGISTRAR SAÍDA ==========================
async function registrarSaida(id) {
  const docRef = doc(db, "registros_portaria", id);
  const horarioSaida = new Date().toLocaleString("pt-BR");
  await updateDoc(docRef, { status: "Saída", horarioSaida });
  alert("Saída registrada!");
}
window.registrarSaida = registrarSaida;

// ======================= FUNÇÃO PARA PARSEAR DATAS ==========================
function parseBRDateString(ptBr) {
  if (!ptBr) return null;
  const parts = String(ptBr).trim().split(" ");
  const datePart = parts[0]; // "dd/mm/yyyy"
  const timePart = parts[1] || "00:00:00";
  const [dd, mm, yyyy] = datePart.split("/");
  if (!dd || !mm || !yyyy) return null;
  const iso = `${yyyy}-${mm}-${dd}T${timePart}`;
  const dt = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
}

// ======================= VARIÁVEIS DE FILTRO ==========================
let todosRegistros = [];
let filtroStatus = "Todos";
let filtroBusca = "";
let filtroData = "todos";
let dataInicio = null;
let dataFim = null;

// ======================= CARREGAR E MONITORAR REGISTROS ==========================
function carregarRegistros() {
  const q = query(registrosRef, orderBy("criadoEm", "desc"));
  onSnapshot(q, (snapshot) => {
    todosRegistros = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let criadoEmDate = null;
      if (data.criadoEm && typeof data.criadoEm.toDate === "function") {
        criadoEmDate = data.criadoEm.toDate();
      } else {
        criadoEmDate = parseBRDateString(data.horarioEntrada);
      }
      todosRegistros.push({ id: docSnap.id, criadoEmDate, ...data });
    });
    renderizarTabela();
  });
}

// ======================= RENDERIZAR TABELA ==========================
function renderizarTabela() {
  const tabela = document.getElementById("listaRegistros");
  tabela.innerHTML = "";

  const agora = new Date();
  const hojeInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0);
  const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

  let inicioPersonalizado = null;
  let fimPersonalizado = null;
  if (filtroData === "personalizado" && dataInicio && dataFim) {
    inicioPersonalizado = new Date(dataInicio + "T00:00:00");
    fimPersonalizado = new Date(dataFim + "T23:59:59.999");
  }

  const busca = filtroBusca.toLowerCase();

  const filtrados = todosRegistros.filter((r) => {
    const combinaBusca =
      !busca ||
      (r.nome && r.nome.toLowerCase().includes(busca)) ||
      (r.documento && r.documento.toLowerCase().includes(busca));

    const combinaStatus = filtroStatus === "Todos" || r.status === filtroStatus;

    const dataEntrada = r.criadoEmDate;
    let combinaData = true;
    if (filtroData === "hoje") {
      if (!dataEntrada) return false;
      combinaData = dataEntrada >= hojeInicio;
    } else if (filtroData === "7dias") {
      if (!dataEntrada) return false;
      combinaData = dataEntrada >= seteDiasAtras;
    } else if (filtroData === "personalizado") {
      if (!inicioPersonalizado || !fimPersonalizado) return false;
      combinaData = dataEntrada >= inicioPersonalizado && dataEntrada <= fimPersonalizado;
    }

    return combinaBusca && combinaStatus && combinaData;
  });

  if (filtrados.length === 0) {
    tabela.innerHTML = `<tr><td colspan="8" class="text-muted">Nenhum registro encontrado</td></tr>`;
    return;
  }

  filtrados.forEach((registro) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${registro.nome || ""}</td>
      <td>${registro.documento || ""}</td>
      <td>${registro.veiculo || ""}</td>
      <td>${registro.destino || ""}</td>
      <td>${registro.motivo || ""}</td>
      <td><span class="badge ${registro.status === "Entrada" ? "bg-success" : "bg-secondary"}">${registro.status}</span></td>
      <td>${registro.horarioEntrada || ""}</td>
      <td>
        ${registro.horarioSaida
          ? registro.horarioSaida
          : `<button class="btn btn-warning btn-sm" onclick="registrarSaida('${registro.id}')">Registrar Saída</button>`}
      </td>
    `;
    tabela.appendChild(linha);
  });
}

// ======================= CONTROLES DE FILTRO ==========================
document.getElementById("filtroTodos").onclick = () => {
  filtroStatus = "Todos";
  renderizarTabela();
};
document.getElementById("filtroEntrada").onclick = () => {
  filtroStatus = "Entrada";
  renderizarTabela();
};
document.getElementById("filtroSaida").onclick = () => {
  filtroStatus = "Saída";
  renderizarTabela();
};

document.getElementById("filtroBusca").oninput = (e) => {
  filtroBusca = e.target.value.toLowerCase();
  renderizarTabela();
};

const filtroDataEl = document.getElementById("filtroData");
const intervaloDatasEl = document.getElementById("intervaloDatas");
const dataInicioEl = document.getElementById("dataInicio");
const dataFimEl = document.getElementById("dataFim");

filtroDataEl.onchange = () => {
  filtroData = filtroDataEl.value;
  intervaloDatasEl.classList.toggle("d-none", filtroData !== "personalizado");
  if (filtroData !== "personalizado") {
    dataInicio = null;
    dataFim = null;
    renderizarTabela();
  }
};

document.getElementById("btnAplicarData").onclick = () => {
  dataInicio = dataInicioEl.value;
  dataFim = dataFimEl.value;
  renderizarTabela();
};

// ======================= INICIAR ==========================
carregarRegistros();
