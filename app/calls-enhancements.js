/* Chamadas — presença rápida e envio de relatório ao diretor */
(() => {
  const RAMON_EMAIL = '';

  async function sendCallReport(chamadaId) {
    if (!RAMON_EMAIL) return { ok:false, configured:false };
    const r = await supabaseClient.functions.invoke('enviar-relatorio-chamada', {
      body: { chamada_id: chamadaId, destinatario: RAMON_EMAIL }
    });
    return { ok: !r.error, configured:true, error:r.error };
  }

  window.callDetail = async function(id, all, ats) {
    const x = all.find(y => y.id === id);
    if (!x) return;
    const m = await q('chamada_atletas','id,atleta_id,status,observacao',z=>z.eq('chamada_id',id));
    const selected = m.data || [];
    const present = selected.filter(s=>s.status==='presente').length;
    const absent = selected.filter(s=>s.status==='faltou').length;

    const rowsHtml = selected.map(s => {
      const a = ats.find(y => y.id===s.atleta_id);
      return '<article class="data-card call-athlete-row" data-row="'+s.id+'"><div class="data-body"><h3>'+esc(a?.nome||'Atleta')+'</h3><p>'+esc(a?.categoria||'')+'</p><div class="attendance-actions">'+
        '<button type="button" class="attendance-btn present '+(s.status==='presente'?'selected':'')+'" data-presente="'+s.id+'">✓ PRESENTE</button>'+
        '<button type="button" class="attendance-btn absent '+(s.status==='faltou'?'selected':'')+'" data-faltou="'+s.id+'">✕ FALTOU</button>'+
        '</div></div></article>';
    }).join('');

    shell('Chamada','Registre a presença dos atletas.',
      '<div class="panel-card call-summary"><small>'+esc(x.tipo.toUpperCase())+' • '+fmtDate(x.data_chamada)+' • '+fmtTime(x.horario)+'</small>'+
      '<h3>'+esc(x.local||'Local não informado')+'</h3><p>'+esc(x.observacoes||'')+'</p>'+
      '<div class="call-counters"><span class="call-count present"><b id="callPresent">'+present+'</b> Presentes</span><span class="call-count absent"><b id="callAbsent">'+absent+'</b> Faltaram</span><span class="call-count pending"><b id="callPending">'+(selected.length-present-absent)+'</b> Pendentes</span></div></div>'+
      '<div class="data-list call-athletes">'+rowsHtml+'</div>'+
      '<div class="call-footer-actions"><button class="primary-btn" id="finishCall">Encerrar chamada</button><button class="mini-btn" data-cancel-call="'+id+'">Cancelar chamada</button></div>'
    );

    const refreshCounters = () => {
      const rows=[...screen.querySelectorAll('.call-athlete-row')];
      const p=rows.filter(r=>r.querySelector('.attendance-btn.present.selected')).length;
      const f=rows.filter(r=>r.querySelector('.attendance-btn.absent.selected')).length;
      document.getElementById('callPresent').textContent=p;
      document.getElementById('callAbsent').textContent=f;
      document.getElementById('callPending').textContent=rows.length-p-f;
    };

    async function mark(rowId,status,button) {
      const r=await upd('chamada_atletas',rowId,{status,responded_at:new Date().toISOString()});
      if(r.error){alert(r.error.message);return;}
      const row=screen.querySelector('[data-row="'+rowId+'"]');
      row.querySelectorAll('.attendance-btn').forEach(b=>b.classList.remove('selected'));
      button.classList.add('selected');
      refreshCounters();
    }

    screen.querySelectorAll('[data-presente]').forEach(b=>b.onclick=()=>mark(b.dataset.presente,'presente',b));
    screen.querySelectorAll('[data-faltou]').forEach(b=>b.onclick=()=>mark(b.dataset.faltou,'faltou',b));
    screen.querySelector('[data-cancel-call]').onclick=async()=>{await upd('chamadas',id,{status:'cancelada'});renderCalls()};

    screen.querySelector('#finishCall').onclick=async()=>{
      const rows=[...screen.querySelectorAll('.call-athlete-row')];
      if(rows.some(r=>!r.querySelector('.attendance-btn.selected'))){
        alert('Marque PRESENTE ou FALTOU para todos os atletas antes de encerrar a chamada.');
        return;
      }
      const finish=await upd('chamadas',id,{status:'encerrada'});
      if(finish.error){alert(finish.error.message);return;}
      const result=await sendCallReport(id);
      if(result.ok) alert('Chamada encerrada. O relatório foi enviado ao diretor de esportes.');
      else if(!result.configured) alert('Chamada encerrada. O envio por e-mail será ativado quando o e-mail do Ramon for configurado.');
      else alert('Chamada encerrada, mas o e-mail não pôde ser enviado agora.');
      renderCalls();
    };
  };
})();
