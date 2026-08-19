import type { Metadata } from "next";
import { EmailVerificationForm } from "@/components/shop/EmailVerificationForm";

export const metadata: Metadata = {
  title: "Potwierdź adres e-mail",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <EmailVerificationForm />
    </div>
  );
}
