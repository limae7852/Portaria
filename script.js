// Importando módulos do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// 🔥 Configuração do Firebase (use seus dados)
const firebaseConfig = {
  apiKey: "AIzaSyCmZBxRVcmTPJFLdWWcNd07LZPJYZnR5N0",
  authDomain: "portaria-e22ae.firebaseapp.com",
  projectId: "portaria-e22ae",
  storageBucket: "portaria-e22ae.firebasestorage.app",
  messagingSenderId: "663485115589",
  appId: "1:663485115589:web:dfb6ad9e43b8f5be049ec5"
};

// Inicializa Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referência para a coleção "visitantes"
const visitantesRef = collection(db, "visitantes");

// Função para adicionar entrada no Firestore
async function registrarEntrada() {
  const nome = document.getElementById("nome").value.trim();
  const documento = document.getElementById("documento").value.trim();
  const empresa = document.getElementById("empresa").value.trim();

  if (!nome || !documento || !empresa) {
    alert("Preencha todos os campos!");
    return;
  }

  try {
    const data = new Date();
    const hora = data.toLocaleString("pt-BR");

    await addDoc(visitantesRef, {
      nome,
      documento,
      empresa,
      dataHora: hora
    });

    document.getElementById("nome").value = "";
    document.getElementById("documento").value = "";
    document.getElementById("empresa").value = "";
    alert("✅ Entrada registrada com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar no banco:", error);
  }
}

// Função para exibir visitantes em tempo real
function carregarVisitantesTempoReal() {
  const tabela = document.getElementById("listaVisitantes");

  onSnapshot(visitantesRef, (snapshot) => {
    tabela.innerHTML = ""; // Limpa antes de recarregar
    snapshot.forEach((doc) => {
      const visitante = doc.data();
      const linha = `
        <tr>
          <td>${visitante.nome}</td>
          <td>${visitante.documento}</td>
          <td>${visitante.empresa}</td>
          <td>${visitante.dataHora}</td>
        </tr>`;
      tabela.innerHTML += linha;
    });
  });
}

// Eventos
document.getElementById("registrarEntrada").addEventListener("click", registrarEntrada);
document.getElementById("limpar").addEventListener("click", () => {
  document.getElementById("nome").value = "";
  document.getElementById("documento").value = "";
  document.getElementById("empresa").value = "";
});

// Carrega automaticamente ao abrir
carregarVisitantesTempoReal();
