"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { 
  BoxArrowRight, 
  Person, 
  Settings, 
  ShieldLock, 
  Activity, 
  ReceiptText 
} from "@/components/icons";

export function ProfileDropdown() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.replace("/login");
    toast.success("Successfully logged out.");
  };

  const initials = (user?.first_name?.charAt(0) || user?.username?.charAt(0) || "U") +
                   (user?.last_name?.charAt(0) || user?.username?.charAt(1) || "").toUpperCase();

  const formattedLoginTime = user?.loginTimestamp
    ? new Date(user.loginTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "Just now";

  return (
    <div ref={dropdownRef} className="relative z-30">
      {/* Clickable Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full hover:opacity-90 focus:outline-none transition border border-[var(--border)] p-0.5 bg-[var(--surface-muted)] cursor-pointer"
        aria-label="User menu"
      >
        <div className="h-8 w-8 rounded-full bg-[var(--primary-soft)] flex items-center justify-center font-bold text-xs text-[var(--primary)] shadow-sm">
          {initials}
        </div>
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* User Info Header Block */}
          <div className="px-3.5 py-3 border-b border-[var(--border)] mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--foreground)] truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
              </span>
              {/* Online Indicator Badge */}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <div className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider mt-0.5">{user?.role}</div>
            {user?.email && <div className="text-[10px] text-[var(--muted)] truncate mt-1">{user.email}</div>}
            <div className="text-[9px] text-[var(--muted)] mt-1.5 opacity-80">
              Logged in: <span className="font-semibold text-[var(--foreground)]">{formattedLoginTime}</span>
            </div>
          </div>

          {/* Interactive Navigation List */}
          <div className="space-y-0.5">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition duration-150"
            >
              <Person className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Profile Overview</span>
            </Link>
            
            <Link
              href="/profile?tab=activity"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition duration-150"
            >
              <Activity className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>My Activity Logs</span>
            </Link>

            <Link
              href="/sales/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition duration-150"
            >
              <ReceiptText className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>My Orders</span>
            </Link>

            <Link
              href="/profile?tab=security"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition duration-150"
            >
              <ShieldLock className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Change Password</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition duration-150"
            >
              <Settings className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Preferences</span>
            </Link>

            <div className="h-px bg-[var(--border)] my-1.5" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[var(--danger)] hover:bg-[var(--danger-soft)] transition duration-150 text-left focus:outline-none cursor-pointer"
            >
              <BoxArrowRight className="w-3.5 h-3.5 text-[var(--danger)]" />
              <span>Logout Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
