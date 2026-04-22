export type StripeServerEnv = {
  NEXT_PUBLIC_SITE_URL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_BUSINESS?: string;
  STRIPE_PRICE_PREMIUM?: string;
  STRIPE_PRICE_PRO?: string;
};

let stripeEnvCache: StripeServerEnv | undefined;

function requireString(name: string, raw: string | undefined): string {
  if (!raw || raw.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return raw;
}

function requireUrl(name: string, raw: string | undefined): string {
  const value = requireString(name, raw);

  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL.`);
  }
}

export function getStripeServerEnv(): StripeServerEnv {
  if (!stripeEnvCache) {
    stripeEnvCache = {
      NEXT_PUBLIC_SITE_URL: requireUrl(
        "NEXT_PUBLIC_SITE_URL",
        process.env.NEXT_PUBLIC_SITE_URL,
      ),
      STRIPE_SECRET_KEY: requireString(
        "STRIPE_SECRET_KEY",
        process.env.STRIPE_SECRET_KEY,
      ),
      STRIPE_WEBHOOK_SECRET: requireString(
        "STRIPE_WEBHOOK_SECRET",
        process.env.STRIPE_WEBHOOK_SECRET,
      ),
      STRIPE_PRICE_BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
      STRIPE_PRICE_PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
      STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
    };
  }

  return stripeEnvCache;
}
