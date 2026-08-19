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
  Menu,
  X,
} from "lucide-react";
import { siteSettings } from "@/lib/settings";
import { useState } from "react";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="relative h-10 w-10 overflow-hidden rounded-xl ring-2 ring-white/10">
          <Image src={siteSettings.logoSrc} alt={siteSettings.brandName} fill className="object-cover" />
        </div>
        <div>
          <span className="block font-display text-sm font-bold leading-tight">Admin Panel</span>
          <span className="block text-[11px] text-white/40">{siteSettings.brandName}</span>
        </div>
      </div>
      <div className="mx-4 border-t border-white/10" />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-white/15 text-white shadow-sm shadow-black/10"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mx-4 border-t border-white/10" />
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-red-300"
        >
          <LogOut size={17} /> Log Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F8F9FC]">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-gradient-to-b from-deep to-deep/95 text-white lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex w-72 flex-col bg-gradient-to-b from-deep to-deep/95 text-white shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-mist-dark bg-white/80 px-5 py-3 backdrop-blur-lg lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-storm hover:bg-mist lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="font-display text-sm font-bold text-ink lg:hidden">Admin</span>
            <span className="hidden text-sm text-storm lg:block">
              {navItems.find((i) => pathname === i.href || (i.href !== "/admin" && pathname?.startsWith(i.href)))?.label || "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-deep/5 text-deep">
              <LayoutDashboard size={15} />
            </div>
          </div>
        </header>
        <main className="flex-1 p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
