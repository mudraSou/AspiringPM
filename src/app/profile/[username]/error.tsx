"use client";
import PageError from "@/components/ui/page-error";

export default function ProfileError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError {...props} fallbackLabel="Go home" fallbackHref="/" />;
}
