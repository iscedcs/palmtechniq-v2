"use client";

import {
  getUserCart,
  removeFromCart,
  updateCartQuantity,
} from "@/actions/cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateRandomAvatar } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  CreditCard,
  Minus,
  Plus,
  Shield,
  ShoppingCart,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { beginCheckout } from "@/actions/checkout";

export function ShoppingCartComponent({ courseId }: { courseId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await getUserCart();
      setCartItems(res);
    })();
  }, []);

  const updateQuantity = async (courseId: string, newQty: number) => {
    try {
      await updateCartQuantity(courseId, newQty);
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === courseId ? { ...item, quantity: newQty } : item
        )
      );
    } catch (e) {
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (courseId: string) => {
    try {
      await removeFromCart(courseId);
      setCartItems((prev) => prev.filter((i) => i.id !== courseId));
      toast.success("Removed from cart");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount;

  const getLevelColor = (level: string) => {
    switch (level) {
      case "BEGINNER":
        return "text-green-400 border-green-400";
      case "INTERMEDIATE":
        return "text-yellow-400 border-yellow-400";
      case "ADVANCED":
        return "text-red-400 border-red-400";
      default:
        return "text-gray-400 border-gray-400";
    }
  };

  return (
    <>
      {/* Cart Trigger */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="icon"
          className="hover-glow relative"
          onClick={() => setIsOpen(true)}>
          <ShoppingCart className="w-5 h-5" />
          {cartItems.length > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-neon-pink text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
              {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
            </Badge>
          )}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-md bg-dark-900/95 backdrop-blur-2xl border-l border-white/10 z-50 overflow-hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}>
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gradient">
                      Shopping Cart
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="hover:bg-white/10">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <p className="text-gray-400 mt-1">
                    {cartItems.length}{" "}
                    {cartItems.length === 1 ? "course" : "courses"} in your cart
                  </p>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">
                        Your cart is empty
                      </p>
                      <p className="text-gray-500 text-sm">
                        Add some courses to get started!
                      </p>
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <motion.div
                        key={item.id}
                        className="glass-card p-4 rounded-xl border border-white/10"
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}>
                        <div className="flex gap-4">
                          <img
                            src={item.thumbnail || generateRandomAvatar()}
                            alt={item.title}
                            className="w-20 h-14 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm leading-tight mb-1">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage
                                  src={
                                    item.instructorAvatar ||
                                    generateRandomAvatar()
                                  }
                                />
                                <AvatarFallback className="text-xs">
                                  {item.instructor.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-400">
                                {item.instructor}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-xs text-gray-400">
                                  {item.rating}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-400">
                                  {item.duration}h
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-xs px-1 py-0 ${getLevelColor(
                                  item.level
                                )}`}>
                                {item.level}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-neon-blue font-bold">
                                  ₦
                                  {item.price?.toLocaleString("en-NG", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                                {item.originalPrice > item.price && (
                                  <span className="text-xs text-gray-500 line-through">
                                    ₦
                                    {item.originalPrice?.toLocaleString(
                                      "en-NG",
                                      { minimumFractionDigits: 2 }
                                    )}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6 hover:bg-white/10"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity - 1)
                                  }>
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center text-sm">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6 hover:bg-white/10"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1)
                                  }>
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6 hover:bg-red-500/20 text-red-400 ml-2"
                                  onClick={() => removeItem(item.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Promo Code & Checkout */}
                {cartItems.length > 0 && (
                  <div className="p-6 border-t border-white/10 space-y-4">
                    {/* Order Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="text-white">
                          ₦{subtotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-white">Total</span>
                        <span className="text-neon-blue">
                          ₦{total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={async () => {
                        const courseIds = cartItems.map((item) => item.id);
                        await beginCheckout(courseIds);
                      }}
                      className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white font-semibold py-3">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Checkout with Paystack
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                      <Shield className="w-4 h-4 text-green-400" />
                      Pay on the go!
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
