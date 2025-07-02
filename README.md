# 🇫🇷 Traduction française alternative pour Oxygen Not Included

Ce dépôt contient une traduction française du jeu **Oxygen Not Included**, générée automatiquement à l’aide d’une intelligence artificielle et basée sur la traduction Francaise disponible sur le Workshop de Steam. Cette traduction est à jour de juillet 2025 après le DLC, *Préhistoric Planet Pack*

## ⚠️ Avertissement

- Cette traduction a été produite à l’aide du modèle **Qwen2.5-14B-Instruct-1M** via un prompt conçu pour préserver les balises du jeu tout en traduisant uniquement le texte visible.
- **La qualité de cette traduction peut être très variable**, voire incorrecte. Elle **n’a pas été vérifiée manuellement dans son intégralité**.
- Certaines chaînes ont été corrigées manuellement pour rendre le fichier `.po` valide.

## 🤝 Crédits

Cette version traduit uniquement les chaînes **non couvertes** par l’excellente traduction disponible ici :

📝 [Traduction française Oxygen Not Included sur Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=928348692)

## 🧠 Prompt utilisé pour l’IA

La traduction a été générée avec le prompt suivant pour garantir la cohérence des balises et des règles spécifiques du jeu :

```text
You are a professional translator from English to French for the video game "Oxygen Not Included".
Rules:
- Translate ONLY VISIBLE TEXT, including text inside tags (e.g. <link="BED">DIY Cot</link> → must be <link="BED">Lit fait maison</link> only "DIY Cot" is translated do not change BED).
- PRESERVE ALL TAGS (e.g. <link>, <i>, <b>, etc.) exactly as they appear.
- PRESERVE ALL ATTRIBUTES exactly (e.g. link="ITEM" → must never be translated).
- Do not modify, add, reorder or combine elements inside tags. (e.g. <i>text</i> → should be <i>texte</i> only text is translated i tag remain).
- PRESERVE ALL PLACEHOLDERS and variables exactly (e.g. {0}, {Assignee}, %s, {DamageInfo}, etc.).
- DO NOT insert any non-Latin characters.
- For capitalized words, consider context:
  * If it's a creature name or plant name → Keep in English
  * If it's a regular word that happens to be capitalized → Translate normally
  * If unsure or translation seems odd → Keep in English

Special rule for logic gate names:
- Always translate "X Gate" as "Porte X", using:
  - "AND Gate" → "Porte ET"
  - "OR Gate" → "Porte OU"
  - "XOR Gate" → "Porte OU exclusif"
  - "NAND Gate" → "Porte NON-ET"
  - "NOR Gate" → "Porte NON-OU"
  - "Buffer Gate" → "Porte tampon"
  - "NOT Gate" → "Porte NON"
- The material (e.g., "Copper", "Cobalt") must be translated and added at the end:
  - "Copper AND Gate" → "Porte ET en cuivre"
  - "Cobalt OR Gate" → "Porte OU en cobalt"

Special terms:
- The word "Atmo" must never be translated :
  * Example: "Atmo Sensor" → "Capteur Atmo" (not "Capteur atmosphérique")
- The word "critter" must be translated into "créature"
- The word "belt" must be translated into "ceinture"
- The word "brightslug" must be translated into "jaune fluo" (not "à jaune fluo")
- The word "petal" must be translated into "rose" (not "à rose")
- The word "Gaudy" must be translated into "tape-à-l'oeil"
- The word "filter" must be translated into "filtre"
- The word "Errand" must be translated into "en attente de"
- The word "Building" must be translated into "station"
- The word "Power Bank" must be translated into "batterie"
- The word "Power" must be translated into "énergie"

- Keep the same case (e.g. <link="LOGICGATEFILTER">Brightslug FILTER Gate</link> must be <link="LOGICGATEFILTER">Porte FILTRE jaune fluo</link>)
- Return ONLY the translation in FRENCH nothing else
```

## 📁 Fichiers

- `strings.po` : le fichier de traduction au format `.po`, prêt à être intégré au jeu.
- `README.md` : ce fichier de présentation.

## 🔧 Installation manuelle (Windows)

Si vous utilisez Windows et avez déjà installé la traduction française disponible sur Steam Workshop, vous pouvez **remplacer le fichier de traduction existant** par celui de ce dépôt :

1. Allez dans le dossier suivant (à adapter selon votre système) :

Documents\Klei\OxygenNotIncluded\mods\Steam\2701205009

2. Remplacez le fichier `strings.po` par le fichier `.po` de ce dépôt.
3. Relancez le jeu pour voir les changements.

## ✍️ Contribuer

Si vous repérez des erreurs, des incohérences ou souhaitez améliorer cette traduction :

- Vous pouvez soumettre une **Pull Request** directement sur ce dépôt GitHub.
- N’hésitez pas à corriger quelques lignes, ou proposer des suggestions.

Chaque contribution est la bienvenue !
