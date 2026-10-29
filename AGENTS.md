<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

---

# AgriSense AI — AGENTS.md

> **Purpose of this file:** Canonical reference for any AI coding agent (or human
> contributor) working in this repository. It documents architecture decisions,
> code-style rules, data-flow contracts, testing expectations, and guardrails so
> that every automated or assisted change stays consistent with the project's
> established patterns.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Project name** | AgriSense AI |
| **Domain** | Precision Agriculture / AI-assisted farm advisory |
| **Primary users** | Smallholder and marginal farmers in India |
| **Research context** | Capstone / academic research paper on AI-driven government scheme eligibility matching and crop advisory |
| **License** | Academic / research use |

---

## 2. Repository Layout

```
farm-ai-grow-83-main/
│
├── client/                         ← React 18 frontend (Vite + JSX, ESM)
│   ├── public/
│   └── src/
│       ├── assets/                 ← Static images
│       ├── components/             ← Shared UI components
│       │   ├── AuthModal.jsx       ← Login / register modal
│       │   ├── ChatbotWidget.jsx   ← Floating AI chat widget
│       │   ├── Footer.jsx
│       │   ├── Navbar.jsx          ← Responsive nav with auth state
│       │   ├── ProtectedRoute.jsx  ← JWT-based route guard
│       │   └── SchemeMatcher.jsx   ← Gov-scheme eligibility UI
│       ├── context/
│       │   ├── AuthContext.jsx     ← JWT auth state (React Context)
│       │   ├── FarmerProfileContext.jsx  ← Farmer profile + localStorage cache
│       │   └── LanguageContext.jsx ← i18n language toggle
│       ├── pages/
│       │   ├── Home.jsx            ← Landing page
│       │   ├── Dashboard.jsx       ← Authenticated dashboard
│       │   ├── CropRecommend.jsx   ← AI crop recommendation page
│       │   ├── WeatherPage.jsx     ← Weather forecast
│       │   ├── DiseaseDetect.jsx   ← Image-based disease detection
│       │   ├── IrrigationPage.jsx  ← Irrigation advisory
│       │   ├── FertilizerPage.jsx  ← Fertilizer calculator
│       │   ├── MarketPage.jsx      ← Crop market prices
│       │   ├── SoilAnalyzer.jsx    ← Soil health analysis (OCR-assisted)
│       │   └── GovernmentSchemes.jsx ← Scheme browser + SchemeMatcher
│       ├── translations/           ← i18n strings
│       ├── App.jsx                 ← Router setup
│       ├── main.jsx
│       └── index.css               ← Tailwind CSS v4 + custom tokens
│
├── server/                         ← Express.js backend (CommonJS)
│   ├── config/
│   │   └── db.js                   ← Mongoose connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── contactController.js
│   │   ├── cropController.js       ← In-memory crop knowledge base (DEPRECATED heuristic)
│   │   ├── diseaseController.js    ← Demo placeholder (hash-selected result, no ML inference)
│   │   ├── fertilizerController.js
│   │   ├── governmentController.js ← External gov-data proxy
│   │   ├── irrigationController.js
│   │   ├── marketController.js
│   │   ├── schemeController.js     ← REST handler for /api/schemes/match
│   │   ├── soilController.js
│   │   └── weatherController.js
│   ├── Data/
│   │   └── govt_schemes.json       ← Static scheme catalogue (DO NOT MODIFY)
│   ├── middleware/
│   │   ├── auth.js                 ← JWT Bearer verification (protect middleware)
│   │   └── upload.js               ← Multer file-upload config
│   ├── models/
│   │   ├── Contact.js              ← Mongoose contact-form schema
│   │   └── User.js                 ← Mongoose user schema (bcrypt passwords)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── cropRoutes.js
│   │   ├── diseaseRoutes.js
│   │   ├── fertilizerRoutes.js
│   │   ├── governmentRoutes.js
│   │   ├── irrigationRoutes.js
│   │   ├── marketRoutes.js
│   │   ├── schemeRoutes.js         ← POST /match → schemeController
│   │   ├── soilRoutes.js
│   │   └── weatherRoutes.js
│   ├── services/
│   │   ├── schemeMatcher.js        ← Pure matching logic (no req/res)
│   │   ├── roiEstimator.js         ← MSP-based economics calculator (pure)
│   │   └── rotationAdvisor.js      ← ICAR/TNAU rotation advisor (pure)
│   ├── tests/
│   │   ├── schemeMatcher.test.js   ← Manual test script (node, no framework)
│   │   ├── roiEstimator.test.js    ← Unit tests for economics calculations
│   │   └── rotation.test.js        ← Unit tests for all 6 rotation statuses
│   └── server.js                   ← Express entry point
│
├── ml-service/                     ← Python FastAPI ML service (port 8001)
│   ├── app.py                      ← POST /predict endpoint
│   ├── train_v2.py                 ← Random Forest training (27-class v2 dataset with source column)
│   └── models/                     ← Saved model artefacts
│
├── AGENTS.md                       ← ← THIS FILE
├── README.md
├── vite.config.ts                  ← Root-level Vite config (client)
└── package.json                    ← Root-level (client) package manifest
```

---

## 3. Technology Stack

### Frontend
| Technology | Version | Role |
|---|---|---|
| React | 18 | UI framework |
| Vite | Latest | Dev server & bundler |
| Tailwind CSS | v4 | Styling (utility-first) |
| Framer Motion | Latest | Page & component animations |
| Lucide React | Latest | Icon set |
| React Router DOM | v6 | Client-side routing |

### Backend
| Technology | Version | Role |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express.js | 4.x | HTTP framework |
| MongoDB | Atlas / local | Primary database |
| Mongoose | 8.x | ODM |
| JSON Web Tokens | 9.x | Authentication tokens |
| bcryptjs | 3.x | Password hashing |
| Multer | 1.x | File uploads (disease images) |
| Tesseract.js | 7.x | OCR for soil report parsing |
| Axios | 1.x | External API calls |

### Module system
- **Client:** ESM (`import`/`export`) — enforced by Vite.
- **Server:** CommonJS (`require`/`module.exports`) — enforced by `"type": "commonjs"` in `server/package.json`.
- **Never mix the two in the same layer.**

---

## 4. Environment & Configuration

### Required `.env` (server only — `server/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/agrisense
CLIENT_URL=http://localhost:5173
JWT_SECRET=<your_secret>
OPENWEATHER_API_KEY=<optional>
```

- Do **not** commit `.env`. It is git-ignored.
- Template is at `server/.env.example`.
- Client env vars use the `VITE_` prefix in `client/.env` (if needed).

### Vite proxy
`vite.config.ts` proxies `/api` to `http://localhost:5000` during development.
All client `fetch` calls use relative paths (e.g. `/api/schemes/match`) and
require **no base URL changes** between dev and production.

---

## 5. Running the Project

```bash
# Terminal 1 — Backend (http://localhost:5001)
cd server
npm run dev        # nodemon server.js

# Terminal 2 — Frontend (http://localhost:5173)
cd client
npm run dev        # vite

# Terminal 3 — Python ML service (http://127.0.0.1:8001)
cd ml-service
uvicorn app:app --host 127.0.0.1 --port 8001 --reload

# Tests (no test runner — plain node)
cd server
npm test           # schemeMatcher → roiEstimator → rotation

# Smoke test (both Express on :5000 and FastAPI on :8001 must be running)
node server/scripts/smoke_test.js
# Skip ML checks if FastAPI is offline: SKIP_ML=1 node server/scripts/smoke_test.js
# Override port: BASE_URL=http://localhost:5001 node server/scripts/smoke_test.js
```

---

## 6. API Surface

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Server health check |
| POST | `/api/auth/register` | None | Create account |
| POST | `/api/auth/login` | None | Returns JWT |
| GET | `/api/auth/me` | Bearer JWT | Current user profile |
| POST | `/api/contact` | None | Submit contact form |
| GET | `/api/contact` | None | List submissions |
| **POST** | **`/api/crop/ml-recommend`** | **None** | **ML crop recommendation (FastAPI proxy)** |
| POST | `/api/crop/recommend` | None | DEPRECATED — in-memory heuristic |
| POST | `/api/disease/detect` | None | Image disease detection (demo placeholder) |
| POST | `/api/irrigation/calculate` | None | Irrigation advisory |
| POST | `/api/fertilizer/calculate` | None | Fertilizer recommendation |
| GET | `/api/market` | None | Market prices |
| GET | `/api/weather` | None | Weather forecast |
| POST | `/api/soil/analyze` | None | Soil health analysis (Tesseract.js OCR) |
| POST | `/api/chat` | None | AI chatbot response |
| GET | `/api/government` | None | Government scheme info |
| **POST** | **`/api/schemes/match`** | **None** | **Scheme eligibility matcher** |

### `POST /api/schemes/match` — Request / Response contract

**Request body:**
```json
{
  "landSizeAcres":  2.0,
  "priorityGroups": ["sc_st"],
  "previousCrop":   "wheat",
  "currentCrop":    "rice",
  "exclusionFlags": {
    "isIncomeTaxPayer": false,
    "isGovtEmployee":   false
  }
}
```

**Success response (200):**
```json
{
  "category": "marginal",
  "totalMatched": 5,
  "matchedSchemes": [
    {
      "scheme_id": "SCH001",
      "scheme_name": "Pradhan Mantri Kisan Samman Nidhi",
      "short_code": "PM-KISAN",
      "benefit_type": "direct_income",
      "key_benefit_description": "...",
      "required_documents": ["..."],
      "official_link": "https://pmkisan.gov.in",
      "computed_benefit": 6000
    }
  ]
}
```

**Error responses:**
- `400` — `landSizeAcres` missing or not a number.
- `500` — Unexpected server error.

---

## 7. Farmer Category Derivation

Category is **always derived server-side** in `schemeController.js` via
`deriveCategory()` from `server/services/schemeMatcher.js`.
The client **must not send** a `category` field — it will be ignored.

| Land size (acres) | Category |
|---|---|
| < 2.5 | `marginal` |
| 2.5 – 5.0 (inclusive) | `small` |
| > 5.0 | `general` |

---

## 8. Scheme Data (`server/Data/govt_schemes.json`)

> [!CAUTION]
> **Do NOT modify `govt_schemes.json`.** It is the single source of truth for
> scheme data. All matching logic adapts to it — not the other way around.

### Field reference

| Field | Type | Notes |
|---|---|---|
| `scheme_id` | string | Unique identifier (`SCH001`…) |
| `scheme_name` | string | Full official scheme name |
| `short_code` | string | Acronym (`PM-KISAN`) |
| `eligible_categories` | string[] | Subset of `["marginal","small","general"]` |
| `additional_priority_groups` | string[] | e.g. `["sc_st","women","north_east"]` |
| `all_crops_eligible` | boolean | If true, skip crop filtering |
| `applicable_crops` | string[] | Lowercase crop names |
| `benefit_type` | string | `direct_income`, `insurance`, `subsidy`, `service` |
| `annual_benefit_inr` | number or null | Fixed annual cash benefit |
| `financial_assistance_inr` | number or null | One-time grant |
| `subsidy_slabs` | object or null | Keys: `marginal`, `small`, `general` → `{min, max}` |
| `exclusion_tags` | string[] | Disqualifying conditions |
| `required_documents` | string[] | Document checklist |
| `official_link` | string | Government portal URL |

---

## 9. Exclusion-Tag Mapping

Only the flags below are currently active. Unknown `exclusion_tags` values in
the JSON are **silently ignored** — never throw errors for unrecognised tags.

| Profile flag (`exclusionFlags.*`) | `exclusion_tags` string |
|---|---|
| `isIncomeTaxPayer` | `income_tax_payer` |
| `isGovtEmployee` | `government_employee_class_1_2` |

To add a new flag: add the entry to `FLAG_TO_TAG` in
`server/services/schemeMatcher.js` only.

---

## 10. Scheme Matching Algorithm (`server/services/schemeMatcher.js`)

The exported `matchSchemes(farmerProfile, schemes)` function is **pure** —
no side effects, no I/O, fully unit-testable.

### Filter pipeline (in order)

1. **Category** — `scheme.eligible_categories` must include `farmerProfile.category`.
2. **Exclusions** — build `activeExclusionTags` from `farmerProfile.exclusionFlags`;
   if any of the scheme's `exclusion_tags` is in that set, exclude it.
3. **Crop** — only applied when `all_crops_eligible === false` AND `currentCrop`
   is provided AND the crop is absent from `applicable_crops`.

### `computed_benefit` resolution order

```
annual_benefit_inr
  → financial_assistance_inr
    → subsidy_slabs[category].max
       (use highest slab if farmer is in additional_priority_groups)
      → null
```

Results are sorted **descending**, with `null` last.

---

## 11. Frontend State — FarmerProfileContext

Stored in React state, persisted to `localStorage` under
`agrisense_farmer_profile`.

### Profile shape

```js
{
  landSizeAcres:  0,
  category:       "general",   // auto-derived — never set directly
  previousCrop:   "",
  priorityGroup:  "none",
  state:          "",
  district:       "",
  exclusionFlags: {            // object of booleans — NOT an array
    isIncomeTaxPayer:    false,
    isGovtEmployee:      false,
    isInstitutionalLand: false,
  },
}
```

> [!IMPORTANT]
> `exclusionFlags` is an **object with boolean values**. It was previously an
> array of strings, which caused the exclusion filter to be bypassed entirely.
> Any agent reading old localStorage data must migrate the array format
> gracefully (see the initialisation logic in `FarmerProfileContext.jsx`).

---

## 12. Authentication

- JWT-based; token stored in **`localStorage`** under `agrisense_token` (`AuthContext.jsx`).
- **Known limitation:** localStorage is accessible to JavaScript and therefore vulnerable to XSS.
  A `httpOnly` cookie is the planned production fix.
- Server middleware: `server/middleware/auth.js` — export `protect`.
- Protected routes use `<ProtectedRoute>` client-side.
- Scheme matching is **public** (no auth required).

---

## 13. Code Style & Conventions

### General
- No TypeScript on the server. Pure JavaScript (CommonJS).
- Use `'use strict';` at the top of all new server-side `.js` files.
- No semicolons in client `.jsx`; semicolons in server `.js`.
- Prefer `const` and arrow functions, consistent with surrounding code.

### Server controllers
- Pattern: `(req, res) => { try { … } catch (error) { … } }`
- Client errors: `res.status(400).json({ success: false, message: "..." })`
- Server errors: `res.status(500).json({ success: false, message: "..." })`

### Route files
- Pattern: `express.Router()` → `router.METHOD(path, handler)` → `module.exports = router`
- All routes mounted in `server.js` under `/api/<resource>`.

### Services
- Files in `server/services/` must be **pure functions** — no Express, no
  Mongoose, no file I/O inside the exported function.

### Client components
- Functional components + hooks only. No class components.
- Context consumed via custom `use*` hooks.
- Tailwind utility classes only — no inline `style` props.

---

## 14. Testing

No external test runner is configured. Tests are plain Node scripts in
`server/tests/`, run via `npm test` from `server/`.

### Current coverage

| File | Section | Scenario |
|---|---|---|
| `schemeMatcher.test.js` | A | 1.5-acre marginal, no exclusions, no crop → ≥2 matches; PM-KISAN present; sorted correctly |
| `schemeMatcher.test.js` | B | `isIncomeTaxPayer: true` → PM-KISAN absent |
| `schemeMatcher.test.js` | B2 | `isGovtEmployee: true` → PM-KISAN absent |
| `schemeMatcher.test.js` | C | `sc_st` priority → SMAM `computed_benefit` = 80 (vs 50 for general) |
| `schemeMatcher.test.js` | D | Unknown crop → PMFBY excluded; all-crop schemes still present |
| `schemeMatcher.test.js` | E | `deriveCategory` boundary values |
| `roiEstimator.test.js` | A | `computeEconomics` rice worked example |
| `roiEstimator.test.js` | B | Null-handling for all four null patterns |
| `roiEstimator.test.js` | C | `rankCrops` ordering and unranked list |
| `roiEstimator.test.js` | D | Missing-file fallback + verified 12-entry file |
| `rotation.test.js` | A | `no_history` — empty/null/undefined previousCrop |
| `rotation.test.js` | B | `no_data` — unknown previousCrop |
| `rotation.test.js` | C | `perennial` — perennial previousCrop |
| `rotation.test.js` | D | `warning` — same crop repeated |
| `rotation.test.js` | E | `success` — predicted crop in recommended list |
| `rotation.test.js` | F | `neutral` — predicted crop not recommended |
| `rotation.test.js` | G | Empty matrix edge case |
| `rotation.test.js` | H | `perennial` via predictedEntry (rice → mango) |
| `rotation.test.js` | I | Whitespace normalisation: `" Rice "` behaves as `"rice"` |
| `rotation.test.js` | J | `sugarcane→sugarcane`: `is_perennial=true` fires before same-crop branch; status = `perennial` |
| `server/scripts/smoke_test.js` | — | Live-server smoke test: `GET /api/health`, `POST /api/crop/ml-recommend` (rice row top3/SHAP, low-confidence gate, cotton repeat warning), rice economics (MSP 2441, roi_available false), and 3 scheme personas (marginal, small tax exclusion, general SC/ST priority). Express (5000) and FastAPI (8001) must both be running (or `SKIP_ML=1`). |

### Agent testing rule
Run `npm test` and verify all tests pass (exit code 0) before finishing any
change. Additionally run `node server/scripts/smoke_test.js` (with server
live) to confirm deployed endpoints respond correctly. Never commit if
either `npm test` or the smoke test fails.

---

## 15. What Agents Must NOT Do

> [!WARNING]

1. **Do not force-push, rebase, or squash** already-pushed commits (Lovable constraint).
2. **Do not modify `server/Data/govt_schemes.json`**.
3. **Do not add `req`/`res` inside `server/services/schemeMatcher.js`**.
4. **Do not derive `category` on the client** and send it to the server.
5. **Do not convert `exclusionFlags` back to an array**.
6. **Do not introduce a new test runner** without updating this file and `package.json`.
7. **Do not mix ESM and CJS** within the same layer.
8. **Do not commit `.env`** or any file containing secrets.

---

## 16. Extending the Project

### Adding a new exclusion flag
1. Add mapping to `FLAG_TO_TAG` in `server/services/schemeMatcher.js`.
2. Add boolean key to `DEFAULT_PROFILE.exclusionFlags` in `FarmerProfileContext.jsx`.
3. Add checkbox to `client/src/components/SchemeMatcher.jsx`.
4. Add test case in `server/tests/schemeMatcher.test.js`.

### Adding a new scheme
Edit `server/Data/govt_schemes.json` following the existing object schema.
Run `npm test` to verify no regression.

### Adding a new API route
1. Create `server/controllers/<name>Controller.js`.
2. Create `server/routes/<name>Routes.js`.
3. Mount in `server/server.js` under `/api/<name>`.
4. Document in §6 of this file.

---

## 17. Research Paper Notes

This project is the implementation artefact for a research paper on
**AI-assisted government scheme eligibility matching for Indian farmers**.

### Key research contributions

| Contribution | Location |
|---|---|
| Rule-based eligibility engine (auditable, deterministic) | `server/services/schemeMatcher.js` |
| Server-side category derivation (tamper-resistant) | `server/controllers/schemeController.js` |
| Extensible exclusion-tag vocabulary | `FLAG_TO_TAG` in `schemeMatcher.js` |
| Economic benefit ranking for recommendation quality evaluation | `computeBenefit()` in `schemeMatcher.js` |
| Persistent farmer profile for longitudinal UI studies | `FarmerProfileContext.jsx` |
| Reproducible test suite | `server/tests/schemeMatcher.test.js` |

### Citing this implementation
When citing in the paper, reference:
- The scheme data model in `server/Data/govt_schemes.json`
- The matching algorithm in `server/services/schemeMatcher.js`
- The test suite in `server/tests/schemeMatcher.test.js` for reproducibility
