type RawConfig = Record<string, unknown>;

function readString(config: RawConfig, key: string, fallback?: string): string {
  const value = config[key];

  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing required environment variable: ${key}`);
}

function readNumber(config: RawConfig, key: string, fallback?: number): number {
  const rawValue = config[key];

  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
    const parsedValue = Number(rawValue);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Environment variable ${key} must be a valid number`);
}

export function validateEnvironment(config: RawConfig) {
  const nodeEnv = readString(config, 'NODE_ENV', 'development');
  const allowedNodeEnvironments = ['development', 'test', 'production'];

  if (!allowedNodeEnvironments.includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, test, production');
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: readNumber(config, 'PORT', 3001),
    FRONTEND_URL: readString(config, 'FRONTEND_URL', 'http://localhost:3000'),
    DATABASE_URL: readString(config, 'DATABASE_URL'),
    JWT_SECRET: readString(config, 'JWT_SECRET'),
    JWT_EXPIRES_IN: readString(config, 'JWT_EXPIRES_IN', '15m'),
    THROTTLE_TTL: readNumber(config, 'THROTTLE_TTL', 60000),
    THROTTLE_LIMIT: readNumber(config, 'THROTTLE_LIMIT', 10),
  };
}
