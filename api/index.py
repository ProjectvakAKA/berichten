from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional
import uuid
import os
from supabase import create_client, Client
from mangum import Mangum
import hashlib
import secrets

app = FastAPI()

# CORS configuratie
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuratie
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Initialiseer Supabase client (optioneel)
supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except:
        pass

# In-memory storage (fallback als Supabase niet is ingesteld)
messages_store = []
users_store = {}  # username -> {password_hash, color, token}
sessions_store = {}  # token -> username

# Security
security = HTTPBearer(auto_error=False)

# Models
class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[EmailStr] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class Message(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: str
    content: str
    username: str
    color: str
    timestamp: str

# Helper functions
def hash_password(password: str) -> str:
    """Simple password hashing (gebruik bcrypt voor productie)"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    """Genereer een random session token"""
    return secrets.token_urlsafe(32)

def get_random_color() -> str:
    """Genereer random gebruikerskleur"""
    colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", 
              "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52C41A",
              "#E74C3C", "#3498DB", "#2ECC71", "#F39C12", "#9B59B6"]
    import random
    return random.choice(colors)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify authentication token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = credentials.credentials
    username = sessions_store.get(token)
    
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return username

# Routes
@app.get("/")
async def root():
    return {"status": "FlowChat API is running", "auth": "enabled"}

@app.post("/api/register")
async def register(request: RegisterRequest):
    """Registreer nieuwe gebruiker"""
    username = request.username.strip()
    password = request.password
    
    if not username or len(username) < 3:
        raise HTTPException(
            status_code=400, 
            detail="Username moet minimaal 3 karakters zijn"
        )
    
    if len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Wachtwoord moet minimaal 6 karakters zijn"
        )
    
    # Check of gebruiker al bestaat
    if username in users_store:
        raise HTTPException(
            status_code=400,
            detail="Gebruikersnaam is al in gebruik"
        )
    
    # Supabase auth (indien beschikbaar)
    if supabase and request.email:
        try:
            response = supabase.auth.sign_up({
                "email": request.email,
                "password": password,
                "options": {
                    "data": {
                        "username": username
                    }
                }
            })
        except Exception as e:
            pass  # Fallback naar lokale auth
    
    # Maak gebruiker aan
    password_hash = hash_password(password)
    color = get_random_color()
    token = generate_token()
    
    users_store[username] = {
        "password_hash": password_hash,
        "color": color,
        "created_at": datetime.now().isoformat()
    }
    
    sessions_store[token] = username
    
    return {
        "username": username,
        "color": color,
        "token": token,
        "message": "Account succesvol aangemaakt"
    }

@app.post("/api/login")
async def login(request: LoginRequest):
    """Login gebruiker"""
    username = request.username.strip()
    password = request.password
    
    if username not in users_store:
        raise HTTPException(
            status_code=401,
            detail="Ongeldige gebruikersnaam of wachtwoord"
        )
    
    user = users_store[username]
    password_hash = hash_password(password)
    
    if user["password_hash"] != password_hash:
        raise HTTPException(
            status_code=401,
            detail="Ongeldige gebruikersnaam of wachtwoord"
        )
    
    # Genereer nieuwe token
    token = generate_token()
    sessions_store[token] = username
    
    return {
        "username": username,
        "color": user["color"],
        "token": token,
        "message": "Succesvol ingelogd"
    }

@app.post("/api/logout")
async def logout(username: str = Depends(get_current_user), 
                 credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout gebruiker"""
    token = credentials.credentials
    if token in sessions_store:
        del sessions_store[token]
    
    return {"message": "Succesvol uitgelogd"}

@app.get("/api/me")
async def get_me(username: str = Depends(get_current_user)):
    """Haal huidige gebruiker op"""
    user = users_store.get(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "username": username,
        "color": user["color"]
    }

@app.post("/api/messages")
async def send_message(message: Message, username: str = Depends(get_current_user)):
    """Nieuw bericht versturen (requires authentication)"""
    if not message.content or len(message.content.strip()) == 0:
        raise HTTPException(status_code=400, detail="Bericht mag niet leeg zijn")
    
    if len(message.content) > 500:
        raise HTTPException(status_code=400, detail="Bericht mag maximaal 500 karakters zijn")
    
    msg_id = str(uuid.uuid4())
    user_color = users_store.get(username, {}).get("color", "#6C757D")
    
    new_message = {
        "id": msg_id,
        "content": message.content.strip(),
        "username": username,
        "color": user_color,
        "timestamp": datetime.now().isoformat()
    }
    
    # Supabase storage (primary)
    if supabase:
        try:
            response = supabase.table("messages").insert(new_message).execute()
            # If Supabase succeeds, also update in-memory for quick access
            messages_store.append(new_message)
            if len(messages_store) > 100:
                messages_store.pop(0)
            return new_message
        except Exception as e:
            # Log error but continue with in-memory storage
            print(f"Supabase insert error: {e}")
    
    # Fallback to in-memory storage
    messages_store.append(new_message)
    
    # Beperk tot laatste 100 berichten
    if len(messages_store) > 100:
        messages_store.pop(0)
    
    return new_message

@app.get("/api/messages")
async def get_messages(since: Optional[str] = None, username: str = Depends(get_current_user)):
    """Berichten ophalen (requires authentication)"""
    
    # Try Supabase first
    if supabase:
        try:
            if since:
                response = supabase.table("messages")\
                    .select("*")\
                    .gt("timestamp", since)\
                    .order("timestamp", desc=False)\
                    .limit(100)\
                    .execute()
            else:
                response = supabase.table("messages")\
                    .select("*")\
                    .order("timestamp", desc=False)\
                    .limit(100)\
                    .execute()
            
            if response.data:
                # Update in-memory cache
                messages_store.clear()
                messages_store.extend(response.data)
                return {"messages": response.data}
        except Exception as e:
            print(f"Supabase fetch error: {e}")
            # Fall through to in-memory
    
    # Fallback to in-memory storage
    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            filtered_messages = [
                msg for msg in messages_store 
                if datetime.fromisoformat(msg["timestamp"]) > since_dt
            ]
            return {"messages": filtered_messages}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid timestamp format")
    
    return {"messages": messages_store}

@app.get("/api/users")
async def get_users(username: str = Depends(get_current_user)):
    """Actieve gebruikers ophalen (requires authentication)"""
    active_users = [
        {"username": uname, "color": users_store[uname]["color"]}
        for uname in sessions_store.values()
        if uname in users_store
    ]
    
    # Deduplicate
    seen = set()
    unique_users = []
    for user in active_users:
        if user["username"] not in seen:
            seen.add(user["username"])
            unique_users.append(user)
    
    return {"users": unique_users}

# Vercel handler met Mangum
handler = Mangum(app)
