/**
 * Validates that input text is meaningful (not gibberish).
 * Returns { valid: boolean, message?: string }
 */
export function validateMeaningfulText(text: string, minWords: number = 3): { valid: boolean; message?: string } {
  const trimmed = text.trim();
  if (!trimmed) return { valid: false, message: 'Please enter some text.' };

  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length < minWords) {
    return { valid: false, message: `Please write at least ${minWords} meaningful words.` };
  }

  // Check for gibberish: if most words have no vowels or are just random chars
  const gibberishWords = words.filter(w => {
    const clean = w.replace(/[^a-zA-Z]/g, '');
    if (clean.length === 0) return false;
    // No vowels in a word longer than 2 chars = likely gibberish
    if (clean.length > 2 && !/[aeiouAEIOU]/.test(clean)) return true;
    // Very long without spaces = likely keyboard mash
    if (clean.length > 15 && !/\s/.test(clean)) return true;
    return false;
  });

  if (gibberishWords.length > words.length * 0.5) {
    return { valid: false, message: 'Input appears to be random text. Please write a meaningful response.' };
  }

  return { valid: true };
}

export function validateWatSentence(sentence: string): { valid: boolean; message?: string } {
  return validateMeaningfulText(sentence, 2);
}

export function validateStory(story: string): { valid: boolean; message?: string } {
  return validateMeaningfulText(story, 10);
}

export function validateParagraph(text: string): { valid: boolean; message?: string } {
  return validateMeaningfulText(text, 8);
}

export function validateSrtResponse(response: string): { valid: boolean; message?: string } {
  return validateMeaningfulText(response, 3);
}
