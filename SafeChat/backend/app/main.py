from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes import auth_router, users_router, follows_router, posts_router, comments_router, messages_router, saves_router
from backend.app.db.session import engine, SessionLocal
from backend.app.models import Base
from backend.app.core.config import settings
from backend.app.services.seed import seed_demo_data

app = FastAPI(title="Social Toxicity Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(follows_router)
app.include_router(posts_router)
app.include_router(comments_router)
app.include_router(messages_router)
app.include_router(saves_router)

Base.metadata.create_all(bind=engine)
if settings.seed_demo:
    with SessionLocal() as db:
        seed_demo_data(db)

@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    if settings.seed_demo:
        with SessionLocal() as db:
            seed_demo_data(db)
