# 💬 FlowChat - Vercel Ready

## 🚀 Deploy naar Vercel (VASTE VERSIE)

### Stap 1: Push naar GitHub
```bash
git init
git add .
git commit -m "FlowChat app"
git branch -M main
git remote add origin [JOUW-REPO-URL]
git push -u origin main
```

### Stap 2: Deploy op Vercel
1. Ga naar **https://vercel.com**
2. Klik **"Add New Project"**
3. Selecteer je **GitHub repository**
4. Vercel detecteert automatisch de settings
5. Klik **"Deploy"**

✅ **Klaar!** Je app is live binnen 1-2 minuten.

## 📁 Project Structuur (ROOT LEVEL)

```
flowchat-fixed/
├── index.html         # Frontend (ROOT!)
├── styles.css         # Styling (ROOT!)
├── app.js            # JavaScript (ROOT!)
├── api/
│   └── index.py      # Backend API
├── vercel.json       # Routing config
├── requirements.txt  # Python deps
└── .gitignore
```

**BELANGRIJK:** De HTML/CSS/JS files staan nu in de ROOT, niet in een `public/` folder. Dit werkt beter voor Vercel.

## 🔧 Als het nog steeds niet werkt

### Check deze dingen:

1. **File structuur correct?**
   - `index.html` in de ROOT ✓
   - `api/index.py` bestaat ✓
   - `vercel.json` in de ROOT ✓

2. **In Vercel Dashboard:**
   - Ga naar je project
   - Settings → General
   - **Framework Preset:** Other
   - **Root Directory:** ./
   - **Build Command:** (leeg laten)
   - **Output Directory:** (leeg laten)

3. **Deploy opnieuw:**
   - Deployments tab
   - Klik op de 3 dots bij laatste deployment
   - "Redeploy"

4. **Check Logs:**
   - Open deployment in Vercel
   - Klik "View Function Logs"
   - Check voor errors

## 🧪 Test URLs
Na deployment test deze URLs:

- **Frontend:** `https://jouw-app.vercel.app/`
- **API Test:** `https://jouw-app.vercel.app/api/messages`
- **API Docs:** `https://jouw-app.vercel.app/docs` (werkt niet op Vercel, alleen lokaal)

## 🆘 Troubleshooting

### 404 Error op /
**Oplossing:** Zorg dat `index.html` in de ROOT staat, NIET in een `public/` folder

### 500 Error op /api
**Oplossing:** Check Function Logs in Vercel voor Python errors

### CORS Errors
**Oplossing:** Al geconfigureerd in `api/index.py` met:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    ...
)
```

### API verbindt niet
**Oplossing:** Check `app.js` regel 2-3:
```javascript
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000'
    : ''; // Gebruikt relative paths op Vercel
```

## 💡 Features

- ✨ Real-time messaging
- 🎨 Modern glassmorphism design
- 📱 Responsive
- 🌈 Unieke gebruikerskleuren
- ⚡ Serverless (Vercel Functions)
- 💾 In-memory storage (voor demo)

## 🔄 Updates Pushen

```bash
git add .
git commit -m "Updates"
git push
```

Vercel deploy automatisch! 🚀

---

**Problemen?** Check de Vercel Function Logs of open een issue.
