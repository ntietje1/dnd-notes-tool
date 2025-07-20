import { kebabCase } from "lodash-es";

export const uniqueSlugify = (text: string, existingSlugs: string[]) => {
    const baseSlug = kebabCase(text);
    
    // Find all existing slugs that match the pattern: baseSlug, baseSlug-1, baseSlug-2, etc.
    const matchingSlugs = existingSlugs.filter(slug => {
        // Exact match
        if (slug === baseSlug) return true;
        
        // Pattern match: baseSlug-number
        const pattern = new RegExp(`^${baseSlug}-(\\d+)$`);
        return pattern.test(slug);
    });
    
    if (matchingSlugs.length === 0) {
        return baseSlug;
    }
    
    // Extract numbers from existing slugs and find the next available number
    const numbers = matchingSlugs
        .map(slug => {
            if (slug === baseSlug) return 0; // baseSlug counts as number 0
            const match = slug.match(new RegExp(`^${baseSlug}-(\\d+)$`));
            return match ? parseInt(match[1]) : 0;
        })
        .sort((a, b) => a - b);
    
    // Find the first gap in the sequence, or use the next number after the highest
    let nextNumber = 1;
    for (const num of numbers) {
        if (num >= nextNumber) {
            nextNumber = num + 1;
        }
    }
    
    return nextNumber === 1 ? baseSlug : `${baseSlug}-${nextNumber}`;
};