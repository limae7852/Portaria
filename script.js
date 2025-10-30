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

// ================= FUNÇÃO: REGISTRAR ENTRADA =================
async function registrarEntrada() {
  const nome = document.getElementById("nome").value.trim();
  const documento = document.getElementById("documento").value.trim();
  const veiculo = document.getElementById("veiculo").value.trim();
  const destino = document.getElementById("destino").value.trim();
  const motivo = document.getElementById("motivo").value.trim();

  if (!nome || !documento) {
    alert("⚠️ Nome e Documento são obrigatórios!");
    return;
  }

  const dados = {
    nome,
    documento,
    veiculo: veiculo || null,
    destino: destino || null,
    motivo: motivo || null,
    horarioEntrada: new Date().toLocaleString("pt-BR"),
    horarioSaida: null,
    status: "Entrada",
    criadoEm: serverTimestamp()
  };

  try {
    await addDoc(registrosRef, dados);
    alert("✅ Entrada registrada com sucesso!");
    limparCampos();
  } catch (error) {
    console.error("Erro ao gravar no Firestore:", error);
    alert("❌ Erro ao salvar dados. Verifique o console.");
  }
}

// ================= FUNÇÃO: REGISTRAR SAÍDA =================
async function registrarSaida(id) {
  try {
    const docRef = doc(db, "registros_portaria", id);
    await updateDoc(docRef, {
      horarioSaida: new Date().toLocaleString("pt-BR"),
      status: "Saída"
    });
    alert("🚪 Saída registrada com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar registro:", error);
    alert("❌ Erro ao registrar saída.");
  }
}

// ================= FUNÇÃO: LISTAR REGISTROS EM TEMPO REAL =================
function carregarRegistrosTempoReal() {
  const tabela = document.getElementById("listaRegistros");
  const q = query(registrosRef, orderBy("criadoEm", "desc"));

  onSnapshot(q, (snapshot) => {
    tabela.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const registro = docSnap.data();
      const id = docSnap.id;

      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td>${registro.nome || ""}</td>
        <td>${registro.documento || ""}</td>
        <td>${registro.veiculo || ""}</td>
        <td>${registro.destino || ""}</td>
        <td>${registro.motivo || ""}</td>
        <td>
          <span class="badge ${registro.status === "Entrada" ? "bg-success" : "bg-secondary"}">
            ${registro.status}
          </span>
        </td>
        <td>${registro.horarioEntrada || ""}</td>
        <td>${registro.horarioSaida ? registro.horarioSaida : `
          <button class="btn btn-warning btn-sm" onclick="registrarSaida('${id}')">
            Registrar Saída
          </button>`}
        </td>
      `;
      tabela.appendChild(linha);
    });
  });
}

// ================= UTILITÁRIOS =================
function limparCampos() {
  ["nome", "documento", "veiculo", "destino", "motivo"].forEach(id => {
    document.getElementById(id).value = "";
  });
}

// ================= EVENTOS =================
document.getElementById("btnRegistrar").addEventListener("click", registrarEntrada);
document.getElementById("btnLimpar").addEventListener("click", limparCampos);

// Torna a função global (para ser chamada pelo botão da tabela)
window.registrarSaida = registrarSaida;

// ================= INICIALIZA =================
carregarRegistrosTempoReal();
