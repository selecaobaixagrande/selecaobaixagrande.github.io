const SUPABASE_URL='https://lvxwziztdngntoqypzga.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_iCXNkHI8bgQ4c9BEVE9M3A_wOY1tvzY';
const supabaseClient=window.supabase?.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'selecaobg-app-auth'}})||null;
const app=document.getElementById('app'),dashboard=document.getElementById('dashboard'),screen=document.getElementById('screen');
let session=null,role='coach',authBusy=false,loginBound=false,liveChannel=null,authHandling=false,authHandledUser=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtDate=v=>v?new Date(v+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
const fmtTime=v=>v?String(v).slice(0,5):'';
const empty=m=>'<div class="empty-state">'+esc(m||'Nenhum registro encontrado.')+'</div>';
const today=()=>new Date().toISOString().slice(0,10);
const monthWeekStart=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay());return d.toISOString().slice(0,10)};
function setSync(ok,text){const d=document.getElementById('syncDot'),t=document.getElementById('syncText');if(d)d.className=ok?'sync-ok':'sync-off';if(t)t.textContent=text}

async function q(table,select='*',builder){let x=supabaseClient.from(table).select(select);if(builder)x=builder(x);return await x}
async function save(table,row){return await supabaseClient.from(table).insert(row).select().single()}
async function upd(table,id,row){return await supabaseClient.from(table).update(row).eq('id',id)}
async function del(table,id){return await supabaseClient.from(table).delete().eq('id',id)}
async function count(table,builder){let x=supabaseClient.from(table).select('*',{count:'exact',head:true});if(builder)x=builder(x);return await x}

async function coachGuard(){
  if(!session)return false;
  const [a,s,p]=await Promise.all([
    q('admin_users','user_id',x=>x.eq('user_id',session.user.id).maybeSingle()),
    q('professores_app','id,nome,ativo',x=>x.eq('user_id',session.user.id).eq('ativo',true).maybeSingle()),
    q('Perfis','Tipo',x=>x.eq('Email',session.user.email).maybeSingle())
  ]);
  role=a.data?'admin':(s.data||String(p.data?.Tipo||'').toLowerCase()==='treinador'?'coach':'none');
  return role!=='none';
}
async function categories(){const r=await q('categorias_app','id,nome,ativo',x=>x.eq('ativo',true).order('nome'));return r.data||[]}
async function athletes(){const r=await q('Atletas','id,nome,categoria,posicao,numero_camisa,foto,jogos,gols,assistencias,presencas,faltas_treino,telefone_responsavel,status,observacoes,observacoes_treinador',x=>x.order('categoria').order('nome').limit(500));if(!r.error&&r.data?.length)return r.data;const p=await q('atletas_publicos','id,nome,categoria,posicao,numero_camisa,foto,jogos,titularidades,gols,assistencias',x=>x.order('categoria').order('nome').limit(500));return (p.data||[]).map(a=>({...a,presencas:0,faltas_treino:0,status:'Ativo'}))}
function catOptions(rows,selected=''){return '<option value="">Todas as categorias</option>'+rows.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===selected?'selected':'')+'>'+esc(x.nome)+'</option>').join('')}
function athleteOptions(rows,selected=[]){const set=new Set(selected);return rows.map(x=>'<option value="'+esc(x.id)+'" '+(set.has(x.id)?'selected':'')+'>'+esc(x.nome)+' — '+esc(x.categoria||'')+'</option>').join('')}

async function loadDashboard(){
  if(!dashboard)return;
  const [a,t,c,p,ptotal,n,e]=await Promise.all([
    count('Atletas',x=>x.eq('status','Ativo')),
    count('treinos',x=>x.gte('data_treino',today()).lt('data_treino',new Date(Date.now()+8*86400000).toISOString().slice(0,10))),
    count('chamadas',x=>x.eq('status','aberta')),
    count('presencas_treino',x=>x.eq('status','presente')),
    count('presencas_treino'),
    count('avisos_internos',x=>x.eq('ativo',true)),
    q('treinos','id,data_treino,horario,local,objetivo,status,categoria_id',x=>x.gte('data_treino',today()).neq('status','cancelado').order('data_treino').order('horario').limit(1))
  ]);
  const total=a.count||0, present=p.count||0, freq=ptotal.count?Math.round((present/ptotal.count)*100):0;
  dashboard.innerHTML='<div class="section-title"><h2>Painel da comissão</h2></div>'+
    '<div class="stats-grid">'+[['⚽',total,'Atletas ativos'],['🏃',t.count||0,'Treinos próximos'],['✓',c.count||0,'Chamadas abertas'],['●',freq+'%','Frequência registrada']].map(x=>'<article class="stat-card"><span>'+x[0]+'</span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></article>').join('')+'</div>'+
    '<div class="dashboard-grid"><article class="panel-card"><small>PRÓXIMO TREINO</small><h3>'+(e.data?.[0]?fmtDate(e.data[0].data_treino)+' • '+fmtTime(e.data[0].horario):'Nenhum agendado')+'</h3><p>'+(e.data?.[0]?[e.data[0].local,e.data[0].objetivo].filter(Boolean).join(' • '):'Cadastre um treino para acompanhar a preparação.')+'</p><button class="mini-btn" data-screen="training">Abrir treinos</button></article><article class="panel-card"><small>AVISOS INTERNOS</small><h3>'+(n.count||0)+' ativo(s)</h3><p>Comunicados da comissão técnica.</p><button class="mini-btn" data-screen="notices">Abrir avisos</button></article></div>'+
    '<div class="section-title recent-title"><h2>Acesso rápido</h2></div><div class="quick-grid">'+[['calls','Chamadas','Convocar atletas'],['attendance','Presença','Registrar treino'],['evaluations','Avaliações','Avaliar atletas'],['lineups','Escalações','Montar equipe'],['calendar','Calendário','Agenda interna'],['notes','Anotações','Notas técnicas']].map(x=>'<button class="tile" data-screen="'+x[0]+'"><b>'+x[1]+'</b><small>'+x[2]+'</small></button>').join('')+'</div>';
  setSync(![a,t,c,p,ptotal,n,e].some(x=>x?.error),'Banco conectado');
}

function shell(title,desc,body){screen.hidden=false;dashboard.hidden=true;document.querySelector('.hero').hidden=true;screen.innerHTML='<button class="back" data-screen="home">‹ Voltar</button><div class="assistant-head"><div class="assistant-icon">⚽</div><div><h2>'+esc(title)+'</h2><p>'+esc(desc||'')+'</p></div></div>'+body}
function formField(label,input){return '<label class="field"><span>'+esc(label)+'</span>'+input+'</label>'}
function actions(){return '<div class="form-actions"><button type="submit" class="primary-btn">Salvar</button><button type="button" class="mini-btn" data-screen="home">Cancelar</button></div>'}
function normalizeMulti(select){return [...select.selectedOptions].map(x=>x.value)}

async function renderAthletes(){
  const rows=await athletes();
  shell('Atletas','Elenco interno da comissão técnica.','<div class="toolbar"><input id="aSearch" placeholder="Buscar atleta...">'+(role==='admin'?'<button class="mini-btn" id="newAthlete">+ Novo</button>':'')+'</div><div id="aList" class="data-list"></div>');
  const draw=()=>{const term=(document.getElementById('aSearch').value||'').toLowerCase();const list=rows.filter(x=>String(x.nome||'').toLowerCase().includes(term));document.getElementById('aList').innerHTML=list.length?list.map(x=>'<article class="athlete-card">'+(x.foto?'<img class="data-image" src="'+esc(x.foto)+'" alt="">':'<div class="data-image placeholder">⚽</div>')+'<div class="data-body"><small>'+esc(x.categoria||'SEM CATEGORIA')+'</small><h3>'+esc(x.nome)+'</h3><p>'+esc(x.posicao||'Posição não informada')+(x.numero_camisa?' • #'+x.numero_camisa:'')+'</p><div class="athlete-meta"><span>Jogos: '+(x.jogos||0)+'</span><span>Gols: '+(x.gols||0)+'</span><span>Presenças: '+(x.presencas||0)+'</span></div><p class="responsavel"><b>Responsável:</b> '+esc(x.telefone_responsavel||'Não cadastrado')+'</p>'+(role==='admin'?'<button class="mini-btn" data-edit-athlete="'+x.id+'">Editar</button>':'')+' <button class="mini-btn" data-athlete-detail="'+x.id+'">Detalhes</button></div></article>').join(''):empty('Nenhum atleta encontrado.')};
  document.getElementById('aSearch').addEventListener('input',draw);draw();
  document.getElementById('newAthlete')?.addEventListener('click',()=>athleteForm());
  document.getElementById('aList').addEventListener('click',e=>{const b=e.target.closest('[data-edit-athlete]');if(b)athleteForm(rows.find(x=>x.id===b.dataset.editAthlete));const d=e.target.closest('[data-athlete-detail]');if(d)athleteDetail(rows.find(x=>x.id===d.dataset.athleteDetail))});
}
function athleteForm(x=null){
  shell(x?'Editar atleta':'Novo atleta','Dados internos do elenco.',
    '<form id="athleteForm" class="form-grid">'+
    formField('Nome','<input name="nome" required value="'+esc(x?.nome||'')+'">')+
    formField('Categoria','<select name="categoria"><option>Sub-13</option><option>Sub-15</option><option>Sub-17</option><option>Sub-20</option></select>')+
    formField('Posição','<input name="posicao" value="'+esc(x?.posicao||'')+'">')+
    formField('Número','<input name="numero_camisa" type="number" value="'+(x?.numero_camisa??'')+'">')+
    formField('Telefone do responsável','<input name="telefone_responsavel" value="'+esc(x?.telefone_responsavel||'')+'">')+
    formField('Status','<select name="status"><option>Ativo</option><option>Inativo</option></select>')+
    formField('Foto URL','<input name="foto" value="'+esc(x?.foto||'')+'">')+
    formField('Observações internas','<textarea name="observacoes">'+esc(x?.observacoes||'')+'</textarea>')+
    actions()+
    '</form>');
  document.querySelector('[name=categoria]').value=x?.categoria||'Sub-13';
  document.querySelector('[name=status]').value=x?.status||'Ativo';
  document.getElementById('athleteForm').onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.target);
    const row=Object.fromEntries(f.entries());
    row.numero_camisa=row.numero_camisa?Number(row.numero_camisa):null;
    const r=x?await upd('Atletas',x.id,row):await save('Atletas',row);
    if(r.error){alert(r.error.message);return}
    await renderAthletes();
  };
}
function athleteDetail(x){shell(x.nome,'Ficha interna do atleta.','<div class="detail-grid"><div><small>CATEGORIA</small><strong>'+esc(x.categoria||'-')+'</strong></div><div><small>POSIÇÃO</small><strong>'+esc(x.posicao||'-')+'</strong></div><div><small>JOGOS</small><strong>'+(x.jogos||0)+'</strong></div><div><small>GOLS</small><strong>'+(x.gols||0)+'</strong></div><div><small>ASSISTÊNCIAS</small><strong>'+(x.assistencias||0)+'</strong></div><div><small>PRESENÇAS</small><strong>'+(x.presencas||0)+'</strong></div></div><div class="coach-private-card"><strong>Dados privados</strong><span>Responsável: '+esc(x.telefone_responsavel||'Não cadastrado')+'</span><span>Observações: '+esc(x.observacoes||x.observacoes_treinador||'Nenhuma')+'</span></div><div class="quick-grid"><button class="tile" data-screen="evaluations"><b>Avaliações</b><small>Histórico técnico</small></button><button class="tile" data-screen="notes"><b>Anotações</b><small>Observações internas</small></button><button class="tile" data-screen="performance"><b>Desempenho</b><small>Estatísticas da temporada</small></button></div>')}

const CALL_GROUPS={
  "sub13-a":{
    label:"Sub-13 — Grupo A",
    category:"Sub-13",
    names:[
      "Gabriel Rios Fernandes","Vinícius Alves Pinho","Rian Pedreira Lima","Nycolas Santana Silva",
      "Miguel Santos Oliveira","Willyam Kervem da Silva Purificação de Jesus","Henrique Oliveira Santos",
      "Davi Lucas Santana de Jesus","Lazaro Pessoa Rodrigues","Benjamin Nunes Sena","Igor Ferreira Moreira",
      "Rafael Almeida da Silva Boaventura","Mateus Machado de Jesus","Luanderson Gonçalves de Lima",
      "Joanderson Gonçalves de Lima","Luís Miranda Rezende","Nicolas Pereira de Souza Oliveira",
      "Bruno Victor Justino Santiago","Riquelme de Jesus Lopes","David Lucas de Souza Nepomuceno",
      "Andrey Conceição da Silva","Henry Nunes da Silva","Paulo Vitor Bastos Xavier Santos",
      "Jacob Neto Sena Carneiro","Vinicius Araújo Santos","Messias Nascimento Lima Oliveira",
      "Miguel Messi Ribeiro Barbosa","Lázaro Sodré dos Santos","Moisés Souza da Silva","Kelven Souza Santos",
      "Kleber Xavier Silva","Andrey da Silva Belo Sodré","Nathan de Jesus Oliveira","Pyetro dos Santos Ribeiro"
    ]
  },
  "sub13-b":{
    label:"Sub-13 — Grupo B",
    category:"Sub-13",
    names:[
      "Arthur Santana da Silva","Gustavo Almeida Santos","Levi Muritiba Carneiro França","Wesle Santos Sudré",
      "Vitor Manoel Jesus da Silva","Vicente Queiroz Oliveira","Amadeu Laurindo Oliveira Souza Neto Filho",
      "Igor Ferreira Moreira","Wallacy Silva Santana","Yuri Silva Oliveira","Welison Santos de Araújo",
      "Davi Ferreira Antunes","Lorenzo Vicente dos Santos Ferreira da Silva","Isabelly Vitória Santana Assis",
      "Anael Breno Souza de Melo","Miguel Silva Cintra","Danillo Fagundes Bela","Izak Soares de Matos",
      "Brenno Kauan Sena da Silva","Pedro Pamponet Fernandes","José Miguel dos Santos Suzart Paz",
      "Gabriel Pereira da Cruz","Aldo Miguel da Silva Nascimento","Enzo Gabriel Santana Macêdo",
      "Pedro Lucas Cerqueira dos Santos","Heitor Rios Carneiro Macedo","Isaac Santana de Araújo",
      "Moisés Souza Santiago","Miguel Costa Melo","Davi Lucca Sousa Silva","Joaquim Sena Carneiro",
      "Moisés Souza da Silva","Arthur Silva Santa Bárbara de Brito","Miguel Henrique Almeida Santos",
      "Andrey da Silva Belo Sodré","Vitor Gabriel Oliveira Mendes","Pyetro dos Santos Ribeiro","Inácio Ferreira Silva"
    ]
  },
  "sub15-17":{
    label:"Sub-15 / Sub-17",
    category:null
  }
};

const normName=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const uniqueAthletes=rows=>{
  const seen=new Set();
  return rows.filter(a=>{
    const key=normName(a.nome);
    if(!key||seen.has(key))return false;
    seen.add(key);return true;
  });
};
function athletesForCallGroup(ats,groupKey){
  const group=CALL_GROUPS[groupKey];
  if(!group)return[];
  const active=ats.filter(a=>String(a.status||"Ativo").toLowerCase()==="ativo");
  if(groupKey==="sub15-17"){
    return uniqueAthletes(active.filter(a=>/sub[- ]?15|sub[- ]?17/i.test(String(a.categoria||""))));
  }
  const wanted=new Set(group.names.map(normName));
  return uniqueAthletes(active.filter(a=>String(a.categoria||"").toLowerCase().includes("sub-13")&&wanted.has(normName(a.nome))));
}
function groupOptions(selected=""){
  return '<option value="">Selecionar grupo…</option>'+Object.entries(CALL_GROUPS).map(([key,g])=>'<option value="'+key+'" '+(key===selected?"selected":"")+'>'+esc(g.label)+'</option>').join("");
}

async function renderCalls(){
  const [cats,ats,calls]=await Promise.all([
    categories(),athletes(),
    q("chamadas","id,tipo,data_chamada,horario,local,observacoes,status,categoria_id,grupo,created_at",x=>x.order("data_chamada",{ascending:false}).limit(100))
  ]);
  shell("Chamadas","Convocações internas organizadas por grupo.",
    '<button class="primary-btn" id="newCall">+ Nova chamada</button><div id="callList" class="data-list"></div>');
  const list=document.getElementById("callList");
  list.innerHTML=calls.data?.length?calls.data.map(x=>
    '<article class="data-card"><div class="assistant-icon">✓</div><div class="data-body"><small>'+
    esc((x.grupo?CALL_GROUPS[x.grupo]?.label:x.tipo||"CHAMADA").toUpperCase())+" • "+esc(x.status)+
    '</small><h3>'+fmtDate(x.data_chamada)+" • "+fmtTime(x.horario)+
    '</h3><p>'+esc([x.local,x.observacoes].filter(Boolean).join(" • "))+
    '</p><button class="mini-btn" data-call="'+x.id+'">Abrir</button></div></article>'
  ).join(""):empty("Nenhuma chamada criada.");
  document.getElementById("newCall").onclick=()=>callForm(cats,ats);
  list.onclick=e=>{const b=e.target.closest("[data-call]");if(b)callDetail(b.dataset.call,calls.data||[],ats)};
}

async function callForm(cats,ats,x=null){
  shell(x?"Editar chamada":"Nova chamada","Todos os atletas ativos serão incluídos automaticamente, separados por categoria.",
    '<form id="callForm" class="form-grid">'+
    formField("Tipo",'<select name="tipo"><option value="treino">Treino</option><option value="jogo">Jogo</option><option value="outro">Outro</option></select>')+
    formField("Data",'<input name="data_chamada" type="date" required value="'+(x?.data_chamada||today())+'">')+
    formField("Horário",'<input name="horario" type="time" value="'+fmtTime(x?.horario)+'">')+
    formField("Local",'<input name="local" value="'+esc(x?.local||"")+'">')+
    formField("Observações",'<textarea name="observacoes">'+esc(x?.observacoes||"")+'</textarea>')+
    actions()+"</form>");

  document.getElementById("callForm").onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.target);
    const active=uniqueAthletes(ats.filter(a=>String(a.status||"Ativo").toLowerCase()==="ativo"));
    if(!active.length)return alert("Nenhum atleta ativo foi encontrado.");

    const row={
      tipo:f.get("tipo"),
      categoria_id:null,
      grupo:null,
      data_chamada:f.get("data_chamada"),
      horario:f.get("horario")||null,
      local:f.get("local")||null,
      observacoes:f.get("observacoes")||null,
      criado_por:session.user.id
    };

    let id=x?.id;
    if(x){
      const r=await upd("chamadas",id,row);
      if(r.error)return alert(r.error.message);
      await supabaseClient.from("chamada_atletas").delete().eq("chamada_id",id);
    }else{
      const r=await save("chamadas",row);
      if(r.error)return alert(r.error.message);
      id=r.data.id;
    }

    const links=active.map(a=>({chamada_id:id,atleta_id:a.id,status:"pendente"}));
    const rr=await supabaseClient.from("chamada_atletas").insert(links);
    if(rr.error)return alert("A chamada não foi salva: "+rr.error.message);
    renderCalls();
  };
  document.querySelector("[name=tipo]").value=x?.tipo||"treino";
}
async function callDetail(id,all,ats){
  const x=all.find(y=>y.id===id);
  if(!x)return;

  let m=await q("chamada_atletas","id,atleta_id,status,observacao",z=>z.eq("chamada_id",id));
  let selected=m.data||[];

  // Chamadas novas usam exclusivamente o grupo salvo. Chamadas antigas, sem grupo, preservam os atletas já registrados.
  if(x.grupo&&CALL_GROUPS[x.grupo]){
    const allowed=new Set(athletesForCallGroup(ats,x.grupo).map(a=>a.id));
    selected=selected.filter(s=>allowed.has(s.atleta_id));
  }

  const present=selected.filter(s=>s.status==="presente").length;
  const absent=selected.filter(s=>s.status==="faltou").length;
  const grouped={};
  selected.forEach(s=>{
    const a=ats.find(y=>y.id===s.atleta_id);
    if(!a)return;
    const cat=a.categoria||"Sem categoria";
    if(!grouped[cat])grouped[cat]=[];
    grouped[cat].push({s,a});
  });

  const categoryOrder=["Sub-13","Sub-15","Sub-17","Sub-20"];
  const orderedCategories=Object.keys(grouped).sort((a,b)=>{
    const ia=categoryOrder.indexOf(a),ib=categoryOrder.indexOf(b);
    if(ia!==-1&&ib!==-1)return ia-ib;
    if(ia!==-1)return -1;
    if(ib!==-1)return 1;
    return a.localeCompare(b,"pt-BR");
  });

  const categoryHtml=orderedCategories.map(cat=>{
    const rows=uniqueAthletes(grouped[cat]).sort((u,v)=>String(u.nome||"").localeCompare(String(v.nome||""),"pt-BR")).map(a=>{
      const s=selected.find(item=>item.atleta_id===a.id);
      return {s,a};
    });
    return '<section class="call-category"><div class="section-title"><h2>'+esc(cat)+'</h2><small>'+rows.length+" atleta(s)</small></div><div class="data-list">"+
      rows.map(({s,a})=>'<article class="data-card call-athlete-row" data-row="'+s.id+'"><div class="data-body"><h3>'+esc(a.nome||"Atleta")+
      '</h3><div class="attendance-actions"><button type="button" class="attendance-btn present '+(s.status==="presente"?"selected":"")+'" data-presente="'+s.id+'">✓ PRESENTE</button>'+
      '<button type="button" class="attendance-btn absent '+(s.status==="faltou"?"selected":"")+'" data-faltou="'+s.id+'">✕ FALTOU</button></div></div></article>').join("")+
      "</div></section>";
  }).join("");

  shell("Chamada",x.grupo&&CALL_GROUPS[x.grupo]?CALL_GROUPS[x.grupo].label:"Chamada existente",
    '<div class="panel-card call-summary"><small>'+esc((x.tipo||"").toUpperCase())+" • "+fmtDate(x.data_chamada)+" • "+fmtTime(x.horario)+
    '</small><h3>'+esc(x.local||"Local não informado")+'</h3>'+
    '<div class="call-counters"><span class="call-count present"><b id="callPresent">'+present+
    '</b> Presentes</span><span class="call-count absent"><b id="callAbsent">'+absent+
    '</b> Faltaram</span><span class="call-count pending"><b id="callPending">'+(selected.length-present-absent)+
    '</b> Pendentes</span></div></div><div class="call-athletes">'+categoryHtml+
    '</div><div class="call-footer-actions"><button class="primary-btn" id="finishCall">Encerrar chamada</button>'+
    '<button class="mini-btn" data-cancel-call="'+id+'">Cancelar chamada</button></div>');

  const refreshCounters=()=>{
    const rows=[...screen.querySelectorAll(".call-athlete-row")];
    const p=rows.filter(r=>r.querySelector(".attendance-btn.present.selected")).length;
    const f=rows.filter(r=>r.querySelector(".attendance-btn.absent.selected")).length;
    document.getElementById("callPresent").textContent=p;
    document.getElementById("callAbsent").textContent=f;
    document.getElementById("callPending").textContent=rows.length-p-f;
  };

  async function mark(rowId,status,button){
    const r=await upd("chamada_atletas",rowId,{status,responded_at:new Date().toISOString()});
    if(r.error){alert(r.error.message);return;}
    const row=screen.querySelector('[data-row="'+rowId+'"]');
    row.querySelectorAll(".attendance-btn").forEach(btn=>btn.classList.remove("selected"));
    button.classList.add("selected");
    refreshCounters();
  }

  screen.querySelectorAll("[data-presente]").forEach(btn=>btn.onclick=()=>mark(btn.dataset.presente,"presente",btn));
  screen.querySelectorAll("[data-faltou]").forEach(btn=>btn.onclick=()=>mark(btn.dataset.faltou,"faltou",btn));
  screen.querySelector("[data-cancel-call]").onclick=async()=>{await upd("chamadas",id,{status:"cancelada"});renderCalls()};

  screen.querySelector("#finishCall").onclick=async()=>{
    const rows=[...screen.querySelectorAll(".call-athlete-row")];
    if(rows.some(r=>!r.querySelector(".attendance-btn.selected"))){
      alert("Marque PRESENTE ou FALTOU para todos os atletas antes de encerrar.");
      return;
    }
    const finish=await upd("chamadas",id,{status:"encerrada"});
    if(finish.error){alert(finish.error.message);return;}
    alert("Chamada encerrada e presença registrada.");
    renderCalls();
  };
}
async function renderTraining(){
  const [cats,r]=await Promise.all([categories(),q('treinos','id,data_treino,horario,local,objetivo,observacoes,status,categoria_id',x=>x.order('data_treino',{ascending:false}).limit(100))]);
  shell('Treinos','Planejamento e histórico da preparação.','<button class="primary-btn" id="newTraining">+ Novo treino</button><div id="trainingList" class="data-list"></div>');
  document.getElementById('trainingList').innerHTML=r.data?.length?r.data.map(x=>'<article class="data-card"><div class="assistant-icon">🏃</div><div class="data-body"><small>'+esc(x.status)+'</small><h3>'+fmtDate(x.data_treino)+' • '+fmtTime(x.horario)+'</h3><p>'+esc([x.local,x.objetivo].filter(Boolean).join(' • '))+'</p><button class="mini-btn" data-training="'+x.id+'">Editar</button> <button class="mini-btn" data-presence="'+x.id+'">Presença</button></div></article>').join(''):empty('Nenhum treino cadastrado.');
  document.getElementById('newTraining').onclick=()=>trainingForm(cats);
  document.getElementById('trainingList').onclick=e=>{const ed=e.target.closest('[data-training]');if(ed)trainingForm(cats,r.data.find(x=>x.id===ed.dataset.training));const p=e.target.closest('[data-presence]');if(p)presenceForm(p.dataset.presence)};
}
async function trainingForm(cats,x=null){
  shell(x?'Editar treino':'Novo treino','Registre a atividade da comissão.','<form id="trainingForm" class="form-grid">'+formField('Categoria','<select name="categoria_id">'+cats.map(c=>'<option value="'+c.id+'">'+esc(c.nome)+'</option>').join('')+'</select>')+formField('Data','<input name="data_treino" type="date" required value="'+(x?.data_treino||today())+'">')+formField('Horário','<input name="horario" type="time" value="'+fmtTime(x?.horario)+'">')+formField('Local','<input name="local" value="'+esc(x?.local||'')+'">')+formField('Objetivo','<input name="objetivo" value="'+esc(x?.objetivo||'')+'">')+formField('Status','<select name="status"><option>agendado</option><option>realizado</option><option>cancelado</option></select>')+formField('Observações','<textarea name="observacoes">'+esc(x?.observacoes||'')+'</textarea>')+actions()+'</form>');
  if(x){document.querySelector('[name=categoria_id]').value=x.categoria_id;document.querySelector('[name=status]').value=x.status}
  document.getElementById('trainingForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const row={categoria_id:f.get('categoria_id')||null,data_treino:f.get('data_treino'),horario:f.get('horario')||null,local:f.get('local')||null,objetivo:f.get('objetivo')||null,status:f.get('status'),observacoes:f.get('observacoes')||null,responsavel_id:session.user.id};const r=x?await upd('treinos',x.id,row):await save('treinos',row);if(r.error)return alert(r.error.message);renderTraining()};
}
async function presenceForm(treinoId){
  const ats=await athletes(),r=await q('presencas_treino','id,atleta_id,status,observacao',x=>x.eq('treino_id',treinoId));const map=new Map((r.data||[]).map(x=>[x.atleta_id,x]));shell('Presença','Registre a situação de cada atleta.','<div class="presence-list">'+ats.map(a=>{const p=map.get(a.id);return '<article class="data-card"><div class="data-body"><h3>'+esc(a.nome)+'</h3><small>'+esc(a.categoria||'')+'</small><select class="status-select presence-status" data-athlete="'+a.id+'"><option value="presente" '+(p?.status==='presente'?'selected':'')+'>Presente</option><option value="falta" '+(p?.status==='falta'?'selected':'')+'>Falta</option><option value="justificada" '+(p?.status==='justificada'?'selected':'')+'>Falta justificada</option></select></div></article>'}).join('')+'</div><button class="primary-btn" id="savePresence">Salvar presença</button>');
  document.getElementById('savePresence').onclick=async()=>{for(const s of screen.querySelectorAll('.presence-status')){const row=map.get(s.dataset.athlete);const payload={treino_id:treinoId,atleta_id:s.dataset.athlete,status:s.value,registrado_por:session.user.id};const r=row?await upd('presencas_treino',row.id,payload):await save('presencas_treino',payload);if(r.error)return alert(r.error.message)}await loadDashboard();presenceForm(treinoId)};
}

async function renderEvaluations(){
  const ats=await athletes(),r=await q('avaliacoes_atletas','id,atleta_id,tecnica,tatica,fisico,disciplina,evolucao,observacoes,created_at',x=>x.order('created_at',{ascending:false}).limit(100));
  shell('Avaliações','Avaliação técnica privada dos atletas.','<button class="primary-btn" id="newEval">+ Nova avaliação</button><div class="data-list">'+(r.data||[]).map(x=>{const a=ats.find(y=>y.id===x.atleta_id);return '<article class="data-card"><div class="data-body"><small>'+fmtDate(x.created_at.slice(0,10))+'</small><h3>'+esc(a?.nome||'Atleta')+'</h3><p>Técnica '+x.tecnica+' • Tática '+x.tatica+' • Físico '+x.fisico+' • Disciplina '+x.disciplina+' • Evolução '+x.evolucao+'</p><span>'+esc(x.observacoes||'')+'</span></div></article>'}).join('')||empty('Nenhuma avaliação registrada.')+'</div>');
  document.getElementById('newEval').onclick=()=>evaluationForm(ats);
}
function evaluationForm(ats,x=null){
  shell('Nova avaliação','Notas de 0 a 10.','<form id="evalForm" class="form-grid">'+formField('Atleta','<select name="atleta_id" required>'+athleteOptions(ats)+'</select>')+['tecnica','tatica','fisico','disciplina','evolucao'].map(k=>formField(k[0].toUpperCase()+k.slice(1),'<input name="'+k+'" type="number" min="0" max="10" required>')).join('')+formField('Observações','<textarea name="observacoes"></textarea>')+actions()+'</form>');
  document.getElementById('evalForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const row=Object.fromEntries(f.entries());['tecnica','tatica','fisico','disciplina','evolucao'].forEach(k=>row[k]=Number(row[k]));row.treinador_id=session.user.id;const r=await save('avaliacoes_atletas',row);if(r.error)return alert(r.error.message);renderEvaluations()};
}

async function renderPerformance(){
  const ats=await athletes(),r=await q('desempenho_atletas','id,atleta_id,temporada,jogos,gols,assistencias,observacoes,updated_at',x=>x.order('temporada',{ascending:false}).limit(200));
  shell('Desempenho','Estatísticas internas por temporada.','<button class="primary-btn" id="newPerf">+ Registrar desempenho</button><div class="data-list">'+(r.data||[]).map(x=>{const a=ats.find(y=>y.id===x.atleta_id);return '<article class="data-card"><div class="data-body"><small>'+esc(x.temporada)+'</small><h3>'+esc(a?.nome||'Atleta')+'</h3><p>'+x.jogos+' jogos • '+x.gols+' gols • '+x.assistencias+' assistências</p><span>'+esc(x.observacoes||'')+'</span></div></article>'}).join('')||empty('Nenhum desempenho registrado.')+'</div>');
  document.getElementById('newPerf').onclick=()=>performanceForm(ats);
}
function performanceForm(ats){
  shell('Registrar desempenho','Dados da temporada.','<form id="perfForm" class="form-grid">'+formField('Atleta','<select name="atleta_id" required>'+athleteOptions(ats)+'</select>')+formField('Temporada','<input name="temporada" value="'+new Date().getFullYear()+'" required>')+formField('Jogos','<input name="jogos" type="number" min="0" value="0">')+formField('Gols','<input name="gols" type="number" min="0" value="0">')+formField('Assistências','<input name="assistencias" type="number" min="0" value="0">')+formField('Observações','<textarea name="observacoes"></textarea>')+actions()+'</form>');
  document.getElementById('perfForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const row={atleta_id:f.get('atleta_id'),temporada:f.get('temporada'),jogos:Number(f.get('jogos')),gols:Number(f.get('gols')),assistencias:Number(f.get('assistencias')),observacoes:f.get('observacoes')||null,updated_by:session.user.id};const r=await supabaseClient.from('desempenho_atletas').upsert(row,{onConflict:'atleta_id,temporada'});if(r.error)return alert(r.error.message);renderPerformance()};
}

async function renderNotes(){
  const ats=await athletes(),r=await q('anotacoes_tecnicas','id,atleta_id,titulo,texto,created_at',x=>x.order('created_at',{ascending:false}).limit(200));
  shell('Anotações técnicas','Observações privadas da comissão.','<button class="primary-btn" id="newNote">+ Nova anotação</button><div class="data-list">'+(r.data||[]).map(x=>{const a=ats.find(y=>y.id===x.atleta_id);return '<article class="data-card"><div class="data-body"><small>'+fmtDate(x.created_at.slice(0,10))+'</small><h3>'+esc(a?.nome||'Atleta')+' — '+esc(x.titulo||'Anotação')+'</h3><p>'+esc(x.texto)+'</p><button class="mini-btn" data-del-note="'+x.id+'">Excluir</button></div></article>'}).join('')||empty('Nenhuma anotação.')+'</div>');
  document.getElementById('newNote').onclick=()=>noteForm(ats);screen.querySelectorAll('[data-del-note]').forEach(b=>b.onclick=async()=>{if(role==='admin'||confirm('Excluir esta anotação?')){await del('anotacoes_tecnicas',b.dataset.delNote);renderNotes()}});
}
function noteForm(ats){
  shell('Nova anotação','Registro privado sobre um atleta.','<form id="noteForm" class="form-grid">'+formField('Atleta','<select name="atleta_id" required>'+athleteOptions(ats)+'</select>')+formField('Título','<input name="titulo" placeholder="Ex.: Evolução">')+formField('Anotação','<textarea name="texto" required rows="6"></textarea>')+actions()+'</form>');
  document.getElementById('noteForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const r=await save('anotacoes_tecnicas',{atleta_id:f.get('atleta_id'),titulo:f.get('titulo')||null,texto:f.get('texto'),autor_id:session.user.id});if(r.error)return alert(r.error.message);renderNotes()};
}

async function renderCalendar(){
  const cats=await categories(),r=await q('calendario_comissao','id,titulo,tipo,data_evento,horario,local,categoria_id,observacoes',x=>x.order('data_evento',{ascending:true}).limit(200));
  shell('Calendário','Agenda interna da comissão.','<button class="primary-btn" id="newEvent">+ Novo evento</button><div class="data-list">'+(r.data||[]).map(x=>'<article class="data-card"><div class="assistant-icon">•</div><div class="data-body"><small>'+esc(x.tipo.toUpperCase())+'</small><h3>'+fmtDate(x.data_evento)+' • '+fmtTime(x.horario)+'</h3><p><b>'+esc(x.titulo)+'</b> '+esc([x.local,x.observacoes].filter(Boolean).join(' • '))+'</p><button class="mini-btn" data-event="'+x.id+'">Excluir</button></div></article>').join('')||empty('Nenhum evento.')+'</div>');
  document.getElementById('newEvent').onclick=()=>calendarForm(cats);screen.querySelectorAll('[data-event]').forEach(b=>b.onclick=async()=>{await del('calendario_comissao',b.dataset.event);renderCalendar()});
}
function calendarForm(cats){
  shell('Novo evento','Compromisso interno da comissão.','<form id="eventForm" class="form-grid">'+formField('Título','<input name="titulo" required>')+formField('Tipo','<select name="tipo"><option>treino</option><option>jogo</option><option>avaliacao</option><option>reuniao</option><option>convocacao</option><option>outro</option></select>')+formField('Data','<input name="data_evento" type="date" required value="'+today()+'">')+formField('Horário','<input name="horario" type="time">')+formField('Local','<input name="local">')+formField('Categoria','<select name="categoria_id">'+cats.map(c=>'<option value="'+c.id+'">'+esc(c.nome)+'</option>').join('')+'</select>')+formField('Observações','<textarea name="observacoes"></textarea>')+actions()+'</form>');
  document.getElementById('eventForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const r=await save('calendario_comissao',{titulo:f.get('titulo'),tipo:f.get('tipo'),data_evento:f.get('data_evento'),horario:f.get('horario')||null,local:f.get('local')||null,categoria_id:f.get('categoria_id')||null,observacoes:f.get('observacoes')||null,criado_por:session.user.id});if(r.error)return alert(r.error.message);renderCalendar()};
}

async function renderNotices(){
  const r=await q('avisos_internos','id,titulo,texto,prioridade,ativo,created_at',x=>x.eq('ativo',true).order('created_at',{ascending:false}));
  shell('Avisos internos','Comunicados exclusivos da comissão.','<button class="primary-btn" id="newNotice">+ Novo aviso</button><div class="data-list">'+(r.data||[]).map(x=>'<article class="data-card"><div class="assistant-icon">'+(x.prioridade==='urgente'?'!':'i')+'</div><div class="data-body"><small>'+esc(x.prioridade.toUpperCase())+'</small><h3>'+esc(x.titulo)+'</h3><p>'+esc(x.texto||'')+'</p><button class="mini-btn" data-read="'+x.id+'">Marcar como lido</button>'+(role==='admin'?'<button class="mini-btn" data-del-notice="'+x.id+'">Excluir</button>':'')+'</div></article>').join('')||empty('Nenhum aviso ativo.')+'</div>');
  document.getElementById('newNotice').onclick=()=>noticeForm();screen.querySelectorAll('[data-read]').forEach(b=>b.onclick=async()=>{await supabaseClient.from('avisos_internos_lidos').upsert({aviso_id:b.dataset.read,user_id:session.user.id},{onConflict:'aviso_id,user_id'});b.textContent='Lido ✓';b.disabled=true});screen.querySelectorAll('[data-del-notice]').forEach(b=>b.onclick=async()=>{await upd('avisos_internos',b.dataset.delNotice,{ativo:false});renderNotices()});
}
function noticeForm(){
  shell('Novo aviso','Mensagem interna para a equipe.','<form id="noticeForm" class="form-grid">'+formField('Título','<input name="titulo" required>')+formField('Prioridade','<select name="prioridade"><option>normal</option><option>baixa</option><option>alta</option><option>urgente</option></select>')+formField('Texto','<textarea name="texto" rows="5"></textarea>')+actions()+'</form>');
  document.getElementById('noticeForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const r=await save('avisos_internos',{titulo:f.get('titulo'),texto:f.get('texto')||null,prioridade:f.get('prioridade'),criado_por:session.user.id});if(r.error)return alert(r.error.message);renderNotices()};
}

async function renderLineups(){
  const [games,ats]=await Promise.all([q('jogos','id,adversario,data_jogo,categoria',x=>x.order('data_jogo',{ascending:false}).limit(100)),athletes()]);
  const r=await q('escalacoes','id,jogo_id,categoria,formacao,titulares,reservas,capitao,observacoes,criado_em',x=>x.order('criado_em',{ascending:false}));
  shell('Escalações','Montagem interna das equipes.','<button class="primary-btn" id="newLineup">+ Nova escalação</button><div class="data-list">'+(r.data||[]).map(x=>'<article class="data-card"><div class="assistant-icon">⚽</div><div class="data-body"><small>'+esc(x.categoria||'')+' • '+esc(x.formacao||'')+'</small><h3>'+esc(x.capitao?'Capitão: '+x.capitao:'Escalação')+'</h3><p>Titulares: '+esc((x.titulares||[]).map(a=>a.nome||a.name||a).join(', '))+'</p></div></article>').join('')||empty('Nenhuma escalação criada.')+'</div>');
  document.getElementById('newLineup').onclick=()=>lineupForm(games.data||[],ats);
}
function lineupForm(games,ats){
  shell('Nova escalação','Defina titulares e reservas.','<form id="lineupForm" class="form-grid">'+formField('Jogo','<select name="jogo_id">'+games.map(g=>'<option value="'+g.id+'">'+fmtDate(g.data_jogo)+' — Baixa Grande x '+esc(g.adversario)+'</option>').join('')+'</select>')+formField('Categoria','<select name="categoria"><option>Sub-13</option><option>Sub-15</option><option>Sub-17</option><option>Sub-20</option></select>')+formField('Esquema','<input name="formacao" placeholder="Ex.: 4-3-3">')+formField('Titulares','<select name="titulares" multiple size="7">'+athleteOptions(ats)+'</select>')+formField('Reservas','<select name="reservas" multiple size="7">'+athleteOptions(ats)+'</select>')+formField('Capitão','<input name="capitao">')+formField('Observações','<textarea name="observacoes"></textarea>')+actions()+'</form>');
  document.getElementById('lineupForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),s=e.target;const byId=id=>ats.find(a=>a.id===id)||{id};const r=await save('escalacoes',{jogo_id:f.get('jogo_id')||null,categoria:f.get('categoria'),formacao:f.get('formacao')||null,titulares:normalizeMulti(s.titulares).map(byId),reservas:normalizeMulti(s.reservas).map(byId),capitao:f.get('capitao')||null,observacoes:f.get('observacoes')||null,treinador_id:session.user.id});if(r.error)return alert(r.error.message);renderLineups()};
}

async function renderMore(){
  const items=[['training','Treinos','Planejamento da preparação'],['attendance','Presença','Controle de frequência'],['evaluations','Avaliações','Avaliação técnica privada'],['performance','Desempenho','Estatísticas por temporada'],['calendar','Calendário','Agenda da comissão'],['notes','Anotações técnicas','Registros privados'],['notices','Avisos internos','Comunicados da equipe'],['lineups','Escalações','Montagem das equipes']];
  if(role==='admin')items.push(['admin','Administração','Professores, categorias e acessos']);
  shell('Área da comissão','Ferramentas internas dos treinadores.','<div class="quick-grid">'+items.map(x=>'<button class="tile" data-screen="'+x[0]+'"><b>'+x[1]+'</b><small>'+x[2]+'</small></button>').join('')+'</div>');
}

async function renderCategoriesAdmin(){
  const r=await q('categorias_app','id,nome,descricao,ativo',x=>x.order('nome'));
  shell('Categorias','Categorias internas da comissão.','<button class="primary-btn" id="newCategory">+ Nova categoria</button><div class="data-list">'+(r.data||[]).map(x=>'<article class="data-card"><div class="assistant-icon">•</div><div class="data-body"><h3>'+esc(x.nome)+'</h3><p>'+esc(x.descricao||'')+'</p><small>'+((x.ativo)?'ATIVA':'INATIVA')+'</small><button class="mini-btn" data-cat-edit="'+x.id+'">Editar</button> <button class="mini-btn" data-cat-del="'+x.id+'">Excluir</button></div></article>').join('')||empty('Nenhuma categoria.')+'</div>');
  document.getElementById('newCategory').onclick=()=>categoryForm();
  screen.querySelectorAll('[data-cat-edit]').forEach(b=>b.onclick=()=>categoryForm((r.data||[]).find(x=>x.id===b.dataset.catEdit)));
  screen.querySelectorAll('[data-cat-del]').forEach(b=>b.onclick=async()=>{if(confirm('Excluir esta categoria?')){const z=await del('categorias_app',b.dataset.catDel);if(z.error)alert(z.error.message);else renderCategoriesAdmin()}});
}
function categoryForm(x=null){
  shell(x?'Editar categoria':'Nova categoria','Somente o administrador pode gerenciar categorias.','<form id="categoryForm" class="form-grid">'+formField('Nome','<input name="nome" required value="'+esc(x?.nome||'')+'">')+formField('Descrição','<textarea name="descricao">'+esc(x?.descricao||'')+'</textarea>')+formField('Status','<select name="ativo"><option value="true">Ativa</option><option value="false">Inativa</option></select>')+actions()+'</form>');
  document.querySelector('[name=ativo]').value=String(x?.ativo??true);
  document.getElementById('categoryForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const row={nome:f.get('nome'),descricao:f.get('descricao')||null,ativo:f.get('ativo')==='true'};const z=x?await upd('categorias_app',x.id,row):await save('categorias_app',row);if(z.error)return alert(z.error.message);renderCategoriesAdmin()};
}
async function renderAdmin(){
  const r=await q('professores_app','id,nome,email,user_id,ativo',x=>x.order('id'));
  shell('Administração','Gerenciamento dos acessos da comissão.','<p class="admin-warning">O administrador deve cadastrar o e-mail de cada professor após a conta Auth existir. O aplicativo não cria senhas automaticamente.</p><div class="quick-grid"><button class="tile" data-screen="categories-admin"><b>Categorias</b><small>Gerenciar categorias</small></button><button class="tile" data-screen="admin"><b>Professores</b><small>Gerenciar acessos</small></button></div><div class="data-list">'+(r.data||[]).map(x=>'<article class="data-card"><div class="assistant-icon">'+x.id+'</div><div class="data-body"><h3>'+esc(x.nome||'Professor '+x.id)+'</h3><p>'+esc(x.email||'E-mail não vinculado')+'</p><small>'+((x.ativo)?'ATIVO':'INATIVO')+'</small><button class="mini-btn" data-prof="'+x.id+'">Editar</button></div></article>').join('')+'</div>');
  screen.querySelectorAll('[data-prof]').forEach(b=>b.onclick=()=>profForm((r.data||[]).find(x=>String(x.id)===b.dataset.prof)));
}
async function openScreen(name){
  if(name==='home'){screen.hidden=true;dashboard.hidden=false;document.querySelector('.hero').hidden=false;loadDashboard()}
  else if(name==='athletes')await renderAthletes();
  else if(name==='calls')await renderCalls();
  else if(name==='training')await renderTraining();
  else if(name==='attendance'){const r=await q('treinos','id,data_treino,horario,local,status',x=>x.order('data_treino',{ascending:false}).limit(50));shell('Presença','Escolha o treino para registrar a frequência.','<div class="data-list">'+(r.data||[]).map(t=>'<article class="data-card"><div class="data-body"><small>'+esc(t.status)+'</small><h3>'+fmtDate(t.data_treino)+' • '+fmtTime(t.horario)+'</h3><p>'+esc(t.local||'')+'</p><button class="mini-btn" data-pres="'+t.id+'">Registrar presença</button></div></article>').join('')||empty('Nenhum treino cadastrado.')+'</div>');screen.querySelectorAll('[data-pres]').forEach(b=>b.onclick=()=>presenceForm(b.dataset.pres))}
  else if(name==='evaluations')await renderEvaluations();
  else if(name==='performance')await renderPerformance();
  else if(name==='calendar')await renderCalendar();
  else if(name==='notes')await renderNotes();
  else if(name==='notices')await renderNotices();
  else if(name==='lineups')await renderLineups();
  else if(name==='admin'&&role==='admin')await renderAdmin();
  else if(name==='categories-admin'&&role==='admin')await renderCategoriesAdmin();
  else if(name==='more')await renderMore();
  else return;
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.screen===name));
  window.scrollTo({top:0,behavior:'smooth'});
}

async function withTimeout(promise,ms=7000){
  return await Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('TIMEOUT')),ms))]);
}
async function showAuthenticatedApp(s){
  session=s;
  authHandledUser=s?.user?.id||authHandledUser;
  try{
    const allowed=await withTimeout(coachGuard(),7000);
    if(!allowed){await supabaseClient.auth.signOut();return false}
    const badge=document.getElementById('userBadge');if(badge){badge.textContent=role==='admin'?'Administrador':'Professor / Treinador';badge.title=s.user.email||''}
    document.getElementById('splashScreen').hidden=true;document.getElementById('loginScreen').hidden=true;document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;document.body.classList.remove('auth-locked');
    loadDashboard().catch(()=>setSync(false,'Não foi possível carregar o painel'));
    setupLiveSync();return true;
  }catch(err){
    console.error('Erro ao validar acesso:',err);
    await supabaseClient.auth.signOut().catch(()=>{});
    return false;
  }
}
function showLogin(){
  document.getElementById('splashScreen').hidden=true;
  document.getElementById('loginScreen').hidden=false;
  document.getElementById('authGate').hidden=false;
  document.getElementById('appShell').hidden=true;
  document.body.classList.remove('auth-locked');
  bindLogin();
}
function bindLogin(){
  if(loginBound)return;loginBound=true;const f=document.getElementById('globalLoginForm');
  f.addEventListener('submit',async e=>{e.preventDefault();if(authBusy)return;authBusy=true;const err=document.getElementById('globalLoginError'),b=f.querySelector('button');err.hidden=true;b.disabled=true;b.textContent='Entrando…';const {data,error}=await supabaseClient.auth.signInWithPassword({email:document.getElementById('globalLoginEmail').value.trim(),password:document.getElementById('globalLoginPassword').value});if(error||!data.session||!(await showAuthenticatedApp(data.session))){err.hidden=false;err.textContent=error?'E-mail ou senha inválidos.':'Esta conta não está autorizada para a comissão.';if(data?.session)await supabaseClient.auth.signOut()}b.disabled=false;b.textContent='Entrar';authBusy=false})
}
async function signOut(){if(liveChannel)await supabaseClient.removeChannel(liveChannel).catch(()=>{});liveChannel=null;await supabaseClient.auth.signOut();location.reload()}
function setupLiveSync(){if(liveChannel)return;liveChannel=supabaseClient.channel('commission-live').on('postgres_changes',{event:'*',schema:'public',table:'Atletas'},()=>loadDashboard()).on('postgres_changes',{event:'*',schema:'public',table:'treinos'},()=>loadDashboard()).on('postgres_changes',{event:'*',schema:'public',table:'chamadas'},()=>loadDashboard()).on('postgres_changes',{event:'*',schema:'public',table:'presencas_treino'},()=>loadDashboard()).on('postgres_changes',{event:'*',schema:'public',table:'avisos_internos'},()=>loadDashboard()).subscribe()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-screen]');if(b){e.preventDefault();openScreen(b.dataset.screen)}});
document.getElementById('logoutBtn').onclick=signOut;
if(supabaseClient)supabaseClient.auth.onAuthStateChange(async(e,s)=>{if(e!=='SIGNED_IN'||!s||authHandling)return;const uid=s.user?.id;if(uid&&authHandledUser===uid)return;authHandledUser=uid;authHandling=true;try{if(document.getElementById('appShell').hidden)await showAuthenticatedApp(s)}finally{authHandling=false}});
async function boot(){
  if(!supabaseClient){showLogin();return}
  document.body.classList.add('auth-locked');
  try{
    await new Promise(r=>setTimeout(r,900));
    const result=await withTimeout(supabaseClient.auth.getSession(),7000);
    const s=result?.data?.session||null;
    if(s&&await showAuthenticatedApp(s))return;
  }catch(err){console.error('Falha ao restaurar sessão:',err)}
  showLogin();
}
boot().catch(err=>{console.error('Falha no boot:',err);showLogin()});