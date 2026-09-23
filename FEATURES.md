# Babbl — Toutes les Features

## 5 Features Signature

### 1. Babbl Cry — Ce qu'un pleur prouve, et ce qu'il ne prouve pas

Le parent enregistre 10 secondes de pleurs. Babbl dit honnêtement ce que le son permet de dire (presque rien), propose des pistes tirées de ce que le parent a saisi, et affiche des repères de sécurité fixes. Voir `LISTE-FINALE-SYMPTOMES.md`.

**Comment ça marche :**
1. Le parent appuie sur Record et approche le téléphone du bébé. Micro brut : réduction de bruit, réglage automatique du volume et annulation d'écho désactivés.
2. Le backend extrait des descripteurs avec librosa, dont la hauteur (pyin) et la part des trames voisées.
3. **Porte d'entrée** : si Babbl n'entend pas de pleur net, il refuse de répondre, rappelle qu'un bébé qui pleure peu n'est jamais rassurant en soi, et affiche les cartes de sécurité.
4. **Observation** : une phrase sur la continuité du pleur pendant le clip (presque continu, coupé de pauses, entrecoupé de longues pauses). Jamais un chiffre, jamais stockée.
5. **Pistes** tirées du contexte saisi (dernière tétée, couche, durée d'éveil, âge), jamais du son, jamais en pourcentage.
6. Claude Sonnet rédige le résumé à partir de ces deux couches, sous garde-fou : aucun pourcentage, aucun nom de maladie, aucune réassurance.

**Ce que le parent reçoit :**
- L'observation en une phrase, et ce que le son ne permet pas de dire
- Les pistes à essayer, avec leur provenance
- Trois cartes de sécurité fixes, toujours affichées
- Un résumé vocal (ElevenLabs) et un message de réconfort dans la voix du parent

**Ce que Babbl ne donne plus :** cause du pleur, pourcentage de confiance, alerte médicale. L'ancien classifieur XGBoost (Donate-a-Cry, 457 clips **étiquetés par les parents contributeurs**, pas par des pédiatres) obtenait 82,6 % de justesse, moins que répondre toujours « faim » (83,6 %). Il est débranché.

---

### 2. Babbl Voice — Clonage de Voix Parental

Le parent enregistre 20 secondes de sa voix. ElevenLabs la clone. L'app peut alors parler au bébé avec la voix de maman ou papa.

**Comment ça marche :**
1. Le parent enregistre un échantillon de 20 secondes pendant l'onboarding.
2. ElevenLabs (Instant Voice Cloning) crée le clone.
3. Après chaque analyse, le parent peut appuyer sur « Réconforter avec ma voix ».
4. Le message est adapté à l'âge et au ton de la piste retenue, mais **n'affirme jamais un état** : pas de « tu es fatigué », pas de « tu as faim » (la piste vient de ce que le parent a saisi, pas du bébé). Un test l'impose (`backend/tests/test_honesty.py`).
5. Le message est signalé comme voix synthétique (AI Act, art. 50).

**Cas d'usage :** bébé qui pleure la nuit pendant que le parent arrive ; conjoint qui lance la voix de l'absent ; baby-sitter.

---

### 3. Babbl Lullaby — Berceuse IA Personnalisée (à construire)

Une berceuse unique chantée dans la voix clonée du parent, avec le prénom du bébé.

1. Claude Sonnet écrit les paroles : prénom, langue, heure du jour. **Jamais** « l'état détecté » du bébé : Babbl n'en détecte aucun.
2. Musique générée (ElevenLabs Music ou équivalent), tempo lent.
3. La voix clonée chante les paroles. Le fichier est marqué comme contenu synthétique.

Coût estimé : ~0,15-0,25 € par berceuse. C'est la fonctionnalité la plus partageable.

---

### 4. Babbl Repères — Cartes de sécurité et repères de santé publique

Des contenus fixes, identiques pour tous, **jamais déduits du son** (voir `LISTE-FINALE-SYMPTOMES.md`).

- **En production** : trois cartes toujours affichées, y compris quand Babbl refuse un enregistrement : fièvre avant 3 mois, respiration, nouveau-né de moins de 15 jours. Mises en avant selon l'âge seul.
- **En brouillon, à faire relire par un pédiatre** (`backend/draft_cards.py`, `recherche/cartes-a-relire.md`) : « Appelez le 15 », « Respiration et toux » avec un seul jeu de seuils d'âge, « Si vous êtes à bout » avant le bouton d'enregistrement, menus Toux, Nez bouché, Voix enrouée, Quand appeler, repères babillage et audition.
- Toujours gratuits, dans toutes les offres.

---

### 5. Ce qui l'a calmé (en construction)

À la réouverture de l'app, une question : qu'est-ce qui l'a calmé ? Tétée, couche ou position, sommeil, bras et voix, votre voix Babbl, rien encore, je ne sais pas.

- La seule étiquette honnête que Babbl peut collecter : elle vient du parent, pas du son.
- Elle nourrit un futur résumé pour le médecin fait **uniquement de vos saisies**, jamais d'une mesure sonore.
- Jamais posée par notification la nuit.

---

## Abandonné ou gelé, et pourquoi

| Idée | Statut | Raison |
|---|---|---|
| **Babbl Nuit** (écoute continue, réponse automatique, rapport matinal) | Abandonné | Capter en continu les paroles d'une pièce touche l'art. 226-1 du code pénal. Compter les pleurs revient à surveiller un processus physiologique : règle 11b du règlement européen sur les dispositifs médicaux. |
| **Babbl Monitor** (baby phone matériel qui « comprend » et répond seul) | Gelé | Même problème que Babbl Nuit, plus une promesse de compréhension que le son ne permet pas. Un baby phone simple, sans analyse, reste possible un jour. |
| **Babbl Alert** (alertes vert/jaune/orange/rouge, pédiatre choisi selon la cause) | Abandonné | Trier à partir du son est une décision à finalité diagnostique : dispositif médical de classe IIa minimum, sans preuve clinique possible. L'absence d'alerte se lirait comme un feu vert. Les repères de sécurité remplacent tout ça. |
| **Babbl Baseline** (écart au profil acoustique habituel) | Débranché | Le score mesurait surtout la distance du téléphone : même pleur, score de 7 à 74. « Pas d'écart » est une fausse réassurance. |
| **Classifieur de cause** (faim, fatigue, douleur en %) | Débranché | Il faisait moins bien que répondre toujours « faim ». Aucune étude ne montre qu'un pleur porte sa cause. |
| **Tendances « il pleure plus entre 2h et 5h »** | Retiré | Un nombre d'enregistrements n'est pas une fréquence de pleurs, et le jugement « il pleure trop » est le facteur de risque mesuré du bébé secoué. |

---

## Features Complémentaires

### Dashboard
- Séries et affirmations quotidiennes pour encourager le parent.
- À revoir : aucune récompense pour enregistrer plus (XP, badge « Night Owl »), cf. `ROADMAP-BACKEND.md`.

### Exercice de Respiration (4-4-6)
- Exercice guidé pour les parents submergés, gratuit, accessible à tout moment.

### Night Mode (manuel)
- Interface sombre pour ne pas éblouir la nuit.

### Historique
- Liste des analyses passées : observation, pistes, heure. Aucune tendance, aucune courbe, aucun « pattern ».

### Contexte Parental
- Dernière tétée, dernière couche, durée d'éveil, date de naissance.
- C'est la **seule source** des pistes proposées.

---

## Tech Stack

| Composant | Technologie |
|---|---|
| Frontend | React (Vite), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python 3, Flask |
| Analyse audio | librosa : porte d'entrée (pyin dans la bande du pleur) et continuité |
| Règles | `triage_rules.py` : porte, observation, pistes, cartes |
| Rédaction | Claude Sonnet, sous garde-fou (`sanitize_llm_output`) |
| Voix / TTS | ElevenLabs (eleven_multilingual_v2 + Instant Voice Cloning) |
| Banc de mesure | Donate-a-Cry, 366 vrais pleurs au téléphone (`backend/bench/gate_bench.py`) |

---

## Accès par Palier

| Feature | Free | Babbl+ (6,99 €/mois) | Babbl Voice (9,99 €/mois) |
|---|---|---|---|
| Analyse (observation + pistes) | 5/jour | Illimité | Illimité |
| Repères de sécurité | **Toujours** | **Toujours** | **Toujours** |
| Gestes à essayer | 1er seulement | Tous | Tous |
| Résumé lu à voix haute | Non | Oui | Oui |
| Historique | 7 jours | Complet | Complet |
| Exercice respiration | Oui | Oui | Oui |
| Voix clonée | Non | Non | 2 voix (maman + papa) |
| Babbl Lullaby | Non | Non | Oui |
| Ce qui l'a calmé | Oui | Oui | Oui |
| Publicité | Oui | Non | Non |

---

*Babbl existe pour qu'aucun parent ne se sente seul à 3h du matin.*
