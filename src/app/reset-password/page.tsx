"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { usePasswordReset } from "@/hooks/usePasswordReset";
import { EResetStep } from "@/types/password.types";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { state, setProvider, setIdentifier, sendReset, loading, reset } =
    usePasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await sendReset();
    if (success) {
      if (state.provider === "email") {
        // Email provider: token comes via link; user needs to manually input the token
        router.push("/reset-password/reset");
      } else {
        router.push(
          `/reset-password/validate?provider=${state.provider}&identifier=${encodeURIComponent(state.identifier)}`,
        );
      }
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card
        title="Reset Password — Step 1"
        description="POST /public/reset-password — Send reset request via email, SMS OTP, or email OTP."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Reset Provider"
            name="provider"
            type="select"
            value={state.provider}
            onChange={(v) => setProvider(v as "email" | "sms" | "email-otp")}
            options={[
              { value: "email", label: "Email Link" },
              { value: "sms", label: "SMS OTP" },
              { value: "email-otp", label: "Email OTP" },
            ]}
            helperText="Header: x-reset-provider"
          />

          <FormField
            label="Identifier"
            name="identifier"
            value={state.identifier}
            onChange={setIdentifier}
            placeholder={
              state.provider === "sms" ? "+628123456789" : "user@example.com"
            }
            helperText={
              state.provider === "sms"
                ? "Phone number for SMS OTP"
                : "Email address"
            }
            required
          />

          <Button type="submit" loading={loading} disabled={!state.identifier}>
            Send Reset Request
          </Button>
        </form>
      </Card>

      {/* Flow diagram */}
      <Card className="mt-6">
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>Reset Flow:</strong>
          </p>
          <ol className="ml-4 list-decimal space-y-1">
            <li>Send reset request → receives email/SMS OTP/email OTP</li>
            {state.provider !== "email" && (
              <li>Validate OTP code → receives password reset token</li>
            )}
            <li>Set new password using the reset token</li>
          </ol>
          <p className="mt-3">
            <strong>Security:</strong> For email provider, the API always
            returns success regardless of whether the email exists (prevents
            enumeration).
          </p>
        </div>
      </Card>

      {/* Manual token entry for email provider */}
      <Card title="Already have a token?" className="mt-6">
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          If you received a password reset link via email, you can enter the
          token directly.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/reset-password/reset")}
        >
          Go to Reset Step
        </Button>
      </Card>
    </div>
  );
}
