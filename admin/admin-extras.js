/* Extra admin modules: partners and lineups */
(function () {
  const $ = (id) => document.getElementById(id);
  const db = () => window.adminSupabase;
  const api = () => window.adminApi;
  async function rows(table, columns) {
    if (api()?.select) return api().select(table, columns);
    return db().from(table).select(columns);
  }
  function status(message) {
    const el = $("extras-status");
    if (el) el.textContent = message;
  }
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  async function loadPartners() {
    const target = $("partners-list");
    if (!target) return;
    try {
      const result = await db().from("parceiros").select("id,nome,categoria,logo_url,site_url,instagram_url,descricao,ativo,ordem").order("ordem");
      const items = result?.data || result || [];
      target.innerHTML = items.length ? items.map(p => '<div class="admin-list-item"><strong>'+esc(p.nome)+'</strong> · '+esc(p.categoria||"Parceiro")+' <span>'+ (p.ativo ? "Ativo" : "Inativo") +'</span> <button type="button" data-partner-delete="'+esc(p.id)+'">Excluir</button></div>').join("") : "<p>Nenhum parceiro cadastrado.</p>";
    } catch (e) { target.textContent = "Não foi possível carregar parceiros."; }
  }
  async function savePartner(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      nome: $("partner-name")?.value.trim(),
      categoria: $("partner-category")?.value.trim() || "Patrocinador",
      logo_url: $("partner-logo")?.value.trim() || null,
      site_url: $("partner-site")?.value.trim() || null,
      instagram_url: $("partner-instagram")?.value.trim() || null,
      descricao: $("partner-description")?.value.trim() || null,
      ativo: $("partner-active")?.checked ?? true,
      ordem: Number($("partner-order")?.value || 0)
    };
    if (!payload.nome) return status("Informe o nome do parceiro.");
    try {
      const result = await db().from("parceiros").insert(payload);
      if (result?.error) throw result.error;
      form.reset(); if ($("partner-active")) $("partner-active").checked = true;
      status("Parceiro salvo."); await loadPartners();
    } catch (e) { status("Erro ao salvar parceiro. Confira sua sessão de administrador e as permissões do Supabase."); }
  }
  async function deletePartner(id) {
    if (!confirm("Excluir este parceiro?")) return;
    try {
      const result = await db().from("parceiros").delete().eq("id", id);
      if (result?.error) throw result.error;
      status("Parceiro excluído."); await loadPartners();
    } catch (e) { status("Não foi possível excluir o parceiro."); }
  }
  async function loadLineups() {
    const target = $("lineups-list");
    if (!target) return;
    try {
      const result = await db().from("escalacoes").select("id,categoria,formacao,capitao,observacoes,criado_em").order("criado_em", {ascending:false});
      const items = result?.data || result || [];
      target.innerHTML = items.length ? items.map(x => '<div class="admin-list-item"><strong>'+esc(x.categoria||"Escalação")+'</strong> · '+esc(x.formacao||"Formação não informada")+' · Capitão: '+esc(x.capitao||"—")+' <button type="button" data-lineup-delete="'+esc(x.id)+'">Excluir</button></div>').join("") : "<p>Nenhuma escalação cadastrada.</p>";
    } catch (e) { target.textContent = "Não foi possível carregar escalações."; }
  }
  async function saveLineup(event) {
    event.preventDefault();
    const payload = {
      categoria: $("lineup-category")?.value.trim() || "Principal",
      formacao: $("lineup-formation")?.value.trim() || null,
      capitao: $("lineup-captain")?.value.trim() || null,
      titulares: ($("lineup-starters")?.value || "").split("\n").map(x=>x.trim()).filter(Boolean),
      reservas: ($("lineup-subs")?.value || "").split("\n").map(x=>x.trim()).filter(Boolean),
      observacoes: $("lineup-notes")?.value.trim() || null
    };
    try {
      const result = await db().from("escalacoes").insert(payload);
      if (result?.error) throw result.error;
      event.currentTarget.reset(); status("Escalação salva."); await loadLineups();
    } catch (e) { status("Erro ao salvar escalação. Confira os campos obrigatórios e as permissões do Supabase."); }
  }
  async function deleteLineup(id) {
    if (!confirm("Excluir esta escalação?")) return;
    try {
      const result = await db().from("escalacoes").delete().eq("id", id);
      if (result?.error) throw result.error;
      status("Escalação excluída."); await loadLineups();
    } catch (e) { status("Não foi possível excluir a escalação."); }
  }
  document.addEventListener("DOMContentLoaded", () => {
    $("partner-form")?.addEventListener("submit", savePartner);
    $("lineup-form")?.addEventListener("submit", saveLineup);
    document.addEventListener("click", e => {
      const p = e.target.closest("[data-partner-delete]");
      const l = e.target.closest("[data-lineup-delete]");
      if (p) deletePartner(p.dataset.partnerDelete);
      if (l) deleteLineup(l.dataset.lineupDelete);
    });
    loadPartners(); loadLineups();
  });
})();