"""
Génère un court message de réconfort chaleureux pour le bébé.

Le message est prononcé avec la voix clonée du parent via ElevenLabs
après l'analyse des pleurs.
"""


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
        "hunger": "Chut, mon tout petit. Papa arrive. Chut. Tu es en sécurité.",
        "fatigue": "Doucement, mon amour. Chut. Ferme tes petits yeux. Papa est là.",
        "discomfort": "Chut. Papa te tient. Tout va bien. Chut.",
        "pain": "Là, là, mon cœur. Papa est là. Chut. Je te tiens.",
        "overstimulation": "Chut. C'est calme maintenant. Papa est là. Chut.",
        "need_for_comfort": "Je suis là, bébé. Je suis là. Chut. Papa te tient.",
    },
    "infant": {
        "hunger": "Mon bébé, Papa arrive tout de suite avec ce qu'il te faut. Tout va bien, je suis là.",
        "fatigue": "Doucement, mon amour. C'est l'heure de dormir. Ferme tes yeux, Papa est là.",
        "discomfort": "Je suis là, mon cœur. Papa va arranger ça. Là, là, bébé, ça va aller.",
        "pain": "Oh bébé, Papa est là. Je te serre contre moi. Ça va aller, mon amour.",
        "overstimulation": "Chut, tout est calme maintenant. Ferme tes yeux. Papa est là, tout va bien.",
        "need_for_comfort": "Mon petit, Papa est là. Je te tiens dans mes bras. Je suis là.",
    },
    "older_infant": {
        "hunger": "Mon amour, Papa arrive avec à manger. Un petit moment, je suis là. Je t'aime.",
        "fatigue": "Tu es fatigué, bébé. Viens contre Papa, on va se reposer ensemble.",
        "discomfort": "Papa est là, mon cœur. On va regarder ce qui te gêne. Ça va aller.",
        "pain": "Je sais que ça fait mal, bébé. Papa est là, je te tiens. Ça va passer, mon amour.",
        "overstimulation": "Viens contre Papa, mon cœur. On va se calmer ensemble. Y'a que nous.",
        "need_for_comfort": "Papa est là, mon amour. Tu n'es pas tout seul. Je te serre fort.",
    },
    "toddler": {
        "hunger": "Mon amour, Papa arrive avec quelque chose à manger. Je suis là, respire doucement.",
        "fatigue": "Tu es fatigué, mon grand bébé. Viens, on fait un gros câlin et on se repose. Papa est là.",
        "discomfort": "Papa est là, dis-moi ce qui ne va pas. On va trouver ensemble, t'inquiète pas.",
        "pain": "Je sais, mon amour. Papa est là, je te tiens. On va arranger ça ensemble.",
        "overstimulation": "Viens dans mes bras, on va se calmer ensemble. Papa et toi, tout va bien.",
        "need_for_comfort": "Papa est là, mon grand. Tu es en sécurité. Je t'aime tellement.",
    },
}


def generate_comfort_message(top_cause: str, age_months: int, parent_label: str = "father") -> str:
    bucket = age_bucket(age_months)
    messages = MESSAGES.get(bucket, MESSAGES["infant"])
    message = messages.get(top_cause, messages["need_for_comfort"])
    if parent_label.lower() == "mother":
        message = message.replace("Papa", "Maman")
    return message
