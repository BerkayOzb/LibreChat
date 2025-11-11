/**
 * Provider display name mappings for model group hierarchical display
 * Maps provider prefixes (extracted from model names like "openai/gpt-4") to user-friendly display names
 *
 * When models are grouped by their provider prefix, these display names will be shown in the UI
 * instead of the auto-capitalized provider name.
 *
 * @example
 * Model: "openai/gpt-4" → Provider: "openai" → Display: "ChatGPT"
 * Model: "anthropic/claude-3" → Provider: "anthropic" → Display: "Claude"
 */
export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  'openai': 'ChatGPT',
  'anthropic': 'Claude',
  'meta-llama': 'Meta AI',
  'google': 'Gemini',
  'mistralai': 'Mistral',
  'qwen': 'Qwen',
};
