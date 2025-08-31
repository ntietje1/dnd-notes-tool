export function validateLocationName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Location name is required";
  if (v.length > 50) return "Location name must be less than 100 characters";
  return undefined;
}

