# Multilingual Toxicity Detection System

This project shows how to build a real-world NLP moderation pipeline for social media comments and direct messages. It can detect toxic language, support multiple languages, translate when needed, and return a structured result that a backend or frontend can use for moderation.

The project is centered around three working parts:

- [Main+project.ipynb](Main+project.ipynb) for the original toxicity pipeline
- [multilingual_toxicity_final.ipynb](multilingual_toxicity_final.ipynb) for the multilingual version with translation and visualization
- [backend/app/services/toxicity.py](backend/app/services/toxicity.py) for the production service used by the API

## What this project does in real life

Imagine a user posting a comment on a social platform:

- If the comment is harmless, it should be allowed.
- If it is insulting, threatening, or hateful, it should be flagged or blocked.
- If the comment is written in another language, the system should still understand it.

That is exactly what this project is built for. It behaves like an automatic moderation assistant that sits between the user and the platform.

Example in practice:

- Input: "तुम बिल्कुल बेकार हो!"
- Step 1: detect language as Hindi
- Step 2: translate to English if needed
- Step 3: clean the text
- Step 4: send the text to the toxicity model
- Step 5: get label scores such as insult and toxic
- Step 6: convert the scores into a severity level
- Step 7: return a result that the app can use to block, warn, or review

## NLP concepts used

The main NLP concepts implemented in the project are:

- Language detection
- Machine translation for multilingual input
- Text preprocessing and normalization
- Transformer-based text classification
- Multi-label toxicity classification
- Probability scoring and threshold-based prediction
- Severity level mapping
- Multilingual text processing
- Batch inference
- Output structuring for analysis and reporting

## How the pipeline works

The full moderation flow is simple in concept but powerful in practice.

### 1. User writes a message

The text may come from a comment, post, or direct message. It can be in English or any other language supported by the language detector and translator.

### 2. Language detection

The system first checks what language the text is written in using `langdetect`.

Why this matters:

- The model is strongest on some languages directly.
- For other languages, translation improves consistency.
- It prevents sending unsupported text blindly into the classifier.

### 3. Translation if needed

If the detected language is not one of the model’s native languages, the text is translated into English using `deep_translator`.

Why this matters:

- The toxicity model can analyze English reliably.
- Translation makes the system usable for multilingual communities.
- It allows the same moderation logic to work across many languages.

### 4. Text preprocessing

Before prediction, the text is cleaned.

Typical preprocessing steps used in the notebooks and backend:

- Remove URLs
- Remove email addresses
- Normalize repeated whitespace
- Lowercase text in the notebook pipeline

Why this matters:

- URLs and emails usually do not help toxicity detection.
- Cleaning reduces noise.
- Normalization improves consistency before inference.

### 5. Toxicity model inference

The cleaned text goes into the Detoxify model, which is a pre-trained transformer-based classifier.

The model outputs scores for several toxicity categories. These are not just yes/no values. They are probability-like confidence scores between 0 and 1.

Why this matters:

- A single message may be toxic in more than one way.
- Multi-label prediction is more realistic than one flat label.
- Probability scores let the system make flexible moderation decisions.

### 6. Thresholding and label detection

Each label score is compared with a threshold.

- If a score is above the threshold, that toxicity type is considered detected.
- If no score crosses the threshold, the content is considered clean or low risk.

Why this matters:

- Not every score should trigger moderation.
- The threshold lets the platform tune sensitivity.
- Different apps can choose stricter or softer moderation rules.

### 7. Severity mapping

The highest score or a weighted score is converted into a severity level.

Common severity levels in the project:

- NONE
- LOW
- MEDIUM
- HIGH
- CRITICAL

Why this matters:

- A platform can treat mild profanity differently from a direct threat.
- Severity is easier for moderation teams to act on than raw scores.
- It helps decide whether to allow, warn, hide, or escalate content.

### 8. Structured output

The final result is returned as a structured object or JSON response.

It usually includes:

- original input text
- detected language
- translated text if translation happened
- toxicity scores for each label
- detected labels
- severity level
- timestamp or metadata

Why this matters:

- The backend can store results.
- The frontend can display them.
- Moderators can review them quickly.

## Real-life moderation example

Input message:

"तुम बिल्कुल बेकार हो और तुम्हें यहाँ नहीं होना चाहिए!"

What happens:

1. The system detects Hindi.
2. Because Hindi is not handled natively by the model in the main production flow, it translates the text into English.
3. The translated text is cleaned.
4. The model predicts toxicity scores.
5. The insult and general toxicity scores rise above the threshold.
6. The system returns a high severity result.
7. The application can now block the message, warn the user, or send it to a moderation queue.

That is how NLP becomes useful in a live product. The model is not just classifying text for a notebook. It is deciding how the platform should respond to a user’s content in real time.

## What is implemented in each notebook

### Main+project.ipynb

This notebook focuses on the core toxicity workflow:

- installs dependencies
- imports libraries
- prepares a text preprocessor
- loads the Detoxify model
- tests sample comments
- computes predictions and severity
- runs batch processing
- exports JSON and CSV results

Conceptually, this notebook is the best place to understand the basic NLP flow from raw text to toxicity decision.

### multilingual_toxicity_final.ipynb

This notebook expands the idea into a full multilingual moderation pipeline:

- language detection with confidence
- translation for non-native languages
- preprocessing before inference
- Detoxify multilingual model loading
- structured toxicity output
- visual summaries and reports
- detailed analysis of multilingual samples

Conceptually, this notebook shows how the same NLP pipeline can work across languages in a real moderation system.

### backend/app/services/toxicity.py

This is the production service used by the backend API.

It includes:

- language detection
- translation caching
- preprocessing
- model loading
- toxicity scoring
- severity mapping
- JSON-ready output

Conceptually, this is the version that matters for the real application, because it is what the API can call whenever a user submits text.

## Why the model is useful in a social app

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