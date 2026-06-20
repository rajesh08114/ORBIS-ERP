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
  { href: "/dashboard", label: "Dashboard", icon: Home, group: "Core", roles: ["Administrator", "System User", "Sales User", "Sales Manager", "Purchase User", "Procurement Manager", "Manufacturing User", "Manufacturing Manager", "Inventory Manager", "Business Owner"] },
  { href: "/executive", label: "Executive", icon: Activity, group: "Core", roles: ["Administrator", "Business Owner"] },
  {
    href: "/digital-twin",
    label: "Digital Twin",
    icon: Boxes,
    group: "Core",
    roles: ["Administrator", "Manufacturing Manager", "Manufacturing User", "Business Owner"],
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: PackageSearch,
    group: "Operations",
    roles: ["Administrator", "Inventory Manager", "Business Owner"],
  },
  {
    href: "/products",
    label: "Products",
    icon: ClipboardList,
    group: "Operations",
    roles: ["Administrator", "Inventory Manager", "Sales Manager", "Sales User", "Business Owner"],
  },
  {
    href: "/sales/orders",
    label: "Sales",
    icon: ReceiptText,
    group: "Operations",
    roles: ["Administrator", "Sales Manager", "Sales User", "Business Owner"],
  },
  {
    href: "/customers",
    label: "Customers",
    icon: Users,
    group: "Operations",
    roles: ["Administrator", "Sales Manager", "Sales User", "Business Owner"],
  },
  {
    href: "/purchase/orders",
    label: "Purchase",
    icon: ShoppingCart,
    group: "Operations",
    roles: ["Administrator", "Procurement Manager", "Purchase User", "Business Owner"],
  },
  {
    href: "/purchase/vendors",
    label: "Vendors",
    icon: Truck,
    group: "Operations",
    roles: ["Administrator", "Procurement Manager", "Purchase User", "Business Owner"],
  },
  {
    href: "/manufacturing/command-center",
    label: "Manufacturing",
    icon: Factory,
    group: "Operations",
    roles: ["Administrator", "Manufacturing Manager", "Manufacturing User", "Business Owner"],
  },
  {
    href: "/manufacturing/bom",
    label: "BOM",
    icon: ClipboardList,
    group: "Operations",
    roles: ["Administrator", "Manufacturing Manager", "Manufacturing User", "Business Owner"],
  },
  {
    href: "/manufacturing/work-centers",
    label: "Work Centers",
    icon: Factory,
    group: "Operations",
    roles: ["Administrator", "Manufacturing Manager", "Manufacturing User", "Business Owner"],
  },
  { href: "/audit-logs", label: "Audit Logs", icon: ShieldCheck, group: "Governance", roles: ["Administrator"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, group: "Governance", roles: ["Administrator", "Business Owner"] },
  { href: "/users", label: "Users", icon: Users, group: "Admin", roles: ["Administrator"] },
  { href: "/settings", label: "Settings", icon: Settings, group: "Admin", roles: ["Administrator"] },
  {
    href: "/help",
    label: "Help",
    icon: FileClock,
    group: "Support",
    roles: ["Administrator", "Inventory Manager", "Procurement Manager", "Purchase User", "Manufacturing Manager", "Manufacturing User", "Sales Manager", "Sales User", "Business Owner", "System User"],
  },
] as const;

export type AppRoute = (typeof appRoutes)[number];

export function canAccessRoute(route: AppRoute, role: UserRole) {
  return (route.roles as readonly UserRole[]).includes(role);
}

const rolePrefixes: Record<UserRole, readonly string[]> = {
  Administrator: ["/"],
  "Inventory Manager": ["/dashboard", "/inventory", "/products", "/help", "/profile", "/notifications", "/access-denied"],
  "Procurement Manager": ["/dashboard", "/purchase", "/procurement", "/help", "/profile", "/notifications", "/access-denied"],
  "Purchase User": ["/dashboard", "/purchase", "/procurement", "/help", "/profile", "/notifications", "/access-denied"],
  "Manufacturing Manager": ["/dashboard", "/manufacturing", "/digital-twin", "/help", "/profile", "/notifications", "/access-denied"],
  "Manufacturing User": ["/dashboard", "/manufacturing", "/digital-twin", "/help", "/profile", "/notifications", "/access-denied"],
  "Sales Manager": ["/dashboard", "/sales", "/products", "/customers", "/help", "/profile", "/notifications", "/access-denied"],
  "Sales User": ["/dashboard", "/sales", "/products", "/customers", "/help", "/profile", "/notifications", "/access-denied"],
  "Business Owner": ["/dashboard", "/executive", "/digital-twin", "/inventory", "/products", "/sales", "/customers", "/purchase", "/manufacturing", "/analytics", "/help", "/profile", "/notifications", "/access-denied"],
  "System User": ["/dashboard", "/help", "/profile", "/notifications", "/access-denied"],
};

export function canAccessPath(pathname: string, role: UserRole) {
  if (role === "Administrator") return true;
  return rolePrefixes[role].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
