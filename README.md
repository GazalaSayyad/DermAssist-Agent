# DermAssist Live Agent

Real-time AI dermatology triage built on Google ADK Live API.  
Supports text, audio, and image/video input with bidirectional WebSocket streaming.

---

## Problem Statement

Dermatology is one of the most underserved and access-constrained medical specialties worldwide. Patients often wait weeks or months for an appointment, only to discover their condition was either a minor irritation or — in more serious cases — something that needed urgent attention much earlier. Meanwhile, emergency rooms are burdened with skin-related visits that could have been triaged and redirected at a much earlier stage.

The core challenges this project addresses:

- **Access gap**: There is a severe shortage of dermatologists globally. In many regions, the patient-to-dermatologist ratio makes timely consultation impossible for the average person.
- **Delayed triage**: Patients and even general practitioners often struggle to distinguish between a benign rash and a potentially dangerous condition (e.g., a viral exanthem vs. an early sign of meningococcal disease or Stevens-Johnson syndrome).
- **No visual channel**: Traditional telehealth text chats cannot capture what dermatology fundamentally requires — a look at the skin. Without image or video input, remote consultations are severely limited.
- **Information asymmetry**: Patients arrive at clinics or ERs with incomplete histories. Critical details — onset timeline, associated systemic symptoms, medication history, exposure history — are collected inconsistently or too late.
- **Lack of structured intake**: Most digital health tools either ask overwhelming intake forms upfront or provide no structure at all, leading to poor-quality data reaching the physician.

**DermAssist Live Agent** addresses this by acting as a real-time, multimodal AI triage assistant — the first point of contact before a physician is involved. It gathers a structured clinical history conversationally, analyzes skin conditions from live video or images, classifies urgency, and surfaces evidence-based treatment context for the physician who reviews the case. It does not replace a doctor. It prepares both the patient and the doctor for a more informed, efficient encounter.

---

## Overview

DermAssist Live Agent is a real-time dermatology triage platform built on:

- **Google Gemini Live 2.5 Flash** (native audio, multimodal) via Google ADK
- **FastAPI** for the async WebSocket server
- **Bidirectional streaming** for voice, text, and image input simultaneously

The agent follows a structured 5-step clinical protocol: patient intake → image/video analysis → triage classification → evidence-based search → consultation summary output.

---

## Key Features

- Real-time bidirectional voice and text over WebSocket
- Live camera and image capture for skin condition analysis
- Structured triage: EMERGENCY / URGENT / ROUTINE classification with red-flag detection
- Google Search integration for current AAD / UpToDate / BMJ guidelines (2026)
- Preliminary consultation summary formatted for physician handoff
- Progressive step-by-step tutorial codebase — easy to learn and extend

---

## Project Structure

```
.
├── README.md
└── app/
    ├── .env                        # Environment credentials (not committed)
    ├── main.py                     # Full multimodal server (text + audio + image)
    ├── step1.py                    # Step 1: Minimal WebSocket echo server
    ├── step2.py                    # Step 2: ADK Runner + session service
    ├── step3.py                    # Step 3: Session init with LiveRequestQueue
    ├── step4.py                    # Step 4: Upstream task — sends text to queue
    ├── step5.py                    # Step 5: Downstream task — streams model events
    ├── stp6.py                     # Step 6: Bidirectional audio streaming
    ├── my_agent/
    │   ├── __init__.py
    │   └── agent.py                # DermAssist agent definition and instructions
    └── static/
        ├── index.html
        ├── css/
        │   └── style.css
        └── js/
            ├── app.js
            ├── audio-player.js
            ├── audio-recorder.js
            ├── pcm-player-processor.js
            └── pcm-recorder-processor.js
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- A Google API Key (Gemini) **or** a Google Cloud project with Vertex AI enabled
- pip

### 1. Clone and navigate

```bash
git clone <your-repo-url>
cd app
```

### 2. Create and activate a virtual environment

```bash
# Windows PowerShell
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux
python -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

> If you see `No module named uvicorn`, re-run the install step above.

### 4. Configure environment

Create `app/.env` and choose **one** of the two modes below.

**API Key mode (simplest):**
```env
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_API_KEY=your_api_key_here
```

**Vertex AI mode (recommended for production):**
```env
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GOOGLE_CLOUD_PROJECT=your_gcp_project
GOOGLE_CLOUD_LOCATION=us-central1
DEMO_AGENT_MODEL=gemini-live-2.5-flash-preview-native-audio-09-2025
GOOGLE_API_KEY=your_api_key_here
```

### 5. Run the app

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8080
```

Open **http://127.0.0.1:8000/** in your browser.

---

## Step-by-Step Tutorial Progression

The codebase is structured as a progressive tutorial. Each step adds one layer of functionality.

| File | Run Command | What It Adds |
|------|-------------|--------------|
| `step1.py` | `uvicorn step1:app --reload` | Minimal WebSocket server that echoes text messages |
| `step2.py` | `uvicorn step2:app --reload` | ADK initialization — Runner + session service |
| `step3.py` | `uvicorn step3:app --reload` | Session init per connection with LiveRequestQueue |
| `step4.py` | `uvicorn step4:app --reload` | Upstream task: sends text content into LiveRequestQueue |
| `step5.py` | `uvicorn step5:app --reload` | Downstream task: streams model events back to the client |
| `stp6.py`  | `uvicorn stp6:app --reload`  | Bidirectional audio: mic input + audio output streaming |
| `main.py`  | `uvicorn main:app --reload`  | Full system: adds image input (text + audio + image) |

---

## Agent Design: DermAssist AI

The agent (`app/my_agent/agent.py`) uses **gemini-live-2.5-flash-native-audio** and implements a 5-step clinical triage workflow.

### Step 1 — Patient Intake
Greets the patient warmly. Collects chief complaint, onset, duration, body location, symptom quality (itch/pain/burning), systemic symptoms (fever, fatigue, joint pain), medications, allergies, travel/exposure history, and special population flags (age, pregnancy, immunocompromised). Questions are asked 1–2 at a time — never a long form all at once.

### Step 2 — Image / Video Analysis
If the patient shares an image or video frame, the agent identifies:
- Lesion morphology (macule / papule / pustule / vesicle / plaque / nodule / ulcer)
- Color, borders (sharp vs diffuse), and distribution pattern
- Approximate body region
- Secondary changes (scaling, crusting, excoriation, lichenification)

It then asks targeted follow-up questions based on visual findings.

### Step 3 — Triage Classification

| Priority | Condition | Action |
|----------|-----------|--------|
| **EMERGENCY** | Rapid spread + fever, OR fever + mucosal involvement (mouth/eyes/genitals) | Immediate ER referral + brief differential for receiving clinician |
| **URGENT** | Any single red flag — mucosal involvement, immunocompromised, pregnancy, rapidly spreading rash, fever with rash | Same-day or urgent care |
| **ROUTINE** | No red flags, chronic or stable presentation | Standard dermatology appointment |

### Step 4 — Evidence-Based Search
Calls Google Search: `"First-line clinical management [condition] 2026 dermatology guidelines"`.  
Cites source names where available (AAD, UpToDate, BMJ). Skipped for EMERGENCY cases.

### Step 5 — Consultation Summary Output
Structured report formatted for physician handoff:

```
PRELIMINARY ASSESSMENT
Suspected Condition(s): [ranked differentials by likelihood]
Confidence: [High / Moderate / Low]

TRIAGE PRIORITY: [EMERGENCY / URGENT / ROUTINE]
[One plain-language sentence explaining why]

EVIDENCE-BASED TREATMENT OVERVIEW
Treatment | Type (Rx/OTC) | Key Notes (range, duration, side-effects)

QUESTIONS FOR THE PHYSICIAN
[2–3 questions that would most refine the diagnosis]

RECOMMENDED NEXT STEPS
[Tailored to triage level]
```

### Hard Limits
- Never writes a prescription or states a specific dose as if prescribing
- Never definitively diagnoses skin cancer — always refers for biopsy or dermoscopy
- Never downplays EMERGENCY symptoms
- Always appends the mandatory medical disclaimer

---

## Using the UI

1. Start the server (`uvicorn main:app --reload`)
2. Open **http://127.0.0.1:8000/**
3. Type a message and click **Send** for text-based consultation
4. Click **Start Audio** to stream microphone input for voice interaction
5. Click **Camera** to capture and send an image for skin condition analysis

---

## Deployment: Google Cloud Run

### Prerequisites
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and authenticated
- A GCP project with billing enabled

### 1. Verify gcloud setup

```bash
gcloud --version
gcloud config list
```

### 2. Set your project

```bash
gcloud config set project YOUR_PROJECT_ID
```

### 3. Enable required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com \
  compute.googleapis.com
```

### 4. Deploy to Cloud Run (source-based)

```bash
gcloud run deploy my-agent-service --source ./app --region us-central1
```

### 5. Check logs

```bash
gcloud run services logs read my-agent-service --region us-central1
```

Your live URL is printed at the end of the deploy step. Example:

```
https://my-agent-service-164027456696.us-central1.run.app
```

> **Production tip:** Remove `--allow-unauthenticated` and configure Cloud IAM or Identity-Aware Proxy (IAP) for access control.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_GENAI_USE_VERTEXAI` | Always | `TRUE` for Vertex AI, `FALSE` for API Key mode |
| `GOOGLE_API_KEY` | API Key mode only | Gemini API key from Google AI Studio |
| `GOOGLE_CLOUD_PROJECT` | Vertex AI mode only | Your GCP project ID |
| `GOOGLE_CLOUD_LOCATION` | Vertex AI mode only | Region, e.g. `us-central1` |
| `DEMO_AGENT_MODEL` | Vertex AI mode only | Model string, e.g. `gemini-live-2.5-flash-preview-native-audio-09-2025` |

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi` | Async web framework and WebSocket server |
| `uvicorn` | ASGI server for running FastAPI |
| `python-dotenv` | Loads `.env` credentials at startup |
| `google-adk` | Google Agent Development Kit (Runner, LiveRequestQueue, session services) |
| `google-genai` | Gemini Live API client for native audio and multimodal streaming |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser / Mobile)                │
│   Text Input   │   Audio (PCM mic)   │   Camera / Image     │
└────────────────────────┬────────────────────────────────────┘
                         │  WebSocket (bidirectional)
┌────────────────────────▼────────────────────────────────────┐
│                  FastAPI Server (main.py)                    │
│  WS Endpoint  │  Upstream Task (→ Queue)  │  Downstream Task │
└────────────────────────┬────────────────────────────────────┘
                         │  ADK Runner · Session Service
┌────────────────────────▼────────────────────────────────────┐
│               Google ADK (LiveRequestQueue)                  │
│         Runner         │      DermAssist Agent               │
│                        │      tools: [google_search]         │
└───────────┬────────────┴──────────────┬─────────────────────┘
            │                           │
┌───────────▼──────────┐   ┌────────────▼──────────────────┐
│  Gemini Live 2.5     │   │  Google Search                 │
│  Flash (native audio)│   │  AAD · UpToDate · BMJ · 2026  │
│  Vertex AI / API Key │   │  dermatology guidelines        │
└──────────────────────┘   └───────────────────────────────┘
            │
            │  Deployed on Google Cloud Run
```

---

## Medical Disclaimer

> DermAssist AI is an AI assistant operating under physician oversight. All consultations are preliminary and informational — not a diagnosis or prescription. Always consult a licensed healthcare provider before starting or changing any treatment. In a medical emergency, call emergency services or go to the nearest ER immediately.

---

## References

- [Google ADK Streaming Guide](https://github.com/kazunori279/adk-streaming-guide/blob/main/workshops/workshop.md)
- [Google Agent Development Kit Docs](https://google.github.io/adk-docs/)
- [Gemini Live API](https://ai.google.dev/gemini-api/docs/live)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Google Cloud Run](https://cloud.google.com/run/docs)

---

*Built on Google ADK Live API · Powered by Gemini Live 2.5 Flash · Deployed on Google Cloud Run*



U can see the output at - https://my-agent-service-164027456696.us-central1.run.app