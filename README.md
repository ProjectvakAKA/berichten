# 📱 FlowChat - Mobile Optimized + Supabase Ready

Complete real-time messaging app met authenticatie, geoptimaliseerd voor mobiel!

## ✨ Nieuwe Features

### 📱 MOBIEL OPTIMALISATIES:
- ✅ **Touch-optimized** - Alle knoppen 44px+ (Apple guidelines)
- ✅ **PWA Support** - Installeerbaar als app op je telefoon!
- ✅ **Pull-to-refresh** - Trek naar beneden voor nieuwe berichten
- ✅ **Responsive design** - Perfect op alle schermgroottes
- ✅ **No zoom on focus** - Invoervelden zoomen niet in op iOS
- ✅ **Safe area support** - Werkt met notches en home indicators
- ✅ **Offline caching** - Statische assets gecached
- ✅ **Landscape mode** - Optimaal ook horizontaal

### 🔐 AUTHENTICATIE:
- ✅ Gebruikersregistratie met wachtwoord
- ✅ Secure login met tokens
- ✅ Auto-logout bij expiry
- ✅ Session persistence

### 🗄️ DATABASE:
- ✅ Supabase integratie
- ✅ Permanente opslag
- ✅ Real-time sync
- ✅ Fallback naar in-memory

## 🚀 SNELLE START

### Stap 1: Deploy (Werkt Direct!)
```bash
git add .
git commit -m "FlowChat mobile-optimized"
git push
```
Vercel deployed automatisch. App werkt, maar data is tijdelijk (zie Stap 3 voor permanente opslag).

### Stap 2: Installeer als App
**Op iPhone/iPad:**
1. Open je Vercel URL in Safari
2. Tik "Deel" knop → "Zet op beginscherm"
3. Je hebt nu een FlowChat app! 📱

**Op Android:**
1. Open URL in Chrome
2. "Zet op beginscherm" of "Installeer app"

### Stap 3: Supabase (Permanente Data)

**📋 WAT JE NODIG HEBT:**

1. **Maak Supabase project** op https://supabase.com (gratis)

2. **Haal je credentials op:**
   - Ga naar Settings ⚙️ → API
   - Kopieer:
     * **Project URL:** `https://xxxxx.supabase.co`
     * **anon public key:** `eyJhbGci...` (lange string)

3. **Run deze SQL** in Supabase SQL Editor:
   ```sql
   CREATE TABLE messages (
     id TEXT PRIMARY KEY,
     content TEXT NOT NULL,
     username TEXT NOT NULL,
     color TEXT NOT NULL,
     timestamp TIMESTAMPTZ DEFAULT NOW()
   );
   
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Authenticated users can read messages"
     ON messages FOR SELECT TO authenticated USING (true);
   
   CREATE POLICY "Authenticated users can insert messages"
     ON messages FOR INSERT TO authenticated WITH CHECK (true);
   
   CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
   ```

4. **Voeg credentials toe aan Vercel:**
   - Vercel Dashboard → Je project → Settings → Environment Variables
   - Klik "Add New"
   
   **Variable 1:**
   ```
   Key:   SUPABASE_URL
   Value: https://xxxxx.supabase.co  (jouw URL!)
   ✓ Production ✓ Preview ✓ Development
   ```
   
   **Variable 2:**
   ```
   Key:   SUPABASE_ANON_KEY
   Value: eyJhbGci...  (jouw key!)
   ✓ Production ✓ Preview ✓ Development
   ```

5. **Redeploy** (Deployments → ... → Redeploy, ZONDER cache)

✅ **Klaar!** Data is nu permanent.

**Gedetailleerde guide:** Zie `SUPABASE-SETUP.txt`

## 📁 Project Structuur

```
flowchat-auth/
├── index.html          # Frontend (PWA meta tags)
├── styles.css          # Mobile-optimized CSS
├── app.js             # JavaScript + pull-to-refresh
├── manifest.json      # PWA manifest
├── sw.js             # Service Worker
├── api/
│   └── index.py       # FastAPI + Supabase
├── vercel.json
└── requirements.txt
```

## 📱 Mobile Features

### Touch Optimizations
- Minimum 44px touch targets
- Tap scale feedback
- No iOS zoom (16px font)
- Smooth scrolling

### PWA Features
- Install als app
- Offline support
- Standalone mode
- Safe area support

### Pull-to-Refresh
Trek chat naar beneden (100px) → Herlaadt berichten

## 🔧 Customization

### Kleuren
In `styles.css`:
```css
:root {
    --primary: #6366f1;
    --secondary: #ec4899;
}
```

### Polling Interval
In `app.js`:
```javascript
setInterval(() => {...}, 2000); // 2 seconden
```

## 🐛 Troubleshooting

**App installeert niet (iOS):**
- Gebruik Safari (niet Chrome!)
- Moet HTTPS zijn (Vercel auto)

**Supabase werkt niet:**
- Check variable names: `SUPABASE_URL` en `SUPABASE_ANON_KEY` (exact!)
- Redeploy zonder cache
- Check Vercel Function Logs

**Berichten verdwijnen:**
- Setup Supabase (zie Stap 3)
- Zonder Supabase = tijdelijke opslag

## 📊 Without vs With Supabase

| Feature | Zonder | Met Supabase |
|---------|--------|--------------|
| Setup tijd | 0 min | 10 min |
| Data persist | ❌ | ✅ |
| Kosten | Gratis | Gratis |
| Schaalbaar | Beperkt | Auto-scale |
| Aanbeveling | Test | Productie |

## 🎯 Next Steps

1. ✅ Test app zonder Supabase
2. ✅ Setup Supabase voor permanente data
3. 🚀 Invite vrienden!
4. 💡 Features toevoegen:
   - User avatars
   - Emoji reactions
   - Channels/rooms
   - File sharing

---

**Made with FastAPI, Supabase, moderne web tech.**
**Optimized for mobile. Production ready.** 🚀📱
