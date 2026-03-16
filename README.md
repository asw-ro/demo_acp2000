# Portal Abonați — Demo / PoC

Prototip interactiv pentru un portal de abonați destinat unei companii de utilități (apă și canalizare) — **Apa Canal 2000 SA Pitești**.

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

**Base URL:** `https://dev.asw.ro/ria/asisservice/linkuri/ext/{metoda}/DEV/`

| Metodă ASiS | Date returnate |
|-------------|----------------|
| `acp_GetAbonat` | Date abonat (denumire, adresă, categorie) |
| `acp_GetContracte` | Contracte, locuri de consum, contoare |
| `acp_GetFacturi` | Facturi emise + sumar sold |
| `acp_GetPlati` | Istoric plăți |
| `acp_GetAutocitiri` | Indici citire per contor |
| `acp_GetSesizari` | Sesizări și cereri |
| `acp_GetNotificari` | Notificări portal |
| `acp_GetAnunturi` | Anunțuri operator |

Când serverul ASiS nu este accesibil (demo local), `asis-api.js` cade automat pe datele din `data.js`.

Autentificarea `x-asis-auth` nu este implementată în această versiune.

## Stack

HTML + CSS + vanilla JS. Zero dependințe externe (doar Google Fonts).
