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
    APP_BASE_URL: readString(config, 'APP_BASE_URL', 'http://localhost:3000'),
    JWT_SECRET: readString(config, 'JWT_SECRET'),
    JWT_EXPIRES_IN: readString(config, 'JWT_EXPIRES_IN', '15m'),
    JWT_REFRESH_SECRET: readString(config, 'JWT_REFRESH_SECRET'),
    JWT_REFRESH_EXPIRES_IN: readString(config, 'JWT_REFRESH_EXPIRES_IN', '7d'),
    RESET_TOKEN_EXPIRES_MINUTES: readNumber(
      config,
      'RESET_TOKEN_EXPIRES_MINUTES',
      30,
    ),
    SMTP_HOST: readString(config, 'SMTP_HOST'),
    SMTP_PORT: readNumber(config, 'SMTP_PORT', 1025),
    SMTP_SECURE: readString(config, 'SMTP_SECURE', 'false'),
    SMTP_USER: readString(config, 'SMTP_USER', ''),
    SMTP_PASS: readString(config, 'SMTP_PASS', ''),
    SMTP_FROM: readString(config, 'SMTP_FROM'),
    ADMIN_BOOTSTRAP_ENABLED: readString(
      config,
      'ADMIN_BOOTSTRAP_ENABLED',
      'false',
    ),
    ADMIN_EMAIL: readString(config, 'ADMIN_EMAIL', 'admin@cga-security.local'),
    ADMIN_PASSWORD: readString(config, 'ADMIN_PASSWORD', 'ChangeMe123!'),
    ADMIN_FULL_NAME: readString(
      config,
      'ADMIN_FULL_NAME',
      'Administrador Inicial',
    ),
    THROTTLE_TTL: readNumber(config, 'THROTTLE_TTL', 60000),
    THROTTLE_LIMIT: readNumber(config, 'THROTTLE_LIMIT', 10),
    S3_ENDPOINT: readString(config, 'S3_ENDPOINT', 'http://localhost:9000'),
    S3_REGION: readString(config, 'S3_REGION', 'us-east-1'),
    S3_BUCKET: readString(config, 'S3_BUCKET', 'cga-security-documents'),
    S3_ACCESS_KEY: readString(config, 'S3_ACCESS_KEY', 'minioadmin'),
    S3_SECRET_KEY: readString(config, 'S3_SECRET_KEY', 'minioadmin'),
    S3_FORCE_PATH_STYLE: readString(config, 'S3_FORCE_PATH_STYLE', 'true'),
  };
}
