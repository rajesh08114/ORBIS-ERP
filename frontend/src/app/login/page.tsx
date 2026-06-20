"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { availableRoles, type UserRole, useAuthStore } from "@/stores/auth-store";

type LoginValues = {
  username: string;
  password: string;
  role: UserRole;
  remember: boolean;
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<LoginValues>({
    defaultValues: {
      username: "",
      password: "",
      role: "Administrator",
      remember: true,
    },
  });
  
  const selectedRole = watch("role");

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

  const submit = handleSubmit((values) => {
    // Fill credentials if empty for fast developer preview
    const username = values.username.trim() || `${values.role.toLowerCase().replace(" ", ".")}`;
    const password = values.password.trim() || "password123";

    const user = login(username, password, values.role);
    if (!user) {
      toast.error("Please enter a username and password.");
      return;
    }
    toast.success(`Welcome back, ${user.username}.`);
    const next = searchParams.get("next");
    router.replace(next ?? user.home);
  });

  return (
    <div className="relative min-h-screen w-full bg-[#0d0d0f] text-slate-100 flex items-center justify-center overflow-x-hidden font-sans select-none">
      
      {/* 1. Atmospheric Glowing Backgrounds */}
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

      {/* 2. Login Content Container */}
      <main className="relative z-10 w-full max-w-md px-4 py-8">
        
        {/* Logo & Header Branding */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center group cursor-pointer">
            <div className="mb-4 p-3 bg-[#12b76a]/15 rounded-xl border border-[#12b76a]/25 text-[#12b76a] transition group-hover:scale-105">
              <div className="grid h-9 w-9 place-items-center rounded-full border-[6px] border-[#12b76a] bg-[#161618]">
                <div className="h-3.5 w-3.5 rotate-45 rounded-[3px] bg-[#12b76a]" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white group-hover:text-[#12b76a] transition">ORBIS ERP</h1>
            <p className="text-sm text-slate-400 mt-2 text-center opacity-80">
              Precision operations for the modern enterprise.
            </p>
          </Link>
        </div>

        {/* glass-panel Form Box */}
        <div className="relative overflow-hidden rounded-2xl bg-[#161618]/80 backdrop-blur-[12px] border border-white/10 p-8 shadow-2xl">
          {/* subtle top border gradient highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#12b76a]/60 to-transparent" />
          
          <form onSubmit={submit} className="space-y-5">
            
            {/* Role Selector Grid */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Authorized Role
              </label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {availableRoles.map((role) => {
                  const active = selectedRole === role;
                  const label = role.replace(" Manager", "");
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setValue("role", role)}
                      className={`py-2 px-2.5 rounded-lg border text-center transition text-[10px] font-bold ${
                        active
                          ? "border-[#12b76a] bg-[#12b76a]/20 text-[#34d399]"
                          : "border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="username">
                Corporate Email / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {/* Mail SVG Icon */}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="username"
                  type="text"
                  placeholder={`e.g. name@company.com`}
                  className="block w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#12b76a]/60 transition text-sm"
                  {...register("username")}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="password">
                  Security Key
                </label>
                <Link className="text-xs font-medium text-[#34d399] hover:underline" href="/forgot-password">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {/* Lock SVG Icon */}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-12 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#12b76a]/60 transition text-sm"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
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

            {/* Checkbox */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/10 bg-white/[0.02] text-[#12b76a] accent-[#12b76a]"
                  {...register("remember")}
                />
                Keep session active
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-[#12b76a] text-white text-sm font-semibold rounded-xl hover:bg-[#12b76a]/90 active:scale-[0.98] transition shadow-lg shadow-[#12b76a]/25 disabled:opacity-60 cursor-pointer"
            >
              Access Dashboard
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>

          {/* SSO Options */}
          <div className="mt-6 border-t border-white/5 pt-6">
            <div className="relative flex justify-center text-xs mb-4">
              <span className="px-2 bg-[#161618] text-slate-400 font-medium">Or continue with</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => toast.info("Google SSO request logged.")}
                className="flex items-center justify-center py-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition text-xs font-semibold text-white cursor-pointer"
              >
                <img alt="Google" className="w-4 h-4 mr-2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMFSR6snTyja0TfImPE7K0F7igvIDJBJP1G2yrzuqQAQsztRc3iAYjzbNeLCqRtC_AOPZOrBnCPgjUI1NgSKaGN2kV8t4ZtitAl-d7LhcQ4yEFSyHKQTGUkPY-Dcqpw72oftzS4BPFk59tqPKnweagUr1SOfop6C6fVwV5UoAA1f-QZN1cI6lZn_6RV_HvNYQYsuHDopVfiUx_piEqN1Xxujx8Q62WJJd87uDcZBdADnUYLsKjy-PHX7WUiDqBDL6Ic20J9jBGJU0"/>
                Google SSO
              </button>
              <button 
                type="button" 
                onClick={() => toast.info("Biometric signature request logged.")}
                className="flex items-center justify-center py-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition text-xs font-semibold text-white cursor-pointer"
              >
                {/* Fingerprint SVG Icon */}
                <svg className="h-4 w-4 mr-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-3.317 2.683-6 6-6s6 2.683 6 6-2.683 6-6 6-6-2.683-6-6zm0 0c0-1.658 1.342-3 3-3s3 1.342 3 3-1.342 3-3 3-3-1.342-3-3zm-6 2c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z" />
                </svg>
                Biometric
              </button>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <footer className="mt-8 text-center space-y-4">
          <p className="text-xs text-slate-500">
            New to ORBIS ERP? <span className="text-[#34d399] hover:underline cursor-pointer" onClick={() => toast.info("Please request access from your Administrator.")}>Request enterprise access</span>
          </p>
          <div className="flex justify-center space-x-4 opacity-40 hover:opacity-85 transition-opacity text-[10px] uppercase font-bold tracking-wider text-slate-400">
            <a href="#" className="hover:text-white transition">Security</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition">Support</a>
          </div>
        </footer>

      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="grid min-h-screen place-items-center bg-[#121212] text-sm text-slate-400 font-bold">
        Loading ORBIS login...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
