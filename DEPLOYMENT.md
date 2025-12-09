# 🚀 Grove Fitness - Guia de Deployment

Aquesta guia t'ajudarà a fer deploy del backend i frontend de Grove Fitness per no haver d'arrencar-los manualment cada vegada.

## 📋 Índex
1. [Deploy Backend](#deploy-backend)
2. [Deploy Frontend](#deploy-frontend)
3. [Configuració de MongoDB](#mongodb)
4. [Variables d'Entorn](#variables-dentorn)

---

## 🔧 Deploy Backend

### Opció 1: Railway (Recomanat) ⭐

**Per què Railway?**
- Gratis per començar (500h/mes)
- MongoDB integrat
- Deployment automàtic amb Git
- SSL gratis

**Passos:**

1. **Crea un compte a Railway**
   - Ves a [railway.app](https://railway.app)
   - Registra't amb GitHub

2. **Crea un nou projecte**
   - Click "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Selecciona el repositori `grove-fitness`
   - Selecciona la carpeta `/backend`

3. **Afegeix MongoDB**
   - Al mateix projecte, click "+ New"
   - Selecciona "Database" → "MongoDB"
   - Railway crearà automàticament una instància de MongoDB

4. **Configura les variables d'entorn**
   - Click al servei del backend
   - Ves a "Variables"
   - Afegeix les següents variables (copia-les de `.env.example`):

   ```bash
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=${MONGO_URL}  # Railway la crea automàticament
   JWT_SECRET=<genera-una-clau-secreta-forta>
   JWT_EXPIRE=7d
   GROQ_API_KEY=<la-teva-api-key-de-groq>
   CLOUDINARY_CLOUD_NAME=<el-teu-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<la-teva-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<el-teu-cloudinary-api-secret>
   CLIENT_URL=https://grove-fitness.vercel.app
   ```

5. **Deploy automàtic**
   - Railway farà deploy automàticament
   - Obtindràs una URL tipus: `https://grove-fitness-production.up.railway.app`

6. **Verifica el deployment**
   - Ves a: `https://la-teva-url.railway.app/health`
   - Hauries de veure: `{"status":"OK",...}`

---

### Opció 2: Render

**Passos:**

1. **Crea un compte a Render**
   - Ves a [render.com](https://render.com)
   - Registra't amb GitHub

2. **Crea un nou Web Service**
   - Click "New +"
   - Selecciona "Web Service"
   - Connecta el repositori de GitHub
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Afegeix MongoDB**
   - Opció A: Usa MongoDB Atlas (recomanat)
     - Crea un compte gratis a [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
     - Crea un cluster gratis
     - Obté la connection string

   - Opció B: Usa una base de dades PostgreSQL de Render + Prisma/TypeORM

4. **Configura les variables d'entorn**
   - A la secció "Environment", afegeix:
   ```bash
   NODE_ENV=production
   MONGODB_URI=<mongodb-atlas-connection-string>
   JWT_SECRET=<genera-una-clau-secreta-forta>
   JWT_EXPIRE=7d
   GROQ_API_KEY=<la-teva-api-key-de-groq>
   CLOUDINARY_CLOUD_NAME=<el-teu-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<la-teva-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<el-teu-cloudinary-api-secret>
   CLIENT_URL=https://grove-fitness.vercel.app
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render farà deploy automàticament

---

## 📱 Deploy Frontend

### Opció 1: Expo Application Services (EAS) - Per Apps Natives

**Per compilar apps per iOS i Android:**

1. **Instal·la EAS CLI**
   ```bash
   cd frontend
   npm install -g eas-cli
   ```

2. **Login a Expo**
   ```bash
   eas login
   ```

3. **Configura el projecte**
   ```bash
   eas build:configure
   ```

4. **Crea el fitxer `.env.production`**
   ```bash
   cd frontend
   cp .env.example .env.production
   ```

   Edita `.env.production`:
   ```bash
   EXPO_PUBLIC_ENV=production
   EXPO_PUBLIC_API_URL_PRODUCTION=https://la-teva-url-railway.railway.app/api
   ```

5. **Build per Android**
   ```bash
   eas build --platform android --profile production
   ```

6. **Build per iOS**
   ```bash
   eas build --platform ios --profile production
   ```

7. **Submit a les stores** (opcional)
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

---

### Opció 2: Vercel - Per Versió Web

**Si vols una versió web de l'app:**

1. **Prepara el projecte per web**
   ```bash
   cd frontend
   npm run web
   # Verifica que funciona localment
   ```

2. **Crea un compte a Vercel**
   - Ves a [vercel.com](https://vercel.com)
   - Registra't amb GitHub

3. **Importa el projecte**
   - Click "Add New" → "Project"
   - Selecciona el repositori `grove-fitness`
   - Root Directory: `frontend`
   - Framework Preset: "Other"
   - Build Command: `npx expo export -p web`
   - Output Directory: `dist`

4. **Configura variables d'entorn**
   ```bash
   EXPO_PUBLIC_ENV=production
   EXPO_PUBLIC_API_URL_PRODUCTION=https://la-teva-url-railway.railway.app/api
   ```

5. **Deploy**
   - Click "Deploy"
   - Obtindràs una URL tipus: `https://grove-fitness.vercel.app`

---

## 🗄️ MongoDB

### Opció 1: Railway MongoDB (si uses Railway)
- Ja està integrat!
- La variable `MONGO_URL` es crea automàticament

### Opció 2: MongoDB Atlas (Gratis)

1. **Crea un compte**
   - Ves a [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Registra't (gratis)

2. **Crea un cluster**
   - Selecciona "FREE" (M0)
   - Tria una regió propera (ex: Frankfurt)

3. **Crea un usuari de base de dades**
   - Database Access → Add New Database User
   - Username: `grove-admin`
   - Password: (genera'n una forta)

4. **Configura Network Access**
   - Network Access → Add IP Address
   - Selecciona "Allow access from anywhere" (0.0.0.0/0)
   - (En producció, limita això a les IPs del teu servidor)

5. **Obté la Connection String**
   - Databases → Connect → "Connect your application"
   - Copia la connection string
   - Format: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/grove-fitness?retryWrites=true&w=majority`
   - Reemplaça `<password>` amb la teva password

---

## 🔐 Variables d'Entorn

### Backend (`.env`)

```bash
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/grove-fitness

# JWT
JWT_SECRET=<genera amb: openssl rand -base64 32>
JWT_EXPIRE=7d

# AI
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cloudinary (opcional, per imatges)
CLOUDINARY_CLOUD_NAME=xxxxxx
CLOUDINARY_API_KEY=xxxxxx
CLOUDINARY_API_SECRET=xxxxxx

# Frontend URL (per CORS)
CLIENT_URL=https://grove-fitness.vercel.app
```

### Frontend (`.env.production`)

```bash
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL_PRODUCTION=https://grove-fitness-production.railway.app/api
```

---

## 🧪 Verificació

### 1. Verifica el Backend

```bash
# Test health endpoint
curl https://la-teva-url.railway.app/health

# Hauries de veure:
{
  "status": "OK",
  "timestamp": "2024-12-09T...",
  "groq_configured": true
}
```

### 2. Verifica el Frontend

- Obre l'app o la web
- Intenta fer login
- Comprova que les dades es carreguen

---

## 🔄 Actualitzacions Automàtiques

Tant Railway com Render fan **deploy automàtic** quan fas push a GitHub:

```bash
# Backend
cd backend
# Fes canvis...
git add .
git commit -m "Update backend"
git push

# Railway/Render farà deploy automàticament!
```

```bash
# Frontend (Vercel)
cd frontend
# Fes canvis...
git add .
git commit -m "Update frontend"
git push

# Vercel farà deploy automàticament!
```

---

## 💰 Costos

### Gratis:
- **Railway**: 500h/mes gratis (suficient per 1 app)
- **Render**: 750h/mes gratis
- **MongoDB Atlas**: 512MB gratis
- **Vercel**: Unlimited deployments gratis
- **Expo EAS**: 30 builds/mes gratis

### Si necessites més:
- **Railway**: $5/mes per més recursos
- **Render**: $7/mes per més recursos
- **MongoDB Atlas**: $9/mes per més espai
- **Expo EAS**: $29/mes per unlimited builds

---

## 📝 Resum Ràpid

### Per començar AVUI MATEIX:

1. **Backend a Railway** (10 minuts)
   - Registra't a railway.app
   - Connecta GitHub
   - Afegeix MongoDB
   - Configura variables d'entorn
   - ✅ Backend online!

2. **Frontend** (10 minuts)
   - **Per web**: Deploy a Vercel
   - **Per mòbil**: Build amb EAS
   - Actualitza l'API URL
   - ✅ Frontend online!

**Total: ~20 minuts per tenir tot online! 🎉**

---

## 🆘 Problemes Comuns

### Error: "Cannot connect to MongoDB"
- Verifica que la connection string és correcta
- Comprova que l'IP està permesa a MongoDB Atlas (0.0.0.0/0)
- Verifica que l'usuari de base de dades existeix

### Error: "CORS error"
- Actualitza `CLIENT_URL` al backend amb la URL del frontend
- Verifica que el frontend usa la URL correcta del backend

### Error: "JWT invalid"
- Genera un nou `JWT_SECRET` i actualitza'l al backend
- Fes logout i login de nou a l'app

---

## 📚 Recursos Addicionals

- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [Expo EAS Docs](https://docs.expo.dev/eas/)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [Vercel Docs](https://vercel.com/docs)

---

Fet amb 💚 per l'equip de Grove Fitness
