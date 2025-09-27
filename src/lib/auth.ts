import { betterAuth } from 'better-auth';
import { supabaseAdapter } from 'better-auth/adapters/supabase';
import { supabase } from './supabase';

export const auth = betterAuth({
  database: supabaseAdapter(supabase, {
    provider: 'supabase',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
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
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
