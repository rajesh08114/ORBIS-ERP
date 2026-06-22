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
  { href: "/dashboard", label: "Dashboard", icon: Home, group: "Core", roles: ["Admin", "Sales User", "Purchase User", "Manufacturing User", "Inventory Manager", "Business Owner"] },
  { href: "/executive", label: "Executive", icon: Activity, group: "Core", roles: ["Admin", "Business Owner"] },
  {
    href: "/digital-twin",
    label: "Digital Twin",
    icon: Boxes,
    group: "Core",
    roles: ["Admin", "Manufacturing User", "Business Owner"],
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: PackageSearch,
    group: "Operations",
    roles: ["Admin", "Inventory Manager", "Business Owner"],
  },
  {
    href: "/products",
    label: "Products",
    icon: ClipboardList,
    group: "Operations",
    roles: ["Admin", "Inventory Manager", "Sales User", "Business Owner"],
  },
  {
    href: "/sales/orders",
    label: "Sales",
    icon: ReceiptText,
    group: "Operations",
    roles: ["Admin", "Sales User", "Business Owner"],
  },
  {
    href: "/customers",
    label: "Customers",
    icon: Users,
    group: "Operations",
    roles: ["Admin", "Sales User", "Business Owner"],
  },
  {
    href: "/purchase/orders",
    label: "Purchase",
    icon: ShoppingCart,
    group: "Operations",
    roles: ["Admin", "Purchase User", "Business Owner"],
  },
  {
    href: "/purchase/vendors",
    label: "Vendors",
    icon: Truck,
    group: "Operations",
    roles: ["Admin", "Purchase User", "Business Owner"],
  },
  {
    href: "/manufacturing/command-center",
    label: "Manufacturing",
    icon: Factory,
    group: "Operations",
    roles: ["Admin", "Manufacturing User", "Business Owner"],
  },
  {
    href: "/manufacturing/bom",
    label: "BOM",
    icon: ClipboardList,
    group: "Operations",
    roles: ["Admin", "Manufacturing User", "Business Owner"],
  },
  {
    href: "/manufacturing/work-centers",
    label: "Work Centers",
    icon: Factory,
    group: "Operations",
    roles: ["Admin", "Manufacturing User", "Business Owner"],
  },
  { href: "/audit-logs", label: "Audit Logs", icon: ShieldCheck, group: "Governance", roles: ["Admin"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, group: "Governance", roles: ["Admin", "Business Owner"] },
  { href: "/users", label: "Users", icon: Users, group: "Admin", roles: ["Admin"] },
  { href: "/settings", label: "Settings", icon: Settings, group: "Admin", roles: ["Admin"] },
  {
    href: "/help",
    label: "Help",
    icon: FileClock,
    group: "Support",
    roles: ["Admin", "Inventory Manager", "Purchase User", "Manufacturing User", "Sales User", "Business Owner"],
  },
] as const;

export type AppRoute = (typeof appRoutes)[number];

export function canAccessRoute(route: AppRoute, role: UserRole) {
  return (route.roles as readonly UserRole[]).includes(role);
}

const rolePrefixes: Record<UserRole, readonly string[]> = {
  Admin: ["/"],
  "Inventory Manager": ["/dashboard", "/inventory", "/products", "/help", "/profile", "/notifications", "/access-denied"],
  "Purchase User": ["/dashboard", "/purchase", "/procurement", "/help", "/profile", "/notifications", "/access-denied"],
  "Manufacturing User": ["/dashboard", "/manufacturing", "/digital-twin", "/help", "/profile", "/notifications", "/access-denied"],
  "Sales User": ["/dashboard", "/sales", "/products", "/customers", "/help", "/profile", "/notifications", "/access-denied"],
  "Business Owner": ["/dashboard", "/executive", "/digital-twin", "/inventory", "/products", "/sales", "/customers", "/purchase", "/manufacturing", "/analytics", "/help", "/profile", "/notifications", "/access-denied"],
};

export function canAccessPath(pathname: string, role: UserRole) {
  if (role === "Admin") return true;
  return rolePrefixes[role]?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ?? false;
}
