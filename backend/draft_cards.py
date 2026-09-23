"""
Brouillons des cartes et repères de LISTE-FINALE-SYMPTOMES.md — NON PUBLIÉS.

Servi au parent UNIQUEMENT si BABBL_CARDS_V2=1 (triage_rules.safety_cards,
GET /api/cards) — interrupteur à n'activer qu'après relecture pédiatrique.
Par défaut (variable absente), les cartes v1 de triage_rules restent servies.
Il existe aussi pour :
  1. passer chaque texte au crible des cartes de sécurité (tests/test_draft_cards.py) ;
  2. produire le document de relecture pour un pédiatre
     (`python draft_cards.py > ../recherche/cartes-a-relire.md`).

Règles communes, tirées de la vérification adverse :
  - aucune carte n'est déclenchée ni modulée par le son ;
  - `trigger` vaut "always", "age" (mise en avant par l'âge seul) ou
    "parent_opens" (menu ouvert par le parent) ;
  - un seul jeu de seuils d'âge pour la respiration et la toux (le critique a
    relevé qu'un bébé de 2 mois qui tousse recevait sinon une urgence plus
    basse qu'un bébé de 5 mois avec une toux aboyante) ;
  - la phrase qui dit ce que Babbl n'entend pas est obligatoire.

Chaque carte porte `source` (texte grand public à recopier mot pour mot après
vérification) et `questions` (ce que le pédiatre doit trancher).
"""

from __future__ import annotations

STATUS = "brouillon — relecture pédiatrique requise avant publication"

DRAFT_CARDS: dict[str, dict] = {
    # ─── Toujours affichées ───────────────────────────────────────────
    "call_15": {
        "title": "Appelez le 15",
        "trigger": "always",
        "emphasize": "age_months < 3",
        "body": (
            "Appelez le 15 sans attendre si votre bébé pleure très faiblement ou gémit, "
            "s'il ne pleure plus du tout, s'il est mou ou difficile à réveiller, s'il refuse "
            "de boire, ou si son pleur est très différent de d'habitude. Avant 3 mois, une "
            "température de 38 °C ou plus impose aussi de consulter sans délai. Babbl "
            "n'entend pas ces signes : ce que vous voyez compte plus que l'enregistrement."
        ),
        "replaces": ["fever_under_3_months"],
        "covers": ["weak_or_absent_cry (n°4)", "high_pitched_monotone_cry (n°9)"],
        "source": "HAS, fièvre du nourrisson ; Ameli, signes de gravité chez le nourrisson",
        "questions": [
            "« Pleur très différent de d'habitude » est-il assez précis, ou faut-il lister (très aigu, gémissant, ininterrompu) ?",
            "Faut-il garder la fièvre dans cette carte ou une carte séparée, comme aujourd'hui ?",
        ],
    },
    "breathing_and_cough": {
        "title": "Respiration et toux",
        "trigger": "always",
        "emphasize": "age_months < 6",
        "body": (
            "Appelez le 15 si votre bébé respire vite ou avec effort, si la peau se creuse "
            "entre les côtes ou sous le cou, s'il fait un petit bruit plaintif à chaque "
            "expiration ou un bruit aigu en inspirant au calme, s'il fait des pauses "
            "respiratoires, devient bleu, gris ou très pâle, ou boit moins de la moitié de "
            "d'habitude. Avant 3 mois, une toux, même sans fièvre, doit faire voir un médecin "
            "rapidement. La coqueluche peut toucher un bébé sans toux ni « chant du coq » : "
            "des pauses ou un bébé qui bleuit peuvent être les seuls signes. Ces signes se "
            "voient et s'entendent : c'est vous qui les repérez, pas le micro de Babbl."
        ),
        "replaces": ["breathing"],
        "covers": [
            "expiratory_grunting (n°5)", "inspiratory_stridor (n°21)",
            "audible_wheeze_and_breathing_rate (n°19)", "paroxysmal_cough_with_whoop (n°10)",
            "cough_event_presence (n°11)",
        ],
        "source": "HAS/CNPP 2019, conseils aux parents, bronchiolite ; Ameli, coqueluche ; Ameli, toux du nourrisson",
        "questions": [
            "Répartition 15 / médecin le jour même / prochain rendez-vous : la fiche HAS 2019 en distingue plusieurs, la carte envoie tout au 15. Quelle répartition recopier ?",
            "Seuil d'âge unique pour la toux : 3 mois (Ameli) ou 6 mois (laryngite) ?",
            "Pauses respiratoires : quel seuil distingue la respiration périodique normale du nouveau-né d'une pause qui justifie le 15 ?",
        ],
    },
    "newborn_under_15_days": {
        "title": "Nouveau-né de moins de 15 jours",
        "trigger": "always",
        "emphasize": "age_days < 15",
        "body": (
            "Avant 15 jours : si la peau ou le blanc des yeux de votre bébé jaunit, s'il tète "
            "mal, s'il est très somnolent ou difficile à réveiller, appelez un médecin le jour "
            "même. La jaunisse se vérifie par une mesure, pas avec le micro."
        ),
        "replaces": ["newborn_under_15_days"],
        "covers": ["cry_change_in_neonatal_jaundice (n°33)"],
        "source": "HAS, sortie de maternité ; carnet de santé, carte colorimétrique des selles",
        "questions": [
            "Ajouter une ligne sur les selles décolorées (carte colorimétrique du carnet) ?",
        ],
    },
    "never_shake": {
        "title": "Si vous êtes à bout",
        "trigger": "always",
        "placement": "avant le bouton d'enregistrement",
        "body": (
            "Si vous vous sentez à bout, couchez bébé sur le dos dans son lit, sortez de la "
            "pièce et appelez quelqu'un. On ne secoue jamais un bébé."
        ),
        "covers": ["cry_quantity_duration_log (n°1)"],
        "source": "Santé publique France / HAS, prévention du syndrome du bébé secoué",
        "questions": ["Faut-il ajouter un numéro d'écoute parentale ?"],
    },
    # ─── Menu « Quand appeler » et menus ouverts par le parent ────────
    "when_to_call_breath_holding": {
        "title": "Votre bébé arrête de respirer en pleurant",
        "trigger": "parent_opens",
        "body": (
            "Si votre bébé, en pleurant ou à tout autre moment, arrête de respirer, devient "
            "bleu, gris ou très pâle, devient tout mou ou ne réagit plus : appelez le 15 "
            "immédiatement. Ne le secouez jamais. Une fois l'épisode passé, notez l'heure ; "
            "s'il se reproduit, filmez-le avec l'appareil photo pour le montrer à un médecin."
        ),
        "covers": ["breath_holding_after_cry (n°12)"],
        "source": "SFP, spasme du sanglot",
        "questions": ["Avant 6 mois, faut-il dire explicitement qu'un bilan est nécessaire ?"],
    },
    "when_to_call_spasms": {
        "title": "Mouvements brusques en série",
        "trigger": "parent_opens",
        "body": (
            "Des mouvements brusques qui se répètent en série, surtout au réveil, avec ou "
            "sans pleurs : filmez-les avec l'appareil photo de votre téléphone et faites voir "
            "votre bébé par un médecin rapidement."
        ),
        "covers": ["spasmes du nourrisson (signal manquant, critique n°13)"],
        "source": "Société française de neurologie pédiatrique (à vérifier)",
        "questions": ["Ce libellé correspond-il aux recommandations françaises ? Quel délai écrire ?"],
    },
    "cough_menu": {
        "title": "Toux",
        "trigger": "parent_opens",
        "body": (
            "Babbl n'analyse pas la toux : le son ne dit pas si elle est grasse, sèche ou "
            "grave. Une toux rauque qui ressemble à un aboiement, avec un bruit en inspirant, "
            "demande un avis médical, et le 15 si votre bébé a du mal à respirer. Gardez-le "
            "au calme, près de vous. Vous pouvez enregistrer la toux pour la faire écouter à "
            "votre médecin : Babbl ne l'analyse pas."
        ),
        "covers": ["barking_cough (n°7)", "wet_vs_dry_cough (n°14)"],
        "source": "Ameli, laryngite de l'enfant",
        "questions": [
            "Seuil « moins de 6 mois → 15 » pour la toux aboyante : le garder, ou l'aligner sur la carte Respiration et toux ?",
            "Enregistrer la toux pour le médecin impose un hébergement de données de santé : fonctionnalité à garder ?",
        ],
    },
    "blocked_nose_menu": {
        "title": "Nez bouché, bruit en respirant",
        "trigger": "parent_opens",
        "body": (
            "Beaucoup de bébés font du bruit en respirant quand leur nez est encombré, "
            "surtout quand ils sont enrhumés. Le geste conseillé : laver le nez au sérum "
            "physiologique, en particulier avant les tétées et le coucher. Babbl n'analyse pas "
            "la respiration et ne peut pas dire d'où vient ce bruit : les signes de la carte "
            "Respiration et toux imposent d'appeler le 15."
        ),
        "covers": ["stertor_nasal_obstruction_noise (n°8)"],
        "source": "HAS 2019, lavage de nez",
        "questions": ["La première phrase peut-elle être lue comme une réassurance ? Faut-il la retirer ?"],
    },
    "hoarse_voice_menu": {
        "title": "Voix enrouée",
        "trigger": "parent_opens",
        "body": (
            "Babbl n'analyse pas la voix de votre bébé et ne peut pas dire si elle a changé. "
            "Parlez-en à votre médecin si la voix enrouée dure plus de deux semaines, si elle "
            "existe depuis la naissance, ou si votre bébé fait un bruit en inspirant, "
            "s'étouffe ou tousse en buvant, ou a du mal à téter. Appelez le 15 s'il respire "
            "difficilement."
        ),
        "covers": ["hoarse_breathy_or_aphonic_voice (n°13)", "bruits de tétée (critique n°15)"],
        "source": "AFPA, dysphonie de l'enfant (à vérifier)",
        "questions": ["Le délai de deux semaines est-il le bon repère chez le nourrisson ?"],
    },
    # ─── Repères, identiques pour tous ────────────────────────────────
    "milestone_babbling": {
        "title": "Repère : les syllabes « ba-ba »",
        "trigger": "age",
        "emphasize": "10 <= age_months <= 12",
        "body": (
            "Vers 10 mois, la plupart des bébés enchaînent des syllabes comme « ba-ba » ou "
            "« da-da ». Si vous ne les avez encore jamais entendues, parlez-en au médecin à la "
            "visite du 9e ou du 12e mois et demandez-lui de vérifier l'audition. Si votre bébé "
            "est né prématuré, dites-le-lui aussi. Babbl n'analyse pas le babillage."
        ),
        "covers": ["canonical_babbling_onset (n°2)"],
        "source": "Carnet de santé 2018, repères de développement",
        "questions": ["10 mois d'âge réel : repère juste, ou faut-il écrire 10-12 mois ?"],
    },
    "milestone_hearing": {
        "title": "Repère : l'audition",
        "trigger": "always",
        "body": (
            "Le test de l'audition fait à la maternité a-t-il été réalisé, et son résultat "
            "est-il noté dans le carnet de santé ? Si vous avez un doute sur l'audition de "
            "votre bébé (il ne sursaute pas aux bruits forts, ne se tourne pas vers votre "
            "voix), parlez-en à votre médecin, même si le test était bon. Le pleur ne permet "
            "pas de savoir si un bébé entend bien."
        ),
        "covers": ["hearing_signal_from_cry (n°20)"],
        "source": "Santé publique France, dépistage de la surdité permanente néonatale",
        "questions": [],
    },
    "tip_vocal_turns": {
        "title": "Conseil : lui répondre",
        "trigger": "parent_opens",
        "body": (
            "Quand votre bébé fait des petits sons, vous pouvez lui répondre doucement, puis "
            "laisser un court silence pour qu'il « réponde » à son tour. Ce conseil ne dit "
            "rien de sa santé ni de son développement."
        ),
        "covers": ["vocal_turn_taking (n°6)", "positive_prelinguistic_vocalisations (n°15)"],
        "source": "Contenu éducatif général",
        "questions": [],
    },
}

# FAQ « Ce que Babbl ne fait pas » — éditorial, hors du parcours d'enregistrement.
DRAFT_FAQ: dict[str, str] = {
    "cause": "Babbl ne traduit pas les pleurs : le son ne dit pas si votre bébé a faim, sommeil, "
             "besoin d'un rot ou des gaz. Les pistes que Babbl propose viennent de ce que vous saisissez.",
    "dunstan": "Les « cinq sons » de la méthode Dunstan n'ont jamais été confirmés par une étude "
               "indépendante. Babbl ne les utilise pas.",
    "teeth_belly_ears": "Le son d'un pleur ne permet pas de savoir si un bébé a mal aux dents, au ventre "
                        "ou aux oreilles. Si quelque chose vous inquiète, appelez votre médecin, ou le 15 "
                        "en cas d'urgence.",
    "development": "Babbl ne suit pas le développement de votre bébé. Si son regard, son sourire, sa "
                   "réaction à votre voix ou son babillage vous posent question, parlez-en à votre médecin, "
                   "par exemple à l'examen du 9e mois.",
}


def render_review_markdown() -> str:
    lines = [
        "# Cartes à relire — Babbl",
        "",
        f"> Statut : {STATUS}. Généré depuis `backend/draft_cards.py` ; ne pas éditer ici.",
        "> Chaque texte a passé le filtre automatique de Babbl (aucun pourcentage, aucune réassurance, aucun « détecté »).",
        "> Ce qui est demandé au relecteur : valider ou corriger chaque texte, et répondre aux questions.",
        "",
    ]
    for key, c in DRAFT_CARDS.items():
        lines += [f"## {c['title']}", ""]
        where = {"always": "toujours affichée", "age": "affichée selon l'âge", "parent_opens": "ouverte par le parent"}[c["trigger"]]
        extra = f", mise en avant si {c['emphasize']}" if c.get("emphasize") else ""
        lines += [f"*{where}{extra}.*", "", f"> {c['body']}", "", f"**Source à recopier :** {c['source']}", ""]
        if c["questions"]:
            lines += ["**Questions :**", ""] + [f"- {q}" for q in c["questions"]] + [""]
    lines += ["## FAQ « Ce que Babbl ne fait pas »", ""]
    lines += [f"- {text}" for text in DRAFT_FAQ.values()]
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    print(render_review_markdown(), end="")
