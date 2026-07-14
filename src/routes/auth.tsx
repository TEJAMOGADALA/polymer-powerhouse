import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Factory, Mail, Lock, KeyRound, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot" | "otp" | "reset";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [otp, setOtp] = useState("");

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onLogin(values: z.infer<typeof loginSchema>) {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
    navigate({ to: "/" });
  }

  async function onSignup(values: z.infer<typeof loginSchema>) {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You're signed in.");
    navigate({ to: "/" });
  }

  async function sendOtp() {
    if (!recoveryEmail) return toast.error("Enter your email");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: recoveryEmail,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("OTP sent to your email");
    setMode("otp");
  }

  async function verifyOtp() {
    if (otp.length !== 6) return toast.error("Enter the 6-digit code");
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: recoveryEmail,
      token: otp,
      type: "email",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Verified. Set a new password.");
    setMode("reset");
  }

  async function resetPassword(newPass: string) {
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/" });
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Factory className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Polymer DMS</h1>
            <p className="text-xs text-muted-foreground">Document Management</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8">
          {mode === "login" && (
            <>
              <h2 className="text-xl font-bold">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">Access your polymer workspace</p>
              <form onSubmit={form.handleSubmit(onLogin)} className="mt-6 space-y-4">
                <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                  <Input type="email" autoComplete="email" {...form.register("email")} />
                </Field>
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
                <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                  <Input type="password" autoComplete="current-password" {...form.register("password")} />
                </Field>
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in..." : "Login"}
                </Button>
              </form>
              <div className="mt-4 flex justify-between text-sm">
                <button type="button" className="text-primary hover:underline" onClick={() => setMode("forgot")}>
                  Forgot password?
                </button>
                <button type="button" className="text-primary hover:underline" onClick={() => setMode("signup")}>
                  Create account
                </button>
              </div>
            </>
          )}

          {mode === "signup" && (
            <>
              <BackBtn onClick={() => setMode("login")} />
              <h2 className="text-xl font-bold">Create admin account</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                First account becomes the admin.
              </p>
              <form onSubmit={form.handleSubmit(onSignup)} className="mt-6 space-y-4">
                <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                  <Input type="email" {...form.register("email")} />
                </Field>
                <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                  <Input type="password" {...form.register("password")} />
                </Field>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating..." : "Create account"}
                </Button>
              </form>
            </>
          )}

          {mode === "forgot" && (
            <>
              <BackBtn onClick={() => setMode("login")} />
              <h2 className="text-xl font-bold">Reset password</h2>
              <p className="mt-1 text-sm text-muted-foreground">We'll email a 6-digit OTP.</p>
              <div className="mt-6 space-y-4">
                <Field label="Registered email" icon={<Mail className="h-4 w-4" />}>
                  <Input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                  />
                </Field>
                <Button className="w-full" disabled={busy} onClick={sendOtp}>
                  {busy ? "Sending..." : "Send OTP"}
                </Button>
              </div>
            </>
          )}

          {mode === "otp" && (
            <>
              <BackBtn onClick={() => setMode("forgot")} />
              <h2 className="text-xl font-bold">Enter OTP</h2>
              <p className="mt-1 text-sm text-muted-foreground">Sent to {recoveryEmail}</p>
              <div className="mt-6 flex flex-col items-center gap-4">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                  </InputOTPGroup>
                </InputOTP>
                <Button className="w-full" disabled={busy} onClick={verifyOtp}>
                  {busy ? "Verifying..." : "Verify OTP"}
                </Button>
                <button className="text-sm text-primary hover:underline" onClick={sendOtp} type="button">
                  Resend code
                </button>
              </div>
            </>
          )}

          {mode === "reset" && <ResetPasswordForm busy={busy} onSubmit={resetPassword} />}
        </div>
      </div>
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-3.5 w-3.5" /> Back
    </button>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <div className="[&_input]:pl-9">{children}</div>
      </div>
    </div>
  );
}

function ResetPasswordForm({ busy, onSubmit }: { busy: boolean; onSubmit: (p: string) => void }) {
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  return (
    <>
      <h2 className="text-xl font-bold">Set new password</h2>
      <div className="mt-6 space-y-4">
        <Field label="New password" icon={<KeyRound className="h-4 w-4" />}>
          <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        </Field>
        <Field label="Confirm password" icon={<KeyRound className="h-4 w-4" />}>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <Button
          className="w-full"
          disabled={busy}
          onClick={() => {
            if (pass.length < 6) return toast.error("Min 6 characters");
            if (pass !== confirm) return toast.error("Passwords don't match");
            onSubmit(pass);
          }}
        >
          {busy ? "Updating..." : "Update password"}
        </Button>
      </div>
    </>
  );
}
