import os
from datetime import timedelta

class Settings:
    def __init__(self) -> None:
        self.secret_key = os.getenv("SECRET_KEY", "change-this-secret")
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
        self.algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.toxicity_threshold = float(os.getenv("TOXICITY_THRESHOLD", "0.5"))
        self.toxicity_mode = os.getenv("TOXICITY_MODE", "flag")
        self.model_name = os.getenv("TOXICITY_MODEL_NAME", "multilingual")
        self.eager_load = os.getenv("TOXICITY_EAGER_LOAD", "false").lower() == "true"
        self.seed_demo = os.getenv("SEED_DEMO", "true").lower() == "true"

    @property
    def token_expires(self) -> timedelta:
        return timedelta(minutes=self.access_token_expire_minutes)

settings = Settings()
