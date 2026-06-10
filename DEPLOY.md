# 🚀 Guía de Despliegue — EduTrack Insight v2.0

Arquitectura online para demos: **Frontend en Vercel** + **Backend en Render** + **MongoDB Atlas** + **IA vía OpenRouter** (sin Ollama local).

```
[Vercel: React]  →  [Render: API Express]  →  [MongoDB Atlas]
                            ↓
                    [OpenRouter: Gemma 4 free]
```

---

## 1️⃣ Backend en Render

1. Entra a [render.com](https://render.com) e inicia sesión con GitHub.
2. **New +** → **Blueprint** → conecta el repo `Eductrack2.0` (rama `main`).
   Render detecta el archivo `render.yaml` automáticamente.
   - *Alternativa manual:* **New +** → **Web Service** → Root Directory: `Backend-Diagnostico-vocacional`, Build: `npm install`, Start: `npm start`, plan **Free**.
3. Cuando pida las variables de entorno, completa:

   | Variable | Valor |
   |---|---|
   | `MONGO_URI` | Tu cadena de Atlas (la misma del `.env` local) |
   | `OPENROUTER_API_KEY` | Tu key de [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) |
   | `FRONTEND_URL` | La URL de Vercel (paso 2). Si aún no la tienes, pon `http://localhost:3000` y actualízala después |

   (`JWT_SECRET` se genera solo; los modelos ya vienen con valor por defecto.)
4. Deploy. Al terminar tendrás una URL tipo: `https://edutrack-api.onrender.com`
5. Verifica abriendo esa URL: debe responder `{"status":"ok","service":"EduTrack Insight API"...}`

> ⚠️ El plan Free de Render "duerme" tras 15 min sin tráfico. El primer request al despertar tarda ~30-60 s. Es normal en demos: abre la URL del backend un minuto antes de presentar.

## 2️⃣ Frontend en Vercel

1. Entra a [vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. **Add New** → **Project** → importa `Eductrack2.0`.
3. Configuración:
   - **Root Directory:** `Frontend-Diagnostico-vocacional`
   - **Framework Preset:** Create React App (lo detecta solo)
4. En **Environment Variables** agrega:

   | Variable | Valor |
   |---|---|
   | `REACT_APP_API_URL` | `https://edutrack-api.onrender.com/api` ← la URL de Render + `/api` |

5. **Deploy**. Tendrás una URL tipo: `https://eductrack2-0.vercel.app`

## 3️⃣ Conectar ambos (CORS)

1. Vuelve a Render → tu servicio → **Environment**.
2. Edita `FRONTEND_URL` con la URL real de Vercel:
   ```
   https://eductrack2-0.vercel.app
   ```
   (Se pueden poner varios orígenes separados por coma, ej. agregar `http://localhost:3000` para seguir probando en local.)
3. Guarda — Render redespliega solo.

## 4️⃣ Poblar la base de datos (si está vacía)

Desde tu PC (apuntando al mismo Atlas):
```bash
cd Backend-Diagnostico-vocacional
node seed.js
```

## ✅ Probar la demo

Abre la URL de Vercel y entra con (login por cédula):

| Rol | Cédula | Contraseña |
|---|---|---|
| SuperAdmin | `11111111` | `super123` |
| Docente | `40000000` | `docente123` |
| Estudiante | `22222222` | `estudiante123` |

**Flujo de demo sugerido (estudiante):** Dashboard → "Cargar datos de prueba" → ver semáforo y evolución → Test Vocacional → ver Resultados con análisis de IA → chatear con Gemma (botón flotante ✨).

---

## 🔧 Variables de entorno (resumen)

**Backend (Render):** `MONGO_URI`, `JWT_SECRET`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_FALLBACK_MODEL`, `FRONTEND_URL`, (`PORT` lo pone Render solo).

**Frontend (Vercel):** `REACT_APP_API_URL` (¡incluye el sufijo `/api`!). Nota: es variable de *build* — si la cambias, hay que redesplegar.

## 🧠 Modelos de IA (gratuitos)

- Principal: `google/gemma-4-26b-a4b-it:free` (rápido, 262K contexto)
- Respaldo automático si se satura: `meta-llama/llama-3.3-70b-instruct:free`

Para cambiar de modelo solo edita la variable en Render (los IDs exactos están en [openrouter.ai/models](https://openrouter.ai/models?max_price=0)).
