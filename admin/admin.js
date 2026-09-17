const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
let supabase=null,editingId=null,coverPath=null,coverUrl=null,loginBusy=false;
function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function loginMessage(msg,type='error'){const el=$('#loginMessage');if(!el)return;el.textContent=msg;el.className='notice '+type}
function slugify(v){return v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100)}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function show(view){$$('.view').forEach(x=>x.classList.toggle('active',x.id===view));$$('.nav[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===view));const titles={dashboard:'Visão geral',news:'Notícias',editor:editingId?'Editar notícia':'Nova notícia'};if($('#pageTitle'))$('#pageTitle').textContent=titles[view]||'Painel';if(view==='news')loadNews()}
function setStatus(text,ok=false){const s=$('#connectionStatus');if(s)s.textContent=text;const dot=s?.previousElementSibling;if(dot)dot.classList.toggle('ok',ok)}
async function requireAdmin(){
  if(!supabase){$('#app').hidden=true;$('#login').classList.add('active');setStatus('Erro de configuração');loginMessage('Erro ao carregar o sistema de autenticação.');return false}
  try{
    const {data:{session},error:sessionError}=await supabase.auth.getSession();
    if(sessionError)throw sessionError;
    if(!session){$('#login').classList.add('active');$('#app').hidden=true;setStatus('Faça login');return false}
    const {data,error}=await supabase.from('admin_users').select('user_id').eq('user_id',session.user.id).maybeSingle();
    if(error)throw error;
    if(!data){await supabase.auth.signOut();$('#login').classList.add('active');$('#app').hidden=true;setStatus('Acesso negado');loginMessage('Acesso negado. Esta conta não possui permissão administrativa.');return false}
    $('#login').classList.remove('active');$('#app').hidden=false;setStatus('Supabase conectado',true);loginMessage('');await loadStats();await loadNews();return true;
  }catch(e){console.error('Admin authorization error:',e);$('#app').hidden=true;$('#login').classList.add('active');setStatus('Erro de conexão');loginMessage('Não foi possível verificar seu acesso. Tente novamente.');return false}
}
async function doLogin(){
  if(loginBusy)return;
  if(!supabase){loginMessage('Erro ao carregar o sistema de autenticação. Recarregue a página.');return}
  const email=$('#loginEmail')?.value.trim()||'',password=$('#loginPassword')?.value||'',btn=$('#loginBtn');
  if(!email||!password){loginMessage('Informe o e-mail e a senha.');return}
  loginBusy=true;if(btn){btn.disabled=true;btn.textContent='Entrando...'}loginMessage('Entrando...','loading');setStatus('Autenticando...');
  try{
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error){
      console.error('Login error:',error);const msg=(error.message||'').toLowerCase();
      if(msg.includes('invalid login credentials')||msg.includes('invalid credentials'))loginMessage('E-mail ou senha incorretos. Confira os dados e tente novamente.');
      else if(msg.includes('email not confirmed'))loginMessage('O e-mail ainda não foi confirmado no Supabase.');
      else if(msg.includes('too many requests'))loginMessage('Muitas tentativas. Aguarde um pouco e tente novamente.');
      else loginMessage('Não foi possível entrar. Tente novamente.');
      setStatus('Falha no login');return;
    }
    const ok=await requireAdmin();
    if(!ok)await supabase.auth.signOut();
  }catch(e){console.error('Login exception:',e);setStatus('Erro de conexão');loginMessage('Não foi possível conectar ao sistema. Verifique sua internet e tente novamente.');}
  finally{loginBusy=false;if(btn){btn.disabled=false;btn.textContent='Entrar'}}
}
function bindLogin(){const btn=$('#loginBtn'),form=$('#loginForm');if(!btn||!form){console.error('Admin login elements not found');return}btn.addEventListener('click',doLogin);form.addEventListener('submit',e=>{e.preventDefault();doLogin()});window.adminLogin=doLogin}
$$('.nav[data-view]').forEach(b=>b.onclick=()=>show(b.dataset.view));$$('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
async function loadStats(){const {data,error}=await supabase.from('news').select('status');if(error){toast('Erro ao carregar notícias.');return}const total=data.length,d=data.filter(n=>n.status==='draft'||n.status==='unpublished').length,p=data.filter(n=>n.status==='published').length;$('#statNews').textContent=total;$('#statDraft').textContent=d;$('#statPublished').textContent=p}
async function loadNews(){const box=$('#newsList');if(!box)return;box.innerHTML='<div class="empty">Carregando notícias...</div>';const {data,error}=await supabase.from('news').select('*').order('created_at',{ascending:false});if(error){box.innerHTML='<div class="empty">Não foi possível carregar as notícias.</div>';return}if(!data.length){box.innerHTML='<div class="empty">Nenhuma notícia cadastrada ainda.</div>';return}box.innerHTML=data.map(n=>`<article class="panel"><div class="panel-head"><div><small>${esc(n.category||'Notícias')} • ${esc(n.status)}</small><h3>${esc(n.title)}</h3></div><div class="actions"><button type="button" class="ghost" data-edit="${n.id}">Editar</button>${n.status==='published'?`<button type="button" class="ghost" data-toggle="${n.id}" data-status="unpublished">Despublicar</button>`:`<button type="button" class="ghost" data-toggle="${n.id}" data-status="published">Publicar</button>`}<button type="button" class="ghost" data-delete="${n.id}">Excluir</button></div></div><p class="muted">${esc(n.subtitle||'')}</p><small class="muted">${n.published_at?new Date(n.published_at).toLocaleString('pt-BR'):'Sem publicação'}</small></article>`).join('');$$('[data-edit]').forEach(b=>b.onclick=()=>editNews(b.dataset.edit));$$('[data-toggle]').forEach(b=>b.onclick=()=>setNewsStatus(b.dataset.toggle,b.dataset.status));$$('[data-delete]').forEach(b=>b.onclick=()=>deleteNews(b.dataset.delete));await loadStats()}
async function editNews(id){const {data,error}=await supabase.from('news').select('*').eq('id',id).single();if(error)return toast('Erro ao abrir notícia.');editingId=id;coverPath=null;coverUrl=data.cover_image||null;$('#title').value=data.title||'';$('#subtitle').value=data.subtitle||'';$('#category').value=data.category||'Notícias';$('#author').value=data.author||'';$('#content').innerHTML=data.content||'';$('#seoTitle').value=data.seo_title||'';$('#slug').value=data.slug||'';$('#seoDescription').value=data.seo_description||'';updateCover();show('editor')}
function collect(){return{title:$('#title').value.trim(),subtitle:$('#subtitle').value.trim(),category:$('#category').value,author:$('#author').value.trim()||'Seleção de Baixa Grande',content:$('#content').innerHTML.trim(),seo_title:$('#seoTitle').value.trim()||$('#title').value.trim().slice(0,70),slug:$('#slug').value.trim()||slugify($('#title').value),seo_description:$('#seoDescription').value.trim()}}
async function uploadCover(){const f=$('#coverFile').files[0];if(!f)return coverUrl;const ext=(f.name.split('.').pop()||'jpg').toLowerCase();const path=`covers/${crypto.randomUUID()}.${ext}`;const {error}=await supabase.storage.from('news').upload(path,f,{upsert:false,contentType:f.type,cacheControl:'31536000'});if(error)throw error;coverPath=path;coverUrl=supabase.storage.from('news').getPublicUrl(path).data.publicUrl;return coverUrl}
async function saveNews(status){const n=collect();if(!n.title)return toast('Informe o título.');try{const image=await uploadCover();const row={title:n.title,slug:n.slug,subtitle:n.subtitle,content:n.content,cover_image:image,category:n.category,author:n.author,status,published_at:status==='published'?new Date().toISOString():null,seo_title:n.seo_title,seo_description:n.seo_description,og_image:image};let error;if(editingId){({error}=await supabase.from('news').update(row).eq('id',editingId))}else{const r=await supabase.from('news').insert(row).select('id').single();error=r.error;if(!error)editingId=r.data.id}if(error)throw error;toast(status==='published'?'Notícia publicada.':'Rascunho salvo.');await loadStats();await loadNews();show('news')}catch(e){toast('Não foi possível salvar: '+(e.message||'erro'))}}
function bindEditor(){const d=$('#draftBtn'),nf=$('#newsForm'),t=$('#title'),sl=$('#slug'),sf=$('#coverFile');if(d)d.onclick=()=>saveNews('draft');if(nf)nf.onsubmit=e=>{e.preventDefault();saveNews('published')};if(t)t.oninput=()=>{if(!sl.dataset.manual)sl.value=slugify(t.value);if(!$('#seoTitle').value)$('#seoTitle').value=t.value.slice(0,70)};if(sl)sl.oninput=e=>e.target.dataset.manual='1';if(sf)sf.onchange=updateCover}
async function setNewsStatus(id,status){const {error}=await supabase.from('news').update({status,published_at:status==='published'?new Date().toISOString():null}).eq('id',id);if(error)toast('Erro ao alterar publicação.');else{toast(status==='published'?'Publicado.':'Despublicado.');loadNews()}}
async function deleteNews(id){if(!confirm('Excluir esta notícia?'))return;const {error}=await supabase.from('news').delete().eq('id',id);if(error)toast('Erro ao excluir.');else{toast('Notícia excluída.');loadNews()}}
function updateCover(){const f=$('#coverFile')?.files[0],p=$('#coverPreview');if(!p)return;if(f){p.style.backgroundImage=`url(${URL.createObjectURL(f)})`;p.querySelector('span').style.display='none'}else if(coverUrl){p.style.backgroundImage=`url(${coverUrl})`;p.querySelector('span').style.display='none'}else{p.style.backgroundImage='none';p.querySelector('span').style.display='block'}}
function init(){try{if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY)throw new Error('Supabase configuration missing');supabase=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);bindLogin();bindEditor();supabase.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')requireAdmin()});requireAdmin()}catch(e){console.error('Admin init error:',e);setStatus('Erro de configuração');loginMessage('Erro ao carregar o sistema de autenticação. Recarregue a página.')}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();