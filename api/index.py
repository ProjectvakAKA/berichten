from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
import uuid
import os
import hashlib
import secrets
import json
from pathlib import Path

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
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Supabase init failed: {e}")

# Persistent storage paths (gebruik /tmp voor Vercel serverless)
STORAGE_DIR = Path("/tmp/flowchat")
STORAGE_DIR.mkdir(exist_ok=True)
USERS_FILE = STORAGE_DIR / "users.json"
SESSIONS_FILE = STORAGE_DIR / "sessions.json"
MESSAGES_FILE = STORAGE_DIR / "messages.json"

# Session expiry time (24 hours)
SESSION_EXPIRY_HOURS = 24

# Security
security = HTTPBearer(auto_error=False)

# Models
class RegisterRequest(BaseModel):
    username: str
    password: str
    email: EmailStr

class LoginRequest(BaseModel):
    username: str
    password: str

class Message(BaseModel):
    content: str

class MessageUpdate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: str
    content: str
    username: str
    color: str
    timestamp: str
    edited: Optional[bool] = False

# Helper functions for persistence
def load_json(filepath: Path, default=None):
    """Load JSON from file with fallback"""
    if default is None:
        default = {}
    try:
        if filepath.exists():
            with open(filepath, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
    return default

def save_json(filepath: Path, data):
    """Save JSON to file"""
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving {filepath}: {e}")

def get_users():
    """Get users from storage"""
    return load_json(USERS_FILE, {})

def save_users(users):
    """Save users to storage"""
    save_json(USERS_FILE, users)

def get_sessions():
    """Get sessions from storage, removing expired ones"""
    sessions = load_json(SESSIONS_FILE, {})
    now = datetime.now()
    
    # Remove expired sessions
    valid_sessions = {}
    for token, session_data in sessions.items():
        try:
            expires_at = datetime.fromisoformat(session_data['expires_at'])
            if expires_at > now:
                valid_sessions[token] = session_data
        except:
            pass
    
    # Save cleaned sessions if we removed any
    if len(valid_sessions) != len(sessions):
        save_sessions(valid_sessions)
    
    return valid_sessions

def save_sessions(sessions):
    """Save sessions to storage"""
    save_json(SESSIONS_FILE, sessions)

def get_messages():
    """Get messages from storage"""
    if supabase:
        return []  # Use Supabase for messages
    return load_json(MESSAGES_FILE, [])

def save_messages(messages):
    """Save messages to storage"""
    if not supabase:
        save_json(MESSAGES_FILE, messages)

def hash_password(password: str) -> str:
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    """Generate a random session token"""
    return secrets.token_urlsafe(32)

def get_random_color() -> str:
    """Generate random user color"""
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
    sessions = get_sessions()
    
    session_data = sessions.get(token)
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Check if session is expired
    try:
        expires_at = datetime.fromisoformat(session_data['expires_at'])
        if expires_at <= datetime.now():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired"
            )
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session"
        )
    
    return session_data['username']

# Routes
@app.get("/")
async def root():
    return {
        "status": "FlowChat Pro API is running", 
        "version": "2.1", 
        "auth": "enabled",
        "storage": "file-based" if not supabase else "supabase"
    }

@app.post("/api/register")
async def register(request: RegisterRequest):
    """Register new user"""
    username = request.username.strip()
    password = request.password
    email = request.email
    
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
    
    users = get_users()
    
    # Check if user already exists
    if username in users:
        raise HTTPException(
            status_code=400,
            detail="Gebruikersnaam is al in gebruik"
        )
    
    # Supabase auth (optional)
    if supabase:
        try:
            response = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "username": username
                    }
                }
            })
        except Exception as e:
            print(f"Supabase auth failed: {e}")
    
    # Create user
    password_hash = hash_password(password)
    color = get_random_color()
    token = generate_token()
    
    users[username] = {
        "password_hash": password_hash,
        "color": color,
        "email": email,
        "created_at": datetime.now().isoformat()
    }
    save_users(users)
    
    # Create session
    sessions = get_sessions()
    sessions[token] = {
        "username": username,
        "expires_at": (datetime.now() + timedelta(hours=SESSION_EXPIRY_HOURS)).isoformat()
    }
    save_sessions(sessions)
    
    return {
        "username": username,
        "color": color,
        "token": token,
        "message": "Account succesvol aangemaakt"
    }

@app.post("/api/login")
async def login(request: LoginRequest):
    """Login user"""
    username = request.username.strip()
    password = request.password
    
    users = get_users()
    
    if username not in users:
        raise HTTPException(
            status_code=401,
            detail="Ongeldige gebruikersnaam of wachtwoord"
        )
    
    user = users[username]
    password_hash = hash_password(password)
    
    if user["password_hash"] != password_hash:
        raise HTTPException(
            status_code=401,
            detail="Ongeldige gebruikersnaam of wachtwoord"
        )
    
    # Generate new token
    token = generate_token()
    sessions = get_sessions()
    sessions[token] = {
        "username": username,
        "expires_at": (datetime.now() + timedelta(hours=SESSION_EXPIRY_HOURS)).isoformat()
    }
    save_sessions(sessions)
    
    return {
        "username": username,
        "color": user["color"],
        "token": token,
        "message": "Succesvol ingelogd"
    }

@app.post("/api/logout")
async def logout(username: str = Depends(get_current_user), 
                 credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user"""
    token = credentials.credentials
    sessions = get_sessions()
    
    if token in sessions:
        del sessions[token]
        save_sessions(sessions)
    
    return {"message": "Succesvol uitgelogd"}

@app.get("/api/me")
async def get_me(username: str = Depends(get_current_user)):
    """Get current user"""
    users = get_users()
    user = users.get(username)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "username": username,
        "color": user["color"]
    }

@app.post("/api/messages")
async def send_message(message: Message, username: str = Depends(get_current_user)):
    """Send new message (requires authentication)"""
    if not message.content or len(message.content.strip()) == 0:
        raise HTTPException(status_code=400, detail="Bericht mag niet leeg zijn")
    
    if len(message.content) > 2000:
        raise HTTPException(status_code=400, detail="Bericht mag maximaal 2000 karakters zijn")
    
    msg_id = str(uuid.uuid4())
    users = get_users()
    user_color = users.get(username, {}).get("color", "#6C757D")
    
    new_message = {
        "id": msg_id,
        "content": message.content.strip(),
        "username": username,
        "color": user_color,
        "timestamp": datetime.now().isoformat(),
        "edited": False
    }
    
    # Supabase storage (primary)
    if supabase:
        try:
            response = supabase.table("messages").insert(new_message).execute()
            return new_message
        except Exception as e:
            print(f"Supabase insert error: {e}")
    
    # Fallback to file storage
    messages = get_messages()
    messages.append(new_message)
    
    # Keep only last 100 messages
    if len(messages) > 100:
        messages = messages[-100:]
    
    save_messages(messages)
    
    return new_message

@app.get("/api/messages")
async def get_messages_endpoint(since: Optional[str] = None, username: str = Depends(get_current_user)):
    """Get messages (requires authentication)"""
    
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
                return {"messages": response.data}
        except Exception as e:
            print(f"Supabase fetch error: {e}")
    
    # Fallback to file storage
    messages = get_messages()
    
    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            filtered_messages = [
                msg for msg in messages 
                if datetime.fromisoformat(msg["timestamp"]) > since_dt
            ]
            return {"messages": filtered_messages}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid timestamp format")
    
    return {"messages": messages}

@app.put("/api/messages/{message_id}")
async def update_message(
    message_id: str, 
    update: MessageUpdate, 
    username: str = Depends(get_current_user)
):
    """Edit a message (own messages only)"""
    messages = get_messages() if not supabase else []
    
    # Find message
    if supabase:
        try:
            response = supabase.table("messages").select("*").eq("id", message_id).execute()
            if not response.data:
                raise HTTPException(status_code=404, detail="Message not found")
            message = response.data[0]
        except:
            raise HTTPException(status_code=404, detail="Message not found")
    else:
        message = next((m for m in messages if m["id"] == message_id), None)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
    
    # Check ownership
    if message["username"] != username:
        raise HTTPException(status_code=403, detail="You can only edit your own messages")
    
    # Update message
    message["content"] = update.content.strip()
    message["edited"] = True
    message["edited_at"] = datetime.now().isoformat()
    
    # Update in Supabase if available
    if supabase:
        try:
            supabase.table("messages")\
                .update({
                    "content": message["content"],
                    "edited": True,
                    "edited_at": message["edited_at"]
                })\
                .eq("id", message_id)\
                .execute()
        except Exception as e:
            print(f"Supabase update error: {e}")
    else:
        save_messages(messages)
    
    return message

@app.delete("/api/messages/{message_id}")
async def delete_message(message_id: str, username: str = Depends(get_current_user)):
    """Delete a message (own messages only)"""
    messages = get_messages() if not supabase else []
    
    # Find message
    if supabase:
        try:
            response = supabase.table("messages").select("*").eq("id", message_id).execute()
            if not response.data:
                raise HTTPException(status_code=404, detail="Message not found")
            message = response.data[0]
        except:
            raise HTTPException(status_code=404, detail="Message not found")
    else:
        message = next((m for m in messages if m["id"] == message_id), None)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
    
    # Check ownership
    if message["username"] != username:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")
    
    # Delete from Supabase if available
    if supabase:
        try:
            supabase.table("messages").delete().eq("id", message_id).execute()
        except Exception as e:
            print(f"Supabase delete error: {e}")
    else:
        messages.remove(message)
        save_messages(messages)
    
    return {"message": "Message deleted successfully"}

@app.get("/api/users")
async def get_users_endpoint(username: str = Depends(get_current_user)):
    """Get active users (requires authentication)"""
    users = get_users()
    sessions = get_sessions()
    
    # Get unique usernames from active sessions
    active_usernames = set(session['username'] for session in sessions.values())
    
    # Build user list
    active_users = [
        {"username": uname, "color": users[uname]["color"]}
        for uname in active_usernames
        if uname in users
    ]
    
    return {"users": active_users}
