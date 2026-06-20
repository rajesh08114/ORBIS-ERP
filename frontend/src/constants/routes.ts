import {
  Activity,
  BarChart3,
  Boxes,
  ClipboardList,
  Factory,
  FileClock,
  Home,
  PackageSearch,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
} from "@/components/icons";
import type { UserRole } from "@/stores/auth-store";

export const appRoutes = [
  { href: "/dashboard", label: "Dashboard", icon: Home, group: "Core", roles: ["Administrator"] },
  { href: "/executive", label: "Executive", icon: Activity, group: "Core", roles: ["Administrator"] },
  {
    href: "/digital-twin",
    label: "Digital Twin",
    icon: Boxes,
    group: "Core",
    roles: ["Administrator", "Manufacturing Manager"],
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: PackageSearch,
    group: "Operations",
    roles: ["Administrator", "Inventory Manager"],
  },
  {
    href: "/products",
    label: "Products",
    icon: ClipboardList,
    group: "Operations",
    roles: ["Administrator", "Inventory Manager", "Sales Manager"],
  },
  {
    href: "/sales/orders",
    label: "Sales",
    icon: ReceiptText,
    group: "Operations",
    roles: ["Administrator", "Sales Manager"],
  },
  {
    href: "/customers",
    label: "Customers",
    icon: Users,
    group: "Operations",
    roles: ["Administrator", "Sales Manager"],
  },
  {
    href: "/purchase/orders",
    label: "Purchase",
    icon: ShoppingCart,
    group: "Operations",
    roles: ["Administrator", "Procurement Manager"],
  },
  {
    href: "/purchase/vendors",
    label: "Vendors",
    icon: Truck,
    group: "Operations",
    roles: ["Administrator", "Procurement Manager"],
  },
  {
    href: "/manufacturing/command-center",
    label: "Manufacturing",
    icon: Factory,
    group: "Operations",
    roles: ["Administrator", "Manufacturing Manager"],
  },
  {
    href: "/manufacturing/bom",
    label: "BOM",
    icon: ClipboardList,
    group: "Operations",
    roles: ["Administrator", "Manufacturing Manager"],
  },
  {
    href: "/manufacturing/work-centers",
    label: "Work Centers",
    icon: Factory,
    group: "Operations",
    roles: ["Administrator", "Manufacturing Manager"],
  },
  { href: "/audit-logs", label: "Audit Logs", icon: ShieldCheck, group: "Governance", roles: ["Administrator"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, group: "Governance", roles: ["Administrator"] },
  { href: "/users", label: "Users", icon: Users, group: "Admin", roles: ["Administrator"] },
  { href: "/settings", label: "Settings", icon: Settings, group: "Admin", roles: ["Administrator"] },
  {
    href: "/help",
    label: "Help",
    icon: FileClock,
    group: "Support",
    roles: ["Administrator", "Inventory Manager", "Procurement Manager", "Manufacturing Manager", "Sales Manager"],
  },
] as const;

export type AppRoute = (typeof appRoutes)[number];

export function canAccessRoute(route: AppRoute, role: UserRole) {
  return (route.roles as readonly UserRole[]).includes(role);
}

const rolePrefixes: Record<UserRole, readonly string[]> = {
  Administrator: ["/"],
  "Inventory Manager": ["/inventory", "/products", "/help", "/profile", "/notifications", "/access-denied"],
  "Procurement Manager": ["/purchase", "/procurement", "/help", "/profile", "/notifications", "/access-denied"],
  "Manufacturing Manager": ["/manufacturing", "/digital-twin", "/help", "/profile", "/notifications", "/access-denied"],
  "Sales Manager": ["/sales", "/products", "/customers", "/help", "/profile", "/notifications", "/access-denied"],
};

export function canAccessPath(pathname: string, role: UserRole) {
  if (role === "Administrator") return true;
  return rolePrefixes[role].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
