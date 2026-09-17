"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, isAccessTokenExpired } from "@/lib/auth/session";
import { forceLogout } from "@/lib/auth/api";
import { PageLoader } from "@/components/ui/Skeleton";

/** No marketing homepage — send guests to login, sessions to projects. */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (isAccessTokenExpired()) {
      void forceLogout();
      return;
    }
    router.replace("/projects");
  }, [router]);

  return <PageLoader label="Redirecting…" />;
}
