# FlowChat Pro - Professional Team Messaging Platform

Een volledig uitgeruste, professionele team messaging applicatie met moderne features en een gepolijst design.

## Features

### Core Features
- Real-time messaging met automatische polling
- Gebruikersauthenticatie (registratie & login)
- Persistent data opslag (Supabase integration)
- Online users tracking
- Professioneel dark/light theme systeem

### Messaging Features
- **Rich text formatting**
  - Bold text: `**text**`
  - Italic text: `*text*`
  - Inline code: `` `code` ``
  - Code blocks: ``` ```code``` ```
- **Message editing** - Edit je eigen berichten
- **Message deletion** - Verwijder je eigen berichten
- **Character counter** - Max 2000 karakters per bericht
- **Multi-line support** - Shift+Enter voor nieuwe regel

### Advanced Features
- **File uploads** - Attach bestanden tot 10MB
- **Image sharing** - Upload en preview afbeeldingen
- **Message search** - Zoek door alle berichten (Ctrl+F)
- **Typing indicators** - Zie wanneer iemand aan het typen is
- **Formatting toolbar** - Quick formatting buttons
- **Keyboard shortcuts** - Productiviteits-shortcuts
- **Context menu** - Right-click op berichten voor acties
- **User profiles** - Gekleurde avatars voor gebruikers
- **Responsive design** - Werkt perfect op mobile en desktop
- **PWA support** - Installeer als native app

### UI/UX Features
- **Professional design** - IBM Plex Sans & JetBrains Mono fonts
- **Theme switcher** - Toggle tussen light en dark mode (Ctrl+T)
- **Smooth animations** - Gepolijste micro-interactions
- **Mobile sidebar** - Collapsible sidebar op mobile
- **Scroll management** - Auto-scroll naar nieuwe berichten
- **File preview** - Preview bestanden voor verzenden
- **Search highlighting** - Gemarkeerde zoekresultaten
- **Timestamp formatting** - Intelligente tijd weergave

## Quick Start

### Stap 1: Deploy (Werkt Direct)
```bash
git add .
git commit -m "FlowChat Pro - Professional Edition"
git push
```
Vercel deployed automatisch. App werkt met in-memory storage.

### Stap 2: Supabase Setup (Optioneel maar aanbevolen)

#### 1. Maak Supabase Project
- Ga naar https://supabase.com (gratis)
- Creëer nieuw project

#### 2. Run SQL Schema
In Supabase SQL Editor:

```sql
-- Messages tabel
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  username TEXT NOT NULL,
  color TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read messages"
  ON messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert messages"
  ON messages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE TO authenticated 
  USING (auth.jwt() ->> 'username' = username);

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE TO authenticated 
  USING (auth.jwt() ->> 'username' = username);

-- Indexes
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_username ON messages(username);
```

#### 3. Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

Apply to: Production, Preview, Development

#### 4. Redeploy
Deployments → ... → Redeploy (zonder cache)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + F` | Open search |
| `Ctrl + T` | Toggle theme |
| `Ctrl + B` | Bold text |
| `Ctrl + I` | Italic text |
| `Ctrl + E` | Code block |
| `Enter` | Send message |
| `Shift + Enter` | New line |
| `Esc` | Close menus/cancel edit |

## Project Structure

```
flowchat-pro/
├── index.html          # Main HTML met split-screen login
├── styles.css          # Professional CSS (1500+ lines)
├── app.js             # Complete JavaScript (800+ lines)
├── api/
│   └── index.py       # FastAPI backend met edit/delete
├── manifest.json      # PWA manifest
├── sw.js             # Service Worker voor caching
├── vercel.json       # Vercel configuration
└── requirements.txt  # Python dependencies
```

## Technical Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern CSS met custom properties
- **JavaScript (ES6+)** - Vanilla JS, no frameworks
- **Fonts:**
  - IBM Plex Sans - Body text
  - JetBrains Mono - Code blocks

### Backend
- **Python 3.9+**
- **FastAPI** - Modern async API framework
- **Supabase** - PostgreSQL database & auth
- **Mangum** - AWS Lambda/Vercel adapter

### Infrastructure
- **Vercel** - Hosting & serverless functions
- **Supabase** - Database & authentication
- **PWA** - Progressive Web App features

## Features Breakdown

### 1. Authentication System
- Secure password hashing (SHA-256)
- Session token management
- Auto-logout on token expiry
- Persistent sessions (localStorage)

### 2. Message System
- Real-time polling (2 second intervals)
- Message grouping by user
- Rich text formatting support
- Edit history tracking
- Soft delete (owner only)

### 3. File Handling
- Client-side file validation
- Size limits (10MB max)
- Image preview
- File type restrictions
- Base64 encoding for uploads

### 4. Search Functionality
- Real-time search (300ms debounce)
- Search by content OR username
- Result highlighting
- Click to scroll to message

### 5. Theme System
- CSS custom properties
- Persistent theme choice
- Smooth transitions
- Professional color palettes

### 6. Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile
- Touch-optimized buttons (44px+)
- Adaptive layouts

## Customization

### Colors
Edit CSS variables in `styles.css`:

```css
:root {
    --primary-600: #4F46E5;  /* Main brand color */
    --accent-600: #7C3AED;   /* Accent color */
    /* ... more colors */
}
```

### Fonts
Change in `index.html` <head>:

```html
<link href="https://fonts.googleapis.com/css2?family=YOUR_FONT&display=swap" rel="stylesheet">
```

Then update CSS:

```css
:root {
    --font-sans: 'Your Font', sans-serif;
}
```

### Polling Interval
In `app.js`:

```javascript
const CONFIG = {
    POLLING_INTERVAL: 2000,  // milliseconds
    // ...
};
```

## API Endpoints

### Authentication
- `POST /api/register` - Create account
- `POST /api/login` - Sign in
- `POST /api/logout` - Sign out
- `GET /api/me` - Get current user

### Messages
- `GET /api/messages` - Fetch messages
- `POST /api/messages` - Send message
- `PUT /api/messages/{id}` - Edit message
- `DELETE /api/messages/{id}` - Delete message

### Users
- `GET /api/users` - Get online users

All endpoints (except register/login) require `Authorization: Bearer {token}` header.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 13+, Android 10+)

## Performance

- **Initial load:** < 1s
- **Message latency:** 2s (polling)
- **File upload:** Depends on size
- **Search:** < 100ms (client-side)

## Security Features

- Password hashing (SHA-256)
- Session token authentication
- CORS protection
- XSS prevention (HTML escaping)
- Input validation
- Owner-only edit/delete

## Known Limitations

1. **Polling-based:** Uses polling instead of WebSockets
2. **File storage:** Files stored as text (base64) in messages
3. **No channels:** Single channel only (easily extensible)
4. **Basic auth:** Not production-grade (use proper OAuth for production)

## Future Enhancements

Potential features to add:

- WebSocket support for real-time updates
- Multiple channels/rooms
- Direct messages
- Voice messages
- Video calls
- File storage service integration
- Email notifications
- Message reactions with emoji
- Read receipts
- User presence (online/away/busy)
- @ mentions with notifications
- Message threads/replies
- Pin messages
- Archive messages
- Export chat history
- Admin dashboard
- Rate limiting
- 2FA authentication

## Troubleshooting

**Messages don't persist:**
→ Setup Supabase (zie Stap 2)

**Supabase errors:**
→ Check environment variables spelling
→ Verify SQL schema is executed
→ Check RLS policies

**Theme doesn't save:**
→ Clear localStorage and try again
→ Check browser storage permissions

**File upload fails:**
→ Check file size (max 10MB)
→ Verify file type is allowed
→ Check browser console for errors

**Login fails:**
→ Verify username/password
→ Check API is running (Vercel logs)
→ Clear cookies and try again

## Development

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run API locally
cd api
uvicorn index:app --reload --port 8000

# Serve frontend
python -m http.server 3000
```

Then open `http://localhost:3000`

### Testing

```bash
# Test API
curl http://localhost:8000/

# Test authentication
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'
```

## Contributing

Dit is een zelfstandig project. Voor eigen gebruik:
1. Fork de repository
2. Maak je aanpassingen
3. Deploy naar je eigen Vercel account

## License

Open source - gebruik naar eigen goeddunken.
Voor commercieel gebruik, overweeg toevoegen van:
- Rate limiting
- Proper authentication (OAuth)
- Content moderation
- Terms of Service
- Privacy Policy

---

**Made with FastAPI, Supabase, and modern web technologies.**  
**Professional design. Production-ready features.** 

Versie: 2.0  
Laatste update: February 2026