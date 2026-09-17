"use client";

import { AuthLifecycle } from "@/components/auth/AuthLifecycle";
import { GlobalToastContainer } from "@/components/feedback/GlobalToastContainer";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthLifecycle />
      {children}
      <GlobalToastContainer />
      <RegisterServiceWorker />
    </>
  );
}
