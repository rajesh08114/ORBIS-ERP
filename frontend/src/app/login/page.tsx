"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

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
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDtqpxz5NvYvMD57bCNbXozecJYGn3En3WCRwKq6nNR1nxjE9ZQqyAppQ5phtPywiqxvpv9lXTaRrcp9XkixxuhXtG-5Er2rmUoWIy8XoVUUyzt6mr7O8EYacmCr9qhoV0Irli0txOuD0fkuhg8h75hq2g18hAX65qqJ4M-nGCQhaVKA4vq5SJKMG1hbQmLADszXpsaiKWONiNbN6fvUX_8CL0cAx3bwTuXZZDYJXGnCBsF4KSec5eiKQxjZOumtXZycCwZJ_q1iWw')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
      </div>

      {/* Login Content Container */}
      <main className="relative z-10 w-full max-w-sm px-4 py-8">
        
        {/* Logo & Header Branding */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center group cursor-pointer">
            <div className="mb-4 p-3 bg-[var(--primary-soft)] rounded-xl border border-[var(--border)] text-[var(--primary)] transition group-hover:scale-105">
              <div className="grid h-9 w-9 place-items-center rounded-full border-[6px] border-[var(--primary-strong)] bg-[var(--surface)]">
                <div className="h-3.5 w-3.5 rotate-45 rounded-[3px] bg-[var(--primary-strong)]" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition">ORBIS ERP</h1>
            <p className="text-sm text-[var(--muted)] mt-2 text-center opacity-80">
              {isAdminMode ? "Login for System Administrator" : "Login for System User"}
            </p>
          </Link>
        </div>

        {/* glass-panel Form Box */}
        <div className="relative overflow-hidden rounded-2xl bg-[var(--surface)]/80 backdrop-blur-[12px] border border-[var(--border)] p-8 shadow-2xl">
          {/* subtle top border gradient highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />
          
          <form onSubmit={submit} className="space-y-5">
            
            {/* Login Id Field */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]" htmlFor="username">
                Login Id
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  placeholder="Enter Login Id"
                  className="block w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/60 transition text-sm"
                  {...register("username")}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  className="block w-full px-4 pr-12 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/60 transition text-sm"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--muted)] hover:text-[var(--foreground)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-[var(--primary-strong)] bg-transparent text-[var(--primary-strong)] text-sm font-semibold rounded-xl hover:bg-[var(--primary-strong)] hover:text-white dark:hover:text-[var(--primary-fg)] active:scale-[0.98] transition shadow-lg disabled:opacity-60 cursor-pointer uppercase tracking-wider"
              >
                SIGN IN
              </button>
            </div>
            
            {/* Links */}
            <div className="text-center pt-3 text-xs text-[var(--muted)] flex justify-center items-center space-x-1">
              <a href="#" className="hover:text-[var(--foreground)] transition">Forget Password?</a>
              <span>|</span>
              <Link href="/signup" className="hover:text-[var(--foreground)] transition">Sign Up</Link>
            </div>
          </form>
        </div>

        {/* Toggle Mode Button */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setIsAdminMode(!isAdminMode)}
            className="text-sm font-medium text-[var(--primary-strong)] dark:text-[var(--secondary)] hover:underline"
          >
            {isAdminMode ? "Login as User" : "Login as System Administrator"}
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
        Loading ORBIS login...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
