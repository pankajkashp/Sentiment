import { getCurrentUser } from "@/lib/auth";
import { ProfileClientView } from "./profile-client-view";
import type { AuthUser } from "@/features/auth/auth-context";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  // Convert Date objects to ISO strings for client component serialization
  const serializedUser: AuthUser | null = user
    ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        stakeholderType: user.stakeholderType,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    : null;

  return <ProfileClientView initialUser={serializedUser} />;
}
