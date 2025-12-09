# ⚡ Grove Fitness - Guia Ràpida de Deployment

**Vols tenir l'app online en 20 minuts? Segueix aquests passos! 🚀**

## 🎯 Opció Recomanada: Railway + Vercel

### 1️⃣ Backend a Railway (10 min)

1. Ves a [railway.app](https://railway.app) i registra't amb GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Selecciona `grove-fitness` → carpeta `/backend`
4. Afegeix MongoDB: Click "+ New" → "Database" → "MongoDB"
5. Configura variables d'entorn al servei backend:
   ```
   NODE_ENV=production
   MONGODB_URI=${MONGO_URL}
   JWT_SECRET=la-teva-clau-secreta-aqui
   JWT_EXPIRE=7d
   GROQ_API_KEY=gsk_la-teva-api-key-de-groq
   CLIENT_URL=https://grove-fitness.vercel.app
   ```
6. Railway farà deploy automàticament!
7. Copia la URL: `https://xxxx.railway.app`

### 2️⃣ Frontend a Vercel (10 min)

1. Ves a [vercel.com](https://vercel.com) i registra't amb GitHub
2. Click "Add New" → "Project"
3. Selecciona `grove-fitness` → Root Directory: `frontend`
4. Framework: "Other"
5. Build Command: `npx expo export -p web`
6. Output Directory: `dist`
7. Variables d'entorn:
   ```
   EXPO_PUBLIC_ENV=production
   EXPO_PUBLIC_API_URL_PRODUCTION=https://xxxx.railway.app/api
   ```
   (Reemplaça amb la teva URL de Railway)
8. Click "Deploy"!

### 3️⃣ Verifica (1 min)

1. Backend: Obre `https://xxxx.railway.app/health`
   - Hauries de veure: `{"status":"OK"}`
2. Frontend: Obre `https://grove-fitness.vercel.app`
   - Intenta fer login!

## ✅ Fet!

Ara cada vegada que facis `git push`, es farà deploy automàticament! 🎉

---

## 📱 També vols apps natives?

### iOS + Android amb Expo EAS

```bash
cd frontend
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile production
```

**Més detalls:** Consulta [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🆘 Problemes?

1. **Backend no funciona?**
   - Verifica que `MONGODB_URI` està configurat
   - Comprova els logs a Railway: Project → Backend → Logs

2. **Frontend no connecta?**
   - Verifica que `EXPO_PUBLIC_API_URL_PRODUCTION` té la URL correcta del backend
   - Comprova la consola del navegador (F12)

3. **CORS errors?**
   - Actualitza `CLIENT_URL` al backend amb la URL de Vercel

---

**📚 Guia completa:** [DEPLOYMENT.md](DEPLOYMENT.md)
