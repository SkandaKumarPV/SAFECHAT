from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.users import router as users_router
from backend.app.api.routes.follows import router as follows_router
from backend.app.api.routes.posts import router as posts_router
from backend.app.api.routes.comments import router as comments_router
from backend.app.api.routes.messages import router as messages_router
from backend.app.api.routes.saves import router as saves_router

__all__ = [
    "auth_router",
    "users_router",
    "follows_router",
    "posts_router",
    "comments_router",
    "messages_router",
    "saves_router",
]
