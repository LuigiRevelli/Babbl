"""
Generate a short, warm comfort message for the baby.

The message is spoken in the cloned parent voice via ElevenLabs after the
cry has been analyzed.
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
        "hunger": "Shhh, little one. Daddy is coming. Shhh. You are safe.",
        "fatigue": "Easy now, my love. Shhh. Close your tiny eyes. Daddy is here.",
        "discomfort": "Shhh. Daddy is holding you. Everything is okay. Shhh.",
        "pain": "There, there, sweetheart. Daddy is here. Shhh. I am holding you.",
        "overstimulation": "Shhh. It is calm now. Daddy is here. Shhh.",
        "need_for_comfort": "I am here, baby. I am here. Shhh. Daddy is holding you.",
    },
    "infant": {
        "hunger": "My baby, Daddy is coming right now with what you need. Everything is okay, I am here.",
        "fatigue": "Easy, my love. It is time to sleep. Close your eyes, Daddy is here.",
        "discomfort": "I am here, sweetheart. Daddy will fix it. There, there, baby, it will be okay.",
        "pain": "Oh baby, Daddy is here. I am holding you close. It will be okay, my love.",
        "overstimulation": "Shhh, everything is calm now. Close your eyes. Daddy is here, all is well.",
        "need_for_comfort": "My little one, Daddy is here. I am holding you in my arms. I am here.",
    },
    "older_infant": {
        "hunger": "My love, Daddy is coming with food right now. Just a moment, I am here. I love you.",
        "fatigue": "You are tired, baby. Come close to Daddy, we will rest together.",
        "discomfort": "Daddy is here, sweetheart. We will look at what is bothering you. It will be okay.",
        "pain": "I know it hurts, baby. Daddy is here, I am holding you. It will pass, my love.",
        "overstimulation": "Come close to Daddy, sweetheart. We will calm down together. It is just us.",
        "need_for_comfort": "Daddy is here, my love. You are not alone. I am holding you tight.",
    },
    "toddler": {
        "hunger": "My love, Daddy is coming with something to eat right now. I am here, breathe slowly.",
        "fatigue": "You are tired, big baby. Come, let us have a big cuddle and rest. Daddy is here.",
        "discomfort": "Daddy is here, tell me what is wrong. We will figure it out together, do not worry.",
        "pain": "I know, my love. Daddy is here, I am holding you. We will make this better together.",
        "overstimulation": "Come into my arms, we will calm down together. Daddy and you, all is well.",
        "need_for_comfort": "Daddy is here, my big one. You are safe. I love you so much.",
    },
}


def generate_comfort_message(top_cause: str, age_months: int, parent_label: str = "father") -> str:
    bucket = age_bucket(age_months)
    messages = MESSAGES.get(bucket, MESSAGES["infant"])
    message = messages.get(top_cause, messages["need_for_comfort"])
    if parent_label.lower() == "mother":
        message = message.replace("Daddy", "Mommy")
    return message
