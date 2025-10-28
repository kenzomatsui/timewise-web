import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import type { UserProfile, ProfileRow } from "./types";

// Retrieves the user's profile settings.
export const get = api<void, UserProfile>(
  { expose: true, method: "GET", path: "/profile", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    // Get internal user_id from clerk_id
    const user = await db.queryRow<{ id: number }>`
      SELECT id FROM users WHERE clerk_id = ${auth.userID}
    `;
    
    if (!user) {
      throw APIError.notFound("user not found");
    }
    
    const profile = await db.queryRow<ProfileRow>`
      SELECT * FROM user_profiles WHERE user_id = ${user.id}
    `;

    if (!profile) {
      throw APIError.notFound("profile not found");
    }

    return {
      userId: profile.user_id,
      name: profile.name,
      occupation: profile.occupation || undefined,
      sleepHours: profile.sleep_hours,
      productiveHours: profile.productive_hours as any[],
      customHours: profile.custom_hours || undefined,
      focusPreference: profile.focus_preference as any,
      alertFrequency: profile.alert_frequency as any,
      allocationStrategy: profile.allocation_strategy as any,
      updatedAt: profile.updated_at,
    };
  }
);
