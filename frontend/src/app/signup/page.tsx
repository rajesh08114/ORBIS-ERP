"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

const signupSchema = z.object({
  username: z.string()
    .min(6, "Login Id must be at least 6 characters.")
    .max(12, "Login Id must be at most 12 characters."),
  email: z.string().email("Please enter a valid Email Id."),
  password: z.string()
    .min(9, "Password must be more than 8 characters.")
    .regex(/[a-z]/, "Must contain at least one lowercase letter.")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter.")
    .regex(/[\W_]/, "Must contain at least one special character."),
  password_confirm: z.string()
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords do not match.",
  path: ["password_confirm"],
});

type SignupValues = z.infer<typeof signupSchema>;

function SignupContent() {
  const router = useRouter();
  const registerAction = useAuthStore((state) => state.register);
  const user = useAuthStore((state) => state.user);
  
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
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      password_confirm: "",
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
    try {
      const sessionUser = await registerAction({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        password_confirm: values.password_confirm
      });
      if (!sessionUser) {
        toast.error("Registration failed. Please try again.");
        return;
      }
      toast.success(`Account created successfully. Welcome, ${sessionUser.username}!`);
      router.replace(sessionUser.home);
    } catch (error: any) {
      if (error.data) {
        // Map backend errors
        const errData = error.data;
        if (errData.username) toast.error(`Login Id: ${errData.username[0]}`);
        else if (errData.email) toast.error(`Email: ${errData.email[0]}`);
        else if (errData.password) toast.error(`Password: ${errData.password[0]}`);
        else toast.error(error.message || "Registration failed.");
      } else {
        toast.error(error.message || "Registration failed due to a network error.");
      }
    }
  });

  if (user) return null; // Avoid flashing form while redirecting

  return (
    <div className="relative min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center overflow-x-hidden font-sans select-none">
      
      {/* Atmospheric Glowing Backgrounds */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Glow Spheres */}
        <div 
          className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[#12b76a]/20 blur-[120px] transition-transform duration-300 ease-out" 
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
        />
        <div 
          className="absolute -bottom-[10%] -left-[10%] w-[600px] h-[600px] rounded-full bg-[#34d399]/10 blur-[120px] transition-transform duration-300 ease-out" 
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

      {/* Signup Content Container */}
      <main className="relative z-10 w-full max-w-sm px-4 py-8">
        
        {/* Logo & Header Branding */}
        <div className="flex flex-col items-center mb-6">
          <Link href="/" className="flex flex-col items-center group cursor-pointer">
            <div className="mb-4 p-3 bg-[#12b76a]/15 rounded-xl border border-[#12b76a]/25 text-[#12b76a] transition group-hover:scale-105">
              <div className="grid h-9 w-9 place-items-center rounded-full border-[6px] border-[#12b76a] bg-[#161618]">
                <div className="h-3.5 w-3.5 rotate-45 rounded-[3px] bg-[#12b76a]" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition">ORBIS ERP</h1>
            <p className="text-sm text-[var(--muted)] mt-2 text-center opacity-80">
              Sign up Page
            </p>
          </Link>
        </div>

        {/* glass-panel Form Box */}
        <div className="relative overflow-hidden rounded-2xl bg-[var(--surface)]/80 backdrop-blur-[12px] border border-[var(--border)] p-6 shadow-2xl">
          {/* subtle top border gradient highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#12b76a]/60 to-transparent" />
          
          <form onSubmit={submit} className="space-y-4">
            
            {/* Login Id Field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]" htmlFor="username">
                Enter Login Id
              </label>
              <input
                id="username"
                type="text"
                placeholder="6-12 characters"
                className="block w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#12b76a]/60 transition text-sm"
                {...register("username")}
              />
              {errors.username && <p className="text-[#ef4444] text-[10px]">{errors.username.message}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]" htmlFor="email">
                Enter Email Id
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                className="block w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#12b76a]/60 transition text-sm"
                {...register("email")}
              />
              {errors.email && <p className="text-[#ef4444] text-[10px]">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]" htmlFor="password">
                Enter Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Strong password"
                  className="block w-full px-4 pr-12 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#12b76a]/60 transition text-sm"
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
              {errors.password && <p className="text-[#ef4444] text-[10px]">{errors.password.message}</p>}
            </div>

            {/* Re-Enter Password Field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]" htmlFor="password_confirm">
                Re-Enter Password
              </label>
              <input
                id="password_confirm"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                className="block w-full px-4 py-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#12b76a]/60 transition text-sm"
                {...register("password_confirm")}
              />
              {errors.password_confirm && <p className="text-[#ef4444] text-[10px]">{errors.password_confirm.message}</p>}
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-[#12b76a] bg-transparent text-[#12b76a] text-sm font-semibold rounded-xl hover:bg-[#12b76a] hover:text-white active:scale-[0.98] transition shadow-lg disabled:opacity-60 cursor-pointer uppercase tracking-wider"
              >
                SIGN UP
              </button>
            </div>
            
            {/* Links */}
            <div className="text-center pt-3 text-xs text-[var(--muted)]">
              Already have an account? <Link href="/login" className="text-[#34d399] hover:underline transition">Sign In</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)] font-bold">
        Loading ORBIS Signup...
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
