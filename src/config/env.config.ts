"use server";

export interface IEnvConfig {
  APP: {
    API_URL: string;
    API_KEY: string;
    APP_IDENTIFIER: string;
    RSA_PRIVATE_KEY: string;
    KEY_ID: string;
    BYPASS_PRODUCT_VERIFICATION: boolean;
    COOKIES: {
      MAX_AGE_IN_DAYS: number;
    };
  };
  ENCRYPTION: {
    SECRET_KEY: string;
    SALT_KEY: string;
  };
}

let cachedEnv: IEnvConfig | null = null;

export const env = async (): Promise<IEnvConfig> => {
  if (cachedEnv) return cachedEnv;

  const apiUrl = process.env.API_URL;
  const apiKey = process.env.API_KEY;
  const appIdentifier = process.env.APP_IDENTIFIER;
  const rsaPrivateKey = process.env.RSA_PRIVATE_KEY;
  const keyId = process.env.KEY_ID;
  const secretKey = process.env.SECRET_KEY;
  const saltKey = process.env.SALT_KEY;

  // Validate required vars (skip if bypass enabled for dev)
  const bypass = process.env.BYPASS_PRODUCT_VERIFICATION === "true";

  if (!apiUrl) {
    throw new Error("Missing required environment variable: API_URL");
  }

  cachedEnv = {
    APP: {
      API_URL: apiUrl,
      API_KEY: apiKey || "",
      APP_IDENTIFIER: appIdentifier || "",
      RSA_PRIVATE_KEY: rsaPrivateKey || "",
      KEY_ID: keyId || "",
      BYPASS_PRODUCT_VERIFICATION: bypass,
      COOKIES: {
        MAX_AGE_IN_DAYS: +(process.env.MAX_AGE_COOKIES_IN_DAYS || 7),
      },
    },
    ENCRYPTION: {
      SECRET_KEY: secretKey || "default-secret-key-min-32-chars!!",
      SALT_KEY: saltKey || "default-salt-16ch",
    },
  };

  return cachedEnv;
};
