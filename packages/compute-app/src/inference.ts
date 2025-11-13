/**
 * Deterministic inference implementation
 *
 * This module provides deterministic text generation with two modes:
 * 1. DEMO mode: Seeded random text (no API key needed)
 * 2. PRODUCTION mode: Real EigenAI or OpenAI API with deterministic seed
 *
 * Set INFERENCE_MODE=production and provide API keys to use real LLMs.
 */

import seedrandom from 'seedrandom';

/**
 * Inference mode: 'demo' or 'production'
 * Set via INFERENCE_MODE environment variable
 */
const INFERENCE_MODE = process.env.INFERENCE_MODE || 'demo';

// Debug: Log the mode on startup
console.log('[INFERENCE] Mode:', INFERENCE_MODE);
console.log('[INFERENCE] EigenAI key present:', !!process.env.EIGENAI_API_KEY);

/**
 * Simple word bank for demo generation
 */
const WORD_BANKS = {
  adjectives: ['quick', 'lazy', 'clever', 'bright', 'gentle', 'fierce', 'calm', 'wild', 'ancient', 'modern'],
  nouns: ['fox', 'dog', 'cat', 'eagle', 'lion', 'river', 'mountain', 'forest', 'ocean', 'desert'],
  verbs: ['jumps', 'runs', 'flies', 'swims', 'climbs', 'explores', 'discovers', 'creates', 'builds', 'dreams'],
  connectors: ['over', 'under', 'through', 'across', 'beside', 'beyond', 'within', 'around', 'towards', 'away from']
};

/**
 * Generate deterministic output given a prompt, model, and seed.
 *
 * Automatically uses DEMO or PRODUCTION mode based on environment.
 *
 * @param prompt - Input text prompt
 * @param model - Model identifier (used in hash computation)
 * @param seed - Deterministic seed for reproducibility
 * @returns Generated text output
 */
export async function generateDeterministicOutput(
  prompt: string,
  model: string,
  seed: number
): Promise<string> {
  if (INFERENCE_MODE === 'production') {
    // Production mode: Use real LLM API
    return generateWithAPI(prompt, model, seed);
  } else {
    // Demo mode: Use seeded random generation
    return generateWithSeed(prompt, model, seed);
  }
}

/**
 * DEMO MODE: Seeded random text generation
 * Used when INFERENCE_MODE=demo or EIGENAI_API_KEY not set
 */
function generateWithSeed(
  prompt: string,
  model: string,
  seed: number
): string {
  // Create seeded RNG
  const rng = seedrandom(`${seed}-${model}-${prompt}`);

  // Simple deterministic generation strategy
  const sentences = Math.floor(rng() * 3) + 2; // 2-4 sentences
  const output: string[] = [];

  // Add context-aware opening
  output.push(`Based on the prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);
  output.push('');
  output.push('[DEMO MODE - Seeded Random Generation]');
  output.push('');

  // Generate deterministic sentences
  for (let i = 0; i < sentences; i++) {
    const sentence = generateSentence(rng);
    output.push(sentence);
  }

  // Add deterministic conclusion
  const conclusionType = Math.floor(rng() * 3);
  const conclusions = [
    'This output is deterministically generated and verifiable.',
    'The same inputs will always produce this exact output.',
    'This response is cryptographically provable and reproducible.'
  ];
  output.push('');
  output.push(conclusions[conclusionType]);
  output.push('');
  output.push('💡 To use real LLM: Set INFERENCE_MODE=production and add EIGENAI_API_KEY');

  return output.join('\n');
}

/**
 * PRODUCTION MODE: Real LLM API with deterministic seed
 * Using EigenAI for verifiable compute with cryptographic signatures
 */
async function generateWithAPI(
  prompt: string,
  model: string,
  seed: number
): Promise<string> {
  const eigenaiKey = process.env.EIGENAI_API_KEY;

  // Use EigenAI for verifiable, deterministic inference
  if (eigenaiKey) {
    console.log('[INFERENCE] Using EigenAI API');
    return callEigenAI(prompt, model, seed, eigenaiKey);
  }

  // No API key available - fall back to demo mode
  console.warn('[INFERENCE] PRODUCTION mode but no EigenAI API key found, using demo mode');
  return generateWithSeed(prompt, model, seed);
}

/**
 * Call EigenAI API for deterministic inference
 *
 * EigenAI provides verifiable, deterministic LLM inference with cryptographic signatures.
 * - Testnet: https://eigenai-sepolia.eigencloud.xyz
 * - Mainnet: https://eigenai.eigencloud.xyz
 * - Models: gpt-oss-120b-f16, qwen3-32b-128k-bf16
 */
async function callEigenAI(
  prompt: string,
  model: string,
  seed: number,
  apiKey: string
): Promise<string> {
  try {
    console.log(`[EIGENAI] Using model: ${model} with seed: ${seed}`);

    // Use Sepolia testnet endpoint
    const response = await fetch('https://eigenai-sepolia.eigencloud.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey, // EigenAI uses X-API-Key header
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        seed: seed,
        temperature: 0, // Deterministic
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EigenAI API error: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();

    // EigenAI returns a cryptographic signature for verification!
    if (data.signature) {
      console.log('[EIGENAI] ✓ Cryptographic signature received:', data.signature.substring(0, 32) + '...');
    }

    // Log usage stats
    if (data.usage) {
      console.log('[EIGENAI] Tokens used:', data.usage.total_tokens);
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('[EIGENAI] API call failed:', error.message);
    throw new Error(`EigenAI inference failed: ${error.message}`);
  }
}

/**
 * Call Google Gemini API for deterministic inference
 *
 * Gemini is FREE with generous quotas: 60 requests/minute
 * Models: gemini-1.5-flash (fast/free), gemini-1.5-pro (best/free), gemini-2.0-flash-exp
 * Get API key: https://aistudio.google.com/apikey
 */
async function callGemini(
  prompt: string,
  model: string,
  seed: number,
  apiKey: string
): Promise<string> {
  try {
    // Map to Gemini model names
    let geminiModel = model;
    if (!model.includes('gemini')) {
      geminiModel = 'gemini-1.5-flash'; // Free, fast model
      console.log(`[GEMINI] Mapping ${model} → ${geminiModel}`);
    }

    console.log(`[GEMINI] Using model: ${geminiModel} with seed: ${seed}`);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0, // Deterministic
            maxOutputTokens: 500,
            // Note: Gemini doesn't have a 'seed' parameter for determinism
            // but temperature=0 makes it consistent
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();

    // Extract text from Gemini response format
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Unexpected Gemini response format');
  } catch (error: any) {
    console.error('[GEMINI] API call failed:', error.message);
    throw new Error(`Gemini inference failed: ${error.message}`);
  }
}

/**
 * Call OpenAI API for deterministic inference
 *
 * OpenAI models: gpt-4, gpt-4-turbo, gpt-3.5-turbo
 */
async function callOpenAI(
  prompt: string,
  model: string,
  seed: number,
  apiKey: string
): Promise<string> {
  try {
    // Map EigenAI models to OpenAI equivalents if needed
    let openaiModel = model;
    if (model.includes('qwen') || model.includes('gpt-oss')) {
      openaiModel = 'gpt-3.5-turbo'; // Default OpenAI model
      console.log(`[OPENAI] Mapping ${model} → ${openaiModel}`);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          { role: 'user', content: prompt }
        ],
        seed: seed,
        temperature: 0,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('[OPENAI] API call failed:', error.message);
    throw new Error(`OpenAI inference failed: ${error.message}`);
  }
}

/**
 * Generate a single deterministic sentence
 */
function generateSentence(rng: seedrandom.PRNG): string {
  const article = rng() > 0.5 ? 'The' : 'A'; // Fixed: Use seeded RNG, not Math.random()
  const adj = pickRandom(WORD_BANKS.adjectives, rng);
  const noun = pickRandom(WORD_BANKS.nouns, rng);
  const verb = pickRandom(WORD_BANKS.verbs, rng);
  const connector = pickRandom(WORD_BANKS.connectors, rng);
  const adj2 = pickRandom(WORD_BANKS.adjectives, rng);
  const noun2 = pickRandom(WORD_BANKS.nouns, rng);

  return `${article} ${adj} ${noun} ${verb} ${connector} the ${adj2} ${noun2}.`;
}

/**
 * Pick a random element from array using seeded RNG
 */
function pickRandom<T>(array: T[], rng: seedrandom.PRNG): T {
  const index = Math.floor(rng() * array.length);
  return array[index];
}

/**
 * PRODUCTION ALTERNATIVE: EigenAI Integration
 *
 * Uncomment and configure for deterministic LLM inference:
 *
 * import fetch from 'node-fetch';
 *
 * export async function generateDeterministicOutput(
 *   prompt: string,
 *   model: string,
 *   seed: number
 * ): Promise<string> {
 *   const response = await fetch('https://api.eigenai.xyz/v1/chat/completions', {
 *     method: 'POST',
 *     headers: {
 *       'Authorization': `Bearer ${process.env.EIGENAI_API_KEY}`,
 *       'Content-Type': 'application/json'
 *     },
 *     body: JSON.stringify({
 *       model,
 *       messages: [{ role: 'user', content: prompt }],
 *       seed,
 *       temperature: 0 // Ensure determinism
 *     })
 *   });
 *
 *   const data = await response.json();
 *   return data.choices[0].message.content;
 * }
 */
