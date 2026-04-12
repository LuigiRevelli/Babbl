# BabyCare

> Understand your baby's cries in 10 seconds and soothe them with your own cloned voice.


## The Problem

Infant crying is one of the most universal and most isolating experiences of early parenthood. Babies cry between 1 and 3 hours a day, and until they can speak, a cry is their only language. Parents are left guessing: hunger? fatigue? pain? a wet diaper? overstimulation?

The consequences of this guessing game are severely underestimated in public health:

- *1 in 7 mothers in France* develops postpartum depression (Santé Publique France), and unresolved crying episodes are one of the top triggers.
- *80% of new parents* report feeling "completely helpless" in front of a crying baby (WHO, 2022).
- Chronic sleep deprivation caused by cry-decoding at night is clinically linked to maternal burnout, couple breakdown, and in extreme cases shaken baby syndrome, which kills or permanently disables around 200 infants every year in France alone.
- Our own cousin Sarah held on for 4 months after giving birth. Then she collapsed into a full maternal burnout. Her marriage nearly ended. Her words were: "I knew he needed something. I just didn't know what."

*This isn't a lack of love. It's a lack of information.*

BabyCare tackles a silent public health crisis that sits at the intersection of maternal mental health, infant safety, and parental well-being, and has until now been left entirely to intuition.

## What It Does

BabyCare is a mobile-first web app that helps parents understand why their baby is crying in under 10 seconds, and even comforts the baby with the parent's own cloned voice.

*User journey:*

1. *Onboarding.* The parent sets up their profile once: baby's age, and optionally records 20 seconds of their own voice which we clone with ElevenLabs. That cloned voice becomes the baby's personalized comforter.

2. *New analysis.* When the baby cries, the parent opens the app and follows a warm 3-step wizard:
   - *Step 1.* Quick context: time since last feeding, last sleep, diaper state.
   - *Step 2.* Baby's current position (illustrated card grid: back, tummy, held upright, cradled, etc.).
   - *Step 3.* They press the big record button and hold the phone near the baby for 5 to 15 seconds. A live waveform confirms the mic is picking up sound. Alternatively, they can upload an audio file.

3. *Analysis.* Under the hood, BabyCare extracts objective acoustic descriptors with *librosa* (F0/pitch, RMS energy, ZCR, spectral centroid/bandwidth/rolloff, MFCCs 1-13, duration, silence ratio), feeds them into a trained *XGBoost* multi-class classifier (multi:softprob, trained on the Donate-a-Cry dataset with stratified 80/20 split and class weighting), then sends the features, the ML prediction, and the parent context to *Mistral Large* which reasons over all of it and returns:
   - Weighted probabilities across cry causes (hunger, fatigue, discomfort, pain, burping, need for comfort)
   - Key signals that drove the decision (traceable, not a black box)
   - Prioritized recommended actions in warm French
   - A confidence level and an alert field that escalates to "seek medical advice" when needed
   - A gentle parent summary

4. *Result.* The parent sees a calm result screen with probability bars, the top cause highlighted, actions to try, and two audio buttons:
   - 🔊 "Listen to the summary": a warm voice (ElevenLabs Rachel) speaks the result directly to the parent.
   - ▶️ "Comfort my baby with my voice": the parent's cloned voice speaks an age-adapted comfort message matched to the detected cause (e.g. "Shh shh my baby, mommy is coming with your milk" for a hungry newborn).

5. *Dashboard and retention.* Returning users land on a gamified dashboard: streaks 🔥, XP, levels, badges ("First cry", "Three days in a row", "50 days in a row"), rotating daily affirmations, a 1-minute guided breathing exercise for overwhelmed parents, and a full history of past analyses. Duolingo-style mechanics because a parent who logs cries learns their baby and decompresses each day.

*Honest on accuracy.* Our offline evaluation on Donate-a-Cry shows 82.6% accuracy and 75.7% weighted F1, but a macro F1 of only 18.1% because the dataset is heavily dominated by the hungry class (382 of 457 samples). We own this transparently: BabyCare is a solid *triage-support tool* today, not a clinical diagnostic, and the in-app confidence score always reflects that.

## Tech Stack

*Frontend*
- React (Vite), mobile-first, max-width 480px, warm cream/orange design system
- CSS variables + Fraunces serif + Inter sans typography
- MediaRecorder API + Web Audio AnalyserNode for the live waveform
- Hand-drawn SVG illustrations (no stock assets)
- localStorage for gamification state (XP, streaks, badges, cloned voice ID)

*Backend*
- Python 3 + Flask + Flask-CORS
- *librosa* for objective acoustic feature extraction (F0, RMS, ZCR, spectral centroid/bandwidth/rolloff, MFCC 1-13, duration, silence)
- *XGBoost* XGBClassifier (multi:softprob), trained on Donate-a-Cry with stratified 80/20 split and compute_sample_weight to offset class imbalance
- scikit-learn, numpy for preprocessing and evaluation
- ffmpeg for webm decoding
- python-dotenv for secret management

*AI / APIs*
- Mistral Large 🚀 (mistral-large-latest), structured JSON reasoning over ML features + parent context, with response_format: json_object, temperature: 0.3, and a strict system prompt that forces warm French output and transparent signal attribution
- ElevenLabs 🚀, eleven_multilingual_v2 for TTS, and Instant Voice Cloning (/v1/voices/add) for the signature feature: cloning the parent's voice from a 20-second sample to comfort the baby

*Scientific grounding*
- Feature set aligned with the Frontiers / IEEE / MDPI literature on infant cry analysis (F0, energy, spectral descriptors, MFCCs are the standard markers in academic classification of infant cries)

## Special Track

Are you submitting to a special track? If so, which one?

- [ ] Alan Play: Living Avatars
- [ ] Alan Play: Mo Studios
- [X] Alan Play: Personalized Wrapped
- [ ] Alan Play: Health App in a Prompt
- [ ] Alan Precision

BabyCare is a perfect fit for *Personalized Wrapped. Every analysis is deeply personal: it's tied to a specific baby, a specific parent's voice, a specific context. We already collect the full history of a baby's cries, top causes, streaks, and parental stress patterns. A *"BabyCare Wrapped"* at the end of each month or year is a natural extension: *"This month your baby cried 47 times. The main reason was hunger (62%). You soothed him with your voice 31 times. Your longest streak was 14 days. You've unlocked 6 badges." It turns a stressful period into a celebration of the bond between parent and child, and gives the parent something warm and shareable to look back on during the hardest year of their life.

## What We'd Do Next

Our vision for BabyCare goes far beyond a single-parent tool. If we had more time, here's what we'd build, in order of ambition:

### 🔬 1. Fix the data imbalance and reach clinical-grade accuracy
Our current macro F1 of 18.1% is the first thing we'd attack. We'd collect and label minority-class samples aggressively (belly pain, burping, discomfort, tired), apply data augmentation (pitch shift, time stretch, noise injection), and target a macro F1 above 60% before any clinical claim. We'd also validate externally on Baby Chillanto and on real hospital recordings to measure true generalization.

### 🧠 2. A dedicated on-device foundation model ("CryNet")
Replace hand-crafted librosa features with a dedicated audio foundation model, a "Whisper for babies", trained on our own clinically-annotated dataset and running on-device via WebAssembly + ONNX so parents never upload audio. This would unlock anomaly detection for conditions like colic, reflux, neurological distress, or even early hearing loss.

### 🌍 3. A world-first open dataset of annotated infant cries
Partner with French maternity hospitals and PMI centers to collect, with full parental consent and on-device anonymization, a multi-thousand-sample dataset annotated by pediatricians. Release it under an open license to advance global research on infant communication, SIDS prevention, and early autism detection (crying patterns are a known early marker).

### 🩺 4. From consumer app to clinical tool
Pursue CE medical device certification (Class IIa) to become the first cry-analysis tool prescribable by pediatricians and reimbursable by French Sécurité Sociale and mutuelles.

### 👩‍⚕️ 5. A community and professional layer
- *Parent forum* moderated by certified midwives and pediatric nurses.
- *"Ask a pediatrician" in one tap* for high-alert analyses, partnered with Alan or Livi.
- *Night mode with baby monitor pairing* (Nanit, Owlet) to auto-analyze cries during the night.

### 🌬️ 6. A parental mental health layer
- *Sarah Score™, a weekly maternal stress index with proactive partner alerts ("your partner had 12 nighttime alerts this week, take the next shift"*) and a direct line to postpartum depression helplines.
- *Partner co-parenting view* to share the mental load that today falls disproportionately on mothers.
- *Integration with Alan's mental health services* to route at-risk parents to professional support instantly.

### 🌍 7. Global reach, local voice
Expand beyond French: clone voices and adapt comfort messages across 30+ languages. An Arabic lullaby for an Algerian mom in Marseille, an Ewe phrase for a Togolese dad in Paris. *A baby should always hear home.*

---

*In one sentence:* we want BabyCare to become the single piece of software that every parent on Earth installs the day their baby is born, and that every pediatrician consults the day a parent walks into their office. Because *no parent should ever feel alone at 3 a.m. again.*
