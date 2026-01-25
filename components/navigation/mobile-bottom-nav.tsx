"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  BookOpen,
  Search,
  User,
  ShoppingCart,
  Settings,
  BarChart3,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/user";
import { useCartStore } from "@/lib/store/cart-store";
import { useNotificationsStore } from "@/lib/store/notifications-store";
import { useSession } from "next-auth/react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  roles: UserRole[];
}

const navigationItems: NavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    href: "/",
    roles: ["USER", "STUDENT", "TUTOR", "ADMIN"],
  },
  {
    id: "courses",
    label: "Courses",
    icon: BookOpen,
    href: "/courses",
    roles: ["USER", "STUDENT", "TUTOR", "ADMIN"],
  },
  {
    id: "search",
    label: "Search",
    icon: Search,
    href: "/search",
    roles: ["USER", "STUDENT", "TUTOR", "ADMIN"],
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
    roles: ["TUTOR"],
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
    roles: ["USER", "STUDENT", "TUTOR", "ADMIN"],
  },
];

interface MobileBottomNavProps {
  userRole: UserRole;
}

export function MobileBottomNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { getTotalItems } = useCartStore();
  const { getUnreadCount }: any = useNotificationsStore();

  const userRole = (session?.user.role || "USER") as UserRole;
  const cartItems = getTotalItems();
  const unreadNotifications = useNotificationsStore(
    (state) => state.unreadCount
  );

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
  let visibleItems = navigationItems
    .filter((item) => item.roles.includes(userRole))
    .slice(0, 5); // Limit to 5 items for mobile

  // Add cart and notifications for appropriate roles
  if (userRole === "STUDENT" || userRole === "USER") {
    // Replace one item with cart if not already present
    if (!visibleItems.find((item) => item.id === "cart")) {
      visibleItems[visibleItems.length - 1] = {
        id: "cart",
        label: "Cart",
        icon: ShoppingCart,
        href: "/cart",
        badge: cartItems,
        roles: ["USER", "STUDENT"],
      };
    }
  }

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
        : item
    );
  }

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href) ;
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
            {visibleItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);

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

                    {/* Icon with badge */}
                    <div className="relative">
                      <Icon
                        className={`w-5 h-5 transition-colors ${
                          active ? "text-neon-blue" : "text-gray-400"
                        }`}
                      />

                      {/* Badge */}
                      {item.badge && item.badge > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500 border-0">
                          {item.badge > 99 ? "99+" : item.badge}
                        </Badge>
                      )}

                      {/* Special notification badge */}
                      {item.id === "profile" &&
                        typeof unreadNotifications === "function" &&
                        unreadNotifications() > 0 &&
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
