"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onDevotionalCreatedSendNotification = exports.generateDailyDevotional = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const GEMINI_API_KEY = (0, params_1.defineSecret)('GEMINI_API_KEY');
const TOPIC_DEVOTIONALS = 'devotionals';
function getSaoPauloDateId(now = new Date()) {
    const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return fmt.format(now);
}
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function generateDevotionalViaGemini(dateId, maxRetries = 3) {
    const apiKey = String(GEMINI_API_KEY.value() || process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY não configurada');
    }
    const prompt = `Gere um devocional cristão em português do Brasil para a data ${dateId}.\n` +
        `Requisitos obrigatórios:\n` +
        `- Tema livre, variado, bem elaborado, objetivo e reflexivo\n` +
        `- 1 título\n` +
        `- 1 versículo (referência + texto do versículo)\n` +
        `- Corpo do estudo com exatamente 4 parágrafos, concisos e coesos\n` +
        `- Uma seção de aplicação prática com 3 a 5 itens curtos\n` +
        `- Finalizar com uma oração curta OU uma frase de impacto para ânimo do dia a dia\n` +
        `\n` +
        `Retorne APENAS um JSON válido (sem markdown) com o seguinte formato:\n` +
        `{"title":"...","verseRef":"...","verseText":"...","bodyParagraphs":["p1","p2","p3","p4"],"application":["item1","item2"],"closing":"..."}`;
    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.0-pro'
    ];
    for (const model of models) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
                console.log(`Tentativa ${attempt + 1}/${maxRetries} com modelo ${model} para data ${dateId}`);
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.9,
                            maxOutputTokens: 900,
                        },
                    }),
                });
                if (!resp.ok) {
                    const text = await resp.text();
                    const error = `Gemini API error: ${resp.status} ${resp.statusText} - ${text}`;
                    // Se for erro de rate limiting (429) ou server error (5xx), fazer retry
                    if (resp.status === 429 || resp.status >= 500) {
                        if (attempt < maxRetries - 1) {
                            const backoffTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                            console.log(`Rate limit ou server error. Aguardando ${backoffTime}ms antes de retry...`);
                            await sleep(backoffTime);
                            continue;
                        }
                    }
                    throw new Error(error);
                }
                const json = (await resp.json());
                const text = String(json?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
                if (!text) {
                    throw new Error('Gemini retornou resposta vazia');
                }
                let parsed;
                try {
                    parsed = JSON.parse(text);
                }
                catch {
                    const match = text.match(/\{[\s\S]*\}/);
                    if (match?.[0]) {
                        parsed = JSON.parse(match[0]);
                    }
                    else {
                        throw new Error('Não foi possível parsear JSON do Gemini');
                    }
                }
                const title = String(parsed?.title || '').trim();
                const verseRef = String(parsed?.verseRef || '').trim();
                const verseText = String(parsed?.verseText || '').trim();
                const bodyParagraphs = Array.isArray(parsed?.bodyParagraphs) ? parsed.bodyParagraphs.map((p) => String(p || '').trim()).filter(Boolean) : [];
                const application = Array.isArray(parsed?.application) ? parsed.application.map((p) => String(p || '').trim()).filter(Boolean) : [];
                const closing = String(parsed?.closing || '').trim();
                if (!title || !verseRef || !verseText || bodyParagraphs.length !== 4) {
                    throw new Error('JSON do Gemini veio incompleto (title/verse/bodyParagraphs)');
                }
                const body = `${bodyParagraphs.join('\n\n')}\n\n` +
                    `Aplicação na prática:\n` +
                    `${application.length ? application.map((i) => `- ${i}`).join('\n') : '- Reflita e aplique hoje mesmo.'}\n\n` +
                    `${closing || ''}`.trim();
                console.log(`Devocional gerado com sucesso usando modelo ${model}`);
                return {
                    title,
                    verseRef,
                    verseText,
                    body,
                };
            }
            catch (error) {
                console.error(`Erro na tentativa ${attempt + 1} com modelo ${model}:`, error);
                if (attempt < maxRetries - 1) {
                    const backoffTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                    console.log(`Aguardando ${backoffTime}ms antes de retry...`);
                    await sleep(backoffTime);
                }
                else {
                    // Se esgotou as tentativas com este modelo, tentar o próximo modelo
                    console.log(`Esgotadas tentativas com modelo ${model}, tentando próximo modelo...`);
                    break;
                }
            }
        }
    }
    throw new Error('Não foi possível gerar devocional após todas as tentativas com todos os modelos disponíveis');
}
exports.generateDailyDevotional = functions
    .runWith({ secrets: [GEMINI_API_KEY] })
    .pubsub
    .schedule('10 5 * * *')
    .timeZone('America/Sao_Paulo')
    .onRun(async () => {
    const db = admin.firestore();
    const dateId = getSaoPauloDateId();
    const ref = db.collection('devotionals').doc(dateId);
    const existing = await ref.get();
    if (existing.exists) {
        console.log(`Devocional já existe para ${dateId}. Pulando...`);
        return null;
    }
    try {
        const generated = await generateDevotionalViaGemini(dateId);
        await ref.set({
            date: dateId,
            title: generated.title,
            verseRef: generated.verseRef,
            verseText: generated.verseText,
            body: generated.body,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: 'system:gemini',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'system:gemini',
        });
        await db.collection('devotionals_generation_logs').add({
            date: dateId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'success',
            source: 'schedule',
        });
        console.log(`Devocional gerado e salvo: ${dateId}`);
        return null;
    }
    catch (error) {
        console.error(`Erro ao gerar devocional (${dateId}):`, error);
        await db.collection('devotionals_generation_logs').add({
            date: dateId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'error',
            error: String(error?.message || error),
            source: 'schedule',
        });
        return null;
    }
});
exports.onDevotionalCreatedSendNotification = functions.firestore
    .document('devotionals/{dateId}')
    .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const dateId = String(context.params.dateId || '').trim();
    const title = typeof data.title === 'string' && data.title.trim() ? data.title.trim() : 'Devocional Diário';
    const verseRef = typeof data.verseRef === 'string' ? data.verseRef.trim() : '';
    const body = verseRef ? `${verseRef}` : 'Abra o app e leia o devocional de hoje.';
    try {
        const message = {
            topic: TOPIC_DEVOTIONALS,
            notification: {
                title: `Devocional de hoje: ${title}`,
                body,
            },
            data: {
                type: 'devotional',
                date: dateId,
            },
            webpush: {
                fcmOptions: {
                    link: '/devocional',
                },
            },
        };
        const res = await admin.messaging().send(message);
        console.log('Push de devocional enviado:', res);
        return null;
    }
    catch (error) {
        console.error('Erro ao enviar push de devocional:', error);
        try {
            await admin.firestore().collection('devotionals_push_logs').add({
                date: dateId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                status: 'error',
                error: String(error?.message || error),
            });
        }
        catch {
            // ignore
        }
        return null;
    }
});
//# sourceMappingURL=devotionalsGenerator.js.map