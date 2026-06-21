"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft } from "@/components/icons";

type ForgetPasswordValues = {
  loginId: string;
  passwordChar: string;
};

export default function ForgetPasswordPage() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [step, setStep] = useState(1);
  const [charIndex, setCharIndex] = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { isSubmitting },
  } = useForm<ForgetPasswordValues>({
    defaultValues: {
      loginId: "",
      passwordChar: "",
    },
  });

  // Track mouse movement for atmospheric background micro-interactions
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 20;
      const y = (e.clientY / window.innerHeight) * 20;
      setMousePosition({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const submit = handleSubmit(async (values) => {
    if (step === 1) {
      if (!values.loginId.trim()) {
        toast.error("Please enter your Login Id or Email.");
        return;
      }
      // Simulate checking user and deciding which character to ask for
      setCharIndex(Math.floor(Math.random() * 4) + 2); // Randomly ask for 2nd, 3rd, 4th, or 5th character
      setStep(2);
      return;
    }

    // Step 2
    const char = values.passwordChar.trim();
    if (!char) {
      toast.error("Please enter the requested character.");
      return;
    }

    try {
      // Simulate API call for password recovery step
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success("Identity verified.", {
        description: "Further recovery instructions have been dispatched to your registered email.",
      });
      router.push("/login");
    } catch (error: any) {
      toast.error("Verification failed.", {
        description: "Please contact your system administrator.",
      });
    }
  });

  return (
    <div className="relative min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center overflow-x-hidden font-sans select-none">
      
      {/* Atmospheric Glowing Backgrounds */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Glow Spheres */}
        <div 
          className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[var(--primary)]/15 blur-[120px] transition-transform duration-300 ease-out" 
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
        />
        <div 
          className="absolute -bottom-[10%] -left-[10%] w-[600px] h-[600px] rounded-full bg-[var(--secondary)]/10 blur-[120px] transition-transform duration-300 ease-out" 
          style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }}
        />
        
        {/* Abstract Dark Industrial Background Image */}
        <div 
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{ 
            backgroundImage: "url('/product/furniture-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
      </div>

      {/* Content Container */}
      <main className="relative z-10 w-full max-w-sm px-4 py-8">
        
        {/* Logo & Header Branding */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center group cursor-pointer">
            <div className="mb-4 p-3 bg-[var(--primary-soft)] rounded-xl border border-[var(--border)] text-[var(--primary)] transition group-hover:scale-105">
              <div className="grid h-9 w-9 place-items-center rounded-full border-[6px] border-[var(--primary-strong)] bg-[var(--surface)]">
                <div className="h-3.5 w-3.5 rotate-45 rounded-[3px] bg-[var(--primary-strong)]" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition">Furniture ERP</h1>
            <p className="text-sm text-[var(--muted)] mt-2 text-center opacity-80">
              Account Recovery
            </p>
          </Link>
        </div>

        {/* glass-panel Form Box */}
        <div className="relative overflow-hidden rounded-2xl bg-[var(--surface)]/80 backdrop-blur-[12px] border border-[var(--border)] p-8 shadow-2xl">
          {/* subtle top border gradient highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />
          
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[var(--foreground)]">Security Check</h2>
            <p className="text-xs text-[var(--muted)] mt-1">
              {step === 1 ? "Enter your Login ID or Email to begin the recovery process." : "To verify your identity, please answer the security prompt below."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            
            {step === 1 ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--primary-strong)]" htmlFor="loginId">
                  Login ID or Email
                </label>
                <div className="relative mt-2">
                  <input
                    id="loginId"
                    type="text"
                    placeholder="e.g. rajesh@grb.com"
                    className="block w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/60 transition text-sm"
                    suppressHydrationWarning
                    {...register("loginId")}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--primary-strong)]" htmlFor="passwordChar">
                  Enter the {getOrdinal(charIndex)} character of your password
                </label>
                <div className="relative mt-2">
                  <input
                    id="passwordChar"
                    type="password"
                    maxLength={1}
                    placeholder=""
                    className="block w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-center text-xl tracking-widest text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/60 transition"
                    suppressHydrationWarning
                    {...register("passwordChar")}
                  />
                </div>
              </div>
            )}

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-[var(--primary-strong)] bg-transparent text-[var(--primary-strong)] text-sm font-semibold rounded-xl hover:bg-[var(--primary-strong)] hover:text-white dark:hover:text-[var(--primary-fg)] active:scale-[0.98] transition shadow-lg disabled:opacity-60 cursor-pointer uppercase tracking-wider"
                suppressHydrationWarning
              >
                {step === 1 ? "Next" : (isSubmitting ? "Verifying..." : "Submit")}
              </button>
            </div>
          </form>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
        </div>
      </main>
    </div>
  );
}
