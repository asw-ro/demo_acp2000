# ASiS Service — Endpoint-uri Portal Abonați

Specificație API pentru endpoint-urile necesare portalului. Toate endpoint-urile sunt REST, returnează JSON, și folosesc autentificarea standard `x-asis-auth`.

**Base URL:** `https://{baseurl}/api/portal`  
**Autentificare:** Header `x-asis-auth: {token}`  
**Content-Type:** `application/json`

---

## 1. Autentificare portal

### POST `/auth/login`

Autentificare utilizator portal. Returnează token de sesiune.

**Request:**

```json
{
  "email": "adrian.ivascu@email.ro",
  "parola": "***"
}
```

**Response 200:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiraLa": "2026-03-16T23:59:59Z",
  "utilizator": {
    "id": "U-001",
    "email": "adrian.ivascu@email.ro",
    "nume": "Ivașcu Gh. Adrian+Ionela",
    "codAbonatPrimar": "036720",
    "status": "Activ",
    "twoFA": true
  }
}
```

**Response 401:**

```json
{
  "eroare": "CREDENTIALE_INVALIDE",
  "mesaj": "Email sau parolă incorectă."
}
```

### POST `/auth/verificare-2fa`

Pasul 2 al autentificării, dacă 2FA e activ.

**Request:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "cod2FA": "482917"
}
```

**Response 200:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "sesiune": "valid"
}
```

### POST `/auth/recuperare-parola`

Inițiere flux recuperare parolă.

**Request:**

```json
{
  "email": "adrian.ivascu@email.ro"
}
```

**Response 200:**

```json
{
  "mesaj": "Link de resetare transmis pe email.",
  "expiraLa": "2026-03-16T01:00:00Z"
}
```

### POST `/auth/creare-cont`

Creare cont nou cu validare cod abonat + factură.

**Request:**

```json
{
  "codAbonat": "036720",
  "nrFactura": "F00098",
  "sumaFactura": 72.5,
  "email": "adrian.ivascu@email.ro",
  "parola": "***",
  "acceptTermeni": true,
  "acceptGDPR": true
}
```

**Response 201:**

```json
{
  "mesaj": "Cont creat. Verificați email-ul pentru link de activare.",
  "utilizatorId": "U-001"
}
```

**Response 409:**

```json
{
  "eroare": "COD_ABONAT_ASOCIAT",
  "mesaj": "Codul de abonat este deja asociat unui alt cont online activ."
}
```

---

## 2. Utilizator și cont

### GET `/utilizator/profil`

Profilul utilizatorului autentificat.

**Response 200:**

```json
{
  "id": "U-001",
  "email": "adrian.ivascu@email.ro",
  "telefon": "0745 123 456",
  "nume": "Ivașcu Gh. Adrian+Ionela",
  "status": "Activ",
  "dataCreare": "2022-03-15",
  "twoFA": true,
  "facturaElectronica": true,
  "preferinteNotificari": {
    "email": true,
    "sms": false,
    "portal": true
  },
  "acordGDPR": {
    "versiune": "v2.1",
    "dataAcceptare": "2026-01-01"
  }
}
```

### PATCH `/utilizator/profil`

Actualizare date cont (email, telefon, parolă).

**Request:**

```json
{
  "email": "nou@email.ro",
  "telefon": "0745 999 888"
}
```

**Response 200:**

```json
{
  "mesaj": "Profil actualizat.",
  "email": "nou@email.ro",
  "telefon": "0745 999 888"
}
```

### PATCH `/utilizator/preferinte`

Actualizare preferințe (2FA, factură electronică, notificări).

**Request:**

```json
{
  "twoFA": true,
  "facturaElectronica": true,
  "preferinteNotificari": {
    "email": true,
    "sms": true,
    "portal": true
  }
}
```

**Response 200:**

```json
{
  "mesaj": "Preferințe salvate."
}
```

### PATCH `/utilizator/consimtamant-gdpr`

Actualizare consimțământ granular pe tip notificare.

**Request:**

```json
{
  "facturiEmise": true,
  "confirmarePlati": true,
  "facturiRestante": true,
  "comunicariOperator": true,
  "perioadaAutocitire": false
}
```

**Response 200:**

```json
{
  "mesaj": "Consimțământ actualizat.",
  "versiune": "v2.2",
  "dataModificare": "2026-03-16T14:30:00Z"
}
```

---

## 3. Abonat și asocieri

### GET `/abonat/{codAbonat}`

Date abonat din ERP.

**Response 200:**

```json
{
  "codAbonat": "036720",
  "denumire": "IVAȘCU GH ADRIAN+IONELA",
  "adresaCorespondenta": "Str. Cornului nr. 31, bl. sc. ap. 0, Pitești, jud. Argeș",
  "categorie": "Casnic",
  "status": "Activ"
}
```

### GET `/abonat/asocieri`

Lista codurilor de abonat asociate contului autentificat.

**Response 200:**

```json
{
  "asocieri": [
    {
      "codAbonat": "036720",
      "denumire": "IVAȘCU GH ADRIAN+IONELA",
      "tip": "Primar",
      "dataAsociere": "2022-03-15",
      "status": "Activa",
      "nrContracte": 2
    }
  ]
}
```

### POST `/abonat/asociere`

Asociere cod abonat suplimentar la cont (cu validare factură).

**Request:**

```json
{
  "codAbonat": "041255",
  "nrFactura": "F00200",
  "sumaFactura": 55.3
}
```

**Response 201:**

```json
{
  "mesaj": "Cod abonat asociat cu succes.",
  "codAbonat": "041255",
  "tip": "Secundar"
}
```

**Response 409:**

```json
{
  "eroare": "COD_ABONAT_ASOCIAT",
  "mesaj": "Codul de abonat este deja asociat unui alt cont online activ."
}
```

---

## 4. Contracte

### GET `/contracte?codAbonat={cod}`

Lista contracte cu locuri de consum și contoare. Dacă `codAbonat` lipsește, returnează pentru toate codurile asociate contului.

**Response 200:**

```json
{
  "contracte": [
    {
      "id": "C-12345",
      "codAbonat": "036720",
      "status": "Activ",
      "dataInceput": "2018-04-01",
      "servicii": "Alimentare cu apă + Canalizare",
      "facturaElectronica": true,
      "locuriConsum": [
        {
          "id": "LC-001",
          "adresa": "Cornului nr. 31, bl. sc. ap. 0, Pitești",
          "status": "Activ",
          "contoare": [
            {
              "id": "CT-001",
              "serie": "ABC-123456",
              "stare": "Funcțional",
              "dataMontare": "2022-06-15",
              "codAutocitire": "276933"
            }
          ]
        }
      ]
    },
    {
      "id": "C-12390",
      "codAbonat": "036720",
      "status": "Activ",
      "dataInceput": "2023-09-01",
      "servicii": "Alimentare cu apă",
      "facturaElectronica": true,
      "locuriConsum": [
        {
          "id": "LC-002",
          "adresa": "Str. Trivale nr. 8, Pitești",
          "status": "Activ",
          "contoare": [
            {
              "id": "CT-002",
              "serie": "DEF-789012",
              "stare": "Funcțional",
              "dataMontare": "2023-09-20",
              "codAutocitire": "318205"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 5. Facturi

### GET `/facturi?codAbonat={cod}&contract={id}&status={status}&deLa={data}&panaLa={data}`

Lista facturi. Toți parametrii de query sunt opționali. Dacă `codAbonat` lipsește, returnează pentru toate codurile asociate.

**Valori `status`:** `toate` (default), `neachitata`, `partial`, `achitata`

**Response 200:**

```json
{
  "facturi": [
    {
      "nr": "F00145",
      "data": "2026-03-01",
      "suma": 92.4,
      "sold": 92.4,
      "contractId": "C-12345",
      "locConsumId": "LC-001",
      "modTransmitere": "Electronic"
    },
    {
      "nr": "F00098",
      "data": "2026-01-01",
      "suma": 72.5,
      "sold": 0.0,
      "contractId": "C-12345",
      "locConsumId": "LC-001",
      "modTransmitere": "Electronic"
    }
  ],
  "sumar": {
    "soldTotal": 237.7,
    "nrNeachitate": 4,
    "nrAchitate": 8
  }
}
```

### GET `/facturi/{nrFactura}/pdf`

Descărcare factură PDF.

**Response 200:** `Content-Type: application/pdf` (binary)

### POST `/facturi/{nrFactura}/retransmitere-email`

Retransmitere factură pe email.

**Response 200:**

```json
{
  "mesaj": "Factura F00145 a fost retransmisă pe email."
}
```

---

## 6. Plăți

### GET `/plati?codAbonat={cod}&deLa={data}&panaLa={data}`

Istoric plăți.

**Response 200:**

```json
{
  "plati": [
    {
      "id": "PL-009",
      "nrFactura": "F00112",
      "data": "2026-02-25",
      "suma": 38.7,
      "metoda": "Card online (ING WebPay)",
      "status": "Confirmată",
      "referintaProcesator": "ING-TXN-20260225-001"
    }
  ]
}
```

### POST `/plati/initiere`

Inițiere plată online. Returnează URL redirect către procesator.

**Request:**

```json
{
  "nrFactura": "F00145",
  "suma": 92.4
}
```

**Response 200:**

```json
{
  "redirectUrl": "https://webpay.ing.ro/pay?ref=TXN-20260316-001&amount=92.40&currency=RON",
  "referintaTranzactie": "TXN-20260316-001",
  "expiraLa": "2026-03-16T15:30:00Z"
}
```

### POST `/plati/callback`

Callback de la procesatorul de plăți (ING WebPay → ASiS Service). Nu e apelat de portal, ci de procesator direct.

**Request (de la ING):**

```json
{
  "referinta": "TXN-20260316-001",
  "status": "SUCCESS",
  "suma": 92.4,
  "dataConfirmare": "2026-03-16T14:32:15Z"
}
```

---

## 7. Autocitiri

### GET `/autocitiri?contorId={id}&ultimeleLuni={n}`

Istoric autocitiri per contor. Default `ultimeleLuni=12`.

**Response 200:**

```json
{
  "autocitiri": [
    {
      "luna": "2026-02",
      "index": 267,
      "consum": 11,
      "sursa": "Autocitire",
      "dataTransmitere": "2026-02-22T10:15:00Z",
      "validat": true
    },
    {
      "luna": "2026-01",
      "index": 256,
      "consum": 13,
      "sursa": "Citire operator",
      "dataTransmitere": null,
      "validat": true
    }
  ],
  "contorId": "CT-001",
  "serieContor": "ABC-123456",
  "codAutocitire": "276933",
  "ultimulIndex": 267
}
```

### POST `/autocitiri`

Transmitere index autocitit.

**Request (multipart/form-data):**

```
contorId: "CT-001"
index: 278
fotografie: [fișier imagine]
```

**Response 201:**

```json
{
  "mesaj": "Index transmis cu succes.",
  "contorId": "CT-001",
  "index": 278,
  "dataTransmitere": "2026-03-16T14:30:00Z",
  "status": "InAsteptareValidare"
}
```

**Response 400:**

```json
{
  "eroare": "INDEX_INVALID",
  "mesaj": "Indexul transmis (150) este mai mic decât ultimul index înregistrat (267)."
}
```

**Response 400:**

```json
{
  "eroare": "PERIOADA_INCHISA",
  "mesaj": "Perioada de autocitire nu este activă. Transmiterea este permisă între 20 și ultima zi a lunii."
}
```

---

## 8. Sesizări

### GET `/sesizari?codAbonat={cod}&status={status}`

Lista sesizări.

**Valori `status`:** `toate` (default), `inregistrat`, `in_lucru`, `solutionat`, `respins`

**Response 200:**

```json
{
  "sesizari": [
    {
      "nr": "REG-00456",
      "data": "2026-02-15",
      "tip": "Reclamație",
      "descriere": "Presiune scăzută a apei în intervalul 18:00-22:00",
      "status": "În lucru",
      "locConsumId": "LC-001",
      "adresaLocConsum": "Cornului nr. 31, bl. sc. ap. 0, Pitești",
      "nrRegistraturaExterna": "GU-2026-04521"
    }
  ]
}
```

### POST `/sesizari`

Depunere sesizare nouă.

**Request (multipart/form-data):**

```
codAbonat: "036720"
locConsumId: "LC-001"
tip: "Reclamație"
descriere: "Presiune scăzută a apei în intervalul 18:00-22:00"
atasament: [fișier opțional]
```

**Response 201:**

```json
{
  "mesaj": "Sesizare înregistrată.",
  "nr": "REG-00512",
  "nrRegistraturaExterna": "GU-2026-04890",
  "status": "Înregistrat",
  "data": "2026-03-16"
}
```

---

## 9. Notificări

### GET `/notificari?citit={bool}&limita={n}`

Lista notificări. Default: toate, limita 50.

**Response 200:**

```json
{
  "notificari": [
    {
      "id": 1,
      "titlu": "Facturi noi emise — martie 2026",
      "text": "Facturile F00145 și F00138 au fost emise. Valoare totală: 137.50 RON.",
      "data": "2026-03-16T12:00:00Z",
      "citit": false,
      "tip": "factura_emisa"
    }
  ],
  "sumar": {
    "total": 7,
    "necitite": 3
  }
}
```

### PATCH `/notificari/{id}/citit`

Marcare notificare ca citită.

**Response 200:**

```json
{
  "mesaj": "Notificare marcată ca citită.",
  "id": 1
}
```

### PATCH `/notificari/citit-toate`

Marcare toate notificările ca citite.

**Response 200:**

```json
{
  "mesaj": "Toate notificările au fost marcate ca citite.",
  "actualizate": 3
}
```

---

## 10. Anunțuri

### GET `/anunturi?limita={n}`

Anunțuri publicate de operator. Default limita 20.

**Response 200:**

```json
{
  "anunturi": [
    {
      "id": 1,
      "titlu": "Lucrări programate — zona Trivale",
      "text": "În data de 25.03.2026, între orele 08:00-16:00, se vor executa lucrări de mentenanță...",
      "data": "2026-03-16",
      "tip": "Lucrări"
    }
  ]
}
```

---

## 11. Dashboard (agregat)

### GET `/dashboard`

Endpoint agregat pentru pagina principală. Returnează tot ce trebuie pentru dashboard într-un singur request, evitând multiple apeluri la încărcare.

**Response 200:**

```json
{
  "sumarFacturi": {
    "soldTotal": 237.7,
    "nrNeachitate": 4,
    "nrAchitate": 8
  },
  "ultimulIndex": {
    "contorId": "CT-001",
    "serie": "ABC-123456",
    "index": 267,
    "data": "2026-02-22"
  },
  "sesizariInLucru": 1,
  "notificariNecitite": 3,
  "facturiRecente": [
    {
      "nr": "F00145",
      "data": "2026-03-01",
      "suma": 92.4,
      "sold": 92.4,
      "contractId": "C-12345"
    }
  ],
  "notificariRecente": [
    {
      "id": 1,
      "titlu": "Facturi noi emise — martie 2026",
      "text": "Facturile F00145 și F00138 au fost emise.",
      "data": "2026-03-16T12:00:00Z",
      "citit": false
    }
  ],
  "sesizariRecente": [
    {
      "nr": "REG-00456",
      "data": "2026-02-15",
      "tip": "Reclamație",
      "status": "În lucru"
    }
  ],
  "perioadaAutocitire": {
    "activa": true,
    "deLa": "2026-03-20",
    "panaLa": "2026-03-31"
  }
}
```

---

## Coduri de eroare comune

| Cod HTTP | Eroare                 | Descriere                                        |
| -------- | ---------------------- | ------------------------------------------------ |
| 400      | `REQUEST_INVALID`      | Parametri lipsă sau format incorect              |
| 400      | `INDEX_INVALID`        | Index autocitire mai mic decât ultimul           |
| 400      | `PERIOADA_INCHISA`     | Autocitire în afara ferestrei 20–ultima zi       |
| 400      | `PAROLA_SLABA`         | Parola nu îndeplinește cerințele de complexitate |
| 401      | `CREDENTIALE_INVALIDE` | Email sau parolă incorectă                       |
| 401      | `TOKEN_EXPIRAT`        | Token de sesiune expirat                         |
| 401      | `2FA_NECESAR`          | Autentificarea necesită verificare 2FA           |
| 403      | `CONT_BLOCAT`          | Cont blocat după prea multe încercări            |
| 403      | `ACCES_INTERZIS`       | Utilizatorul nu are acces la resursa cerută      |
| 404      | `RESURSA_NEGASITA`     | Cod abonat, factură sau contor inexistent        |
| 409      | `COD_ABONAT_ASOCIAT`   | Cod abonat deja asociat altui cont activ         |
| 409      | `EMAIL_EXISTENT`       | Email-ul este deja folosit de alt cont           |

Toate erorile returnează structura:

```json
{
  "eroare": "COD_EROARE",
  "mesaj": "Descriere lizibilă pentru utilizator."
}
```

---

## Mapare endpoint → pagină portal

| Pagină portal       | Endpoint-uri consumate                                                    |
| ------------------- | ------------------------------------------------------------------------- |
| Login / Creare cont | `POST /auth/login`, `POST /auth/creare-cont`, `POST /auth/verificare-2fa` |
| Dashboard           | `GET /dashboard`                                                          |
| Cont client         | `GET /utilizator/profil`, `GET /abonat/{cod}`, `GET /abonat/asocieri`     |
| Contracte           | `GET /contracte`                                                          |
| Facturi             | `GET /facturi`, `GET /facturi/{nr}/pdf`                                   |
| Plăți               | `GET /plati`, `POST /plati/initiere`                                      |
| Autocitire          | `GET /autocitiri`, `POST /autocitiri`                                     |
| Sesizări            | `GET /sesizari`, `POST /sesizari`                                         |
| Notificări          | `GET /notificari`, `PATCH /notificari/{id}/citit`                         |
| Anunțuri            | `GET /anunturi`                                                           |
| Setări              | `PATCH /utilizator/profil`, `PATCH /utilizator/preferinte`                |
| GDPR                | `PATCH /utilizator/consimtamant-gdpr`                                     |
