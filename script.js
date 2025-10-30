// ==================== FIREBASE ====================
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

// ==================== FUNÇÕES ====================
// Limpar campos
const limparCampos = () => ["nome","documento","veiculo","destino","motivo"].forEach(id=>document.getElementById(id).value="");
document.getElementById("btnLimpar").onclick = limparCampos;

// Registrar entrada
document.getElementById("formEntrada").onsubmit = async (e)=>{
  e.preventDefault();
  const nome=document.getElementById("nome").value.trim();
  const documento=document.getElementById("documento").value.trim();
  if(!nome||!documento){alert("Nome e Documento obrigatórios");return;}
  const dados={
    nome,
    documento,
    veiculo:document.getElementById("veiculo").value||null,
    destino:document.getElementById("destino").value||null,
    motivo:document.getElementById("motivo").value||null,
    status:"Entrada",
    horarioEntrada:new Date().toLocaleString("pt-BR"),
    horarioSaida:"",
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  };
  try{await registrosRef.add(dados);limparCampos();}catch(err){console.error(err);alert("Erro ao registrar");}
};

// Registrar saída
window.registrarSaida=async (id)=>{
  const docRef=registrosRef.doc(id);
  await docRef.update({status:"Saída",horarioSaida:new Date().toLocaleString("pt-BR")});
};

// ==================== PARSE DATA PT-BR ====================
function parseBRDateString(ptBr){
  if(!ptBr)return null;
  const [d,m,y]=ptBr.split("/"); if(!d||!m||!y)return null;
  return new Date(`${y}-${m}-${d}`);
}

// ==================== FILTROS ====================
let todosRegistros=[],filtroStatus="Todos",filtroBusca="",filtroData="todos",dataInicio=null,dataFim=null;

// Carregar registros
function carregarRegistros(){
  registrosRef.orderBy("criadoEm","desc").onSnapshot(snap=>{
    todosRegistros=[];
    snap.forEach(doc=>{
      const data=doc.data();
      let criadoEmDate=null;
      if(data.criadoEm&&data.criadoEm.toDate)criadoEmDate=data.criadoEm.toDate();
      else criadoEmDate=parseBRDateString(data.horarioEntrada);
      todosRegistros.push({...data,id:doc.id,criadoEmDate});
    });
    renderizarTabela();
  });
}

// Renderizar tabela
function renderizarTabela(){
  const tabela=document.getElementById("listaRegistros");tabela.innerHTML="";
  const agora=new Date();
  const hojeInicio=new Date(agora.getFullYear(),agora.getMonth(),agora.getDate());
  const seteDiasAtras=new Date(agora.getTime()-7*24*60*60*1000);
  let inicio=null,fim=null;
  if(filtroData==="personalizado"&&dataInicio&&dataFim){inicio=new Date(dataInicio+"T00:00:00");fim=new Date(dataFim+"T23:59:59");}
  const busca=filtroBusca.toLowerCase();
  const filtrados=todosRegistros.filter(r=>{
    const combinaBusca=!busca||(r.nome&&r.nome.toLowerCase().includes(busca))||(r.documento&&r.documento.toLowerCase().includes(busca));
    const combinaStatus=filtroStatus==="Todos"||r.status===filtroStatus;
    const dataEntrada=r.criadoEmDate;
    let combinaData=true;
    if(filtroData==="hoje")combinaData=dataEntrada>=hojeInicio;
    else if(filtroData==="7dias")combinaData=dataEntrada>=seteDiasAtras;
    else if(filtroData==="personalizado"&&inicio&&fim)combinaData=dataEntrada>=inicio&&dataEntrada<=fim;
    return combinaBusca&&combinaStatus&&combinaData;
  });
  if(filtrados.length===0){tabela.innerHTML='<tr><td colspan="8" class="text-muted">Nenhum registro encontrado</td></tr>';return;}
  filtrados.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${r.nome||""}</td><td>${r.documento||""}</td><td>${r.veiculo||""}</td><td>${r.destino||""}</td><td>${r.motivo||""}</td>
    <td><span class="badge ${r.status==="Entrada"?"bg-success":"bg-secondary"}">${r.status}</span></td>
    <td>${r.horarioEntrada||""}</td>
    <td>${r.horarioSaida?r.horarioSaida:`<button class="btn btn-warning btn-sm" onclick="registrarSaida('${r.id}')">Registrar Saída</button>`}</td>`;
    tabela.appendChild(tr);
  });
}

// ==================== EVENTOS FILTRO ====================
document.getElementById("filtroTodos").onclick=()=>{filtroStatus="Todos";renderizarTabela();};
document.getElementById("filtroEntrada").onclick=()=>{filtroStatus="Entrada";renderizarTabela();};
document.getElementById("filtroSaida").onclick=()=>{filtroStatus="Saída";renderizarTabela();};
document.getElementById("filtroBusca").oninput=(e)=>{filtroBusca=e.target.value.toLowerCase();renderizarTabela();};
const filtroDataEl=document.getElementById("filtroData");
const intervaloDatasEl=document.getElementById("intervaloDatas");
const dataInicioEl=document.getElementById("dataInicio");
const dataFimEl=document.getElementById("dataFim");
filtroDataEl.onchange=()=>{filtroData=filtroDataEl.value;intervaloDatasEl.classList.toggle("d-none",filtroData!=="personalizado");if(filtroData!=="personalizado"){dataInicio=null;dataFim=null;renderizarTabela();}};
document.getElementById("btnAplicarData").onclick=()=>{dataInicio=dataInicioEl.value;dataFim=dataFimEl.value;renderizarTabela();};

// ==================== INICIAR ====================
carregarRegistros();
