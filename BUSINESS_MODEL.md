# Babbl — Business Model Économique

## Psychologie du Parent qui Paie

| Levier psychologique | Impact | Comment l'exploiter |
|---|---|---|
| **Peur** — "Et si c'était grave ?" | Très fort | Le résultat détaillé (payant) rassure |
| **Culpabilité** — "Je devrais tout faire pour mon bébé" | Très fort | "89% des parents Babbl se sentent plus confiants" |
| **Épuisement à 3h du matin** | Très fort | À 3h du mat, 7€/mois c'est RIEN si ça aide |
| **Dépense bébé normalisée** | Fort | Parents dépensent ~12 000€ la 1ère année, 50€/an c'est invisible |
| **Effet pédiatre digital** | Fort | "Une consultation coûte 25-50€, Babbl c'est 6€/mois 24h/24" |
| **Voix clonée = émotion pure** | Très fort | Feature unique, impossible à copier, les parents adorent |

---

## Modèle : Freemium à 3 Paliers

### Babbl Free (gratuit, pour toujours)

- 5 analyses par jour
- Résultat : cause principale + % de confiance
- Explication détaillée de l'IA : verrouillé
- Actions recommandées : seulement la 1ère
- Historique : 7 derniers jours
- Voice clone : non
- Night mode : non
- Exercice respiration : oui (coûte rien, fidélise)
- Publicité : bannières baby products (non-intrusif)

Pourquoi 5/jour gratuit : assez pour que les parents adorent l'app et en parlent à d'autres parents (bouche-à-oreille = canal n°1 pour les apps bébé). Mais pas assez pour une nuit complète difficile.

### Babbl+ — 6.99€/mois ou 49.99€/an

- Analyses illimitées
- Résultat complet avec explication IA détaillée
- Actions recommandées : toutes, hiérarchisées
- Signaux acoustiques détaillés ("Le pitch élevé indique...")
- Historique complet + tendances hebdo
- Night mode (manuel)
- Pas de pub
- Voice clone : non

Pourquoi ce prix : 6.99€ = moins qu'un café par semaine. Le prix annuel (49.99€) pousse les parents à s'engager — ils savent qu'ils utiliseront l'app pendant ~12 mois.

### Babbl Voice — 9.99€/mois ou 69.99€/an

- Tout Babbl+
- Voice cloning (2 voix : maman + papa)
- Night mode auto-détection
- Messages de réconfort avec la voix du parent
- Analyse prioritaire (plus rapide)
- Alerte pédiatre (triage haute urgence)
- Rapport hebdo envoyé par email

Pourquoi ça marchera : la voix clonée est LA feature killer. Aucun concurrent ne l'a. C'est émotionnel, unique, et ça coûte cher à fournir (ElevenLabs) donc ça justifie le premium. Un parent qui entend son bébé se calmer avec SA voix clonée ne cancel jamais cet abonnement.

---

## Le Moment du Paywall

Le paywall frappe au moment exact où le parent a le plus besoin du résultat :

1. Parent enregistre les pleurs → GRATUIT
2. Analyse en cours... → GRATUIT
3. "Cause principale : FAIM — 78%" → GRATUIT
4. "Pourquoi ? Voici les signaux détectés..." → PAYWALL Babbl+
5. "Actions recommandées..." → PAYWALL Babbl+
6. "Écouter le résumé vocal..." → PAYWALL Babbl+
7. "Réconforter avec ma voix..." → PAYWALL Babbl Voice

Le parent voit que ça marche, il voit la cause, il veut COMPRENDRE et AGIR. C'est là qu'il paye.

---

## Coûts par Utilisateur Payant / Mois

| Poste | Coût |
|---|---|
| Claude Sonnet par analyse (~800 tokens) | ~0.004€ |
| Moyenne 30 analyses/mois par user payant | 0.12€ |
| ElevenLabs TTS (résumé vocal) | ~0.01€/analyse soit 0.30€/mois |
| ElevenLabs Voice Clone (une fois) | ~0.05€ |
| Hébergement serveur | ~0.10€/user |
| **Total coût/user payant/mois** | **~0.55€** |

## Marges par Palier

| Palier | Revenue/user/mois | Coût/user/mois | Marge |
|---|---|---|---|
| Free (pub) | ~0.15€ (CPM baby ads) | ~0.05€ | 67% |
| Babbl+ | 6.99€ (mensuel) / 4.17€ (annuel) | 0.42€ | 90-94% |
| Babbl Voice | 9.99€ (mensuel) / 5.83€ (annuel) | 0.55€ | 91-94% |

---

## Projections de Croissance

Hypothèses : distribution standard freemium baby app (85% free, 10% Plus, 5% Voice)

| Métrique | 6 mois | 12 mois | 24 mois |
|---|---|---|---|
| Users totaux | 10 000 | 50 000 | 200 000 |
| Free (85%) | 8 500 | 42 500 | 170 000 |
| Babbl+ (10%) | 1 000 | 5 000 | 20 000 |
| Babbl Voice (5%) | 500 | 2 500 | 10 000 |
| **MRR** | **10 970€** | **54 850€** | **219 400€** |
| **ARR** | **131K€** | **658K€** | **2.63M€** |
| Coûts API/mois | ~1 200€ | ~6 000€ | ~24 000€ |
| **Marge brute** | **~89%** | **~89%** | **~89%** |

---

## Revenue Streams Additionnels (Phase 2-3)

### 1. Abonnement Cadeau — "Offrir Babbl"

Les grands-parents et amis adorent offrir des cadeaux bébé tech. Carte cadeau Babbl Voice 6 mois = 39.99€. Énorme potentiel baby shower.

### 2. B2B Maternités et Mutuelles (Phase 2, dans 12-18 mois)

- Maternités : 300-500€/mois/établissement (patients ont accès gratuit pendant 3 mois post-naissance)
- Mutuelles : 2-4€/assuré/mois (proposé comme avantage santé)
- 500 maternités en France x 400€/mois = 2.4M€ ARR additionnel

### 3. Recommandations Produits Contextuelles (Phase 2)

Pas de la pub, mais des recommandations utiles basées sur l'analyse :
- "Votre bébé semble avoir faim souvent, ces biberons anti-coliques sont recommandés par les pédiatres"
- Commission affiliate 10-20% sur produits bébé
- Estimation : 1-3€/user actif/mois

### 4. Co-Parenting Premium (Phase 2)

Dashboard partagé entre 2 parents. Les deux doivent avoir un compte. Double potentiellement les abonnements par foyer.

---

## Concurrence

| App | Modèle | Prix | Users |
|---|---|---|---|
| Nanni AI | Freemium + sub | 4.99$/mois | 500K+ |
| CryAnalyzer | Freemium + pub | Gratuit + pub | 3M+ |
| Zoundream | B2B (hôpitaux) | Pas de prix public | N/A |
| Hush | Freemium + sub | 5.99$/mois | Nouveau |
| **Babbl** | Freemium 3 tiers | 6.99-9.99€/mois | Lancement |

Avantage compétitif : la voice clone. Personne ne l'a. C'est ce qui justifie le tier Voice et ce qui différencie Babbl de tous les concurrents.

---

## Résumé

Babbl donne le résultat gratuitement pour créer l'habitude, puis vend la compréhension détaillée (Babbl+) et l'émotion de la voix clonée (Babbl Voice) au moment exact où le parent en a le plus besoin.
