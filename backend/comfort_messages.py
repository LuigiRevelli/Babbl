"""
Message de réconfort prononcé au bébé avec la voix clonée du parent.

Rattaché à l'hypothèse contextuelle, à l'âge et au parent — jamais à un
« état détecté ». Aucune phrase ne parle de santé ni ne rassure sur l'état du
bébé (« tout va bien », « ça va passer » ont été retirés : entendus par le
parent et stockés dans l'historique, ce sont des réassurances). Les clés
sont exactement celles de `taxonomy.CONTEXT_HYPOTHESES`.

Chaque phrase passe le crible de `tests/test_honesty.py`.
"""

from taxonomy import HYPOTHESIS_KEYS


def age_bucket(age_months: int) -> str:
    if age_months < 3:
        return "newborn"
    if age_months < 6:
        return "infant"
    if age_months < 12:
        return "older_infant"
    return "toddler"


MESSAGES = {
    # Aucune phrase n'affirme un état ou un besoin (« tu es fatigué », « c'est
    # l'heure de dormir », « tu as faim ») : l'hypothèse vient de ce que le
    # parent a saisi, pas du bébé, et la voix clonée la ferait entendre comme
    # un constat. Aucun accord de genre (« mon petit », « tout seul ») : le
    # sexe du bébé n'est pas connu. Les clés suivent la taxonomie.
    "newborn": {
        "hunger": "Chut, mon bébé. Papa arrive. Chut. Je suis là.",
        "fatigue": "Doucement, mon amour. Chut. Papa est là, tout près.",
        "discomfort": "Chut. Papa te tient. Je suis là. Chut.",
        "need_for_comfort": "Je suis là, mon bébé. Je suis là. Chut. Papa te tient.",
    },
    "infant": {
        "hunger": "Mon bébé, Papa arrive tout de suite. Je suis là.",
        "fatigue": "Doucement, mon amour. Chut. Papa est là, on se pose ensemble.",
        "discomfort": "Je suis là, mon cœur. Papa s'occupe de toi. Là, là, mon bébé.",
        "need_for_comfort": "Mon trésor, Papa est là. Je te tiens dans mes bras. Je suis là.",
    },
    "older_infant": {
        "hunger": "Mon amour, Papa arrive. Un petit moment, je suis là. Je t'aime.",
        "fatigue": "Doucement, mon bébé. Viens contre Papa, on se pose ensemble.",
        "discomfort": "Papa est là, mon cœur. On regarde ensemble.",
        "need_for_comfort": "Papa est là, mon amour. Je suis avec toi. Je te serre fort.",
    },
    "toddler": {
        "hunger": "Mon amour, Papa arrive. Je suis là, respire doucement.",
        "fatigue": "Doucement, mon trésor. Viens, on fait un gros câlin. Papa est là.",
        "discomfort": "Papa est là. On regarde ensemble, doucement.",
        "need_for_comfort": "Papa est là, mon trésor. Je te tiens. Je t'aime tellement.",
    },
}

assert all(set(bucket) == set(HYPOTHESIS_KEYS) for bucket in MESSAGES.values()), \
    "comfort_messages: les clés doivent être exactement celles de la taxonomie"


def generate_comfort_message(top_cause: str, age_months: int | None, parent_label: str = "father") -> str:
    bucket = age_bucket(age_months if age_months is not None else 3)
    messages = MESSAGES.get(bucket, MESSAGES["infant"])
    message = messages.get(top_cause, messages["need_for_comfort"])
    if parent_label.lower() == "mother":
        message = message.replace("Papa", "Maman")
    return message
