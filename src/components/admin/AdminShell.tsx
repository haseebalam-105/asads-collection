"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Star,
  Ticket,
  Newspaper,
  Settings,
  LogOut,
} from "lucide-react";
import { siteSettings } from "@/lib/settings";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-mist">
      <aside className="hidden w-60 shrink-0 flex-col bg-deep text-white lg:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="relative h-9 w-9 overflow-hidden rounded-full">
            <Image src={siteSettings.logoSrc} alt={siteSettings.brandName} fill className="object-cover" />
          </div>
          <span className="font-display text-sm font-bold">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="mx-3 mb-5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={17} /> Log Out
        </button>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-mist-dark bg-white px-5 py-3 lg:hidden">
          <span className="font-display text-sm font-bold text-deep">Admin Panel</span>
          <button onClick={handleLogout} className="text-xs font-semibold text-storm">
            Log Out
          </button>
        </header>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
