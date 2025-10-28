import { createClerkClient, verifyToken } from "@clerk/backend";
import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import db from "../db";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string;
}

export const auth = authHandler<AuthParams, AuthData>(async (data) => {
  const token = data.authorization?.replace("Bearer ", "");
  if (!token) {
    throw APIError.unauthenticated("missing token");
  }

  try {
    const verifiedToken = await verifyToken(token, {
      secretKey: clerkSecretKey(),
    });

    const user = await clerkClient.users.getUser(verifiedToken.sub);

    // Ensure user exists in our database
    const existingUser = await db.queryRow<{ id: number }>`
      SELECT id FROM users WHERE clerk_id = ${user.id}
    `;

    if (!existingUser) {
      // Create user if doesn't exist
      const email =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress || "";

      await db.exec`
        INSERT INTO users (clerk_id, email, is_active)
        VALUES (${user.id}, ${email}, true)
        ON CONFLICT (clerk_id) DO NOTHING
      `;

      // Create default profile
      const newUser = await db.queryRow<{ id: number }>`
        SELECT id FROM users WHERE clerk_id = ${user.id}
      `;

      if (newUser) {
        const name =
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.username || "User";

        await db.exec`
          INSERT INTO user_profiles (user_id, name)
          VALUES (${newUser.id}, ${name})
          ON CONFLICT (user_id) DO NOTHING
        `;
      }
    }

    return {
      userID: user.id,
      email:
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress || "",
    };
  } catch (err) {
    console.error("Auth error:", err);
    throw APIError.unauthenticated("invalid token", err as Error);
  }
});

// Configure the API gateway to use the auth handler.
export const gw = new Gateway({ authHandler: auth });
