export function parseAIResponse(response: string): any {
  // Simple parser for AI responses
  try {
    return JSON.parse(response);
  } catch {
    return { message: response };
  }
}
