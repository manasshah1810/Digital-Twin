/**
 * Centralized environment configuration
 * Ensures type safety and provides default values
 */

export const config = {
    db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/digitaltwin',
    },
    simulation: {
        timeoutMs: parseInt(process.env.SIM_TIMEOUT_MS || '5000', 10),
        maxGraphDepth: parseInt(process.env.MAX_GRAPH_DEPTH || '50', 10),
    },
    env: process.env.NODE_ENV || 'development',
} as const;

export type Config = typeof config;
