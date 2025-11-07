"use client";

import { UserProfileDropdown } from "@/components/auth/user-profile-dropdown";
import { ShoppingCartComponent } from "@/components/cart/shopping-cart";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { Button } from "@/components/ui/button";
import { roleNavItems } from "@/lib/const";
import { generateRandomAvatar } from "@/lib/utils";
import type { UserRole } from "@/types/user";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Navigation() {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <div className=" mx-auto md:px-0  max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="flex justify-center mx-auto items-center space-x-1"
              whileHover={{ scale: 1.05 }}>
              <Image
                src="/assets/standalone.png"
                alt=""
                width={100}
                height={100}
                className="w-10 h-10"
              />
              <span className="text-2xl font-bold text-gradient">
                PalmTechnIQ
              </span>
            </motion.div>
          </Link>

          {/* Navigation Items */}
          {status === "authenticated" && (
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className="hover-glow hover:bg-white/10 hover:text-neon-blue transition-all duration-300">
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {status === "authenticated" ? (
              <>
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
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="hover-glow hover:bg-white/10 hover:text-neon-blue transition-all duration-300">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 transition-all duration-300 hover-glow">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            {/* Role Badge */}
            {/* <Badge
              variant="outline"
              className={`
                border-2 px-3 py-1 font-semibold hidden sm:flex
                ₦{userRole === "ADMIN" ? "border-red-500 text-red-400" : ""}
                ₦{
                  userRole === "TUTOR"
                    ? "border-neon-purple text-neon-purple"
                    : ""
                }
                ₦{
                  userRole === "STUDENT"
                    ? "border-neon-blue text-neon-blue"
                    : ""
                }
                ₦{userRole === "USER" ? "border-gray-400 text-gray-400" : ""}
              `}>
              {userRole}
            </Badge> */}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
