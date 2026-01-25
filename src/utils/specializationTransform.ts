import { Transform } from 'class-transformer';
import { getSpecializationKey, SpecializationKey } from '@/constants/specializations';

/**
 * Transform decorator that converts English or Arabic specialization value to key
 * Example: "Cardiology" or "أمراض القلب" -> "CARDIOLOGY"
 */
export function TransformSpecialization() {
  return Transform(({ value }) => {
    if (!value || typeof value !== 'string') {
      return value;
    }
    
    // If it's already a key (uppercase with underscores), return as is
    if (value === value.toUpperCase() && /^[A-Z_]+$/.test(value)) {
      return value;
    }
    
    // Try to get the key from the display value (EN or AR)
    const key = getSpecializationKey(value);
    return key || value; // Return key if found, otherwise return original value for validation to catch
  });
}

/**
 * Format specialization response based on language preference
 * @param key - The specialization key stored in DB
 * @param lang - Language preference ('en' or 'ar')
 * @returns Formatted specialization object
 */
export function formatSpecializationResponse(key: SpecializationKey, lang?: 'en' | 'ar') {
  const { getSpecialization } = require('@/constants/specializations');
  const spec = getSpecialization(key);
  
  if (!spec) {
    return { key, value: key };
  }

  // If language is specified, return only that language
  if (lang === 'en') {
    return { key, value: spec.en };
  } else if (lang === 'ar') {
    return { key, value: spec.ar };
  }
  
  // Default: return both languages
  return {
    key,
    en: spec.en,
    ar: spec.ar,
  };
}
