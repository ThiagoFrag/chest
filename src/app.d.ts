import type { User } from '$lib/db/schema/users';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      sessionId: string | null;
      passed2fa: boolean;
    }
  }
}

export {};
