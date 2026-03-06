"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  BookOpen,
  Search,
  User,
  Settings,
  BarChart3,
  Users,
} from "lucide-react";
import type { UserRole } from "@/types/user";
import { useNotificationsStore } from "@/lib/store/notifications-store";
import { useSession } from "next-auth/react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  roles: UserRole[];
  isSpecial?: boolean;
}

const navigationItems: NavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    href: "/",
    roles: ["USER", "STUDENT", "MENTOR", "TUTOR", "ADMIN"],
  },
  {
    id: "courses",
    label: "Courses",
    icon: BookOpen,
    href: "/courses",
    roles: ["USER", "STUDENT", "MENTOR", "TUTOR", "ADMIN"],
  },
  {
    id: "search",
    label: "Search",
    icon: Search,
    href: "/search",
    roles: ["USER", "STUDENT", "MENTOR", "TUTOR", "ADMIN"],
    isSpecial: true,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    href: "/student",
    roles: ["STUDENT"],
  },
  {
    id: "tutor-dashboard",
    label: "Dashboard",
    icon: Users,
    href: "/tutor",
    roles: ["MENTOR", "TUTOR"],
  },
  {
    id: "admin-dashboard",
    label: "Admin",
    icon: Settings,
    href: "/admin",
    roles: ["ADMIN"],
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    href: "/profile",
    roles: ["USER", "STUDENT", "MENTOR", "TUTOR", "ADMIN"],
  },
];

export function MobileBottomNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const unreadNotifications = useNotificationsStore(
    (state) => state.unreadCount,
  );

  const userRole = (session?.user.role || "USER") as UserRole;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Filter navigation items based on user role
  let visibleItems = navigationItems.filter((item) =>
    item.roles.includes(userRole),
  );

  // Handle unauthenticated state
  if (status !== "authenticated") {
    visibleItems = visibleItems.map((item) =>
      item.id === "profile"
        ? {
            id: "login",
            label: "Sign In",
            icon: User,
            href: "/login",
            roles: ["USER"],
          }
        : item,
    );
  }

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/search");
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20 md:hidden" />

      {/* Mobile Bottom Navigation */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : 100 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}>
        <div className="glass-card border-t border-white/10 backdrop-blur-2xl">
          <div className="flex items-center justify-around px-2 py-2">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              // Handle special search item
              if (item.isSpecial) {
                return (
                  <button
                    key={item.id}
                    onClick={handleSearchClick}
                    className="relative flex flex-col items-center justify-center p-2 min-w-0 flex-1">
                    <motion.div
                      className="relative flex flex-col items-center justify-center transition-all duration-200 text-gray-400"
                      whileTap={{ scale: 0.95 }}>
                      <Icon className="w-5 h-5 text-gray-400" />
                      <span className="text-xs mt-1 font-medium text-gray-400 truncate max-w-full">
                        {item.label}
                      </span>
                    </motion.div>
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center p-2 min-w-0 flex-1">
                  <motion.div
                    className={`relative flex flex-col items-center justify-center transition-all duration-200 ${
                      active ? "text-neon-blue" : "text-gray-400"
                    }`}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      scale: active ? 1.1 : 1,
                    }}>
                    {/* Active indicator */}
                    {active && (
                      <motion.div
                        className="absolute -top-1 w-1 h-1 bg-neon-blue rounded-full"
                        layoutId="activeIndicator"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Icon with notification badge */}
                    <div className="relative">
                      <Icon
                        className={`w-5 h-5 transition-colors ${
                          active ? "text-neon-blue" : "text-gray-400"
                        }`}
                      />

                      {/* Notification badge for profile */}
                      {item.id === "profile" &&
                        typeof unreadNotifications === "number" &&
                        unreadNotifications > 0 &&
                        status === "authenticated" && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900" />
                        )}
                    </div>

                    {/* Label */}
                    <span
                      className={`text-xs mt-1 font-medium transition-colors truncate max-w-full ${
                        active ? "text-neon-blue" : "text-gray-400"
                      }`}>
                      {item.label}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </>
  );
}
