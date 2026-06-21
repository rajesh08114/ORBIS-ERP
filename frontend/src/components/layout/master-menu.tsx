"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "@/components/icons";

export function MasterMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const links = [
    { label: "Sale Orders", href: "/sales/orders" },
    { label: "Purchase Orders", href: "/purchase/orders" },
    { label: "Manufacturing Orders", href: "/manufacturing/orders" },
    { label: "Bills of Materials", href: "/manufacturing/bom" },
    { label: "Products", href: "/products" },
    { label: "Audit Logs", href: "/audit-logs" },
  ];

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center p-2 rounded-[8px] hover:bg-[var(--surface-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        aria-label="Open Master Menu"
      >
        <Menu className="h-6 w-6 text-[var(--foreground)]" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 animate-in fade-in duration-200">
          <div 
            ref={menuRef} 
            className="w-full max-w-sm bg-[#121212] border border-[#333] shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-top-8 duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-[#1a1a1a]">
              <h2 className="text-lg font-semibold text-white tracking-wide">Master Menu</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Links List */}
            <nav className="flex flex-col">
              {links.map((link, idx) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-6 py-4 text-sm font-medium transition-colors focus:bg-[#2a2a2a] focus:outline-none ${idx !== links.length - 1 ? 'border-b border-[#333]' : ''}`}
                  style={{ color: '#d1d5db' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.backgroundColor = '#2a2a2a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
