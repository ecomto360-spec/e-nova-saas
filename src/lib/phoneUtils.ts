/**
 * Phone Number Validation and Formatting Utilities for Algeria & International
 * 
 * Rules:
 * 1. The phone number field must contain a maximum of 10 digits, EXCEPT when an
 *    international country calling code is added (e.g. 213550252565).
 * 2. The mobile phone number MUST start with:
 *    - Local format: 05 -- -- -- --, 06 -- -- -- --, or 07 -- -- -- -- (exactly 10 digits)
 *    - With Algeria code 213: 2135 -- -- -- --, 2136 -- -- -- --, or 2137 -- -- -- -- (exactly 12 digits)
 *    - With Algeria code +213: +2135 -- -- -- --, +2136 -- -- -- --, or +2137 -- -- -- -- (exactly 13 characters)
 *    - With Algeria code 00213: 002135 -- -- -- --, 002136 -- -- -- --, or 002137 -- -- -- -- (exactly 14 digits)
 */

/**
 * Cleans phone input and strictly enforces max length based on whether
 * an international country calling code is present.
 */
export function cleanAndLimitPhone(rawInput: string): string {
  if (!rawInput) return "";

  const trimmed = rawInput.trim();
  const hasLeadingPlus = trimmed.startsWith("+");

  // Keep only digits
  const digitsOnly = trimmed.replace(/\D/g, "");

  if (hasLeadingPlus) {
    // If it starts with +213: max 13 chars (+ followed by 12 digits)
    if (digitsOnly.startsWith("213")) {
      return "+" + digitsOnly.slice(0, 12);
    }
    // General international with +: max 16 chars (+ followed by 15 digits)
    return "+" + digitsOnly.slice(0, 15);
  }

  // Without +:
  // Check if starts with Algerian country code 213 (e.g. 213550252565)
  if (digitsOnly.startsWith("213")) {
    return digitsOnly.slice(0, 12); // 213 + 9 digits = 12 digits max
  }

  // Check if starts with 00213
  if (digitsOnly.startsWith("00213")) {
    return digitsOnly.slice(0, 14); // 00213 + 9 digits = 14 digits max
  }

  // Check if starts with general 00 international
  if (digitsOnly.startsWith("00")) {
    return digitsOnly.slice(0, 17);
  }

  // Regular local number: strictly capped at 10 digits!
  return digitsOnly.slice(0, 10);
}

/**
 * Returns the dynamic HTML maxLength attribute value for a phone input.
 */
export function getPhoneMaxLength(phoneValue: string): number {
  if (!phoneValue) return 10;
  if (phoneValue.startsWith("+213")) return 13;
  if (phoneValue.startsWith("+")) return 16;
  if (phoneValue.startsWith("00213")) return 14;
  if (phoneValue.startsWith("00")) return 17;
  if (phoneValue.startsWith("213")) return 12;
  return 10;
}

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  errorAr?: string;
}

/**
 * Validates that the phone number complies with:
 * - Must start with 05, 06, or 07 (or with country code 2135..., 2136..., 2137...)
 * - Must have exactly 10 digits for local format, or 12 digits with 213, 13 chars with +213, 14 with 00213.
 */
export function validatePhoneNumber(phone: string, lang: "fr" | "ar" = "fr"): PhoneValidationResult {
  const clean = cleanAndLimitPhone(phone);

  if (!clean) {
    return {
      isValid: false,
      error: "Veuillez renseigner votre numéro de téléphone.",
      errorAr: "يرجى إدخال رقم الهاتف."
    };
  }

  // Case 1: Algerian number with +213 (+213550252565)
  if (clean.startsWith("+213")) {
    const mobilePrefix = clean.charAt(4); // the digit after +213
    if (!["5", "6", "7"].includes(mobilePrefix)) {
      return {
        isValid: false,
        error: "Le numéro doit commencer par +2135, +2136 ou +2137 (ex: +213550252565).",
        errorAr: "يجب أن يبدأ الرقم بـ 2135+ أو 2136+ أو 2137+ (مثال: 213550252565+)."
      };
    }
    if (clean.length !== 13) {
      return {
        isValid: false,
        error: "Avec l'indicatif +213, le numéro doit comporter 12 chiffres (ex: +213550252565).",
        errorAr: "مع الرمز +213، يجب أن يتكون الرقم من 12 رقماً (مثال: 213550252565+)."
      };
    }
    return { isValid: true };
  }

  // Case 2: Algerian number with 213 without plus (213550252565)
  if (clean.startsWith("213")) {
    const mobilePrefix = clean.charAt(3); // the digit after 213
    if (!["5", "6", "7"].includes(mobilePrefix)) {
      return {
        isValid: false,
        error: "Le numéro doit commencer par 2135, 2136 ou 2137 (ex: 213550252565).",
        errorAr: "يجب أن يبدأ الرقم بـ 2135 أو 2136 أو 2137 (مثال: 213550252565)."
      };
    }
    if (clean.length !== 12) {
      return {
        isValid: false,
        error: "Avec l'indicatif 213, le numéro doit comporter exactement 12 chiffres (ex: 213550252565).",
        errorAr: "مع الرمز 213، يجب أن يتكون الرقم من 12 رقماً بالضبط (مثال: 213550252565)."
      };
    }
    return { isValid: true };
  }

  // Case 3: Algerian number with 00213
  if (clean.startsWith("00213")) {
    const mobilePrefix = clean.charAt(5); // the digit after 00213
    if (!["5", "6", "7"].includes(mobilePrefix)) {
      return {
        isValid: false,
        error: "Le numéro doit commencer par 002135, 002136 ou 002137 (ex: 00213550252565).",
        errorAr: "يجب أن يبدأ الرقم بـ 002135 أو 002136 أو 002137 (مثال: 00213550252565)."
      };
    }
    if (clean.length !== 14) {
      return {
        isValid: false,
        error: "Avec l'indicatif 00213, le numéro doit comporter exactement 14 chiffres (ex: 00213550252565).",
        errorAr: "مع الرمز 00213، يجب أن يتكون الرقم من 14 رقماً بالضبط (مثال: 00213550252565)."
      };
    }
    return { isValid: true };
  }

  // Case 4: Other international numbers starting with + or 00
  if (clean.startsWith("+") || clean.startsWith("00")) {
    const digits = clean.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) {
      return {
        isValid: false,
        error: "Numéro international invalide.",
        errorAr: "رقم هاتف دولي غير صحيح."
      };
    }
    return { isValid: true };
  }

  // Case 5: Local number starting with 0
  if (clean.startsWith("0")) {
    const secondDigit = clean.charAt(1);
    if (clean.length >= 2 && !["5", "6", "7"].includes(secondDigit)) {
      return {
        isValid: false,
        error: "Le numéro de téléphone doit commencer par 05, 06 ou 07 (ex: 0550252565).",
        errorAr: "يجب أن يبدأ رقم الهاتف بـ 05 أو 06 أو 07 (مثال: 0550252565)."
      };
    }

    if (clean.length !== 10) {
      return {
        isValid: false,
        error: "Le numéro doit comporter exactement 10 chiffres (ex: 0550252565).",
        errorAr: "يجب أن يتكون رقم الهاتف من 10 أرقام بالضبط (مثال: 0550252565)."
      };
    }

    return { isValid: true };
  }

  // Case 6: 9 digits without leading 0 (e.g. 550252565)
  if (clean.length === 9 && ["5", "6", "7"].includes(clean.charAt(0))) {
    return {
      isValid: false,
      error: "Veuillez ajouter le 0 au début (ex: 0" + clean + ") ou l'indicatif pays (ex: 213" + clean + ").",
      errorAr: "يرجى إضافة 0 في البداية (مثال: 0" + clean + ") أو رمز البلد (مثال: 213" + clean + ")."
    };
  }

  // Case 7: Anything else
  return {
    isValid: false,
    error: "Le numéro de téléphone doit commencer par 05, 06 ou 07 (ou l'indicatif 213, ex: 213550252565).",
    errorAr: "يجب أن يبدأ رقم الهاتف بـ 05 أو 06 أو 07 (أو مع الرمز 213، مثال: 213550252565)."
  };
}
