const fs = require('fs');
const path = require('path');
const axios = require('axios');
const gettext = require('gettext-parser');

const CONFIG = {
    model: 'Qwen2.5-14B-Instruct-1M-Q3_K_S.gguf',
    apiUrl: 'http://127.0.0.1:1234/v1/chat/completions',
    inputPoFile: 'fr.po',
    outputDir: 'output',
    outputPoFile: path.join('output', 'strings.po'),
    tempPoFile: path.join('output', 'temp.po'),
    originalPoFile: 'strings.po',
    saveInterval: 10,
    requestDelay: 400,
    maxHistoryLength: 20,
    temperature: 0.1,
    apiTimeout: 10000
};

const SYSTEM_PROMPT = `
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
`.trim();

class PoTranslator {
    constructor() {
        this.conversationHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
        this.originalTranslations = new Map();
    }

    async translateText(text) {
        const userPrompt = `Translate this text to French:\n${text}`;
        const tempHistory = [...this.conversationHistory, { role: 'user', content: userPrompt }];

        try {
            const apiCall = axios.post(CONFIG.apiUrl, {
                model: CONFIG.model,
                messages: tempHistory,
                temperature: CONFIG.temperature,
                max_tokens: -1
            }, {
                timeout: CONFIG.apiTimeout
            });

            const response = await Promise.race([apiCall, new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout de la requête API')), CONFIG.apiTimeout)
            )]);

            const translatedContent = response.data.choices[0].message.content.trim();

            this.updateConversationHistory(userPrompt, translatedContent);

            return translatedContent;

        }
        catch (error) {
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.message.includes('Timeout')) {
                console.error(`⏱️ Timeout API (${CONFIG.apiTimeout / 1000}s) pour: "${this.truncateText(text, 50)}"`);
            }
            else {
                console.error('❌ Erreur lors de la traduction :', error.message);
                if (error.response) {
                    console.error('Réponse du serveur:', error.response.data);
                }
            }
            return text;
        }
    }

    updateConversationHistory(userPrompt, assistantResponse) {
        this.conversationHistory.push(
            { role: 'user', content: userPrompt },
            { role: 'assistant', content: assistantResponse }
        );

        if (this.conversationHistory.length > CONFIG.maxHistoryLength) {
            this.conversationHistory = [this.conversationHistory[0], ...this.conversationHistory.slice(-19)];
        }
    }

    async loadOriginalTranslations() {
        try {
            const originalPoContent = fs.readFileSync(CONFIG.originalPoFile);
            const parsedPo = gettext.po.parse(originalPoContent);

            for (const [context, messages] of Object.entries(parsedPo.translations)) {
                for (const [messageId, entry] of Object.entries(messages)) {
                    if (!messageId) continue;

                    const translation = entry.msgstr.join('').trim();
                    if (!translation) continue;

                    const contextId = entry.msgctxt;
                    this.originalTranslations.set(contextId, {originalText: messageId, translation: translation});
                }
            }
            console.log(`📚 ${this.originalTranslations.size} traductions originales chargées`);
        } catch (error) {
            console.warn(`⚠️ Impossible de charger les traductions originales: ${error.message}`);
        }
    }

    extractEntriesToTranslate(parsedPo) {
        const entriesToTranslate = [];

        for (const [context, messages] of Object.entries(parsedPo.translations)) {
            for (const [messageId, entry] of Object.entries(messages)) {
                if (!messageId) continue;

                const currentTranslation = entry.msgstr.join('').trim();
                if (currentTranslation && currentTranslation !== messageId){ continue };

                entriesToTranslate.push({originalText: messageId, entry: entry, context: context});
            }
        }

        return entriesToTranslate;
    }

    async translateEntry(entryData, index, totalEntries) {
        const { originalText, entry } = entryData;
        const contextId = entry.msgctxt;

        try {
            let translation;
            let wasFromOriginal = false;
            let wasTimeout = false;

            if (this.originalTranslations.has(contextId)) {
                const originalData = this.originalTranslations.get(contextId);
                translation = originalData.translation;
                wasFromOriginal = true;
            }
            else {
                const apiTranslation = await this.translateText(originalText);

                if (apiTranslation === originalText) {
                    wasTimeout = true;
                }

                translation = apiTranslation;

                if (!translation || translation.trim() === '') {
                    console.log(`⚠️ Traduction vide pour: "${originalText}"`);
                    translation = originalText;
                    wasTimeout = true;
                }
            }

            const cleanTranslation = translation.trim();
            entry.msgstr = [cleanTranslation];

            this.logTranslationProgress(index, totalEntries, originalText, cleanTranslation, wasFromOriginal, wasTimeout);

            if (!wasFromOriginal) {
                await this.delay(CONFIG.requestDelay);
            }

            return true;

        }
        catch (error) {
            console.error(`❌ Erreur pour "${originalText}":`, error.message);
            entry.msgstr = [originalText];
            return false;
        }
    }

    logTranslationProgress(index, total, originalText, translation, wasFromOriginal, wasTimeout = false) {
        const displayOriginal = this.truncateText(originalText, 80);
        const displayTranslation = this.truncateText(translation, 80);

        let icon;
        if (wasTimeout) {
            icon = '⏱️';
        }
        else if (wasFromOriginal) {
            icon = '▶️';
        }
        else {
            icon = '✅';
        }

        console.log(`${icon} ${index + 1}/${total} "${displayOriginal}" → "${displayTranslation}"`);
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    saveTemporaryFile(parsedPo) {
        const tempBuffer = gettext.po.compile(parsedPo);
        fs.writeFileSync(CONFIG.tempPoFile, tempBuffer);
    }

    saveFinalFile(parsedPo) {
        const finalBuffer = gettext.po.compile(parsedPo);
        fs.writeFileSync(CONFIG.outputPoFile, finalBuffer);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async translatePoFile() {
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir);
        }

        await this.loadOriginalTranslations();

        const inputPoContent = fs.readFileSync(CONFIG.inputPoFile);
        const parsedPo = gettext.po.parse(inputPoContent);

        const entriesToTranslate = this.extractEntriesToTranslate(parsedPo);
        console.log(`🔄 Traduction de ${entriesToTranslate.length} entrées`);

        if (entriesToTranslate.length === 0) {
            console.log('✅ Aucune entrée à traduire trouvée');
            return;
        }

        let successCount = 0;
        for (let i = 0; i < entriesToTranslate.length; i++) {
            const success = await this.translateEntry(entriesToTranslate[i], i, entriesToTranslate.length);
            if (success) successCount++;

            if ((i + 1) % CONFIG.saveInterval === 0) {
                this.saveTemporaryFile(parsedPo);
                console.log(`💾 Sauvegarde temporaire après ${i + 1} traductions`);
            }
        }

        this.saveFinalFile(parsedPo);

        console.log('✅ PO final écrit:', CONFIG.outputPoFile);
        console.log(`📊 Statistiques: ${successCount}/${entriesToTranslate.length} entrées traitées avec succès`);
    }
}

async function main() {
    const translator = new PoTranslator();
    await translator.translatePoFile();
}

main().catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
});