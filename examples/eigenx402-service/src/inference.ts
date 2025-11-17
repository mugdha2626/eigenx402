/**
 * EigenAI inference implementation
 *
 * Calls EigenAI API for deterministic LLM inference with cryptographic signatures
 */

/**
 * Call EigenAI API for deterministic inference
 *
 * EigenAI provides verifiable, deterministic LLM inference with cryptographic signatures.
 * - Testnet: https://eigenai-sepolia.eigencloud.xyz
 * - Mainnet: https://eigenai.eigencloud.xyz
 * - Models: gpt-oss-120b-f16, qwen3-32b-128k-bf16
 */
export async function callEigenAI(
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
