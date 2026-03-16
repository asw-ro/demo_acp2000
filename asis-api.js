// asis-api.js — Client ASiS Service (PoC)
//
// Pattern: GET {baseUrl}/{metoda}/{DB}/?{params}
// Autentificarea (x-asis-auth) nu este implementată în această versiune.
//
// Dacă serverul nu este accesibil (CORS / reţea), cade automat pe DATE DUMMY.

const ASIS = {
  baseUrl: "https://dev.asw.ro/ria/asisservice/linkuri/ext",
  db: "DEV",
};

// Construieşte URL complet pentru o metodă şi un set de parametri
function _url(metoda, params = {}) {
  const base = `${ASIS.baseUrl}/${metoda}/${ASIS.db}/`;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return qs ? `${base}?${qs}` : base;
}

// Execută un GET şi verifică envelope-ul {status: "OK", ...}
async function _fetch(metoda, params = {}) {
  const resp = await fetch(_url(metoda, params));
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.status !== "OK") throw new Error(data.mesaj || "Eroare ASiS Service");
  return data;
}

// Cod abonat primar al utilizatorului autentificat (din sesiune / token)
// În demo se citeşte din DATA; în producţie vine din contextul de autentificare
function _codAbonat() {
  return DATA.utilizator.codPrimar;
}

// ---------------------------------------------------------------------------
// Fallback-uri dummy — date din data.js, acelaşi format ca răspunsul real
// ---------------------------------------------------------------------------

const _dummy = {
  GetAbonat: () => ({
    codAbonat: DATA.abonat.cod,
    denumire: DATA.abonat.denumire,
    adresaCorespondenta: DATA.abonat.adresaCorespondenta,
    categorie: DATA.abonat.categorie,
    statusAbonat: "Activ",
  }),

  GetContracte: () => DATA.contracte,

  GetFacturi: (params = {}) => {
    let list = DATA.facturi;
    if (params.contract) list = list.filter((f) => f.contract === params.contract);
    if (params.status === "neachitata") list = list.filter((f) => f.sold === f.suma && f.sold > 0);
    else if (params.status === "partial") list = list.filter((f) => f.sold > 0 && f.sold < f.suma);
    else if (params.status === "achitata") list = list.filter((f) => f.sold === 0);
    const soldTotal = DATA.facturi.reduce((s, f) => s + f.sold, 0);
    return {
      facturi: list,
      sumar: {
        soldTotal: parseFloat(soldTotal.toFixed(2)),
        nrNeachitate: DATA.facturi.filter((f) => f.sold > 0).length,
        nrAchitate: DATA.facturi.filter((f) => f.sold === 0).length,
      },
    };
  },

  GetPlati: () => DATA.plati,

  GetAutocitiri: (contorId) => {
    const list = DATA.autocitiri.filter((a) => a.contor === contorId);
    const ct = DATA.contracte
      .flatMap((c) => c.locuriConsum.flatMap((lc) => lc.contoare))
      .find((c) => c.id === contorId);
    return {
      contorId,
      serieContor: ct?.serie || null,
      codAutocitire: ct?.codAutocitire || null,
      ultimulIndex: list[0]?.index || null,
      autocitiri: list.map(({ luna, index, consum, sursa }) => ({ luna, index, consum, sursa })),
    };
  },

  GetSesizari: (params = {}) => {
    let list = DATA.sesizari;
    if (params.status && params.status !== "toate")
      list = list.filter((s) => s.status === params.status);
    return list.map((s) => {
      const lc = DATA.contracte.flatMap((c) => c.locuriConsum).find((lc) => lc.id === s.locConsum);
      return { ...s, adresaLocConsum: lc?.adresa || null };
    });
  },

  GetNotificari: (params = {}) => {
    const list = params.limita ? DATA.notificari.slice(0, params.limita) : DATA.notificari;
    return {
      notificari: list,
      sumar: {
        total: DATA.notificari.length,
        necitite: DATA.notificari.filter((n) => !n.citit).length,
      },
    };
  },

  GetAnunturi: () => DATA.anunturi,
};

// ---------------------------------------------------------------------------
// API public — aceeaşi interfaţă pentru app.js indiferent de sursă
// ---------------------------------------------------------------------------

const AsisAPI = {

  // acp_GetAbonat
  async getAbonat(codAbonat = _codAbonat()) {
    try {
      const r = await _fetch("acp_GetAbonat", { codAbonat });
      return r.date;
    } catch {
      return _dummy.GetAbonat();
    }
  },

  // acp_GetContracte
  async getContracte(codAbonat = _codAbonat()) {
    try {
      const r = await _fetch("acp_GetContracte", { codAbonat });
      return { contracte: r.contracte };
    } catch {
      return { contracte: _dummy.GetContracte() };
    }
  },

  // acp_GetFacturi
  async getFacturi(params = {}) {
    const { contract, status } = params;
    try {
      const r = await _fetch("acp_GetFacturi", {
        codAbonat: _codAbonat(),
        contract,
        status,
      });
      return { facturi: r.facturi, sumar: r.sumar };
    } catch {
      return _dummy.GetFacturi(params);
    }
  },

  // acp_GetPlati
  async getPlati() {
    try {
      const r = await _fetch("acp_GetPlati", { codAbonat: _codAbonat() });
      return { plati: r.plati };
    } catch {
      return { plati: _dummy.GetPlati() };
    }
  },

  // acp_GetAutocitiri
  async getAutocitiri(contorId, ultimeleLuni = 12) {
    try {
      const r = await _fetch("acp_GetAutocitiri", { contorId, ultimeleLuni });
      return r;
    } catch {
      return _dummy.GetAutocitiri(contorId);
    }
  },

  // acp_GetSesizari
  async getSesizari(params = {}) {
    try {
      const r = await _fetch("acp_GetSesizari", {
        codAbonat: _codAbonat(),
        status: params.status,
      });
      return { sesizari: r.sesizari };
    } catch {
      return { sesizari: _dummy.GetSesizari(params) };
    }
  },

  // acp_GetNotificari
  async getNotificari(params = {}) {
    try {
      const r = await _fetch("acp_GetNotificari", {
        codAbonat: _codAbonat(),
        limita: params.limita,
      });
      return { notificari: r.notificari, sumar: r.sumar };
    } catch {
      return _dummy.GetNotificari(params);
    }
  },

  // acp_GetAnunturi
  async getAnunturi(params = {}) {
    try {
      const r = await _fetch("acp_GetAnunturi", { limita: params.limita });
      return { anunturi: r.anunturi };
    } catch {
      return { anunturi: _dummy.GetAnunturi() };
    }
  },

  // ---------------------------------------------------------------------------
  // Profil utilizator — gestionat de portal (nu vine din ASiS ERP)
  // ---------------------------------------------------------------------------
  async getUtilizatorProfil() {
    const u = DATA.utilizator;
    return {
      id: u.id,
      email: u.email,
      telefon: u.telefon,
      nume: u.nume,
      status: u.status,
      dataCreare: u.dataCreare,
      twoFA: u.twoFA,
      facturaElectronica: u.facturaElectronica,
      preferinteNotificari: { email: u.notifEmail, sms: u.notifSMS, portal: u.notifPortal },
      acordGDPR: { versiune: "v2.1", dataAcceptare: "2026-01-01" },
    };
  },

  // ---------------------------------------------------------------------------
  // Dashboard — agregat din multiple surse ERP
  // ---------------------------------------------------------------------------
  async getDashboard() {
    const ctPrimar = "CT-001";

    const [facturiR, autocitiriR, sesizariR, notificariR] = await Promise.all([
      this.getFacturi(),
      this.getAutocitiri(ctPrimar),
      this.getSesizari(),
      this.getNotificari({ limita: 4 }),
    ]);

    return {
      sumarFacturi: facturiR.sumar,
      ultimulIndex: {
        contorId: autocitiriR.contorId,
        serie: autocitiriR.serieContor,
        codAutocitire: autocitiriR.codAutocitire,
        index: autocitiriR.ultimulIndex || 0,
        data: autocitiriR.autocitiri[0]?.luna || null,
      },
      sesizariInLucru: sesizariR.sesizari.filter((s) => s.status === "În lucru").length,
      notificariNecitite: notificariR.sumar?.necitite ?? notificariR.notificari.filter((n) => !n.citit).length,
      facturiRecente: facturiR.facturi.slice(0, 5).map(({ nr, data, suma, sold, contract }) => ({
        nr, data, suma, sold, contractId: contract,
      })),
      notificariRecente: notificariR.notificari.slice(0, 4),
      sesizariRecente: sesizariR.sesizari.slice(0, 3).map(({ nr, data, tip, status }) => ({ nr, data, tip, status })),
      perioadaAutocitire: { activa: true, deLa: "2026-03-20", panaLa: "2026-03-31" },
    };
  },

  // ---------------------------------------------------------------------------
  // Operaţii de scriere (dummy — se vor mapa pe metode POST ASiS)
  // ---------------------------------------------------------------------------
  patchNotificariCitit(id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const n = DATA.notificari.find((x) => x.id === id);
        if (n) n.citit = true;
        resolve({ mesaj: "Notificare marcată ca citită.", id });
      }, 30);
    });
  },

  patchNotificariCititToate() {
    return new Promise((resolve) => {
      setTimeout(() => {
        DATA.notificari.forEach((n) => (n.citit = true));
        resolve({ mesaj: "Toate notificările au fost marcate ca citite.", actualizate: DATA.notificari.length });
      }, 30);
    });
  },
};
