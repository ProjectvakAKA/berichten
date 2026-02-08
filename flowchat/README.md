# 💬 FlowChat - Real-time Messaging App

Een moderne, real-time messaging applicatie gebouwd met FastAPI en vanilla JavaScript. Klaar om te deployen op Vercel!

## ✨ Features

- **Real-time messaging** met long polling
- **Modern UI design** met glassmorphism en animaties
- **Gebruikersbeheer** met unieke kleuren
- **Responsive design** voor desktop en mobiel
- **Character count** en message validation
- **Auto-scroll** naar nieuwe berichten
- **Online user counter**
- **Serverless ready** voor Vercel

## 🚀 Lokaal Testen in PyCharm

### Vereisten
- Python 3.9 of hoger
- PyCharm (of andere IDE)

### Stap 1: Project Setup
1. Open de project folder in PyCharm
2. Maak een virtual environment aan:
   ```bash
   python -m venv venv
   ```

3. Activeer de virtual environment:
   - **Windows**: `venv\Scripts\activate`
   - **Mac/Linux**: `source venv/bin/activate`

4. Installeer dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Stap 2: Backend Starten
1. Open een terminal in PyCharm
2. Navigeer naar de project root
3. Start de FastAPI server:
   ```bash
   uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
   ```

4. De API draait nu op: `http://localhost:8000`
5. API docs beschikbaar op: `http://localhost:8000/docs`

### Stap 3: Frontend Testen
1. Open `public/index.html` in je browser
2. Of gebruik een local server:
   ```bash
   # Met Python
   cd public
   python -m http.server 3000
   ```
3. Open `http://localhost:3000` in je browser

### Stap 4: Testen
1. Open meerdere browser tabs/windows
2. Log in met verschillende gebruikersnamen
3. Start met chatten!

## 📦 Deployen naar Vercel

### Optie 1: Via Vercel CLI (Aanbevolen)

1. **Installeer Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login bij Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy je project**:
   ```bash
   vercel
   ```

4. Volg de prompts:
   - Set up and deploy? **Y**
   - Which scope? **[Kies je account]**
   - Link to existing project? **N**
   - What's your project's name? **flowchat** (of een andere naam)
   - In which directory is your code located? **./** (druk enter)

5. Je app is nu live! Vercel geeft je een URL zoals:
   `https://flowchat-xyz123.vercel.app`

6. Voor productie deployment:
   ```bash
   vercel --prod
   ```

### Optie 2: Via Vercel Dashboard

1. Ga naar [vercel.com](https://vercel.com)
2. Log in of maak een account aan
3. Klik op "Add New Project"
4. Importeer je Git repository (of upload de folder)
5. Vercel detecteert automatisch de configuratie
6. Klik op "Deploy"

### Optie 3: Via GitHub

1. Push je code naar GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin [je-repo-url]
   git push -u origin main
   ```

2. Ga naar [vercel.com](https://vercel.com)
3. Klik "Import Project"
4. Selecteer je GitHub repository
5. Klik "Deploy"

## 🔧 Configuratie

### Environment Variables (Optioneel)
Voor productie kan je environment variables toevoegen in Vercel:

1. Ga naar je project in Vercel Dashboard
2. Settings → Environment Variables
3. Voeg toe (indien nodig):
   - `PYTHON_VERSION=3.9`
   - Database credentials (indien je een database toevoegt)

### Database Upgrade (Optioneel)
De huidige app gebruikt in-memory storage. Voor productie:

**Optie A: Vercel KV (Redis)**
```python
# Installeer: pip install vercel-kv
from vercel_kv import kv

await kv.set('messages', messages_list)
messages = await kv.get('messages')
```

**Optie B: Vercel Postgres**
```python
# Installeer: pip install psycopg2-binary
import psycopg2

conn = psycopg2.connect(os.getenv('POSTGRES_URL'))
```

## 📁 Project Structuur

```
flowchat/
├── api/
│   └── index.py          # FastAPI backend
├── public/
│   ├── index.html        # Frontend HTML
│   ├── styles.css        # Styling
│   └── app.js            # JavaScript logic
├── vercel.json           # Vercel configuratie
├── requirements.txt      # Python dependencies
└── README.md            # Deze file
```

## 🛠️ Technische Details

### Backend (FastAPI)
- **Framework**: FastAPI (serverless compatible)
- **API Endpoints**:
  - `POST /api/join` - Gebruiker aanmelden
  - `POST /api/messages` - Bericht versturen
  - `GET /api/messages` - Berichten ophalen
  - `GET /api/users` - Actieve gebruikers

### Frontend
- **Vanilla JavaScript** (geen frameworks)
- **Long Polling** voor real-time updates
- **LocalStorage** voor sessie persistentie
- **Responsive Design** met CSS Grid/Flexbox

### Styling
- **Fonts**: Syne (headers), Instrument Sans (body)
- **Design**: Glassmorphism met animaties
- **Dark theme** met gradient backgrounds
- **CSS Variables** voor eenvoudige customization

## 🎨 Customization

### Kleuren Aanpassen
Bewerk CSS variabelen in `public/styles.css`:

```css
:root {
    --primary: #6366f1;      /* Primaire kleur */
    --secondary: #ec4899;    /* Secondary kleur */
    --accent: #14b8a6;       /* Accent kleur */
    --background: #0f0f23;   /* Achtergrond */
}
```

### Polling Interval Aanpassen
In `public/app.js`:

```javascript
pollingInterval = setInterval(async () => {
    // ...
}, 2000); // Verander 2000 naar gewenste ms
```

### Maximum Berichten
In `api/index.py`:

```python
# Beperk tot laatste 100 berichten
if len(messages_store) > 100:  # Verander dit getal
    messages_store.pop(0)
```

## 🐛 Troubleshooting

### Backend start niet
```bash
# Check Python versie
python --version  # Moet 3.9+ zijn

# Herinstalleer dependencies
pip install --upgrade -r requirements.txt
```

### Frontend verbindt niet met backend
1. Check of backend draait op `http://localhost:8000`
2. Open browser console (F12) voor errors
3. Check CORS settings in `api/index.py`

### Vercel deployment faalt
1. Check `vercel.json` syntax
2. Verifieer `requirements.txt` is aanwezig
3. Check Vercel logs in dashboard

## 📝 Licentie

Dit project is open source en beschikbaar onder de MIT licentie.

## 🙌 Credits

Gemaakt met FastAPI, moderne web technologieën en liefde voor design.

---

**Veel plezier met je messaging app!** 🚀

Voor vragen of problemen, check de Vercel documentatie of FastAPI docs.
