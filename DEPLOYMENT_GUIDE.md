# FlowChat Pro - Quick Deployment Guide

## Wat Is Er Nieuw?

Je FlowChat app is nu een **volledige professionele messaging platform** met:

### Features Toegevoegd:
- **Rich text formatting** (bold, italic, code)
- **Message editing & deletion**
- **File uploads** (tot 10MB)
- **Image sharing** met preview
- **Message search** (Ctrl+F)
- **Theme switcher** (light/dark mode)
- **Typing indicators**
- **Keyboard shortcuts**
- **Context menu** (right-click messages)
- **Professional UI** (IBM Plex Sans font)
- **Formatting toolbar**
- **User profiles** met avatars
- **Mobile responsive**
- **Better animations**

### UI Verbeteringen:
- Split-screen login page
- Modern gradient design
- Professional color palette
- Smooth transitions
- Better spacing
- Polished interactions

---

## Deploy Instructies

### Option 1: Direct Deploy (Snelste)

```bash
# Vervang je oude bestanden met de nieuwe
git add .
git commit -m "Update to FlowChat Pro v2.0"
git push
```

Vercel deployed automatisch. **Klaar!**

### Option 2: Clean Deploy (Aanbevolen)

```bash
# Backup oude files (optioneel)
mkdir backup
cp *.html *.css *.js backup/

# Verplaats nieuwe files
# (Zorg dat je de api/ folder hebt!)

# Deploy
git add .
git commit -m "FlowChat Pro v2.0 - Professional Edition"
git push
```

---

## Vercel Environment Variables

Als je Supabase gebruikt, check of deze variables nog kloppen:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

**Belangrijk:** Na toevoegen van nieuwe variables, moet je **redeploy** (zonder cache).

---

## Supabase Database Update

Als je al Supabase gebruikt, update je database schema:

```sql
-- Add nieuwe columns voor message editing
ALTER TABLE messages 
ADD COLUMN edited BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMPTZ;

-- Update policies voor edit/delete
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE TO authenticated 
  USING (auth.jwt() ->> 'username' = username);

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE TO authenticated 
  USING (auth.jwt() ->> 'username' = username);
```

---

## Test Checklist

Na deployment, test het volgende:

### Basic Features:
- [ ] Registreren met email werkt
- [ ] Inloggen werkt
- [ ] Berichten versturen werkt
- [ ] Berichten worden persistent opgeslagen

### New Features:
- [ ] Bold text: `**text**` werkt
- [ ] Italic text: `*text*` werkt
- [ ] Code: `` `code` `` werkt
- [ ] Message editing (click edit button) werkt
- [ ] Message deletion werkt
- [ ] Theme switcher (sun icon) werkt
- [ ] Search (Ctrl+F) werkt
- [ ] Formatting toolbar buttons werken
- [ ] File upload button werkt

### UI:
- [ ] Login page ziet er professioneel uit
- [ ] Sidebar toont online users
- [ ] Messages hebben avatars
- [ ] Timestamps zijn goed geformateerd
- [ ] Mobile view werkt (< 768px)

---

## Keyboard Shortcuts

Informeer je gebruikers:

```
Ctrl + F     →  Search messages
Ctrl + T     →  Toggle theme
Ctrl + B     →  Bold text
Ctrl + I     →  Italic text
Ctrl + E     →  Code block
Enter        →  Send message
Shift+Enter  →  New line
Esc          →  Cancel/Close
```

Er is ook een shortcuts modal (user menu → Keyboard Shortcuts).

---

## File Structure Check

Zorg dat je file structure er zo uitziet:

```
flowchat-pro/
├── index.html          ✓
├── styles.css          ✓
├── app.js              ✓
├── manifest.json       ✓
├── sw.js              ✓
├── vercel.json        ✓
├── requirements.txt   ✓
├── README.md          ✓
└── api/
    └── index.py       ✓
```

**Belangrijk:** De `api/` folder moet er zijn!

---

## Common Issues

### "Email is required" error
→ Dit is opgelost. Email is nu verplicht bij registratie.

### Theme doesn't save
→ Check of localStorage werkt in je browser
→ Disable "Block all cookies" setting

### Messages don't show up
→ Check Vercel function logs
→ Verify Supabase connection
→ Try without Supabase (in-memory mode)

### File upload doesn't work
→ Max 10MB per file
→ Check browser console for errors
→ Backend might need file storage setup

### Formatting buttons don't work
→ Clear browser cache
→ Check if app.js loaded correctly
→ Try Ctrl+Shift+R (hard refresh)

---

## Performance Tips

### Optimize for Large Teams:

1. **Increase polling interval** (in `app.js`):
   ```javascript
   POLLING_INTERVAL: 3000  // Was 2000
   ```

2. **Limit message history**:
   ```javascript
   // In backend (index.py):
   .limit(50)  // Was 100
   ```

3. **Add pagination**:
   ```javascript
   // Load older messages on scroll
   ```

---

## Next Steps

### Immediate:
1. Deploy de nieuwe versie
2. Test alle features
3. Informeer je team over nieuwe features

### Short Term:
1. Customizeer kleuren (zie README)
2. Voeg je logo toe
3. Update brand naming

### Long Term:
1. Add multiple channels
2. Implement direct messages
3. Add voice/video calls
4. Setup proper file storage (S3/Cloudflare)

---

## Support

**Deployment problemen?**
- Check Vercel deployment logs
- Verify all files are pushed
- Check function logs for errors

**Feature vragen?**
- Zie volledige README.md
- Check app.js comments
- Review API endpoints

**Wil je meer features?**
- Zie "Future Enhancements" in README
- Plan je roadmap
- Prioriteer based on user feedback

---

**Succes met je upgrade naar FlowChat Pro! 🚀**

Dit is nu een **echte professionele messaging app** waar je trots op kan zijn.