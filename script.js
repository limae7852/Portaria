// script.js (modular, com logs)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// --- CONFIG: substitua se necessário ---
const firebaseConfig = {
  apiKey: "AIzaSyCmZBxRVcmTPJFLdWWcNd07LZPJYZnR5N0",
  authDomain: "portaria-e22ae.firebaseapp.com",
  projectId: "portaria-e22ae",
  storageBucket: "portaria-e22ae.firebasestorage.app",
  messagingSenderId: "663485115589",
  appId: "1:663485115589:web:b1c2fa0c96a2664aa88d7d"
};

// --- Inicializa ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const registrosRef = collection(db, 'registros_portaria');

// --- UI refs ---
const statusEl = document.getElementById('status');
const logEl = document.getElementById('consoleLog');
const form = document.getElementById('formEntrada');

function log(msg){
  const ts = new Date().toLocaleTimeString();
  logEl.textContent = `[${ts}] ${msg}\n` + logEl.textContent;
  console.log(msg);
}
function setStatus(text, type='secondary'){
  statusEl.className = 'alert alert-' + type;
  statusEl.textContent = 'Status: ' + text;
}

// --- Form submit handler ---
form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  setStatus('Gravando...', 'info');

  const nome = document.getElementById('nome').value.trim();
  const documento = document.getElementById('documento').value.trim();
  const motivo = document.getElementById('motivo').value.trim();

  if(!nome || !documento){
    setStatus('Nome e documento obrigatórios', 'warning');
    log('Validação falhou: campos vazios');
    return;
  }

  const payload = {
    nome,
    documento,
    motivo: motivo || null,
    horarioEntrada: new Date().toLocaleString('pt-BR'),
    horarioSaida: null,
    status: 'Entrada',
    criadoEm: serverTimestamp()
  };

  try {
    log('Tentando salvar payload: ' + JSON.stringify(payload));
    const ref = await addDoc(registrosRef, payload);
    log('Sucesso. ID: ' + ref.id);
    setStatus('Gravado com sucesso (id: ' + ref.id + ')', 'success');
    form.reset();
  } catch (err) {
    const em = err?.message || String(err);
    log('Erro ao gravar: ' + em);
    // Checagens específicas de erro comum
    if (em.includes('permission-denied')) {
      setStatus('Permissão negada — verifique regras do Firestore.', 'danger');
    } else if (em.includes('Invalid project ID') || em.includes('auth domain') || em.includes('network')) {
      setStatus('Erro de configuração ou rede. Veja console.', 'danger');
    } else {
      setStatus('Erro ao gravar: ' + em, 'danger');
    }
  }
});

// --- small startup checks ---
log('Script carregado. Verificando Firestore...');
try {
  // só um log de sanity
  if (!firebaseConfig || !firebaseConfig.projectId) {
    setStatus('Firebase config ausente. Verifique firebaseConfig.', 'danger');
    log('firebaseConfig ausente ou inválido.');
  } else {
    log('firebaseConfig detectado (projectId=' + firebaseConfig.projectId + '). Firestore pronto.');
    setStatus('Pronto. Preencha o formulário e clique Registrar.', 'secondary');
  }
} catch(e){
  log('Erro startup: ' + e.message);
  setStatus('Erro no startup. Veja console.', 'danger');
}
