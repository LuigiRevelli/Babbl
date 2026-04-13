# Babbl

> Understand your baby's cries in 10 seconds and soothe them with your own cloned voice.

**Founded by Luigi Revelli Caracciolo** — [LinkedIn](https://www.linkedin.com/in/luigi-revelli/)

## The Problem

Infant crying is one of the most universal and most isolating experiences of early parenthood. Babies cry between 1 and 3 hours a day, and until they can speak, a cry is their only language. Parents are left guessing: hunger? fatigue? pain? a wet diaper? overstimulation?

The consequences of this guessing game are severely underestimated in public health:

- **1 in 7 mothers in France** develops postpartum depression (Sante Publique France), and unresolved crying episodes are one of the top triggers.
- **80% of new parents** report feeling "completely helpless" in front of a crying baby (WHO, 2022).
- Chronic sleep deprivation caused by cry-decoding at night is clinically linked to maternal burnout, couple breakdown, and in extreme cases shaken baby syndrome, which affects around 200 infants every year in France alone.

**This isn't a lack of love. It's a lack of information.**

Babbl tackles a silent public health crisis that sits at the intersection of maternal mental health, infant safety, and parental well-being — and has until now been left entirely to intuition.

## What It Does

Babbl is a mobile-first web app that helps parents understand why their baby is crying in under 10 seconds, and comforts the baby with the parent's own cloned voice.

### User journey

1. **Onboarding.** The parent sets up their profile once: baby's age, and optionally records 20 seconds of their own voice which is cloned with ElevenLabs. That cloned voice becomes the baby's personalized comforter.

2. **Recording.** When the baby cries, the parent opens the app, presses the record button, and holds the phone near the baby for 5 to 15 seconds.

3. **Analysis.** Under the hood, Babbl extracts 19 acoustic descriptors with *librosa* (pitch, energy, spectral features, MFCCs), feeds them into a trained *XGBoost* classifier, then sends everything to *Claude Sonnet* which reasons over the audio features, ML predictions, and parent context to return:
   - Weighted probabilities across cry causes (hunger, fatigue, discomfort, pain, overstimulation, need for comfort)
   - Key signals that drove the decision (traceable, not a black box)
   - Prioritized recommended actions
   - A confidence level and an alert field that escalates to "seek medical advice" when needed
   - A warm parent summary

4. **Result.** The parent sees a calm result screen with probability bars, the top cause highlighted, actions to try, and two audio buttons:
   - **"Listen to the summary"**: a warm voice (ElevenLabs) speaks the result to the parent.
   - **"Comfort my baby with my voice"**: the parent's cloned voice speaks an age-adapted comfort message matched to the detected cause.

5. **Dashboard.** Returning users land on a gamified dashboard: streaks, XP, levels, badges, daily affirmations, a guided breathing exercise for overwhelmed parents, and a full history of past analyses.

### A note on accuracy

The current model achieves 82.6% accuracy on the Donate-a-Cry dataset, but macro F1 is limited (18.1%) due to heavy class imbalance (the dataset is dominated by the "hungry" class). Babbl is a **triage-support tool**, not a clinical diagnostic, and the in-app confidence score always reflects that transparently.

## Tech Stack

### Frontend
- React (Vite), TypeScript, mobile-first (max-width 480px)
- Tailwind CSS + shadcn/ui component library
- Fraunces serif + Inter sans typography, warm cream/orange design system
- MediaRecorder API for audio capture
- localStorage for gamification state and user data

### Backend
- Python 3, Flask, Flask-CORS
- *librosa* for acoustic feature extraction (19 features: RMS, ZCR, spectral centroid/bandwidth/rolloff, MFCC 1-13, duration, silence ratio)
- *XGBoost* classifier (multi:softprob, trained on Donate-a-Cry with stratified split and class weighting)
- Context-aware triage rules that adjust predictions based on feeding/diaper/sleep schedules

### AI & APIs
- **Claude Sonnet** (Anthropic) — structured JSON reasoning over ML features + parent context, with temperature 0.3 and a system prompt enforcing warm tone and transparent signal attribution
- **ElevenLabs** — eleven_multilingual_v2 for TTS, and Instant Voice Cloning for the signature feature: cloning the parent's voice from a short sample to comfort the baby

### Scientific grounding
Feature set aligned with the Frontiers / IEEE / MDPI literature on infant cry analysis (F0, energy, spectral descriptors, MFCCs are the standard markers in academic classification).

## Roadmap

### 1. Improve model accuracy
Collect and label minority-class samples (pain, burping, discomfort, fatigue), apply data augmentation (pitch shift, time stretch, noise injection), and target a macro F1 above 60%. Validate on external datasets (Baby Chillanto, real hospital recordings).

### 2. On-device inference
Replace hand-crafted features with a dedicated audio model running on-device via WebAssembly + ONNX, so parents never upload audio. This would unlock anomaly detection for conditions like colic, reflux, or neurological distress.

### 3. Open dataset of annotated infant cries
Partner with maternity hospitals to collect a multi-thousand-sample dataset annotated by pediatricians. Release under an open license to advance global research on infant communication and early detection.

### 4. Clinical certification
Pursue CE medical device certification (Class IIa) to become the first cry-analysis tool prescribable by pediatricians and reimbursable by health insurance.

### 5. Community & professional layer
- Parent forum moderated by certified midwives and pediatric nurses
- "Ask a pediatrician" in one tap for high-alert analyses
- Night mode with baby monitor pairing (Nanit, Owlet) for automatic nighttime analysis

### 6. Parental mental health
- Weekly parental stress index with proactive partner alerts
- Co-parenting view to share the mental load
- Direct routing to professional support for at-risk parents

### 7. Global reach, local voice
Expand beyond French: clone voices and adapt comfort messages across 30+ languages. A baby should always hear home.

---

*Babbl exists so that no parent ever feels alone at 3 a.m. again.*
