from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "Welcome to KelanaAI"
    }

@app.get("/health")
def home():
    return {
        "Status": "OK"
    }

from pydantic import BaseModel, field_validator

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def email_must_contain_at(cls, value: str) -> str:
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("Invalid email address")
        return value.lower().strip()

class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def email_must_contain_at(cls, value: str) -> str:
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("Invalid email address")
        return value.lower().strip()

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

    @field_validator("email")
    @classmethod
    def email_must_contain_at(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("Invalid email address")
        return value.lower().strip()

class PasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str

class QuestionRequest(BaseModel):
    question: str
    conversation_id: Optional[int] = None
    conversation_history: Optional[list[dict]] = None

    @field_validator("question")
    @classmethod
    def question_must_not_be_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Question cannot be empty")
        return value


class ConversationCreateRequest(BaseModel):
    title: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        value = value.strip()
        if not value:
            raise ValueError("Title cannot be empty")

        return value[:100]


class ConversationMessageRequest(BaseModel):
    question: str

    @field_validator("question")
    @classmethod
    def question_must_not_be_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Question cannot be empty")
        return value


class AssistantSourceResponse(BaseModel):
    name: Optional[str] = None
    uri: Optional[str] = None
    score: Optional[float] = None


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    confidence_score: Optional[int] = None
    sources: Optional[list[AssistantSourceResponse]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConversationDetailResponse(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    created_at: Optional[datetime] = None
    messages: list[MessageResponse] = []

    class Config:
        from_attributes = True


class ConversationAnswerResponse(BaseModel):
    conversation_id: int
    question: str
    answer: str
    confidence_score: Optional[int] = None
    sources: list[AssistantSourceResponse] = []
    messages: list[MessageResponse] = []


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    travel_style: Optional[str] = None
    recommendations: str

class TripUpdateRequest(BaseModel):
    destination: Optional[str] = None
    days: Optional[int] = None
    budget: Optional[float] = None
    travel_style: Optional[str] = None

from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_recommendation_transport,
    get_ai_recomendation,
    recomendations,
    recommended_transport
)
from services.auth_service import (
    authenticate_user,
    create_access_token,
    get_user_id_from_token,
    hash_password,
    register_user,
)
from services.kb_service import ask_knowledge_base

from models.user import User
from models.trip import Trip
from models.conversation import Conversation, Message
from database import SessionLocal, init_db, get_db
init_db()

@app.post("/api/v1/auth/register", response_model=UserResponse, status_code=201)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    try:
        return register_user(
            db=db,
            name=request.name,
            email=request.email,
            password=request.password,
        )
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error))

@app.post("/api/v1/auth/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": user,
    }

def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    auth_scheme, _, token = authorization.partition(" ")
    if auth_scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = token.strip()
    user_id = get_user_id_from_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user

@app.get("/api/v1/users/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/api/v1/users/me", response_model=UserResponse)
def update_profile(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if request.email is not None and request.email != user.email:
        email_owner = db.query(User).filter(User.email == request.email).first()
        if email_owner is not None:
            raise HTTPException(status_code=409, detail="Email already registered")
        user.email = request.email

    if request.name is not None:
        normalized_name = request.name.strip()
        if not normalized_name:
            raise HTTPException(status_code=422, detail="Name cannot be empty")
        user.name = normalized_name

    db.commit()
    db.refresh(user)
    return user

@app.put("/api/v1/users/me/password")
def update_password(
    request: PasswordUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not authenticate_user(db, user.email, request.current_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=422,
            detail="New password must be at least 8 characters",
        )

    user.password_hash = hash_password(request.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@app.get("/recommendations")
def get_recommendations(current_user: User = Depends(get_current_user)):
    return {
         "recommended_places": recomendations()
    }

@app.post("/api/v1/ask")
def ask_endpoint(request: QuestionRequest, db: Session = Depends(get_db)):
    history = []

    # Jika conversation_id disertakan, ambil riwayat langsung dari tabel Message untuk konteks
    if request.conversation_id:
        db_messages = (
            db.query(Message)
            .filter(Message.conversation_id == request.conversation_id)
            .order_by(Message.created_at.asc(), Message.id.asc())
            .all()
        )
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in db_messages
        ]
    elif request.conversation_history:
        history = request.conversation_history

    result = ask_knowledge_base(
        question=request.question,
        conversation_history=history,
    )

    # Simpan ke tabel Message jika conversation_id valid
    if request.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
        if conv:
            user_msg = Message(
                conversation_id=conv.id,
                role="user",
                content=request.question,
            )
            db.add(user_msg)
            assistant_msg = Message(
                conversation_id=conv.id,
                role="assistant",
                content=result["answer"],
                confidence_score=result["confidence_score"],
                sources=result.get("sources"),
            )
            db.add(assistant_msg)
            if not conv.title or conv.title == "New Conversation":
                conv.title = request.question[:50].strip()
            db.commit()

    return {
        "question": request.question,
        "answer": result["answer"],
        "confidence_score": result["confidence_score"],
        "sources": result["sources"],
        "created_at": datetime.now().isoformat(),
        "conversation_id": request.conversation_id,
    }

@app.post("/api/v1/trips")
def create_trip(
    request: TripRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    daily_budget = calculate_daily_budget(request.budget, request.days)
    category     = request.travel_style or get_trip_category(request.budget)

    ai_recommendation = get_ai_recomendation(
        destination=request.destination,
        days=request.days,
        budget=request.budget,
        travel_style=category
    )

    trip = Trip(
        destination  = request.destination,
        days         = request.days,
        budget       = request.budget,
        category     = category,
        daily_budget = daily_budget,
        ai_recommendation = ai_recommendation,
        user_id = current_user.id,
        is_active = True,
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip

@app.get("/api/v1/trips")
def list_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Trip).filter(
        Trip.user_id == current_user.id,
        Trip.is_active == True,
    ).all()

@app.get("/api/v1/trips/{trip_id}")
def get_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.user_id == current_user.id,
        Trip.is_active == True,
    ).first()
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    return trip

@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.is_active == True).first()
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    trip.is_active = False
    db.commit()
    return {"message": f"Trip with id {trip_id} deleted successfully"}

@app.put("/api/v1/trips/{trip_id}")
def update_trip(
    trip_id: int,
    request: TripUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.is_active == True).first()

    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if request.destination is not None:
        trip.destination = request.destination
    if request.days is not None:
        trip.days = request.days
    if request.budget is not None:
        trip.budget = request.budget
    if request.travel_style is not None:
        trip.category = request.travel_style or get_trip_category(trip.budget)

    if trip.days > 0:
        trip.daily_budget = trip.budget / trip.days

    db.commit()
    db.refresh(trip)
    return trip

@app.post("/api/v1/conversations", response_model=ConversationResponse, status_code=201)
def create_conversation(
    request: Optional[ConversationCreateRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    title = request.title if request and request.title else "New Conversation"
    conversation = Conversation(
        user_id=current_user.id,
        title=title,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation

@app.get("/api/v1/conversations", response_model=list[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )

@app.get("/api/v1/conversations/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Ambil pesan langsung dari tabel Message terurut kronologis
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )
    conversation.messages = messages

    return conversation

@app.post("/api/v1/conversations/{conversation_id}/messages", response_model=ConversationAnswerResponse)
def create_conversation_message(
    conversation_id: int,
    request: ConversationMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Ambil seluruh pesan dari tabel Message secara eksplisit untuk memahami konteks percakapan
    previous_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )

    history = [
        {"role": msg.role, "content": msg.content}
        for msg in previous_messages
    ]

    result = ask_knowledge_base(
        question=request.question,
        conversation_history=history,
    )

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.question,
    )
    db.add(user_message)

    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=result["answer"],
        confidence_score=result["confidence_score"],
        sources=result.get("sources"),
    )
    db.add(assistant_message)

    if not conversation.title or conversation.title == "New Conversation":
        conversation.title = request.question[:50].strip()

    db.commit()
    db.refresh(conversation)

    # Ambil seluruh pesan terbaru langsung dari tabel Message
    all_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )

    return {
        "conversation_id": conversation.id,
        "question": request.question,
        "answer": result["answer"],
        "confidence_score": result["confidence_score"],
        "sources": result.get("sources", []),
        "messages": all_messages,
    }

@app.delete("/api/v1/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    db.delete(conversation)
    db.commit()
    return {"message": "Conversation deleted successfully"}
