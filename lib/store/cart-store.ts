import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  id: string;
  courseId: string;
  title: string;
  instructor: string;
  price: number;
  originalPrice?: number;
  image: string;
  duration: string;
  level: string;
}

interface PromoCode {
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  isValid: boolean;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  promoCode: PromoCode | null;
  isLoading: boolean;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (courseId: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  applyPromoCode: (code: string) => Promise<void>;
  removePromoCode: () => void;

  // Computed
  getTotalItems: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  isInCart: (courseId: string) => boolean;
}

const mockPromoCodes: Record<string, PromoCode> = {
  SAVE20: {
    code: "SAVE20",
    discount: 20,
    type: "percentage",
    isValid: true,
  },
  NEWUSER: {
    code: "NEWUSER",
    discount: 50,
    type: "fixed",
    isValid: true,
  },
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      promoCode: null,
      isLoading: false,

      addItem: (item: CartItem) => {
        const { items } = get();
        const existingItem = items.find((i) => i.courseId === item.courseId);

        if (!existingItem) {
          set({ items: [...items, item] });

          // Track analytics
          if (typeof window !== "undefined") {
            window.gtag?.("event", "add_to_cart", {
              currency: "USD",
              value: item.price,
              items: [
                {
                  item_id: item.courseId,
                  item_name: item.title,
                  category: "Course",
                  price: item.price,
                  quantity: 1,
                },
              ],
            });
          }
        }
      },

      removeItem: (courseId: string) => {
        const { items } = get();
        const item = items.find((i) => i.courseId === courseId);

        set({
          items: items.filter((i) => i.courseId !== courseId),
        });

        // Track analytics
        if (item && typeof window !== "undefined") {
          window.gtag?.("event", "remove_from_cart", {
            currency: "USD",
            value: item.price,
            items: [
              {
                item_id: item.courseId,
                item_name: item.title,
                category: "Course",
                price: item.price,
                quantity: 1,
              },
            ],
          });
        }
      },

      clearCart: () => {
        set({
          items: [],
          promoCode: null,
        });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      applyPromoCode: async (code: string) => {
        set({ isLoading: true });
        try {
          const courseIds = get().items.map((item) => item.courseId);
          const res = await fetch("/api/promos/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, courseIds }),
          });
          const json = await res.json();
          if (!res.ok || !json.ok) {
            throw new Error("Invalid promo code");
          }

          const promo = json.promo;
          set({
            promoCode: {
              code: promo.code,
              discount: promo.discountValue,
              type: promo.discountType === "PERCENTAGE" ? "percentage" : "fixed",
              isValid: true,
            },
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      removePromoCode: () => {
        set({ promoCode: null });
      },

      getTotalItems: () => {
        return get().items.length;
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price, 0);
      },

      getDiscount: () => {
        const { promoCode } = get();
        if (!promoCode) return 0;

        const subtotal = get().getSubtotal();

        if (promoCode.type === "percentage") {
          return (subtotal * promoCode.discount) / 100;
        } else {
          return Math.min(promoCode.discount, subtotal);
        }
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        return Math.max(0, subtotal - discount);
      },
      isInCart: (courseId: string) => {
        const { items } = get();
        return items.some((item) => item.courseId === courseId);
      },
    }),

    {
      name: "cart-storage",
      partialize: (state) => ({
        items: state.items,
        promoCode: state.promoCode,
      }),
    }
  )
);
