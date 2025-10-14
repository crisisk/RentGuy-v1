import { loadClientEnv } from './env.schema'

/**
 * Shared, validated environment configuration for frontend modules.
 * Parsing happens once on module load; failures throw immediately during boot.
 */
export const env = loadClientEnv()
