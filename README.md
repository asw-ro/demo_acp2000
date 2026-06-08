# Portal Abonați — Demo / PoC

Prototip interactiv pentru un portal de abonați destinat unei companii de utilități (apă și canalizare) 

![Demo](https://i.ibb.co/FbzQ8PHJ/demo-desktop-dashboard.jpg)

## Deschidere

```bash
open index.html
```

Se deschide direct în browser. Fonturile se încarcă de pe Google Fonts.

## Pagini demo

- Panou principal (dashboard cu statistici live)
- Cont client
- Contracte și locuri de consum
- Facturi (cu filtrare pe status / contract)
- Istoric plăți
- Autocitire index (selector contor, formular, istoric)
- Sesizări (listă + formular depunere)
- Notificări
- Anunțuri
- Setări cont
- GDPR / Acord

## Fișiere

| Fișier | Rol |
|--------|-----|
| `index.html` | Markup, layout |
| `styles.css` | Stiluri |
| `data.js` | Date dummy (fallback demo) |
| `asis-api.js` | Client ASiS Service — metode GET |
| `app.js` | Logică UI, navigare, randare pagini |
| `api-asisservice.md` | Specificație REST API portal |

## Strat de integrare ASiS Service

Toate datele vin din **ASiS ERP** prin ASiS Service:

```
Browser → Portal API → asis-api.js → ASiS Service → ASiS ERP
```

**Pattern URL:** `GET https://dev.asw.ro/ria/asisservice/linkuri/ext/{metoda}/{DB}/?{params}`

Când serverul ASiS nu este accesibil (demo local), `asis-api.js` cade automat pe datele din `data.js`.

Autentificarea `x-asis-auth` nu este implementată în această versiune.

### Apeluri GET către ASiS Service

| Metodă ASiS | Parametri trimiși | Date returnate |
|-------------|-------------------|----------------|
| `acp_GetAbonat` | `codAbonat` | Denumire, adresă corespondență, categorie, status abonat |
| `acp_GetContracte` | `codAbonat` | Lista contracte cu locuri de consum și contoare |
| `acp_GetFacturi` | `codAbonat`, `contract` *(opțional)*, `status` *(opțional: `neachitata` / `partial` / `achitata`)* | Lista facturi + sumar sold total / nr. neachitate / nr. achitate |
| `acp_GetPlati` | `codAbonat` | Istoric plăți (factură, dată, sumă, metodă, status) |
| `acp_GetAutocitiri` | `contorId`, `ultimeleLuni` *(implicit 12)* | Serie contor, cod autocitire, ultimul index, istoric indici |
| `acp_GetSesizari` | `codAbonat`, `status` *(opțional)* | Lista sesizări / cereri cu adresă loc de consum |
| `acp_GetNotificari` | `codAbonat`, `limita` *(opțional)* | Lista notificări + sumar (total / necitite) |
| `acp_GetAnunturi` | `limita` *(opțional)* | Lista anunțuri operator (titlu, tip, text, dată) |

### Metode agregate (fără apel direct — combinate în portal)

| Metodă portal | Apeluri interne | Scop |
|---------------|-----------------|------|
| `getDashboard()` | `acp_GetFacturi` + `acp_GetAutocitiri` + `acp_GetSesizari` + `acp_GetNotificari` | Date sumar pagină principală |
| `getAbonatAsocieri()` | `acp_GetAbonat` + `acp_GetContracte` | Asocieri cont utilizator |
| `getUtilizatorProfil()` | — (date portal local) | Profil, preferințe notificări, GDPR |

### Operații de scriere (dummy — nu sunt încă mapate pe ASiS Service)

| Metodă portal | Operație |
|---------------|----------|
| `patchNotificariCitit(id)` | Marchează o notificare ca citită |
| `patchNotificariCititToate()` | Marchează toate notificările ca citite |

## Stack

HTML + CSS + vanilla JS. Zero dependințe externe (doar Google Fonts).
