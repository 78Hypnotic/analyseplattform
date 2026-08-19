import "server-only";

const DEFAULT_OPERATOR_NAME = "Manuel Hohlwegler";
const DEFAULT_CONTACT_EMAIL = "manuel.hohlwegler@gmx.de";

export type LegalOperator = {
  name: string;
  addressLines: string[];
  email: string;
  phone: string | null;
  vatId: string | null;
};

export function getLegalOperator(): LegalOperator {
  const addressLines = cleanEnvValue(process.env.LEGAL_POSTAL_ADDRESS)
    ?.split("|")
    .map((line) => line.trim())
    .filter(Boolean) ?? [];

  if (process.env.NODE_ENV === "production" && addressLines.length === 0) {
    throw new Error("LEGAL_POSTAL_ADDRESS must be configured for production.");
  }

  return {
    name: cleanEnvValue(process.env.LEGAL_OPERATOR_NAME) ?? DEFAULT_OPERATOR_NAME,
    addressLines,
    email: cleanEnvValue(process.env.LEGAL_CONTACT_EMAIL) ?? DEFAULT_CONTACT_EMAIL,
    phone: cleanEnvValue(process.env.LEGAL_CONTACT_PHONE) ?? null,
    vatId: cleanEnvValue(process.env.LEGAL_VAT_ID) ?? null,
  };
}

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") || undefined;
}