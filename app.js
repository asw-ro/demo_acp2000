// Escape HTML pentru valori din API — protecţie XSS în template strings.
// DOMPurify (încărcat în pagină) se foloseşte pentru câmpuri rich-text
// (ex: anunt.text cu HTML formatat). Pentru valori plain-text se foloseşte esc().
function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Funcţii helper pentru badge-uri nav (citesc DATA direct — sursă de adevăr)
function stB(s, a) {
  return s === 0
    ? '<span class="badge badge-green">Achitată</span>'
    : s < a
      ? '<span class="badge badge-amber">Parțial</span>'
      : '<span class="badge badge-red">Neachitată</span>';
}
function seB(s) {
  return s === "Soluționat"
    ? '<span class="badge badge-green">Soluționat</span>'
    : s === "În lucru"
      ? '<span class="badge badge-amber">În lucru</span>'
      : '<span class="badge badge-blue">Înregistrat</span>';
}
function fNeach() {
  return DATA.facturi.filter((f) => f.sold > 0).length;
}
function nNecit() {
  return DATA.notificari.filter((n) => !n.citit).length;
}

const PAGES = [
  { id: "dashboard", label: "Panou principal", icon: "🏠", section: "Principal", crumb: "/ Dashboard" },
  { id: "cont", label: "Cont client", icon: "📋", section: "Principal", crumb: "/ Cont client" },
  { id: "contracte", label: "Contracte", icon: "📄", section: "Principal", crumb: "/ Contracte" },
  { id: "facturi", label: "Facturi", icon: "🧾", section: "Facturare", badge: () => fNeach() },
  { id: "plati", label: "Plăți", icon: "💳", section: "Facturare", crumb: "/ Istoric plăți" },
  { id: "autocitire", label: "Autocitire index", icon: "🔢", section: "Servicii", crumb: "/ Autocitire" },
  { id: "sesizari", label: "Sesizări", icon: "📩", section: "Servicii", crumb: "/ Sesizări" },
  { id: "notificari", label: "Notificări", icon: "🔔", section: "Servicii", badge: () => nNecit() },
  { id: "anunturi", label: "Anunțuri", icon: "📢", section: "Servicii", crumb: "/ Anunțuri" },
  { id: "setari", label: "Setări", icon: "⚙️", section: "Cont", crumb: "/ Setări cont" },
  { id: "gdpr", label: "GDPR / Acord", icon: "🛡️", section: "Cont", crumb: "/ GDPR" },
];
let curPage = "dashboard";

function buildNav() {
  const nav = document.getElementById("sidebar-nav");
  let h = "", ls = "";
  PAGES.forEach((p) => {
    if (p.section !== ls) {
      h += `<div class="nav-label">${p.section}</div>`;
      ls = p.section;
    }
    const b = p.badge ? p.badge() : 0;
    h += `<div class="nav-item${curPage === p.id ? " active" : ""}" onclick="navigate('${p.id}')"><span class="nav-icon">${p.icon}</span>${p.label}${b > 0 ? `<span class="nav-badge">${b}</span>` : ""}</div>`;
  });
  nav.innerHTML = h;
}

function navigate(id) {
  curPage = id;
  const p = PAGES.find((x) => x.id === id);
  document.getElementById("topbar-title").textContent = p.label;
  document.getElementById("topbar-crumb").textContent = p.crumb || `/ ${p.label}`;
  closeSidebar();
  buildNav();
  render(id);
}

async function render(id) {
  const el = document.getElementById("page-content");
  el.innerHTML = "";
  const R = {
    dashboard: rDash,
    cont: rCont,
    contracte: rContr,
    facturi: rFact,
    plati: rPlati,
    autocitire: rAuto,
    sesizari: rSes,
    notificari: rNotif,
    anunturi: rAnunt,
    setari: rSet,
    gdpr: rGDPR,
  };
  if (R[id]) await R[id](el);
  el.querySelectorAll(".fade-in").forEach((e, i) => {
    e.style.animationDelay = i * 0.04 + "s";
  });
}

// --- Pagini ---

async function rDash(el) {
  const d = await AsisAPI.getDashboard();
  el.innerHTML = `<div class="welcome fade-in"><h2>Bună ziua, Adrian 👋</h2><p>Aveți ${d.sumarFacturi.nrNeachitate} facturi neachitate și ${d.notificariNecitite} notificări necitite. Perioada de autocitire este activă (20–31 martie).</p></div><div class="stats-row"><div class="stat-card fade-in" onclick="navigate('facturi')"><div class="stat-icon bl">🧾</div><div class="stat-val">${d.sumarFacturi.soldTotal.toFixed(2)}</div><div class="stat-lbl">Sold neachitat (RON)</div></div><div class="stat-card fade-in" onclick="navigate('facturi')"><div class="stat-icon gr">✓</div><div class="stat-val">${d.sumarFacturi.nrAchitate}</div><div class="stat-lbl">Facturi achitate (12 luni)</div></div><div class="stat-card fade-in" onclick="navigate('autocitire')"><div class="stat-icon am">🔢</div><div class="stat-val">${d.ultimulIndex.index}</div><div class="stat-lbl">Ultimul index transmis</div></div><div class="stat-card fade-in" onclick="navigate('sesizari')"><div class="stat-icon rd">📩</div><div class="stat-val">${d.sesizariInLucru}</div><div class="stat-lbl">Sesizări în lucru</div></div></div><div class="grid-2"><div class="card fade-in"><div class="card-hd"><span class="card-title">Facturi recente</span><span class="card-act" onclick="navigate('facturi')">Vezi toate →</span></div><table class="dt"><thead><tr><th>Nr.</th><th>Data</th><th>Sumă</th><th>Sold</th><th>Status</th><th></th></tr></thead><tbody>${d.facturiRecente
    .map(
      (f) =>
        `<tr><td class="mono fw">${f.nr}</td><td>${f.data}</td><td class="mono">${f.suma.toFixed(2)}</td><td class="mono${f.sold > 0 ? " fw" : ""}">${f.sold.toFixed(2)}</td><td>${stB(f.sold, f.suma)}</td><td>${f.sold > 0 ? '<button class="btn btn-p" style="font-size:10px;padding:4px 8px">💳 Plătește</button>' : '<button class="btn btn-o" style="font-size:10px;padding:4px 8px">📥 PDF</button>'}</td></tr>`,
    )
    .join("")}</tbody></table></div><div class="card fade-in"><div class="card-hd"><span class="card-title">Autocitire index</span><span class="badge badge-blue">Perioadă activă</span></div><div class="card-body"><div class="info-box"><div class="info-row"><span>Serie contor:</span><strong class="mono">${d.ultimulIndex.serie}</strong></div><div class="info-row"><span>Cod autocitire:</span><strong class="mono">${d.ultimulIndex.codAutocitire}</strong></div><div class="info-row"><span>Ultimul index:</span><strong class="mono">${d.ultimulIndex.index}</strong></div></div><button class="btn btn-p btn-full" onclick="navigate('autocitire')">Transmite autocitire →</button><div class="alert alert-amber">⏰ Perioada de transmitere: 20 – 31 martie 2026</div></div></div></div><div class="grid-2"><div class="card fade-in"><div class="card-hd"><span class="card-title">Notificări</span><span class="card-act" onclick="navigate('notificari')">Vezi toate</span></div>${d.notificariRecente
    .map(
      (n) =>
        `<div class="notif-item${!n.citit ? " unread" : ""}"><div class="ndot ${n.citit ? "off" : "on"}"></div><div class="notif-text"><strong>${esc(n.titlu)}</strong><span>${esc(n.text)}</span></div><div class="notif-time">${esc(n.data)}</div></div>`,
    )
    .join("")}</div><div class="card fade-in"><div class="card-hd"><span class="card-title">Sesizările mele</span><span class="card-act" onclick="navigate('sesizari')">+ Sesizare nouă</span></div><table class="dt"><thead><tr><th>Nr.</th><th>Data</th><th>Tip</th><th>Status</th></tr></thead><tbody>${d.sesizariRecente
    .map(
      (s) =>
        `<tr><td class="mono fw">${s.nr}</td><td>${s.data}</td><td>${s.tip}</td><td>${seB(s.status)}</td></tr>`,
    )
    .join("")}</tbody></table></div></div>`;
}

async function rCont(el) {
  const [profil, abonat, asocieri] = await Promise.all([
    AsisAPI.getUtilizatorProfil(),
    AsisAPI.getAbonat(),
    AsisAPI.getAbonatAsocieri(),
  ]);
  const as = asocieri.asocieri[0];
  el.innerHTML = `<div class="detail-header fade-in"><h3>Cont client</h3><p>Informații despre contul dvs. online și datele de identificare</p></div><div class="grid-2"><div class="card fade-in"><div class="card-hd"><span class="card-title">Date utilizator online</span><span class="badge badge-green">${profil.status}</span></div><div class="card-body"><div class="kv-grid"><div class="kv-item"><div class="kv-label">Email</div><div class="kv-value">${profil.email}</div></div><div class="kv-item"><div class="kv-label">Telefon</div><div class="kv-value">${profil.telefon}</div></div><div class="kv-item"><div class="kv-label">Data creare cont</div><div class="kv-value">${profil.dataCreare}</div></div><div class="kv-item"><div class="kv-label">2FA</div><div class="kv-value">${profil.twoFA ? "Activă (Email)" : "Inactivă"}</div></div><div class="kv-item"><div class="kv-label">Factură electronică</div><div class="kv-value">${profil.facturaElectronica ? "DA — doar electronic" : "NU — tipărit"}</div></div><div class="kv-item"><div class="kv-label">Acord GDPR</div><div class="kv-value">${profil.acordGDPR.versiune} — acceptat ${profil.acordGDPR.dataAcceptare}</div></div></div></div></div><div class="card fade-in"><div class="card-hd"><span class="card-title">Date abonat (ERP)</span><span class="mono" style="font-size:11px;color:var(--gray-400)">COD ${abonat.codAbonat}</span></div><div class="card-body"><div class="kv-grid"><div class="kv-item"><div class="kv-label">Denumire</div><div class="kv-value">${abonat.denumire}</div></div><div class="kv-item"><div class="kv-label">Categorie</div><div class="kv-value">${abonat.categorie}</div></div><div class="kv-item kv-full"><div class="kv-label">Adresă corespondență</div><div class="kv-value">${abonat.adresaCorespondenta}</div></div></div><div class="alert alert-blue">ℹ️ Datele de abonat sunt preluate din ASiS ERP. Pentru modificări, depuneți o cerere.</div></div></div></div><div class="card fade-in"><div class="card-hd"><span class="card-title">Coduri abonat asociate</span><span class="card-act" onclick="alert('Demo: Asociere cod abonat suplimentar')">+ Adaugă cod abonat</span></div><table class="dt"><thead><tr><th>Cod</th><th>Denumire</th><th>Tip</th><th>Data</th><th>Contracte</th></tr></thead><tbody><tr><td class="mono fw">${as.codAbonat}</td><td>${as.denumire}</td><td><span class="badge badge-blue">${as.tip}</span></td><td>${as.dataAsociere}</td><td>${as.nrContracte}</td></tr></tbody></table></div>`;
}

async function rContr(el) {
  const result = await AsisAPI.getContracte();
  el.innerHTML = `<div class="detail-header fade-in"><h3>Contracte și locuri de consum</h3><p>Contractele active asociate codului dvs. de abonat</p></div>${result.contracte
    .map(
      (c) =>
        `<div class="card fade-in" style="margin-bottom:16px"><div class="card-hd"><span class="card-title">Contract ${c.id}</span><span class="badge badge-green">${c.status}</span></div><div class="card-body"><div class="kv-grid"><div class="kv-item"><div class="kv-label">Cod abonat</div><div class="kv-value mono">${c.codAbonat}</div></div><div class="kv-item"><div class="kv-label">Data început</div><div class="kv-value">${c.dataInceput}</div></div><div class="kv-item kv-full"><div class="kv-label">Servicii</div><div class="kv-value">${c.servicii}</div></div></div><strong style="font-size:12px;color:var(--navy)">Locuri de consum</strong>${c.locuriConsum
          .map(
            (lc) =>
              `<div class="info-box" style="margin-top:10px"><div class="info-row"><span>ID:</span><strong class="mono">${lc.id}</strong></div><div class="info-row"><span>Adresă:</span><strong>${lc.adresa}</strong></div><div class="info-row"><span>Status:</span><strong>${lc.status}</strong></div>${lc.contoare
                .map(
                  (ct) =>
                    `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--gray-200)"><div class="info-row"><span>Contor:</span><strong class="mono">${ct.serie}</strong></div><div class="info-row"><span>Stare:</span><strong>${ct.stare}</strong></div><div class="info-row"><span>Montare:</span><strong>${ct.dataMontare}</strong></div><div class="info-row"><span>Cod autocitire:</span><strong class="mono">${ct.codAutocitire}</strong></div></div>`,
                )
                .join("")}</div>`,
          )
          .join("")}</div></div>`,
    )
    .join("")}`;
}

async function rFact(el) {
  const [facturiResult, contracteResult] = await Promise.all([
    AsisAPI.getFacturi(),
    AsisAPI.getContracte(),
  ]);
  el.innerHTML = `<div class="detail-header fade-in"><h3>Facturi</h3><p>Toate facturile emise pentru codurile dvs. de abonat</p></div><div style="display:flex;gap:10px;margin-bottom:16px" class="fade-in"><div class="form-group" style="margin:0;flex:1"><select id="flt-s" onchange="fFact()"><option value="">Toate statusurile</option><option value="n">Neachitată</option><option value="p">Parțial</option><option value="a">Achitată</option></select></div><div class="form-group" style="margin:0;flex:1"><select id="flt-c" onchange="fFact()"><option value="">Toate contractele</option>${contracteResult.contracte
    .map(
      (c) =>
        `<option value="${c.id}">${c.id} — ${c.locuriConsum[0].adresa.split(",")[0]}</option>`,
    )
    .join("")}</select></div></div><div class="card fade-in"><table class="dt"><thead><tr><th>Nr.</th><th>Data</th><th>Contract</th><th>Sumă</th><th>Sold</th><th>Status</th><th></th></tr></thead><tbody id="fb"></tbody></table></div><div style="margin-top:12px;font-size:12px;color:var(--gray-400)" class="fade-in">Sold total: <strong style="color:var(--red);font-family:'JetBrains Mono',monospace">${facturiResult.sumar.soldTotal.toFixed(2)} RON</strong></div>`;
  await fFact();
}

async function fFact() {
  const s = document.getElementById("flt-s")?.value || "";
  const c = document.getElementById("flt-c")?.value || "";
  const statusMap = { n: "neachitata", p: "partial", a: "achitata" };
  const result = await AsisAPI.getFacturi({
    contract: c || undefined,
    status: statusMap[s],
  });
  const tbody = document.getElementById("fb");
  if (!tbody) return;
  tbody.innerHTML = result.facturi
    .map(
      (f) =>
        `<tr><td class="mono fw">${f.nr}</td><td>${f.data}</td><td class="mono">${f.contractId}</td><td class="mono">${f.suma.toFixed(2)}</td><td class="mono${f.sold > 0 ? " fw" : ""}">${f.sold.toFixed(2)}</td><td>${stB(f.sold, f.suma)}</td><td>${f.sold > 0 ? `<button class="btn btn-p" style="font-size:10px;padding:4px 8px" onclick="alert('Demo: Redirect ING WebPay — ${f.nr} ${f.sold.toFixed(2)} RON')">💳 Plătește</button>` : '<button class="btn btn-o" style="font-size:10px;padding:4px 8px">📥 PDF</button>'}</td></tr>`,
    )
    .join("");
}

async function rPlati(el) {
  const result = await AsisAPI.getPlati();
  el.innerHTML = `<div class="detail-header fade-in"><h3>Istoric plăți</h3><p>Toate plățile înregistrate</p></div><div class="card fade-in"><table class="dt"><thead><tr><th>ID</th><th>Factură</th><th>Data</th><th>Sumă</th><th>Metodă</th><th>Status</th></tr></thead><tbody>${result.plati
    .map(
      (p) =>
        `<tr><td class="mono fw">${p.id}</td><td class="mono">${p.nrFactura}</td><td>${p.data}</td><td class="mono">${p.suma.toFixed(2)}</td><td>${p.metoda}</td><td><span class="badge badge-green">${p.status}</span></td></tr>`,
    )
    .join("")}</tbody></table></div>`;
}

async function rAuto(el) {
  const result = await AsisAPI.getContracte();
  const ct = result.contracte.flatMap((c) =>
    c.locuriConsum.flatMap((lc) =>
      lc.contoare.map((x) => ({ ...x, adresa: lc.adresa, contract: c.id })),
    ),
  );
  window._ct = ct;
  el.innerHTML = `<div class="detail-header fade-in"><h3>Autocitire index</h3><p>Transmiteți indexul contorului</p></div><div class="grid-2"><div class="card fade-in"><div class="card-hd"><span class="card-title">Transmitere autocitire</span><span class="badge badge-blue">Perioadă activă</span></div><div class="card-body"><div class="form-group"><label>Selectare contor</label><select id="sc" onchange="uCI()">${ct
    .map(
      (c, i) =>
        `<option value="${i}">${c.serie} — ${c.adresa.split(",")[0]}</option>`,
    )
    .join("")}</select></div><div class="info-box" id="ci"></div><div class="form-group"><label>Index curent</label><input type="number" placeholder="Introduceți indexul" id="ii"></div><div class="upload-area">📷 Atașați fotografie contor</div><button class="btn btn-p btn-full" onclick="sAuto()">Actualizare index</button><div class="alert alert-amber">⏰ Perioada: 20 – 31 martie 2026</div></div></div><div class="card fade-in"><div class="card-hd"><span class="card-title">Istoric autocitiri</span></div><table class="dt"><thead><tr><th>Luna</th><th>Index</th><th>Consum</th><th>Sursă</th></tr></thead><tbody id="ab"></tbody></table></div></div>`;
  await uCI();
}

async function uCI() {
  const scEl = document.getElementById("sc");
  if (!scEl) return;
  const c = window._ct[scEl.value];
  const result = await AsisAPI.getAutocitiri(c.id);
  document.getElementById("ci").innerHTML = `<div class="info-row"><span>Loc consum:</span><strong>${c.adresa}</strong></div><div class="info-row"><span>Serie:</span><strong class="mono">${result.serieContor}</strong></div><div class="info-row"><span>Cod autocitire:</span><strong class="mono">${result.codAutocitire}</strong></div><div class="info-row"><span>Ultimul index:</span><strong class="mono">${result.ultimulIndex ?? "—"}</strong></div>`;
  document.getElementById("ab").innerHTML = result.autocitiri
    .map(
      (a) =>
        `<tr><td>${a.luna}</td><td class="mono fw">${a.index}</td><td class="mono">${a.consum}</td><td>${a.sursa}</td></tr>`,
    )
    .join("");
}

function sAuto() {
  const v = document.getElementById("ii").value;
  if (!v) { alert("Introduceți indexul."); return; }
  alert(`Demo: Index ${v} transmis cu succes către modulul Determinare consumuri (4.4.6).`);
}

async function rSes(el) {
  const [sesizariResult, contracteResult] = await Promise.all([
    AsisAPI.getSesizari(),
    AsisAPI.getContracte(),
  ]);
  const locuriConsum = contracteResult.contracte.flatMap((c) => c.locuriConsum);
  el.innerHTML = `<div class="detail-header fade-in"><h3>Sesizări și solicitări</h3><p>Depuneți și urmăriți sesizările dvs.</p></div><div class="grid-2"><div class="card fade-in"><div class="card-hd"><span class="card-title">Sesizări depuse</span></div><table class="dt"><thead><tr><th>Nr.</th><th>Data</th><th>Tip</th><th>Descriere</th><th>Status</th></tr></thead><tbody>${sesizariResult.sesizari
    .map(
      (s) =>
        `<tr><td class="mono fw">${esc(s.nr)}</td><td>${esc(s.data)}</td><td>${esc(s.tip)}</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(s.descriere)}">${esc(s.descriere)}</td><td>${seB(s.status)}</td></tr>`,
    )
    .join("")}</tbody></table></div><div class="card fade-in"><div class="card-hd"><span class="card-title">Sesizare nouă</span></div><div class="card-body"><div class="form-group"><label>Loc consum</label><select>${locuriConsum
    .map((lc) => `<option>${lc.adresa.split(",")[0]}</option>`)
    .join(
      "",
    )}</select></div><div class="form-group"><label>Tip</label><select><option>Reclamație</option><option>Cerere</option><option>Cerere acte adiționale</option></select></div><div class="form-group"><label>Descriere</label><textarea placeholder="Descrieți problema..."></textarea></div><div class="upload-area">📎 Adaugă atașament</div><button class="btn btn-p btn-full" onclick="alert('Demo: Sesizare transmisă → Ghișeul Unic. Nr: REG-00512')">Trimite solicitare</button></div></div></div>`;
}

async function rNotif(el) {
  const result = await AsisAPI.getNotificari();
  el.innerHTML = `<div class="detail-header fade-in"><h3>Notificări</h3><p>Toate notificările primite</p></div><div class="card fade-in"><div class="card-hd"><span class="card-title">Notificări (${result.notificari.length})</span><span class="card-act" onclick="mAll()">Marchează toate citite</span></div>${result.notificari
    .map(
      (n) =>
        `<div class="notif-item${!n.citit ? " unread" : ""}" onclick="mR(${n.id})"><div class="ndot ${n.citit ? "off" : "on"}"></div><div class="notif-text"><strong>${esc(n.titlu)}</strong><span>${esc(n.text)}</span></div><div class="notif-time">${esc(n.data)}</div></div>`,
    )
    .join("")}</div>`;
}

async function mR(id) {
  await AsisAPI.patchNotificariCitit(id);
  navigate("notificari");
}

async function mAll() {
  await AsisAPI.patchNotificariCititToate();
  navigate("notificari");
}

async function rAnunt(el) {
  const result = await AsisAPI.getAnunturi();
  el.innerHTML = `<div class="detail-header fade-in"><h3>Anunțuri</h3><p>Comunicări de la Apa Canal 2000 SA</p></div>${result.anunturi
    .map(
      (a) =>
        `<div class="card fade-in" style="margin-bottom:14px"><div class="card-hd"><span class="card-title">${esc(a.titlu)}</span><span class="badge badge-blue">${esc(a.tip)}</span></div><div class="card-body"><p style="font-size:13px;color:var(--gray-600);line-height:1.6;margin-bottom:8px">${DOMPurify.sanitize(a.text)}</p><span style="font-size:11px;color:var(--gray-400)">Publicat: ${esc(a.data)}</span></div></div>`,
    )
    .join("")}`;
}

async function rSet(el) {
  const profil = await AsisAPI.getUtilizatorProfil();
  const n = profil.preferinteNotificari;
  el.innerHTML = `<div class="detail-header fade-in"><h3>Setări cont</h3><p>Administrați contul dvs. online</p></div><div class="grid-2"><div class="card fade-in"><div class="card-hd"><span class="card-title">Date cont</span></div><div class="card-body"><div class="form-group"><label>Email</label><input type="email" value="${profil.email}"></div><div class="form-group"><label>Telefon</label><input type="tel" value="${profil.telefon}"></div><div class="form-group"><label>Parolă</label><input type="password" value="********"></div><button class="btn btn-p" onclick="alert('Demo: Salvat.')">Salvează modificările</button></div></div><div class="card fade-in"><div class="card-hd"><span class="card-title">Preferințe</span></div><div class="card-body"><div class="toggle-row"><div><div class="toggle-label">Autentificare 2FA</div><div class="toggle-desc">Cod suplimentar prin email</div></div><div class="toggle-switch${profil.twoFA ? " on" : ""}" onclick="this.classList.toggle('on')"></div></div><div class="toggle-row"><div><div class="toggle-label">Factură electronică</div><div class="toggle-desc">Fără format tipărit</div></div><div class="toggle-switch${profil.facturaElectronica ? " on" : ""}" onclick="this.classList.toggle('on')"></div></div><div class="toggle-row"><div><div class="toggle-label">Notificări email</div><div class="toggle-desc">Pe adresa de email</div></div><div class="toggle-switch${n.email ? " on" : ""}" onclick="this.classList.toggle('on')"></div></div><div class="toggle-row"><div><div class="toggle-label">Notificări SMS</div><div class="toggle-desc">Prin SMS</div></div><div class="toggle-switch${n.sms ? " on" : ""}" onclick="this.classList.toggle('on')"></div></div><div class="toggle-row"><div><div class="toggle-label">Notificări portal</div><div class="toggle-desc">În cont</div></div><div class="toggle-switch${n.portal ? " on" : ""}" onclick="this.classList.toggle('on')"></div></div></div></div></div>`;
}

function rGDPR(el) {
  el.innerHTML = `<div class="detail-header fade-in"><h3>GDPR / Acord</h3><p>Consimțământ și preferințe privind datele personale</p></div><div class="card fade-in" style="margin-bottom:16px"><div class="card-hd"><span class="card-title">Status acord</span><span class="badge badge-green">Activ</span></div><div class="card-body"><div class="kv-grid"><div class="kv-item"><div class="kv-label">Versiune</div><div class="kv-value">v2.1</div></div><div class="kv-item"><div class="kv-label">Data acceptare</div><div class="kv-value">01.01.2026</div></div><div class="kv-item"><div class="kv-label">Termeni și Condiții</div><div class="kv-value" style="color:var(--green)">✓ Acceptat</div></div><div class="kv-item"><div class="kv-label">Politica de Confidențialitate</div><div class="kv-value" style="color:var(--green)">✓ Acceptat</div></div></div></div></div><div class="card fade-in" style="margin-bottom:16px"><div class="card-hd"><span class="card-title">Consimțământ notificări</span></div><div class="card-body"><div class="toggle-row"><div><div class="toggle-label">Facturi emise</div><div class="toggle-desc">La emiterea unei facturi noi</div></div><div class="toggle-switch on" onclick="this.classList.toggle('on')"></div></div><div class="toggle-row"><div><div class="toggle-label">Confirmare plăți</div><div class="toggle-desc">La confirmarea unei plăți</div></div><div class="toggle-switch on" onclick="this.classList.toggle('on')"></div></div><div class="toggle-row"><div><div class="toggle-label">Facturi restante</div><div class="toggle-desc">Atenționare facturi neachitate</div></div><div class="toggle-switch on" onclick="this.classList.toggle('on')"></div></div><div class="toggle-row"><div><div class="toggle-label">Comunicări operator</div><div class="toggle-desc">Anunțuri, lucrări, avarii</div></div><div class="toggle-switch on" onclick="this.classList.toggle('on')"></div></div><div class="toggle-row"><div><div class="toggle-label">Perioadă autocitire</div><div class="toggle-desc">Reminder transmitere index</div></div><div class="toggle-switch on" onclick="this.classList.toggle('on')"></div></div><div class="alert alert-blue" style="margin-top:16px">ℹ️ Modificările sunt jurnalizate. Puteți retrage consimțământul oricând.</div></div></div><div class="card fade-in"><div class="card-hd"><span class="card-title">Drepturi GDPR</span></div><div class="card-body"><p style="font-size:13px;color:var(--gray-600);line-height:1.7;margin-bottom:14px">Conform GDPR: dreptul la informare, acces, rectificare, ștergere, restricționare, portabilitate și opoziție.</p><div style="display:flex;gap:10px"><button class="btn btn-o" onclick="alert('Demo: Export date transmis.')">📥 Export date</button><button class="btn btn-o" style="color:var(--red);border-color:var(--red)" onclick="alert('Demo: Solicitare ștergere cont transmisă.')">🗑️ Ștergere cont</button></div></div></div>`;
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebar-overlay").classList.toggle("visible");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("visible");
}

buildNav();
render("dashboard");
