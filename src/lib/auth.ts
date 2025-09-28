import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';

export const auth = betterAuth({
  database: memoryAdapter({
    // Add some configuration for better session handling
    sessionExpiry: 60 * 60 * 24 * 7, // 7 days
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to false for easier testing
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      teamId: {
        type: 'string',
        required: false,
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'member',
      },
    },
  },
  plugins: [],
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key-here-change-this-in-production',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  trustedOrigins: ['http://localhost:3000'],
  logger: {
    level: 'debug',
    disabled: false,
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
