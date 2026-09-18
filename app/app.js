const SUPABASE_URL='https://lvxwziztdngntoqypzga.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_iCXNkHI8bgQ4c9BEVE9M3A_wOY1tvzY';
const SITE_URL='https://selecaobaixagrande.github.io/';
const INSTAGRAM_URL='https://www.instagram.com/selecaobaixagrande/';
const supabaseClient=window.supabase?.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY)||null;
const app=document.getElementById('app'),screen=document.getElementById('screen'),installBtn=document.getElementById('installBtn'),homeUpdates=document.getElementById('homeUpdates');
let deferredPrompt=null,liveChannel=null,refreshTimer=null,chatImages=[],chatHistory=[];

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;if(installBtn)installBtn.hidden=false});
installBtn?.addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.hidden=true});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js?v=13').catch(()=>{});

const content={
 news:['Notícias','As notícias publicadas no portal oficial aparecem aqui automaticamente.'],
 games:['Jogos','Agenda, horários, locais e competições.'],
 results:['Resultados','Partidas encerradas e placares oficiais.'],
 squad:['Elenco','Atletas publicados oficialmente e suas categorias.'],
 categories:['Categorias','Sub-13, Sub-15, Sub-17 e Sub-20.'],
 gallery:['Galeria','Fotos publicadas no acervo oficial.'],
 lineups:['Escalações','Formações, titulares, reservas e capitães.'],
 alerts:['Avisos','Comunicados e informações importantes.']
};

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function fmtDate(v){if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})}
function fmtTime(v){return v?String(v).slice(0,5):''}
function image(src,alt=''){return src?'<img class="data-image" src="'+esc(src)+'" alt="'+esc(alt)+'" loading="lazy" onerror="this.remove()">':''}
function setSync(ok,text){const dot=document.getElementById('syncDot'),label=document.getElementById('syncText');if(dot)dot.className=ok?'sync-ok':'sync-off';if(label)label.textContent=text}

async function queryTable(table,select,filter=''){
  if(!supabaseClient)return {data:null,error:new Error('Banco indisponível')};
  let q=supabaseClient.from(table).select(select);
  if(filter)q=filter(q);
  return await q;
}

async function getNews(limit=10){
  const r=await queryTable('noticias','id,titulo,resumo,conteudo,imagem,criado_em,publicado',q=>q.eq('publicado',true).order('criado_em',{ascending:false}).limit(limit));
  if(r.error)return r;
  return r;
}
async function getGames(limit=20){
  return await queryTable('jogos','id,adversario,competicao,data_jogo,horario,local,status,gols_baixa_grande,gols_adversario,escudo_adversario,destaque,observacoes,criado_em',q=>q.order('data_jogo',{ascending:true}).limit(limit));
}

function empty(msg='Nenhum conteúdo oficial publicado ainda.'){return '<div class="empty-state">'+esc(msg)+'</div>'}

async function loadData(name){
  if(!supabaseClient){screen.insertAdjacentHTML('beforeend',empty('Conexão com o banco indisponível.'));return}
  let r={data:null,error:null};
  if(name==='news')r=await getNews(30);
  if(name==='games')r=await queryTable('jogos','id,adversario,competicao,data_jogo,horario,local,status,gols_baixa_grande,gols_adversario,escudo_adversario,destaque,observacoes,criado_em',q=>q.in('status',['agendado','ao_vivo']).order('data_jogo',{ascending:true}).limit(30));
  if(name==='results')r=await queryTable('jogos','id,adversario,competicao,data_jogo,horario,local,status,gols_baixa_grande,gols_adversario,escudo_adversario,destaque,observacoes,criado_em',q=>q.eq('status','encerrado').order('data_jogo',{ascending:false}).limit(30));
  if(name==='squad')r=await queryTable('atletas_publicos','id,nome,categoria,posicao,numero_camisa,foto,instagram,jogos,titularidades,gols,assistencias,cartoes_amarelos,cartoes_vermelhos',q=>q.order('categoria').order('nome').limit(100));
  if(name==='gallery')r=await queryTable('galeria','id,titulo,descricao,imagem_url,ativo,criado_em',q=>q.eq('ativo',true).order('criado_em',{ascending:false}).limit(100));
  if(name==='alerts')r=await queryTable('avisos','id,titulo,texto,ativo,criado_em',q=>q.eq('ativo',true).order('criado_em',{ascending:false}).limit(30));
  if(name==='lineups')r=await queryTable('escalacoes','id,jogo_id,categoria,formacao,titulares,reservas,capitao,criado_em',q=>q.order('criado_em',{ascending:false}).limit(30));
  if(r.error){screen.insertAdjacentHTML('beforeend',empty('Não foi possível carregar os dados agora.'));return}
  if(!r.data?.length){screen.insertAdjacentHTML('beforeend',empty());return}
  renderList(name,r.data);
}

function renderList(name,data){
  const box=document.createElement('div');box.className='data-list';
  data.forEach(item=>{
    const card=document.createElement('article');card.className='data-card';
    if(name==='news')card.innerHTML=image(item.imagem,item.titulo)+'<div class="data-body"><small>NOTÍCIA OFICIAL</small><h3>'+esc(item.titulo)+'</h3>'+(item.resumo?'<p>'+esc(item.resumo)+'</p>':'')+'<span>'+fmtDate(item.criado_em)+'</span></div>';
    else if(name==='squad'){const stats=[item.jogos!=null?item.jogos+' jogos':null,item.gols!=null?item.gols+' gols':null,item.assistencias!=null?item.assistencias+' assist.':null].filter(Boolean).join(' • ');card.innerHTML=image(item.foto,item.nome)+'<div class="data-body"><small>'+esc(item.categoria||'ELENCO')+'</small><h3>'+esc(item.nome)+'</h3><p>'+esc(item.posicao||'Atleta')+(item.numero_camisa!=null?' • Camisa '+esc(item.numero_camisa):'')+'</p>'+(stats?'<span>'+esc(stats)+'</span>':'')+'</div>'}
    else if(name==='gallery')card.innerHTML=image(item.imagem_url,item.titulo||'Galeria')+'<div class="data-body"><small>GALERIA OFICIAL</small><h3>'+esc(item.titulo||'Momento da Seleção')+'</h3>'+(item.descricao?'<p>'+esc(item.descricao)+'</p>':'')+'</div>';
    else if(name==='alerts')card.innerHTML='<div class="assistant-icon">!</div><div class="data-body"><small>COMUNICADO OFICIAL</small><h3>'+esc(item.titulo)+'</h3>'+(item.texto?'<p>'+esc(item.texto)+'</p>':'')+'<span>'+fmtDate(item.criado_em)+'</span></div>';
    else if(name==='lineups'){const list=v=>Array.isArray(v)?v.map(x=>typeof x==='object'?(x.nome||x.name||x.jogador||'Atleta'):x).filter(Boolean).join(', '):'';card.innerHTML='<div class="assistant-icon">⚽</div><div class="data-body"><small>'+esc(item.categoria||'ESCALAÇÃO')+(item.formacao?' • '+esc(item.formacao):'')+'</small><h3>'+esc(item.capitao?'Capitão: '+item.capitao:'Escalação oficial')+'</h3><p><b>Titulares:</b> '+esc(list(item.titulares)||'Não informado')+'</p><p><b>Reservas:</b> '+esc(list(item.reservas)||'Não informado')+'</p></div>'}
    else {const score=name==='results'?'<strong class="data-score">'+esc(item.gols_baixa_grande??'-')+' × '+esc(item.gols_adversario??'-')+'</strong>':'';const status=item.status==='ao_vivo'?'AO VIVO':(item.status==='encerrado'?'ENCERRADO':'PRÓXIMO JOGO');card.innerHTML=(item.escudo_adversario?image(item.escudo_adversario,item.adversario):'')+'<div class="data-body"><small>'+esc(item.competicao||'JOGO')+' • '+status+'</small><h3>Baixa Grande × '+esc(item.adversario)+'</h3><p>'+fmtDate(item.data_jogo)+(item.horario?' • '+fmtTime(item.horario):'')+(item.local?' • '+esc(item.local):'')+'</p>'+score+(item.destaque?'<span>'+esc(item.destaque)+'</span>':'')+'</div>'}
    box.appendChild(card);
  });
  screen.appendChild(box);
}

async function loadHome(){
  if(!homeUpdates)return;
  homeUpdates.innerHTML=empty('Verificando conexão com o site...');
  const [news,games,alerts]=await Promise.all([
    getNews(1),
    queryTable('jogos','id,adversario,data_jogo,status,gols_baixa_grande,gols_adversario',q=>q.eq('status','encerrado').order('data_jogo',{ascending:false}).limit(1)),
    queryTable('avisos','id',q=>q.eq('ativo',true).limit(1))
  ]);
  const errors=[news,games,alerts].filter(x=>x.error).length;
  if(errors){setSync(false,'Problema na conexão');homeUpdates.innerHTML=empty('Não foi possível verificar o site agora.');return}
  const latest=games.data?.[0];
  homeUpdates.innerHTML=[
    '<article class="data-card"><div class="assistant-icon">✓</div><div class="data-body"><small>CONEXÃO</small><h3>Banco de dados conectado</h3><p>O aplicativo está lendo os dados oficiais do site.</p></div></article>',
    latest?'<article class="data-card"><div class="assistant-icon">⚽</div><div class="data-body"><small>ÚLTIMO JOGO</small><h3>Baixa Grande '+esc(latest.gols_baixa_grande??'-')+' × '+esc(latest.gols_adversario??'-')+' '+esc(latest.adversario)+'</h3><p>'+fmtDate(latest.data_jogo)+' • '+esc(latest.status)+'</p></div></article>':''
  ].join('');
  setSync(true,'Site sincronizado');
}

async function renderCheck(){
  screen.innerHTML='<button class="back" data-screen="home">‹ Voltar</button><div class="assistant-head"><div class="assistant-icon">✓</div><div><h2>Verificar site</h2><p>Conferência automática dos dados publicados.</p></div></div><div id="checkBox" class="data-list"><div class="empty-state">Verificando...</div></div>';
  const box=document.getElementById('checkBox');
  if(!supabaseClient){box.innerHTML=empty('Banco indisponível.');return}
  const checks=[];
  const count=async(table,filter)=>{let q=supabaseClient.from(table).select('*',{count:'exact',head:true});if(filter)q=filter(q);return await q};
  const [news,games,alerts,photos,lineups]=await Promise.all([
    count('noticias',q=>q.eq('publicado',true)),
    count('jogos'),
    count('avisos',q=>q.eq('ativo',true)),
    count('galeria',q=>q.eq('ativo',true)),
    count('escalacoes')
  ]);
  const errors=[news,games,alerts,photos,lineups].filter(x=>x.error);
  if(errors.length){box.innerHTML=empty('Não foi possível concluir a verificação.');return}
  const latest=await queryTable('jogos','id,adversario,data_jogo,status,gols_baixa_grande,gols_adversario',q=>q.eq('status','encerrado').order('data_jogo',{ascending:false}).limit(1));
  const latestGame=latest.data?.[0];
  const rows=[
    ['Notícias publicadas',news.count??0,'ok'],
    ['Jogos cadastrados',games.count??0,'ok'],
    ['Avisos ativos',alerts.count??0,'ok'],
    ['Fotos na galeria',photos.count??0,'ok'],
    ['Escalações',lineups.count??0,'ok'],
    ['Último jogo registrado',latestGame?('Baixa Grande '+(latestGame.gols_baixa_grande??'-')+' × '+(latestGame.gols_adversario??'-')+' '+latestGame.adversario):'Nenhum','ok']
  ];
  box.innerHTML=rows.map(r=>'<article class="data-card"><div class="assistant-icon">'+(r[2]==='ok'?'✓':'!')+'</div><div class="data-body"><small>VERIFICAÇÃO</small><h3>'+esc(r[0])+'</h3><p>'+esc(String(r[1]))+'</p></div></article>').join('');
}
function renderCategories(){
  screen.insertAdjacentHTML('beforeend','<div class="category-list">'+
    ['Sub-13','Sub-15','Sub-17','Sub-20'].map((c,i)=>'<article class="data-card"><div class="assistant-icon">'+(i+1)+'</div><div class="data-body"><small>FUTEBOL DE BASE</small><h3>'+c+'</h3><p>Informações e novidades da categoria no portal oficial.</p></div></article>').join('')+
    '</div>');
}

async function renderAthletes(){
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(!session){screen.innerHTML='<button class="back" data-screen="home">‹ Voltar</button>'+empty('Entre na área da equipe para acessar os atletas.');return}
  const {data:trainer}=await supabaseClient.from('Perfis').select('Tipo').eq('Email',session.user.email).maybeSingle();
  const {data:admin}=await supabaseClient.from('admin_users').select('user_id').eq('user_id',session.user.id).maybeSingle();
  if(!admin && String(trainer?.Tipo||'').toLowerCase()!=='treinador'){screen.innerHTML='<button class="back" data-screen="home">‹ Voltar</button>'+empty('A área de atletas é exclusiva para professores e treinadores autorizados.');return}
  screen.innerHTML='<button class="back" data-screen="home">‹ Voltar</button><div class="assistant-head"><div class="assistant-icon">⚽</div><div><h2>Atletas</h2><p>Cadastro e acompanhamento da equipe.</p></div></div><div class="athlete-tools"><input id="athleteSearch" placeholder="Buscar atleta..."><select id="athleteCategory"><option value="">Todas as categorias</option><option>Sub-13</option><option>Sub-15 / Sub-17</option><option>Sub-20</option></select></div><div id="athleteList" class="data-list"><div class="empty-state">Carregando atletas...</div></div>';
  const {data,error}=await supabaseClient.from('Atletas').select('id,nome,categoria,posicao,numero_camisa,foto,jogos,titularidades,gols,assistencias,presencas,faltas_treino,telefone_responsavel,status,observacoes').order('categoria').order('nome').limit(300);
  if(error){document.getElementById('athleteList').innerHTML=empty('Não foi possível carregar os atletas.');return}
  const list=document.getElementById('athleteList'),search=document.getElementById('athleteSearch'),cat=document.getElementById('athleteCategory');
  const draw=()=>{const term=search.value.trim().toLowerCase(),category=cat.value;const rows=(data||[]).filter(x=>(!term||String(x.nome||'').toLowerCase().includes(term))&&(!category||x.categoria===category));if(!rows.length){list.innerHTML=empty('Nenhum atleta encontrado.');return}list.innerHTML=rows.map(x=>'<article class="athlete-card">'+image(x.foto,x.nome)+'<div class="data-body"><small>'+esc(x.categoria||'ATLETA')+'</small><h3>'+esc(x.nome)+'</h3><p>'+esc(x.posicao||'Posição não informada')+(x.numero_camisa?' • Camisa '+esc(x.numero_camisa):'')+'</p><div class="athlete-meta"><span>Presenças: '+esc(x.presencas??0)+'</span><span>Faltas: '+esc(x.faltas_treino??0)+'</span></div><p class="responsavel"><b>Responsável:</b> '+esc(x.telefone_responsavel||'Telefone não cadastrado')+'</p><button class="mini-btn athlete-edit" data-athlete-id="'+esc(x.id)+'">Editar telefone</button></div></article>').join('');list.querySelectorAll('.athlete-edit').forEach(btn=>btn.addEventListener('click',()=>editAthletePhone(btn.dataset.athleteId,data)));};
  search.addEventListener('input',draw);cat.addEventListener('change',draw);draw();
}
async function editAthletePhone(id,rows){
  const athlete=rows.find(x=>x.id===id);if(!athlete)return;
  const phone=window.prompt('Telefone do responsável por '+athlete.nome,athlete.telefone_responsavel||'');
  if(phone===null)return;
  const {error}=await supabaseClient.from('Atletas').update({telefone_responsavel:phone.trim()||null}).eq('id',id);
  if(error){window.alert('Não foi possível salvar o telefone.');return}
  athlete.telefone_responsavel=phone.trim()||null;renderAthletes();
}

function renderMore(){
  screen.innerHTML='<button class="back" data-screen="home">‹ Voltar</button><h2>Mais</h2><p>Ferramentas do aplicativo.</p><div class="grid more-grid">'+
    '<button class="tile" data-screen="assistant"><b>Assistente</b><small>Produção e comandos do site</small></button>'+
    '<button class="tile" data-screen="check"><b>Verificar site</b><small>Conferência automática</small></button>'+
    '<button class="tile" data-screen="athletes"><b>Atletas</b><small>Equipe, presenças e responsáveis</small></button>'+
    '<button class="tile" data-url="'+SITE_URL+'"><b>Site oficial</b><small>Abrir portal completo</small></button>'+
    '<button class="tile" data-url="'+INSTAGRAM_URL+'"><b>Instagram</b><small>@selecaobaixagrande</small></button>'+
    '</div>';
}

async function renderAssistant(){
  if(!supabaseClient){screen.innerHTML='<button class="back" data-screen="home">‹ Voltar</button>'+empty('Conexão com o banco indisponível.');return}
  const{data:{session}}=await supabaseClient.auth.getSession();
  if(!session){chatHistory=[];screen.innerHTML='<button class="back" data-screen="home">‹ Voltar</button><div class="assistant-head"><div class="assistant-icon">✦</div><div><h2>Área administrativa</h2><p>Entre para usar o Assistente da Seleção.</p></div></div><form id="loginForm" class="chat-form" style="display:flex;flex-direction:column"><input id="loginEmail" type="email" autocomplete="username" placeholder="E-mail"><input id="loginPassword" type="password" autocomplete="current-password" placeholder="Senha"><button type="submit" style="height:44px">Entrar</button><div id="loginError" class="empty-state" hidden></div></form>';document.getElementById('loginForm').addEventListener('submit',loginAdmin);return}
  screen.innerHTML='<button class="back" data-screen="home">‹ Voltar</button><div class="assistant-head"><div class="assistant-icon">✦</div><div><h2>Assistente da Seleção</h2><p>Assistente editorial oficial.</p></div><button id="logoutBtn" class="icon-btn" type="button" title="Sair">×</button></div><div class="command-list"><button data-command="/TEXT">/TEXT <small>Texto profissional</small></button><button data-command="/NEWS">/NEWS <small>Notícia</small></button><button data-command="/TITLE">/TITLE <small>Título</small></button><button data-command="/CAPTION">/CAPTION <small>Legenda</small></button><button data-command="/RESULT">/RESULT <small>Resultado</small></button><button data-command="/GAME">/GAME <small>Jogo</small></button><button data-command="/TRAINING">/TRAINING <small>Treino</small></button><button data-command="/INSTAGRAM">/INSTAGRAM <small>Instagram</small></button></div><div class="chat" id="chat"><div class="bubble">Olá! Sou o Assistente da Seleção. Escolha um comando ou escreva seu pedido.</div></div><div id="imagePreview" class="image-preview" hidden></div><form class="chat-form" id="chatForm"><label class="attach-btn" id="attachBtn" title="Adicionar fotos" aria-label="Adicionar fotos">＋<input id="imageInput" class="image-input" type="file" accept="image/*" multiple></label><input id="chatInput" autocomplete="off" placeholder="Digite seu pedido..."><button>Enviar</button></form>';document.getElementById('chatForm').addEventListener('submit',sendChat);document.getElementById('logoutBtn').addEventListener('click',async()=>{await supabaseClient.auth.signOut();renderAssistant()});document.querySelectorAll('[data-command]').forEach(b=>b.addEventListener('click',()=>{document.getElementById('chatInput').value=b.dataset.command+' ';document.getElementById('chatInput').focus()}));document.getElementById('imageInput').addEventListener('change',async e=>{for(const file of [...e.target.files].slice(0,6-chatImages.length)){if(file.type.startsWith('image/'))chatImages.push(await prepareImage(file));}renderImagePreview();e.target.value='';});
}

async function loginAdmin(e){
  e.preventDefault();
  const email=document.getElementById('loginEmail').value.trim(),password=document.getElementById('loginPassword').value,errorBox=document.getElementById('loginError');
  const{data,error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error||!data?.session){errorBox.hidden=false;errorBox.textContent='Não foi possível entrar. Verifique o e-mail e a senha.';return}
  const{data:allowed}=await supabaseClient.from('admin_users').select('user_id').eq('user_id',data.session.user.id).maybeSingle();
  const{data:profile}=await supabaseClient.from('Perfis').select('Tipo').eq('Email',data.session.user.email).maybeSingle();
  const isTrainer=String(profile?.Tipo||'').toLowerCase()==='treinador';
  if(!allowed&&!isTrainer){await supabaseClient.auth.signOut();errorBox.hidden=false;errorBox.textContent='Este usuário não possui acesso à equipe técnica.';return}
  renderAssistant();
}

async function openScreen(name){
  if(name==='home'){
    screen.hidden=true;document.querySelector('.hero').hidden=false;document.querySelectorAll('.section').forEach(x=>x.hidden=false);loadHome();
  }else if(name==='more'){
    document.querySelector('.hero').hidden=true;document.querySelectorAll('.section').forEach(x=>x.hidden=true);screen.hidden=false;renderMore();
  }else if(name==='check'){document.querySelector('.hero').hidden=true;document.querySelectorAll('.section').forEach(x=>x.hidden=true);screen.hidden=false;await renderCheck();
  }else if(name==='assistant'){
    document.querySelector('.hero').hidden=true;document.querySelectorAll('.section').forEach(x=>x.hidden=true);screen.hidden=false;await renderAssistant();
  }else{
    document.querySelector('.hero').hidden=true;document.querySelectorAll('.section').forEach(x=>x.hidden=true);screen.hidden=false;screen.innerHTML='<button class="back" data-screen="home">‹ Voltar</button><h2>'+esc(content[name][0])+'</h2><p>'+esc(content[name][1])+'</p>';
    if(name==='categories')renderCategories();else await loadData(name);
  }
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.screen===name));
}

async function prepareImage(file){
  return await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{const img=new Image();img.onload=()=>{const max=1600,scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve({name:file.name,data:c.toDataURL('image/jpeg',.82)});};img.onerror=reject;img.src=reader.result;};reader.onerror=reject;reader.readAsDataURL(file);
  });
}
function renderImagePreview(){
  const box=document.getElementById('imagePreview');if(!box)return;
  box.hidden=!chatImages.length;
  box.innerHTML=chatImages.map((x,i)=>'<div class="image-chip"><img src="'+x.data+'" alt="Imagem '+(i+1)+'"><button type="button" data-remove-image="'+i+'">×</button><small>Imagem '+(i+1)+'</small></div>').join('');
  box.querySelectorAll('[data-remove-image]').forEach(b=>b.addEventListener('click',()=>{chatImages.splice(Number(b.dataset.removeImage),1);renderImagePreview();}));
}
async function sendChat(e){
  e.preventDefault();const input=document.getElementById('chatInput'),text=input.value.trim();if(!text&&!chatImages.length)return;
  const chat=document.getElementById('chat');const me=document.createElement('div');me.className='bubble me';me.textContent=(text||'Analise as fotos que enviei.')+(chatImages.length?'\n\n📷 '+chatImages.length+' foto(s) enviada(s).':'');chat.appendChild(me);input.value='';
  const loading=document.createElement('div');loading.className='bubble';loading.textContent='Analisando…';chat.appendChild(loading);
  const images=chatImages.map(x=>x.data);chatImages=[];renderImagePreview();
  const historyForRequest=chatHistory.slice(-12);
  try{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),30000);
    let result;
    try{
      result=await supabaseClient.functions.invoke('selecaobot',{body:{message:text||'Analise as fotos enviadas e siga exatamente minha orientação. Identifique cada foto como Imagem 1, Imagem 2 etc. Se eu pedir para escolher uma foto para usar, diga claramente qual imagem deve ser usada e por quê.',images,history:historyForRequest},signal:controller.signal});
    }finally{clearTimeout(timeout)}
    const{data,error}=result;
    if(error){
      let detail=error.message||'Não foi possível conectar ao Assistente.';
      try{if(error.context){const body=await error.context.json();detail=body?.detail||body?.error||detail;}}catch(_e){}
      throw new Error(detail);
    }
    if(data?.ok===false){
      loading.textContent='Erro da IA: '+(data.detail||data.error||'erro desconhecido');
      return;
    }
    const answer=data?.answer||'Não recebi uma resposta.';
    loading.textContent=answer;
    chatHistory.push({role:'user',content:text||'Analise as fotos enviadas.'},{role:'assistant',content:answer});
    chatHistory=chatHistory.slice(-12);
  }catch(err){
    console.error(err);
    let detail=err?.message||'erro desconhecido';
    try{if(err?.context){const body=await err.context.json();detail=body?.detail||body?.error||detail;}}catch(_e){}
    loading.textContent='Erro do Assistente: '+detail;
  }
}

function setupLiveSync(){
  if(!supabaseClient)return;
  try{
    liveChannel=supabaseClient.channel('app-live-sync')
      .on('postgres_changes',{event:'*',schema:'public',table:'noticias'},()=>{setSync(true,'Atualizado agora');loadHome()})
      .on('postgres_changes',{event:'*',schema:'public',table:'jogos'},()=>{setSync(true,'Atualizado agora');loadHome()})
      .on('postgres_changes',{event:'*',schema:'public',table:'avisos'},()=>{setSync(true,'Atualizado agora');loadHome()})
      .on('postgres_changes',{event:'*',schema:'public',table:'galeria'},()=>{setSync(true,'Atualizado agora');loadHome()})
      .on('postgres_changes',{event:'*',schema:'public',table:'escalacoes'},()=>{setSync(true,'Atualizado agora');loadHome()})
      .subscribe();
  }catch(e){}
}

async function refreshAll(){
  setSync(false,'Atualizando...');
  await loadHome();
  setSync(true,'Sincronizado com o site');
}

document.getElementById('refreshBtn')?.addEventListener('click',async()=>{await refreshAll();if(!screen.hidden&&document.querySelector('.nav-item[data-screen="check"]')?.classList.contains('active'))await renderCheck();});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-screen]');if(b){e.preventDefault();openScreen(b.dataset.screen);return}
  const u=e.target.closest('[data-url]');if(u){window.location.href=u.dataset.url}
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshAll()});
window.addEventListener('online',refreshAll);
loadHome();setupLiveSync();setSync(true,'Sincronizado com o site');setInterval(()=>{if(document.visibilityState==='visible')refreshAll()},60000);
