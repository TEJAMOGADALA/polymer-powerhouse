import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Factory, Mail, Lock, KeyRound, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import loginVideo from "@/assets/LoginPageMfc.mp4.asset.json";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const target = search.next && search.next.startsWith("/") ? search.next : "/";
      throw redirect({ href: target });
    }
  },
  component: AuthPage,
});

type Mode = "login" | "forgot" | "otp" | "reset";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const nextPath = search.next && search.next.startsWith("/") ? search.next : "/";
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
    window.location.href = nextPath;
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
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      {/* Background video with fallback gradient */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        aria-hidden
      >
        <source src={loginVideo.url} type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/75 via-slate-900/70 to-blue-950/80"
        aria-hidden
      />

      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Factory className="h-5 w-5" />
          </div>
          <div className="text-white drop-shadow">
            <h1 className="text-lg font-bold leading-tight">Polymer DMS</h1>
            <p className="text-xs opacity-80">Document Management</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {mode === "login" && (
            <>
              <h2 className="text-xl font-bold">Administrator sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">Access your polymer workspace</p>
              <form onSubmit={form.handleSubmit(onLogin)} className="mt-6 space-y-4">
                <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                  <Input type="email" autoComplete="email" {...form.register("email")} />
                </Field>
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
                <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                  <PasswordInput autoComplete="current-password" {...form.register("password")} />
                </Field>
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in..." : "Login"}
                </Button>
              </form>
              <div className="mt-4 flex justify-center text-sm">
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    const currentEmail = form.getValues("email").trim();
                    if (currentEmail) setRecoveryEmail(currentEmail);
                    setMode("forgot");
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {mode === "forgot" && (
            <>
              <BackBtn onClick={() => setMode("login")} />
              <h2 className="text-xl font-bold">Reset password</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll email a 6-digit OTP to your registered administrator address.
              </p>
              <div className="mt-6 space-y-4">
                <Field label="Registered email" icon={<Mail className="h-4 w-4" />}>
                  <Input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>
                <Button className="w-full" disabled={busy || !recoveryEmail} onClick={sendOtp}>
                  {busy ? "Sending..." : `Send OTP${recoveryEmail ? ` to ${recoveryEmail}` : ""}`}
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

        <p className="mt-4 text-center text-xs text-white/80 drop-shadow">
          Single-administrator access · New accounts must be provisioned by the admin.
        </p>
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

const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
  (props, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <Input ref={ref} type={show ? "text" : "password"} {...props} className="pr-10" />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

function ResetPasswordForm({ busy, onSubmit }: { busy: boolean; onSubmit: (p: string) => void }) {
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  return (
    <>
      <h2 className="text-xl font-bold">Set new password</h2>
      <div className="mt-6 space-y-4">
        <Field label="New password" icon={<KeyRound className="h-4 w-4" />}>
          <PasswordInput value={pass} onChange={(e) => setPass(e.target.value)} />
        </Field>
        <Field label="Confirm password" icon={<KeyRound className="h-4 w-4" />}>
          <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} />
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
