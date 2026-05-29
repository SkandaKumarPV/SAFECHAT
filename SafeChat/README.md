# SafeChat — Multilingual Toxicity Moderation

This repository contains a demo NLP moderation pipeline (not a production-ready hosted service) that detects toxic language across multiple languages, translates when necessary, and returns structured label scores and a severity level.

This updated README provides a concise guide to the repository contents, how to run the backend service, and where to find notebooks and example frontend code.

## Repository layout

- **Main+project.ipynb** — exploratory notebook with the core toxicity pipeline.
- **multilingual_toxicity_final.ipynb** — multilingual pipeline with translation and visualizations.
- **backend/** — FastAPI backend and production-like service code.
  - `backend/app/services/toxicity.py` — core detection and translation logic used by the API.
  - `backend/app/main.py` — FastAPI app entrypoint.
  - `backend/social.db` — SQLite DB used by the backend (kept in repo for demo).
- **TOXICITY_SOCIAL_MEDIA-main/** — example frontend (Vite + React/TS) used for demos.
- **requirements.txt** — Python dependencies for the backend and notebooks.
- **.gitignore** — ignore rules for local artifacts.

## Quick start — backend (Python)

1. Create and activate a Python virtual environment (recommended Python 3.10+):

```
python -m venv .venv
.
\venv\Scripts\activate  # Windows PowerShell
```

2. Install dependencies:

```
pip install -r requirements.txt
```

3. Set environment variables (create a `.env` file if needed). Example values:

```
DATABASE_URL=sqlite:///./backend/social.db
SECRET_KEY=replace-with-a-secret
```

4. Run the backend FastAPI app (from the repository root):

```
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000` and interactive docs at `/docs`.

## Frontend demo

The `TOXICITY_SOCIAL_MEDIA-main` folder contains a Vite + React TypeScript demo. From that folder:

```
cd TOXICITY_SOCIAL_MEDIA-main
npm install
npm run dev
```

Adjust the frontend API base URL in `src/lib/api.ts` if the backend runs on a non-default host/port.

## Notebooks

- `Main+project.ipynb` — step-by-step experiments and model exploration.
- `multilingual_toxicity_final.ipynb` — multilingual testing, translation, and visualization examples.

Run the notebooks in Jupyter or VS Code to reproduce experiments. They include installation cells and usage examples.

## Notes and recommendations

- `backend/social.db` is included for demo purposes. For production, switch to a separate DB server and set `DATABASE_URL`.
- `.env`, local editor settings, `__pycache__`, and other development artifacts are ignored via `.gitignore`.
- Remove any large model weights from the repo; load models at runtime or via package artifacts.

## Contact / Attribution

This project and its notebooks were built as an academic/demo project. For questions or help running it, open an issue on the repository.

---

Updated: May 29, 2026

In a social platform, toxicity detection is usually used for:

- comments
- direct messages
- posts
- reports
- moderation dashboards

The model helps the platform:

- reduce abusive content
- protect users from harassment
- flag harmful messages quickly
- support human moderators
- keep the app safer at scale

## Example output shape

A typical result looks like this:

```json
{
  "language": "hi",
  "translated": true,
  "translated_text": "You are completely useless.",
  "is_toxic": true,
  "severity": "HIGH",
  "scores": {
    "toxic": 0.97,
    "insult": 0.95,
    "threat": 0.01
  }
}
```

This is useful because a moderation system can immediately see what happened, why it happened, and what action to take.

## Step-by-step summary

1. User submits text.
2. The system detects the language.
3. The system translates if needed.
4. The text is cleaned.
5. The Detoxify model predicts toxicity labels.
6. The scores are compared against a threshold.
7. The system maps the result to a severity level.
8. The final structured output is returned to the app.

## Important idea to remember

This project is not just about detecting bad words.

It is about understanding text in context, handling different languages, converting raw model scores into practical moderation decisions, and turning NLP into a real product feature.

## How to run

### Install dependencies

```bash
cd d:\NLP
pip install -r requirements.txt
```

### Run the multilingual notebook

```bash
jupyter notebook multilingual_toxicity_final.ipynb
```

### Run the backend

```bash
uvicorn backend.app.main:app --reload
```

## Short conclusion

If you want to understand the project deeply, focus on this sequence:

**Language detection -> translation -> preprocessing -> transformer classification -> thresholding -> severity mapping -> structured output**

That is the full NLP logic behind the application.