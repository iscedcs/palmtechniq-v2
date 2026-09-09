"use client";

import { UserProfileDropdown } from "@/components/auth/user-profile-dropdown";
import { ShoppingCartComponent } from "@/components/cart/shopping-cart";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ChevronDown, Menu } from "lucide-react";
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
  const navItems = roleNavItems[role] || [];

  const isMoreActive = navItems.slice(4).some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

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
      <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-2 lg:gap-3 xl:gap-6">
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 hover:opacity-90 transition-opacity"
              aria-label="PalmTechnIQ — home">
              <Image
                src="/assets/palmtechniqlogo.png"
                alt="PalmTechnIQ"
                width={362}
                height={71}
                priority
                className="h-8 sm:h-9 xl:h-10 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Desktop Navigation Items */}
          <div className="hidden lg:flex items-center justify-center flex-1 min-w-0 px-1 xl:px-3">
            <div className="flex items-center gap-1 xl:gap-1.5 flex-wrap justify-center">
              {/* Always visible on lg+ (First 4 items) */}
              {navItems.slice(0, 4).map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href} className="shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`hover-glow hover:bg-white/10 hover:text-neon-blue transition-all duration-200 text-xs xl:text-sm px-2.5 xl:px-3 h-8 xl:h-9 shrink-0 ${
                        isActive
                          ? "bg-white/10 text-neon-blue font-medium border border-neon-blue/20"
                          : "text-gray-300"
                      }`}>
                      <item.icon className="w-3.5 h-3.5 xl:w-4 xl:h-4 mr-1.5 shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}

              {/* Visible on xl+ (Items 4 and 5) */}
              {navItems.slice(4, 6).map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="hidden xl:inline-flex shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`hover-glow hover:bg-white/10 hover:text-neon-blue transition-all duration-200 text-xs xl:text-sm px-2.5 xl:px-3 h-8 xl:h-9 shrink-0 ${
                        isActive
                          ? "bg-white/10 text-neon-blue font-medium border border-neon-blue/20"
                          : "text-gray-300"
                      }`}>
                      <item.icon className="w-3.5 h-3.5 xl:w-4 xl:h-4 mr-1.5 shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}

              {/* Visible on 2xl+ (Items 6+) */}
              {navItems.slice(6).map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="hidden 2xl:inline-flex shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`hover-glow hover:bg-white/10 hover:text-neon-blue transition-all duration-200 text-xs xl:text-sm px-2.5 xl:px-3 h-8 xl:h-9 shrink-0 ${
                        isActive
                          ? "bg-white/10 text-neon-blue font-medium border border-neon-blue/20"
                          : "text-gray-300"
                      }`}>
                      <item.icon className="w-3.5 h-3.5 xl:w-4 xl:h-4 mr-1.5 shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}

              {/* "More" Dropdown Menu for overflowing items */}
              {navItems.length > 4 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`hover-glow hover:bg-white/10 hover:text-neon-blue transition-all duration-200 text-xs xl:text-sm px-2.5 xl:px-3 h-8 xl:h-9 shrink-0 gap-1.5 ${
                        navItems.length <= 6 ? "2xl:hidden" : ""
                      } ${
                        isMoreActive
                          ? "bg-white/10 text-neon-blue font-medium border border-neon-blue/30"
                          : "text-gray-300"
                      }`}>
                      {isMoreActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse shrink-0" />
                      )}
                      <span>More</span>
                      <ChevronDown className="w-3.5 h-3.5 transition-transform shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    className="w-52 glass-card border-white/15 bg-black/95 backdrop-blur-2xl p-1.5 shadow-2xl rounded-xl z-50">
                    {/* Items 4 and 5 (shown in dropdown only on lg, hidden on xl+ where they are in top bar) */}
                    {navItems.slice(4, 6).map((item) => {
                      const isActive =
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/");
                      return (
                        <DropdownMenuItem
                          key={item.href}
                          asChild
                          className="xl:hidden cursor-pointer">
                          <Link
                            href={item.href}
                            className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${
                              isActive
                                ? "bg-neon-blue/15 text-neon-blue font-semibold"
                                : "text-gray-200 hover:bg-white/10 hover:text-white"
                            }`}>
                            <item.icon className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{item.label}</span>
                            {isActive && (
                              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-blue" />
                            )}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}

                    {/* Items 6+ (shown in dropdown on lg & xl, hidden on 2xl+ if rendered in top bar) */}
                    {navItems.slice(6).map((item) => {
                      const isActive =
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/");
                      return (
                        <DropdownMenuItem
                          key={item.href}
                          asChild
                          className="2xl:hidden cursor-pointer">
                          <Link
                            href={item.href}
                            className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${
                              isActive
                                ? "bg-neon-blue/15 text-neon-blue font-semibold"
                                : "text-gray-200 hover:bg-white/10 hover:text-white"
                            }`}>
                            <item.icon className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{item.label}</span>
                            {isActive && (
                              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-blue" />
                            )}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center justify-end shrink-0 gap-1.5 sm:gap-2.5">
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
                  className="lg:hidden hover:bg-white/10 text-white h-9 w-9">
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
                            isActive ? "bg-white/10 text-neon-blue" : "text-gray-300"
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
