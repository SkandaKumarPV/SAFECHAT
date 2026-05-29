from __future__ import annotations

from sqlalchemy.orm import Session

from backend.app.core.security import get_password_hash
from backend.app.models import User, Post


def seed_demo_data(db: Session) -> None:
    demo = db.query(User).filter(User.username == "demo_user").first()
    if demo is None:
        demo = User(
            username="demo_user",
            email="demo_user@example.com",
            full_name="Demo User",
            bio="Welcome to the safe social demo account.",
            hashed_password=get_password_hash("demo1234"),
        )
        db.add(demo)
        db.commit()
        db.refresh(demo)

    tester = db.query(User).filter(User.username == "tester").first()
    if tester is None:
        tester = User(
            username="tester",
            email="tester@example.com",
            full_name="Test User",
            bio="QA account for moderation testing.",
            hashed_password=get_password_hash("test1234"),
        )
        db.add(tester)
        db.commit()

    # Create a richer demo dataset (idempotent).
    # Only seed if the DB doesn't already have enough posts.
    total_posts = db.query(Post).count()
    if total_posts >= 20:
        return

    # Create extra demo users if they don't exist.
    extra_users: list[tuple[str, str, str]] = [
        ("zoro", "zoro@example.com", "Roronoa Zoro"),
        ("luffy", "luffy@example.com", "Monkey D. Luffy"),
        ("nami", "nami@example.com", "Nami"),
        ("sanji", "sanji@example.com", "Vinsmoke Sanji"),
        ("robin", "robin@example.com", "Nico Robin"),
        ("ace", "ace@example.com", "Portgas D. Ace"),
        ("law", "law@example.com", "Trafalgar Law"),
        ("hancock", "hancock@example.com", "Boa Hancock"),
    ]

    users: list[User] = []
    for username, email, full_name in extra_users:
        u = db.query(User).filter(User.username == username).first()
        if u is None:
            u = User(
                username=username,
                email=email,
                full_name=full_name,
                bio="",
                avatar_url=None,
                hashed_password=get_password_hash("demo1234"),
            )
            db.add(u)
            db.commit()
            db.refresh(u)
        users.append(u)

    # Ensure demo & tester included
    users = [demo, tester, *users]

    captions = [
        "Late night vibes.",
        "New post drop. Thoughts?",
        "Testing the moderation pipeline.",
        "Weekend mood.",
        "Coffee and code.",
        "Simple things.",
        "Small progress is still progress.",
        "Exploring new places.",
        "Aesthetic feed check.",
        "Just posted this!",
        "Trying out the app UI.",
        "Hello world from another account.",
        "Sunset energy.",
        "Keeping it clean.",
        "This is a safe caption.",
        "Rate this shot.",
        "Minimal caption, max vibe.",
        "Scrolling season.",
        "Learning every day.",
        "Building in public.",
        "Moments that matter.",
        "Better together.",
        "Stay consistent.",
        "Good energy only.",
        "New week, new goals.",
        "Some random thoughts.",
        "A quick update.",
        "Another safe post.",
        "UI looks great in dark mode.",
        "Posting from the demo seed.",
    ]

    # Use stable Picsum photos for distinct images.
    # We vary the seed by post index to avoid duplicates.
    def image_url_for(i: int) -> str:
        # 900x900 squares fit the UI nicely.
        return f"https://picsum.photos/seed/toxicity-social-{i}/900/900"

    # Create posts until we reach ~30 total.
    target_total = 30
    to_create = max(0, target_total - total_posts)
    if to_create == 0:
        return

    posts: list[Post] = []
    for i in range(to_create):
        author = users[i % len(users)]
        caption = captions[i % len(captions)]
        posts.append(
            Post(
                author_id=author.id,
                content=caption,
                image_url=image_url_for(total_posts + i + 1),
            )
        )

    db.add_all(posts)
    db.commit()
