"""Sons du test de bout en bout : un pleur synthétique (hauteur qui monte et
descend de ± 12 %, comme dans backend/tests/test_api.py) et un silence. Le
micro simulé de Chromium les joue à la place d'un vrai micro. numpy seul."""
import io
import os
import sys
import wave

import numpy as np

SR = 48000


def wav(y: np.ndarray) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((y * 32767).astype(np.int16).tobytes())
    return buf.getvalue()


def cry(seconds: float = 12.0, freq: float = 450.0) -> np.ndarray:
    t = np.linspace(0, seconds, int(SR * seconds), endpoint=False)
    contour = freq * (1 + 0.12 * np.sin(2 * np.pi * 0.8 * t))
    return 0.6 * np.sin(2 * np.pi * np.cumsum(contour) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * t))


out = sys.argv[1] if len(sys.argv) > 1 else "."
os.makedirs(out, exist_ok=True)
with open(os.path.join(out, "cry.wav"), "wb") as f:
    f.write(wav(cry()))
with open(os.path.join(out, "silence.wav"), "wb") as f:
    f.write(wav(np.zeros(SR * 12)))
print("ok", out)
