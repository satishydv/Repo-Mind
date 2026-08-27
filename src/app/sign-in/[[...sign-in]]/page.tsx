import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { AuthBackground } from "@/components/auth-background";
import { CustomAuthCard } from "@/components/auth/custom-auth-card";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface PageProps {
  params: Promise<{ "sign-in"?: string[] }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const subPath = resolvedParams?.["sign-in"]?.[0];

  if (subPath === "sso-callback") {
    return (
      <AuthenticateWithRedirectCallback
        signUpForceRedirectUrl="/sync-user"
        signInForceRedirectUrl="/sync-user"
      />
    );
  }

  return (
    <AuthBackground>
      <CustomAuthCard mode="sign-in" />
    </AuthBackground>
  );
}
