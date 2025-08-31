export function validateCharacterName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Character name is required";
  if (v.length > 50) return "Character name must be 50 characters or fewer";  return undefined;
}

