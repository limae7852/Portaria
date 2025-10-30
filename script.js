// ==================== CONFIG FIREBASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyCmZBxRVcmTPJFLdWWcNd07LZPJYZnR5N0",
  authDomain: "portaria-e22ae.firebaseapp.com",
  projectId: "portaria-e22ae",
  storageBucket: "portaria-e22ae.firebasestorage.app",
  messagingSenderId: "663485115589",
  appId: "1:663485115589:web:b1c2fa0c96a2664aa88d7d"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const registrosRef = db.collection("registros_portaria");

// ==================== HELPERS ====================
function parseBRDateString(ptBr) {
  if (!ptBr) return null;
  // aceita "dd/mm/yyyy" ou "dd/mm/yyyy HH:MM:SS"
  const parts = String(ptBr).trim().split(" ");
  const datePart = parts[0];
  const timePart = parts[1] || "00:00:00";
  const d = datePart.split("/");
  if (d.length !== 3) return null;
  const [dd, mm, yyyy] = d;
  const iso = `${yyyy}-${mm}-${dd}T${timePart}`;
  const dt = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

// ==================== ESTADO ====================
let todosRegistros = [];
let filtroStatus = "Todos", filtroBusca = "", filtroData = "todos", dataInicio = null, dataFim = null;

// ==================== DOM refs ====================
const listaEl = document.getElementById("listaRegistros");
const contadorEl = document.getElementById("contadorDentro");
const filtroBuscaEl = document.getElementById("filtroBusca");
const filtroDataEl = document.getElementById("filtroData");
const intervaloDatasEl = document.getElementById("intervaloDatas");
const dataInicioEl = document.getElementById("dataInicio");
const dataFimEl = document.getElementById("dataFim");
const btnExportCSV = document.getElementById("btnExportCSV");

// ==================== CRUD ====================
document.getElementById("formEntrada").onsubmit = async (e) => {
  e.preventDefault();
  const nome = document.getElementById("nome").value.trim();
  const documento = document.getElementById("documento").value.trim();
  const veiculo = document.getElementById("veiculo").value.trim();
  const destino = document.getElementById("destino").value.trim();
  const motivo = document.getElementById("motivo").value.trim();

  if (!nome || !documento) { alert("Nome e Documento são obrigatórios"); return; }

  const dados = {
    nome,
    documento,
    veiculo: veiculo || null,
    destino: destino || null,
    motivo: motivo || null,
    status: "Entrada",
    horarioEntrada: new Date().toLocaleString("pt-BR"),
    horarioSaida: "",
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await registrosRef.add(dados);
    document.getElementById("formEntrada").reset();
  } catch (err) {
    console.error("Erro ao salvar:", err);
    alert("Erro ao salvar (ver console).");
  }
};

window.registrarSaida = async function (id) {
  try {
    const docRef = registrosRef.doc(id);
    await docRef.update({ status: "Saída", horarioSaida: new Date().toLocaleString("pt-BR") });
  } catch (err) {
    console.error("Erro ao registrar saída:", err);
    alert("Erro ao registrar saída.");
  }
};

document.getElementById("btnLimpar").onclick = () => {
  ["nome","documento","veiculo","destino","motivo"].forEach(id => document.getElementById(id).value = "");
};

// ==================== CARREGAR / OBSERVAR ====================
function carregarRegistros() {
  registrosRef.orderBy("criadoEm", "desc").onSnapshot(snap => {
    todosRegistros = [];
    snap.forEach(doc => {
      const data = doc.data();
      let criadoEmDate = null;
      if (data.criadoEm && typeof data.criadoEm.toDate === "function") {
        criadoEmDate = data.criadoEm.toDate();
      } else {
        criadoEmDate = parseBRDateString(data.horarioEntrada);
      }
      todosRegistros.push({ id: doc.id, criadoEmDate, ...data });
    });
    atualizarContador();
    renderizarTabela();
  }, err => {
    console.error("onSnapshot erro:", err);
  });
}

// ==================== FILTRAGEM / RENDER ====================
function renderizarTabela() {
  listaEl.innerHTML = "";
  const agora = new Date();
  const hojeInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0);
  const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

  let inicioCustom = null, fimCustom = null;
  if (filtroData === "personalizado" && dataInicio && dataFim) {
    inicioCustom = new Date(dataInicio + "T00:00:00");
    fimCustom = new Date(dataFim + "T23:59:59.999");
  }

  const busca = (filtroBusca || "").toLowerCase();

  const filtrados = todosRegistros.filter(r => {
    const combinaBusca = !busca ||
      (r.nome && r.nome.toLowerCase().includes(busca)) ||
      (r.documento && r.documento.toLowerCase().includes(busca));

    const combinaStatus = filtroStatus === "Todos" || r.status === filtroStatus;

    const d = r.criadoEmDate;
    if (!d && (filtroData === "hoje" || filtroData === "7dias" || filtroData === "personalizado")) return false;

    let combinaData = true;
    if (filtroData === "hoje") combinaData = d >= hojeInicio && isSameDay(d, agora);
    else if (filtroData === "7dias") combinaData = d >= seteDiasAtras;
    else if (filtroData === "personalizado") combinaData = inicioCustom && fimCustom && d >= inicioCustom && d <= fimCustom;

    return combinaBusca && combinaStatus && combinaData;
  });

  if (filtrados.length === 0) {
    listaEl.innerHTML = `<tr><td colspan="8" class="text-muted">Nenhum registro encontrado</td></tr>`;
    return;
  }

  filtrados.forEach(r => {
    const tr = document.createElement("tr");

    // destaque se for hoje
    const hoje = r.criadoEmDate && isSameDay(r.criadoEmDate, new Date());
    if (hoje) tr.classList.add("hoje");

    tr.innerHTML = `
      <td>${r.nome || ""}</td>
      <td>${r.documento || ""}</td>
      <td>${r.veiculo || ""}</td>
      <td>${r.destino || ""}</td>
      <td>${r.motivo || ""}</td>
      <td><span class="badge ${r.status === "Entrada" ? "bg-success" : "bg-secondary"}">${r.status}</span></td>
      <td>${r.horarioEntrada || ""}</td>
      <td>${r.horarioSaida ? r.horarioSaida : `<button class="btn btn-warning btn-sm" onclick="registrarSaida('${r.id}')">Registrar Saída</button>`}</td>
    `;
    listaEl.appendChild(tr);
  });
}

// ==================== CONTADOR (entradas sem saída) ====================
function atualizarContador() {
  const dentro = todosRegistros.reduce((acc, r) => {
    const estaDentro = r.status === "Entrada" && (!r.horarioSaida || r.horarioSaida === "");
    return acc + (estaDentro ? 1 : 0);
  }, 0);
  contadorEl.textContent = `Dentro: ${dentro}`;
}

// ==================== FILTRO CONTROLES ====================
document.getElementById("filtroTodos").onclick = () => { filtroStatus = "Todos"; renderizarTabela(); };
document.getElementById("filtroEntrada").onclick = () => { filtroStatus = "Entrada"; renderizarTabela(); };
document.getElementById("filtroSaida").onclick = () => { filtroStatus = "Saída"; renderizarTabela(); };

filtroBuscaEl.oninput = (e) => { filtroBusca = e.target.value.trim(); renderizarTabela(); };

filtroDataEl.onchange = () => {
  filtroData = filtroDataEl.value;
  intervaloDatasEl.classList.toggle("d-none", filtroData !== "personalizado");
  if (filtroData !== "personalizado") { dataInicio = null; dataFim = null; renderizarTabela(); }
};

document.getElementById("btnAplicarData").onclick = () => {
  dataInicio = dataInicioEl.value;
  dataFim = dataFimEl.value;
  renderizarTabela();
};

// ==================== EXPORT CSV ====================
function registrosFiltradosAtuais() {
  // reuse renderizar logic to compute current filtered list (but return array)
  const agora = new Date();
  const hojeInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0);
  const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
  let inicioCustom = null, fimCustom = null;
  if (filtroData === "personalizado" && dataInicio && dataFim) {
    inicioCustom = new Date(dataInicio + "T00:00:00");
    fimCustom = new Date(dataFim + "T23:59:59.999");
  }
  const busca = (filtroBusca || "").toLowerCase();

  return todosRegistros.filter(r => {
    const combinaBusca = !busca ||
      (r.nome && r.nome.toLowerCase().includes(busca)) ||
      (r.documento && r.documento.toLowerCase().includes(busca));
    const combinaStatus = filtroStatus === "Todos" || r.status === filtroStatus;
    const d = r.criadoEmDate;
    if (!d && (filtroData === "hoje" || filtroData === "7dias" || filtroData === "personalizado")) return false;
    let combinaData = true;
    if (filtroData === "hoje") combinaData = d >= hojeInicio && isSameDay(d, agora);
    else if (filtroData === "7dias") combinaData = d >= seteDiasAtras;
    else if (filtroData === "personalizado") combinaData = inicioCustom && fimCustom && d >= inicioCustom && d <= fimCustom;
    return combinaBusca && combinaStatus && combinaData;
  });
}

btnExportCSV.onclick = () => {
  const dados = registrosFiltradosAtuais();
  if (!dados.length) { alert("Nenhum registro para exportar."); return; }

  const headers = ["id","nome","documento","veiculo","destino","motivo","status","horarioEntrada","horarioSaida","criadoEm"];
  const rows = dados.map(r => {
    const criado = r.criadoEmDate ? r.criadoEmDate.toLocaleString("pt-BR") : "";
    return headers.map(h => {
      if (h === "id") return r.id;
      if (h === "criadoEm") return criado;
      return (r[h] !== undefined && r[h] !== null) ? String(r[h]).replace(/"/g, '""') : "";
    }).map(cell => `"${cell}"`).join(",");
  });

  const csv = `"${headers.join('","')}"\n` + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const now = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
  a.download = `registros_portaria_${now}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ==================== INICIAR ====================
carregarRegistros();
