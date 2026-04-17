"use client";

import { UserProfileDropdown } from "@/components/auth/user-profile-dropdown";
import { ShoppingCartComponent } from "@/components/cart/shopping-cart";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { roleNavItems } from "@/lib/const";
import { generateRandomAvatar } from "@/lib/utils";
import type { UserRole } from "@/types/user";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthenticatedNavigation() {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname() ?? "";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const role = (session?.user.role || "USER") as UserRole;
  const userName = session?.user.name || "Guest";
  const userEmail = session?.user.email || "";
  const userAvatar = session?.user.image || generateRandomAvatar();
  const navItems = roleNavItems[role];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all w-full duration-300 ${
        isScrolled
          ? "glass-card border-b border-white/10 backdrop-blur-3xl"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}>
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex-1">
            <motion.div
              className="flex items-center space-x-1"
              whileHover={{ scale: 1.05 }}>
              <Image
                src="/assets/standalone.png"
                alt=""
                width={100}
                height={100}
                className="w-10 h-10"
              />
              <span className="text-2xl hidden md:block font-bold text-gradient">
                PalmTechnIQ
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation Items */}
          <div className="hidden lg:flex items-center justify-center space-x-1 xl:space-x-2">
            {navItems.map((item, index) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`hover-glow hover:bg-white/10 hover:text-neon-blue transition-all duration-300 ${
                        isActive ? "bg-white/10 text-neon-blue" : ""
                      }`}>
                      <item.icon className="w-4 h-4 mr-1.5" />
                      {item.label}
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* User Actions */}
          <div className="flex items-center justify-end flex-1 space-x-2 sm:space-x-4">
            {/* Shopping Cart */}
            <ShoppingCartComponent />

            {/* Notifications */}
            <NotificationsDropdown />

            {/* User Profile Dropdown */}
            <UserProfileDropdown
              userRole={role}
              userName={userName}
              userEmail={userEmail}
              userAvatar={userAvatar}
            />

            {/* Mobile Menu Button */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden hover:bg-white/10">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-72 glass-card border-l border-white/10 bg-background/95 backdrop-blur-xl">
                <SheetHeader>
                  <SheetTitle className="text-left text-gradient">
                    Navigation
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col space-y-1">
                  {navItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start hover:bg-white/10 hover:text-neon-blue transition-all duration-200 ${
                            isActive ? "bg-white/10 text-neon-blue" : ""
                          }`}>
                          <item.icon className="w-4 h-4 mr-3" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
