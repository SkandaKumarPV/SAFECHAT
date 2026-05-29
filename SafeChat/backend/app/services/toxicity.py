from __future__ import annotations

import re
from typing import Any, Dict, Optional

from langdetect import detect, LangDetectException
from deep_translator import GoogleTranslator
from detoxify import Detoxify

from backend.app.core.config import settings

NATIVE_LANGUAGES = {"en", "fr", "es", "it", "pt", "tr", "ru"}
SEVERITY_LEVELS = [
    (0.80, "CRITICAL"),
    (0.60, "HIGH"),
    (0.40, "MEDIUM"),
    (0.20, "LOW"),
    (0.00, "NONE"),
]

class ToxicityService:
    def __init__(self) -> None:
        self._model: Optional[Detoxify] = None
        self._cache: Dict[tuple, str] = {}

    def _load_model(self) -> Detoxify:
        if self._model is None:
            self._model = Detoxify(settings.model_name)
        return self._model

    def _severity(self, max_score: float) -> str:
        for threshold, level in SEVERITY_LEVELS:
            if max_score >= threshold:
                return level
        return "NONE"

    def _clean(self, text: str) -> str:
        text = re.sub(r"http\S+|www\.\S+", "", text)
        text = re.sub(r"\S+@\S+", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def analyze(self, text: str) -> Dict[str, Any]:
        if not text or not text.strip():
            return {
                "is_toxic": False,
                "max_score": 0.0,
                "severity": "NONE",
                "scores": {},
                "language": "unknown",
                "translated": False,
                "translated_text": None,
            }

        language = "unknown"
        try:
            language = detect(text)
        except LangDetectException:
            language = "unknown"

        translated_text = None
        translated = False
        content_for_model = text

        if language != "unknown" and language not in NATIVE_LANGUAGES:
            cache_key = (text[:150], language)
            if cache_key in self._cache:
                translated_text = self._cache[cache_key]
            else:
                translated_text = GoogleTranslator(source=language, target="en").translate(text)
                self._cache[cache_key] = translated_text
            content_for_model = translated_text
            translated = True

        clean_text = self._clean(content_for_model)
        if not clean_text:
            clean_text = content_for_model

        model = self._load_model()
        raw_scores = model.predict(clean_text)
        scores = {k: float(v) for k, v in raw_scores.items()}
        max_score = max(scores.values()) if scores else 0.0

        return {
            "is_toxic": max_score >= settings.toxicity_threshold,
            "max_score": round(max_score, 4),
            "severity": self._severity(max_score),
            "scores": scores,
            "language": language,
            "translated": translated,
            "translated_text": translated_text,
        }

service = ToxicityService()

if settings.eager_load:
    service._load_model()
