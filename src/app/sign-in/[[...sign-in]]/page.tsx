import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { AuthBackground } from "@/components/auth-background";
import { CustomAuthCard } from "@/components/auth/custom-auth-card";

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
