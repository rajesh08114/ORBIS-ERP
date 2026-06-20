import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { OrbisLogo } from "@/components/layout/orbis-logo";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md p-6">
        <OrbisLogo />
        <h1 className="mt-8 text-3xl font-bold">Reset password</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Enter your email and ORBIS will send recovery instructions.</p>
        <div className="mt-6 grid gap-4">
          <Input type="email" placeholder="alex@orbis.example" />
          <Button>Send reset link</Button>
          <Link href="/login" className="text-center text-sm font-semibold text-[var(--primary)]">Back to login</Link>
        </div>
      </Card>
    </main>
  );
}
