# Politique de confidentialité de Babbl — BROUILLON

> **À faire relire par un avocat avant toute publication.** Ce texte a été écrit à partir du code réel (branche `main-ecbl1r`, 23/09/2026). Chaque flux décrit ci-dessous existe dans le code, et aucun autre n'y figure. Les passages entre [crochets] sont à compléter. La section « Points à trancher » en fin de document s'adresse à l'avocat, pas au public.

---

## 1. Qui est responsable de vos données

[Raison sociale, forme juridique, adresse, SIREN], représentée par Luigi Revelli, est responsable du traitement.
Contact pour vos données : [adresse e-mail dédiée, ex. confidentialite@babbl.fr].

## 2. Ce que fait Babbl, en une phrase

Babbl écoute 10 secondes de pleurs, vérifie qu'il s'agit bien d'un pleur, puis vous propose des pistes tirées **de ce que vous avez noté vous-même** (dernière tétée, dernière couche, dernier réveil). Il affiche aussi, à chaque fois, les situations où il faut appeler le 15. Babbl ne pose aucun diagnostic et ne déduit rien de médical du son.

## 3. Ce que nous collectons, pourquoi, et combien de temps nous le gardons

### 3.1 Sans compte

Vous pouvez utiliser Babbl sans créer de compte. Dans ce cas :

| Donnée | Où elle va | Pourquoi | Durée |
|---|---|---|---|
| Enregistrement de 10 s des pleurs | Notre serveur | Vérifier que c'est un pleur et décrire sa continuité (« presque continu », « coupé de pauses ») | **Effacé dès l'analyse terminée, en moins d'une seconde.** Il n'est jamais stocké, ni transmis à un tiers. |
| Ce que vous avez noté (heures de tétée, de couche, de réveil ; prénom et âge du bébé s'ils sont renseignés) | Notre serveur, puis Anthropic (voir 4) | Rédiger les pistes et le résumé | Pas conservé par Babbl après la réponse |
| Résumé lu à voix haute | Notre serveur, fichier audio | Vous le faire écouter | 24 heures, puis effacé |
| Historique, journal (tétées, couches, réveils), séances de respiration, humeur notée | **Votre téléphone uniquement** (stockage du navigateur) | Vous les montrer | Jusqu'à ce que vous les effaciez. Le journal des tétées, couches et réveils ne garde que 14 jours. |
| Adresse IP | Notre serveur, en mémoire | Limiter les abus (20 analyses par 10 minutes, 3 clonages de voix par jour) | 10 minutes à 24 heures, jamais écrite sur disque |

### 3.2 Avec un compte

En plus de ce qui précède :

| Donnée | Où elle va | Pourquoi | Durée |
|---|---|---|---|
| Adresse e-mail et mot de passe (chiffré) | Supabase (voir 4) | Vous connecter | Jusqu'à la suppression du compte |
| Profil : prénom du bébé, tranche d'âge, votre rôle (parent 1 / parent 2), identifiant de voix clonée | Supabase | Personnaliser les textes | Jusqu'à la suppression du compte |
| Historique des analyses : date, pistes proposées et leur raison (« dernière tétée il y a 3 h »), résumé, gestes proposés, texte du message de réconfort | Supabase | Vous montrer votre historique et préparer le résumé pour le médecin | Jusqu'à la suppression du compte |
| « Ce qui a apaisé votre bébé » (si vous répondez) | Supabase | Vous le rappeler dans l'historique | Jusqu'à la suppression du compte |
| Journal saisi (type d'événement, note) et badges | Supabase | Synchroniser vos appareils | Jusqu'à la suppression du compte |

**Ce qui n'est jamais conservé, même avec un compte :** l'enregistrement des pleurs, et toute mesure chiffrée du son (hauteur, intensité, durée des pauses). Seule la phrase de continuité est affichée. Elle n'est ni historisée ni stockée.

### 3.3 Si vous clonez votre voix (facultatif)

Pour que le message de réconfort soit lu avec votre voix, vous enregistrez un court échantillon. Il est envoyé à ElevenLabs (voir 4), qui crée une « voix » réutilisable. L'échantillon est effacé de notre serveur dès l'envoi terminé. **ElevenLabs conserve la voix créée** jusqu'à ce que vous supprimiez votre compte Babbl : nous la supprimons alors chez ElevenLabs.

Cette fonction repose sur votre **consentement**, que vous pouvez retirer à tout moment en supprimant votre compte.

## 4. Qui d'autre traite vos données (sous-traitants)

| Prestataire | Rôle | Ce qu'il reçoit | Pays | Garanties |
|---|---|---|---|---|
| Supabase Inc. | Base de données, comptes | Tout ce qui est listé en 3.2 | [Région du projet à confirmer, ex. UE (Francfort)] | [DPA Supabase signé ; CCT si hors UE] |
| Anthropic PBC | Rédaction du résumé et des gestes | Texte seulement : pistes, heures notées, âge, prénom s'il est valide, description de la continuité. **Jamais l'audio.** | États-Unis | [DPA Anthropic ; CCT / Data Privacy Framework ; option zéro rétention à demander] |
| ElevenLabs Inc. | Lecture à voix haute ; voix clonée | Le texte à lire ; l'échantillon de votre voix si vous clonez | États-Unis [à vérifier : option UE] | [DPA ElevenLabs ; CCT / DPF] |
| Render Services Inc. | Hébergement du serveur et du site | Tout ce qui passe par le serveur (en transit) ; adresses IP dans leurs journaux techniques | [Région à choisir, ex. Francfort] | [DPA Render] |

Babbl n'utilise **aucun outil de mesure d'audience, aucune publicité et aucun traceur**. Les polices d'écriture sont servies par Babbl lui-même : ouvrir l'application n'envoie aucune requête à un autre site. Les journaux techniques de notre serveur ne contiennent ni prénom, ni texte saisi, ni identifiant de compte, ni adresse IP. Ils contiennent l'heure, la route appelée, le code de réponse, la durée et un identifiant de requête aléatoire.

## 5. Sur quelle base légale

- **Exécution du service que vous demandez** (art. 6.1.b RGPD) : l'analyse, l'historique, le compte.
- **Consentement** (art. 6.1.a, et [art. 9.2.a si données de santé, voir « Points à trancher »]) : le clonage de voix, et [la conservation de l'historique].
- **Intérêt légitime** (art. 6.1.f) : la limitation des abus par adresse IP, en mémoire et pour une courte durée.

## 6. Vos droits

Vous pouvez à tout moment accéder à vos données, les rectifier, les effacer, en limiter l'usage, vous y opposer, les récupérer dans un format lisible, et retirer votre consentement.

- **Effacer tout, en un geste :** Profil → « Supprimer mon compte ». Nous effaçons dans l'ordre votre voix clonée chez ElevenLabs, votre historique, votre journal, vos badges, votre profil, puis votre compte. Si une étape échoue, le compte n'est pas supprimé : vous pouvez relancer l'effacement sans rien perdre en route. Les données de votre téléphone sont effacées au même moment.
- **Récupérer vos données :** Profil → « Télécharger mes données ». Un fichier JSON contient ce qui est sur votre téléphone et, si vous avez un compte, tout ce que le serveur garde. Il marche aussi sans compte.
- **Tout autre droit :** écrivez à [adresse du point 1]. Réponse sous un mois.
- **Réclamation :** CNIL, 3 place de Fontenoy, 75007 Paris, www.cnil.fr.

## 7. Sécurité

Échanges chiffrés (HTTPS). Chaque accès à votre compte est vérifié par Supabase, et jamais décodé à la main. Chaque requête ne peut lire ou modifier que les analyses de son propre compte. Aucun enregistrement de pleur n'est écrit durablement sur disque. Les fichiers audio générés sont effacés après 24 heures.

## 8. Enfants

Babbl s'adresse aux **parents**. Le bébé n'utilise pas l'application. Les données qui le concernent (prénom, âge, heures de tétée, pleurs le temps de l'analyse) sont saisies par son parent, qui exerce ses droits pour lui.

## 9. Modifications

Nous vous préviendrons dans l'application de tout changement important. Version du [date].

---

## Points à trancher par l'avocat (ne pas publier)

1. **Données de santé (art. 9) ?** Heures de tétée et de couche, pleurs, « ce qui a apaisé », âge d'un nourrisson, plus un résumé qui peut être partagé avec le médecin. Si ce sont des données de santé : consentement explicite, analyse d'impact (AIPD) probablement obligatoire, et hébergement **HDS** à examiner (Supabase et Render ne sont pas certifiés HDS à notre connaissance).
2. **Voix clonée = donnée biométrique ?** Elle ne sert pas à identifier la personne, ce qui plaide pour « non » au sens de l'art. 4.14. Elle reste un échantillon vocal conservé par un tiers américain. Faut-il un consentement explicite séparé, et quelle durée ?
3. **Transferts hors UE :** Anthropic et ElevenLabs (États-Unis). Vérifier l'adhésion au Data Privacy Framework ou signer les CCT. Demander la **zéro rétention** chez Anthropic. Vérifier si ElevenLabs propose un hébergement UE.
4. **Google Fonts : réglé.** Les polices sont servies par l'application (paquets `@fontsource`). Vérifié dans un navigateur : aucune requête externe au chargement. Les maquettes de conception, qui chargent encore Google Fonts, ont été déplacées dans `design/prototype/` et ne sont plus publiées avec le site.
5. **Statut réglementaire :** la politique ne doit rien promettre qui fasse de Babbl un dispositif médical (voir `LISTE-FINALE-SYMPTOMES.md`, « Ce qui reste à trancher »). Le texte ci-dessus s'en tient à « pistes tirées de ce que vous avez noté ».
6. **Portabilité : réglé.** L'export JSON existe (`GET /api/me/export` et le bouton du Profil). Reste à valider que le JSON est un « format couramment utilisé et lisible par machine » au sens de l'art. 20.
7. **Conservation de l'historique :** aujourd'hui, jusqu'à la suppression du compte. La purge automatique est prête (`backend/purge.py`, variable `BABBL_RETENTION_DAYS`) mais reste désactivée tant qu'une durée n'est pas fixée. Quelle durée retenir, par exemple 2 ans ? Une fois décidée, mettre à jour les tableaux 3.2 de ce document.
8. **Registre des traitements** et, le cas échéant, **AIPD** : à tenir. Ce brouillon peut en servir de base.
9. **Mentions légales et CGU :** documents séparés, à écrire.
