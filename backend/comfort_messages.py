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
    "newborn": {
        "hunger": "Chut, mon tout petit. Papa arrive. Chut. Je suis là.",
        "fatigue": "Doucement, mon amour. Chut. Ferme tes petits yeux. Papa est là.",
        "discomfort": "Chut. Papa te tient. Je suis là. Chut.",
        "need_for_comfort": "Je suis là, bébé. Je suis là. Chut. Papa te tient.",
    },
    "infant": {
        "hunger": "Mon bébé, Papa arrive tout de suite avec ce qu'il te faut. Je suis là.",
        "fatigue": "Doucement, mon amour. C'est l'heure de dormir. Ferme tes yeux, Papa est là.",
        "discomfort": "Je suis là, mon cœur. Papa s'occupe de toi. Là, là, bébé.",
        "need_for_comfort": "Mon petit, Papa est là. Je te tiens dans mes bras. Je suis là.",
    },
    "older_infant": {
        "hunger": "Mon amour, Papa arrive avec à manger. Un petit moment, je suis là. Je t'aime.",
        "fatigue": "Tu es fatigué, bébé. Viens contre Papa, on se repose ensemble.",
        "discomfort": "Papa est là, mon cœur. On regarde ensemble ce qui te gêne.",
        "need_for_comfort": "Papa est là, mon amour. Tu n'es pas tout seul. Je te serre fort.",
    },
    "toddler": {
        "hunger": "Mon amour, Papa arrive avec quelque chose à manger. Je suis là, respire doucement.",
        "fatigue": "Tu es fatigué, mon grand bébé. Viens, on fait un gros câlin et on se repose. Papa est là.",
        "discomfort": "Papa est là. Dis-moi ce qui te gêne, on regarde ensemble.",
        "need_for_comfort": "Papa est là, mon grand. Je te tiens. Je t'aime tellement.",
    },
}

assert all(set(bucket) == set(HYPOTHESIS_KEYS) for bucket in MESSAGES.values()), \
    "comfort_messages: les clés doivent être exactement celles de la taxonomie"


def generate_comfort_message(top_cause: str, age_months: int, parent_label: str = "father") -> str:
    bucket = age_bucket(age_months)
    messages = MESSAGES.get(bucket, MESSAGES["infant"])
    message = messages.get(top_cause, messages["need_for_comfort"])
    if parent_label.lower() == "mother":
        message = message.replace("Papa", "Maman")
    return message
