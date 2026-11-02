// reader.js: reads a slab photo's grading label with Claude and returns the listing fields.
// The API key stays in this browser's localStorage and is only sent to api.anthropic.com.

const KEY = 'dksKardsAnthropic';
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.135.0/+esm';
const MODEL = 'claude-opus-5-5';

export const ERAS = ['WOTC vintage', 'EX & DP era', 'HGSS to XY', 'Sun & Moon', 'Sword & Shield', 'Scarlet & Violet', 'Japanese', 'Other'];
const GRADERS = ['PSA', 'CGC', 'BGS', 'TAG', 'ACE', 'SGC', 'Other'];

export function getKey() {
  try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
}
export function setKey(k) { localStorage.setItem(KEY, k); }
export function forgetKey() { localStorage.removeItem(KEY); }

let sdk;
async function client() {
  sdk ??= (await import(SDK_URL)).default;
  // The dashboard is a static page used only by the owner, so the call goes straight from their browser.
  return new sdk({ apiKey: getKey(), dangerouslyAllowBrowser: true });
}

// Turns SDK errors into something the shop owner can act on.
function explain(e) {
  if (!sdk) return e;
  if (e instanceof sdk.AuthenticationError) return new Error('Anthropic rejected the API key. Check it was copied in full, or make a new one.');
  if (e instanceof sdk.PermissionDeniedError) return new Error('This API key isn’t allowed to use Claude. Check the key’s workspace in the Anthropic Console.');
  if (e instanceof sdk.RateLimitError) return new Error('Claude is busy or the account’s limit was reached. Wait a minute and try again, or check billing in the Anthropic Console.');
  if (e instanceof sdk.BadRequestError) return new Error(`Claude couldn’t take this request: ${e.message}`);
  if (e instanceof sdk.APIConnectionError) return new Error('Couldn’t reach Claude. Check your internet connection and try again.');
  if (e instanceof sdk.APIError) return new Error(`Claude error ${e.status ?? ''}: ${e.message}`);
  return e;
}

// Cheap check that the key works (no model call is billed).
export async function testKey() {
  try {
    const c = await client();
    const m = await c.models.retrieve(MODEL);
    return m.display_name || MODEL;
  } catch (e) { throw explain(e); }
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    isGradedSlab: { type: 'boolean', description: 'True if the photo shows a graded card in a slab with a readable grading label.' },
    grader: { type: 'string', enum: GRADERS },
    grade: { type: 'string', description: 'Numeric grade only, e.g. "8", "9.5", "10". Empty if unreadable.' },
    gradeLabel: { type: 'string', description: 'The words beside the grade, e.g. "NM-MT", "GEM MT", "Pristine". Empty if none.' },
    cert: { type: 'string', description: 'Certification number, digits only. Empty if unreadable.' },
    cardName: { type: 'string', description: 'Card name as collectors write it, e.g. "Leafeon VMAX", "Charizard ex", "Umbreon V".' },
    variant: { type: 'string', description: 'Variant or rarity on the label, e.g. "Full Art", "Alt Art", "Holo", "1st Edition", "Special Illustration Rare". Empty if none.' },
    setName: { type: 'string', description: 'Set or product in its common English name, e.g. "Prize Pack Series 1", "Evolving Skies", "Base Set".' },
    cardNumber: { type: 'string', description: 'Card number as printed on the label, e.g. "008", "215". Empty if none.' },
    year: { type: 'string', description: 'Year on the label, e.g. "2022". Empty if none.' },
    language: { type: 'string', enum: ['English', 'Japanese', 'Korean', 'Chinese', 'Other'] },
    era: { type: 'string', enum: ERAS },
    unclear: { type: 'string', description: 'Anything that could not be read with confidence, in one short sentence. Empty if everything was clear.' }
  },
  required: ['isGradedSlab', 'grader', 'grade', 'gradeLabel', 'cert', 'cardName', 'variant', 'setName', 'cardNumber', 'year', 'language', 'era', 'unclear']
};

const SYSTEM = `You read grading labels on photos of graded Pokémon card slabs for a shop's listing form.

Take every field from the label text first; use the card itself only to confirm the name or number. PSA labels usually read: line 1 year and game or set, line 2 card name and variant, line 3 set or subset, with the card number, grade words, numeric grade and cert number on the right. CGC, BGS, TAG, ACE and SGC labels carry the same facts in a different layout.

Write names the way collectors do, not in label capitals: "Leafeon VMAX", "Charizard ex", "Pikachu V". Expand label abbreviations into the set's common name when you are sure of it ("POKEMON PRIZE PACK: SER 1" is "Prize Pack Series 1", "SWSH EVOLVING SKIES" is "Evolving Skies"). Pick the era from the set: Wizards of the Coast sets (1999 to 2003) are WOTC vintage; Sword & Shield products including Prize Pack Series 1 to 3 are Sword & Shield; a Japanese-language card is Japanese whatever its set.

If a field can't be read, leave it empty and say so in "unclear". Never guess a cert number or grade: a wrong cert number on a listing is worse than an empty one.`;

// photo: { base64, ext } from preparePhoto(). Returns the parsed fields.
export async function readSlab(photo) {
  const params = {
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: photo.ext === 'webp' ? 'image/webp' : 'image/jpeg', data: photo.base64 } },
        { type: 'text', text: 'Read the grading label on this slab and return the fields.' }
      ]
    }]
  };
  let res;
  try {
    const c = await client();
    // Server-side fallback: if the classifier declines, the API retries on Anthropic's recommended model in the same call.
    res = await c.beta.messages.create({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
  } catch (e) { throw explain(e); }

  if (res.stop_reason === 'refusal') throw new Error('Claude declined to read this photo. Try a closer, straight-on photo of the label.');
  if (res.stop_reason === 'max_tokens') throw new Error('Claude’s answer was cut off. Try again.');
  const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('');
  try { return JSON.parse(text); } catch { throw new Error('Claude’s answer couldn’t be read. Try again.'); }
}
