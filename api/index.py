from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, validator
from datetime import datetime, timedelta
from typing import Optional
import uuid
import os
import hashlib
import secrets
import re

app = FastAPI()

# CORS configuratie
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuratie - VERPLICHT
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables")

# Initialiseer Supabase client
from supabase import create_client, Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Session expiry
SESSION_EXPIRY_HOURS = 24

# Security
security = HTTPBearer(auto_error=False)

# Models
class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str
    
    @validator('email')
    def validate_email(cls, v):
        # Simple email validation
        if not v or '@' not in v:
            raise ValueError('Email must contain @')
        return v.lower().strip()
    
    @validator('username')
    def validate_username(cls, v):
        return v.strip()

class LoginRequest(BaseModel):
    username: str
    password: str

class Message(BaseModel):
    content: str

class MessageUpdate(BaseModel):
    content: str

# Helper functions
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
    """Verify authentication token from Supabase"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = credentials.credentials
    
    try:
        # Check if session exists in Supabase
        response = supabase.table("sessions")\
            .select("*")\
            .eq("token", token)\
            .execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        session = response.data[0]
        
        # Check if session is expired
        expires_at = datetime.fromisoformat(session["expires_at"].replace('Z', '+00:00'))
        if expires_at <= datetime.utcnow():
            # Delete expired session
            supabase.table("sessions").delete().eq("token", token).execute()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired"
            )
        
        return session["username"]
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

# Routes
@app.get("/")
async def root():
    return {
        "status": "FlowChat Pro API is running", 
        "version": "2.3-Supabase", 
        "auth": "enabled",
        "storage": "supabase (fully persistent)"
    }

@app.post("/api/register")
async def register(request: RegisterRequest):
    """Register new user"""
    username = request.username
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
    
    try:
        # Check if user already exists
        existing = supabase.table("users")\
            .select("username")\
            .eq("username", username)\
            .execute()
        
        if existing.data and len(existing.data) > 0:
            raise HTTPException(
                status_code=400,
                detail="Gebruikersnaam is al in gebruik"
            )
        
        # Create user
        password_hash = hash_password(password)
        color = get_random_color()
        
        user_data = {
            "username": username,
            "password_hash": password_hash,
            "color": color,
            "email": email,
            "created_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("users").insert(user_data).execute()
        
        # Create session
        token = generate_token()
        session_data = {
            "token": token,
            "username": username,
            "expires_at": (datetime.utcnow() + timedelta(hours=SESSION_EXPIRY_HOURS)).isoformat(),
            "created_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("sessions").insert(session_data).execute()
        
        return {
            "username": username,
            "color": color,
            "token": token,
            "message": "Account succesvol aangemaakt"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Registratie gefaald: {str(e)}"
        )

@app.post("/api/login")
async def login(request: LoginRequest):
    """Login user"""
    username = request.username.strip()
    password = request.password
    
    try:
        # Get user from Supabase
        response = supabase.table("users")\
            .select("*")\
            .eq("username", username)\
            .execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=401,
                detail="Ongeldige gebruikersnaam of wachtwoord"
            )
        
        user = response.data[0]
        password_hash = hash_password(password)
        
        if user["password_hash"] != password_hash:
            raise HTTPException(
                status_code=401,
                detail="Ongeldige gebruikersnaam of wachtwoord"
            )
        
        # Create new session
        token = generate_token()
        session_data = {
            "token": token,
            "username": username,
            "expires_at": (datetime.utcnow() + timedelta(hours=SESSION_EXPIRY_HOURS)).isoformat(),
            "created_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("sessions").insert(session_data).execute()
        
        return {
            "username": username,
            "color": user["color"],
            "token": token,
            "message": "Succesvol ingelogd"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Login gefaald"
        )

@app.post("/api/logout")
async def logout(username: str = Depends(get_current_user), 
                 credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user"""
    token = credentials.credentials
    
    try:
        # Delete session from Supabase
        supabase.table("sessions").delete().eq("token", token).execute()
        return {"message": "Succesvol uitgelogd"}
    except Exception as e:
        print(f"Logout error: {e}")
        return {"message": "Logout gefaald"}

@app.get("/api/me")
async def get_me(username: str = Depends(get_current_user)):
    """Get current user"""
    try:
        response = supabase.table("users")\
            .select("username, color")\
            .eq("username", username)\
            .execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = response.data[0]
        return {
            "username": user["username"],
            "color": user["color"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get user error: {e}")
        raise HTTPException(status_code=500, detail="Kon gebruiker niet ophalen")

@app.post("/api/messages")
async def send_message(message: Message, username: str = Depends(get_current_user)):
    """Send new message"""
    if not message.content or len(message.content.strip()) == 0:
        raise HTTPException(status_code=400, detail="Bericht mag niet leeg zijn")
    
    if len(message.content) > 2000:
        raise HTTPException(status_code=400, detail="Bericht mag maximaal 2000 karakters zijn")
    
    try:
        # Get user color
        user_response = supabase.table("users")\
            .select("color")\
            .eq("username", username)\
            .execute()
        
        user_color = user_response.data[0]["color"] if user_response.data else "#6C757D"
        
        msg_id = str(uuid.uuid4())
        new_message = {
            "id": msg_id,
            "content": message.content.strip(),
            "username": username,
            "color": user_color,
            "timestamp": datetime.utcnow().isoformat(),
            "edited": False
        }
        
        supabase.table("messages").insert(new_message).execute()
        
        return new_message
        
    except Exception as e:
        print(f"Send message error: {e}")
        raise HTTPException(status_code=500, detail="Kon bericht niet versturen")

@app.get("/api/messages")
async def get_messages_endpoint(since: Optional[str] = None, username: str = Depends(get_current_user)):
    """Get messages"""
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
        
        return {"messages": response.data if response.data else []}
        
    except Exception as e:
        print(f"Get messages error: {e}")
        raise HTTPException(status_code=500, detail="Kon berichten niet ophalen")

@app.put("/api/messages/{message_id}")
async def update_message(
    message_id: str, 
    update: MessageUpdate, 
    username: str = Depends(get_current_user)
):
    """Edit a message"""
    try:
        # Get message
        response = supabase.table("messages")\
            .select("*")\
            .eq("id", message_id)\
            .execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Message not found")
        
        message = response.data[0]
        
        # Check ownership
        if message["username"] != username:
            raise HTTPException(status_code=403, detail="You can only edit your own messages")
        
        # Update message
        updated = supabase.table("messages")\
            .update({
                "content": update.content.strip(),
                "edited": True,
                "edited_at": datetime.utcnow().isoformat()
            })\
            .eq("id", message_id)\
            .execute()
        
        return updated.data[0] if updated.data else message
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update message error: {e}")
        raise HTTPException(status_code=500, detail="Kon bericht niet bewerken")

@app.delete("/api/messages/{message_id}")
async def delete_message(message_id: str, username: str = Depends(get_current_user)):
    """Delete a message"""
    try:
        # Get message
        response = supabase.table("messages")\
            .select("*")\
            .eq("id", message_id)\
            .execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Message not found")
        
        message = response.data[0]
        
        # Check ownership
        if message["username"] != username:
            raise HTTPException(status_code=403, detail="You can only delete your own messages")
        
        # Delete message
        supabase.table("messages").delete().eq("id", message_id).execute()
        
        return {"message": "Message deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete message error: {e}")
        raise HTTPException(status_code=500, detail="Kon bericht niet verwijderen")

@app.get("/api/users")
async def get_users_endpoint(username: str = Depends(get_current_user)):
    """Get active users"""
    try:
        # Get all active sessions
        now = datetime.utcnow().isoformat()
        sessions_response = supabase.table("sessions")\
            .select("username")\
            .gt("expires_at", now)\
            .execute()
        
        if not sessions_response.data:
            return {"users": []}
        
        # Get unique usernames
        active_usernames = list(set(s["username"] for s in sessions_response.data))
        
        # Get user details
        users_response = supabase.table("users")\
            .select("username, color")\
            .in_("username", active_usernames)\
            .execute()
        
        return {"users": users_response.data if users_response.data else []}
        
    except Exception as e:
        print(f"Get users error: {e}")
        raise HTTPException(status_code=500, detail="Kon gebruikers niet ophalen")
