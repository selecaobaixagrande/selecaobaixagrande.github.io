const SUPABASE_URL='https://lvxwziztdngntoqypzga.supabase.co';
// A chave pública será configurada depois. Nunca coloque uma secret/service key no app.
const SUPABASE_PUBLISHABLE_KEY='CONFIGURE_NO_SUPABASE_DASHBOARD';
const supabaseClient=(window.supabase&&SUPABASE_PUBLISHABLE_KEY.startsWith('sb_'))
  ? window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY):null;

const app=document.getElementById('app');
const screen=document.getElementById('screen');
const installBtn=document.getElementById('installBtn');
let deferredPrompt=null;

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installBtn.hidden=false});
installBtn.addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.hidden=true});
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});

const content={
 news:['Notícias','As notícias oficiais da Seleção aparecerão aqui quando o conteúdo estiver conectado ao Supabase.'],
 games:['Jogos','Próximos jogos, horários, locais e competições.'],
 results:['Resultados','Resultados oficiais e placares das partidas.'],
 squad:['Elenco','Atletas e categorias da Seleção de Baixa Grande.']
};

function openScreen(name){
 if(name==='home'){screen.hidden=true;document.querySelector('.hero').hidden=false;document.querySelectorAll('.section').forEach(x=>x.hidden=false)}
 else if(name==='assistant'){document.querySelector('.hero').hidden=true;document.querySelectorAll('.section').forEach(x=>x.hidden=true);screen.hidden=false;screen.innerHTML=`<button class="back" data-screen="home">‹ Voltar</button><h2>Assistente da Seleção</h2><p>Seu assistente editorial. Você pode pedir textos, notícias, títulos, legendas, resultados e publicações.</p><div class="chat" id="chat"><div class="bubble">Olá! Sou o Assistente da Seleção. O que você precisa criar hoje?</div></div><form class="chat-form" id="chatForm"><input id="chatInput" autocomplete="off" placeholder="Digite seu pedido..."><button>Enviar</button></form>`;document.getElementById('chatForm').addEventListener('submit',sendChat)}
 else {document.querySelector('.hero').hidden=true;document.querySelectorAll('.section').forEach(x=>x.hidden=true);screen.hidden=false;screen.innerHTML=`<button class="back" data-screen="home">‹ Voltar</button><h2>${content[name][0]}</h2><p>${content[name][1]}</p><p>Esta área já está preparada para receber os dados do banco da Seleção.</p>`}
 document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.screen===name));
}

async function sendChat(e){
 e.preventDefault();const input=document.getElementById('chatInput');const text=input.value.trim();if(!text)return;
 const chat=document.getElementById('chat');chat.insertAdjacentHTML('beforeend',`<div class="bubble me"></div>`);chat.lastElementChild.textContent=text;input.value='';
 const loading=document.createElement('div');loading.className='bubble';loading.textContent='Preparando resposta…';chat.appendChild(loading);
 // A chamada à IA será feita por Edge Function autenticada, mantendo chaves secretas no servidor.
 if(!supabaseClient){loading.textContent='O Assistente já está com a interface pronta. Falta apenas configurar a chave pública do Supabase para conectar esta tela ao backend.';return}
 try{
   const {data,error}=await supabaseClient.functions.invoke('selecaobot',{body:{message:text}});
   if(error)throw error;loading.textContent=data?.answer||'Não recebi uma resposta.';
 }catch(err){loading.textContent='A conexão com o Assistente ainda não foi configurada. A interface está pronta para a integração.'}
}

document.addEventListener('click',e=>{const b=e.target.closest('[data-screen]');if(b)openScreen(b.dataset.screen)});
