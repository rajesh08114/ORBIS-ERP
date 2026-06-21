"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type LoginValues = {
  username: string;
  password: string;
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user) {
      router.replace(user.home || "/dashboard");
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginValues>({
    defaultValues: {
      username: "",
      password: "",
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

  const submit = handleSubmit(async (values) => {
    const username = values.username.trim();
    const password = values.password;

    if (!username || !password) {
      toast.error("Please enter both Login Id and Password.");
      return;
    }

    try {
      const sessionUser = await login(username, password, isAdminMode);
      if (!sessionUser) {
        toast.error("Invalid Login Id or Password", {
          description: isAdminMode ? "Ensure you have Administrator privileges." : "Please check your credentials and try again."
        });
        return;
      }
      toast.success(`Welcome back, ${sessionUser.username}.`);
      const next = searchParams.get("next");
      router.replace(next ?? sessionUser.home);
    } catch (error: any) {
      toast.error(error.message || "Login failed due to a network error.", {
        description: error.status === 0 ? "The server might be down or a CORS policy blocked the request." : "Please check your credentials and try again."
      });
    }
  });

  if (user) return null; // Avoid flashing login form while redirecting

  return (
    <div className="relative min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center overflow-x-hidden font-sans select-none animate-in fade-in duration-200">
      
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

      {/* Login Content Container */}
      <main className="relative z-10 w-full max-w-[400px] px-4 py-8">
        
        {/* Logo & Header Branding */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex flex-col items-center group cursor-pointer">
            <div className="mb-5 p-3.5 bg-[var(--primary-soft)] rounded-2xl border border-[var(--border)] text-[var(--primary)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg shadow-sm">
              <div className="grid h-10 w-10 place-items-center rounded-full border-[7px] border-[var(--primary-strong)] bg-[var(--surface)]">
                <div className="h-4 w-4 rotate-45 rounded-[4px] bg-[var(--primary-strong)]" />
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-300">
              Furniture ERP
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--primary)] mt-3 text-center px-4 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 shadow-inner">
              {isAdminMode ? "System Administrator" : "System User Login"}
            </p>
          </Link>
        </div>

        {/* Premium glass-panel Form Box */}
        <div className="relative overflow-hidden rounded-3xl bg-[var(--surface)]/80 backdrop-blur-2xl border border-[var(--border)] p-8 shadow-2xl transition-all duration-200 hover:shadow-[0_20px_40px_rgba(87,52,79,0.12)]">
          {/* subtle top border gradient highlight */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-70" />
          
          <form onSubmit={submit} className="space-y-6">
            
            {/* Login Id Field */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--primary-strong)]" htmlFor="username">
                Login ID
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter Login ID"
                suppressHydrationWarning
                {...register("username")}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--primary-strong)]" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  className="pr-12"
                  suppressHydrationWarning
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--muted)]/50 group-hover:text-[var(--primary)] hover:text-[var(--primary-strong)] transition-colors duration-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  suppressHydrationWarning
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 text-[11px] uppercase tracking-widest"
                variant="primary"
                suppressHydrationWarning
              >
                Secure Sign In
              </Button>
            </div>
            
            {/* Links */}
            <div className="text-center pt-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]/80 flex justify-center items-center space-x-3">
              <Link href="/forget-password" className="hover:text-[var(--primary)] transition-colors">Recover Access</Link>
              <span className="opacity-30">|</span>
              <Link href="/signup" className="hover:text-[var(--primary)] transition-colors">Request Account</Link>
            </div>
          </form>
        </div>

        {/* Toggle Mode Button */}
        <div className="mt-8 text-center animate-in slide-in-from-bottom-4 duration-200">
          <button
            type="button"
            onClick={() => setIsAdminMode(!isAdminMode)}
            className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary-strong)]/80 hover:text-[var(--primary-strong)] hover:bg-[var(--surface-muted)] px-4 py-2 rounded-full transition-all duration-300"
            suppressHydrationWarning
          >
            Switch to {isAdminMode ? "User" : "Administrator"} Gateway
          </button>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)] font-bold">
        Loading Furniture ERP login...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
