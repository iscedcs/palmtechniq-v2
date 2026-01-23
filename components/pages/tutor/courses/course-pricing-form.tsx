"use client";

import {
  motion,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

type CoursePricingFormProps = {
  form: UseFormReturn<any>;
};

export default function CoursePricingForm({ form }: CoursePricingFormProps) {
  const basePrice = form.watch("basePrice");
  const currentPrice = form.watch("currentPrice");
  const platformFee = 0.1; // 10% platform cut
  const tutorEarnings =
    (currentPrice || basePrice || 0) * (1 - platformFee) || 0;

  // 🧮 Expected enrollments input for projection
  const [expectedEnrollments, setExpectedEnrollments] = useState(50);

  const projectedEarnings = tutorEarnings * expectedEnrollments;

  // Smooth animated counter for projected earnings
  const springValue = useSpring(projectedEarnings, {
    stiffness: 60,
    damping: 15,
  });
  const animatedEarnings = useTransform(springValue, (v) =>
    Math.round(v).toLocaleString()
  );
  const animatedEarningsText = useMotionTemplate`₦${animatedEarnings}`;

  useEffect(() => {
    springValue.set(projectedEarnings);
  }, [projectedEarnings]);

  const { fields: groupTierFields, append, remove } = useFieldArray({
    control: form.control,
    name: "groupTiers",
  });

  // --- Local Draft Persistence
  useEffect(() => {
    const subscription = form.watch((values) => {
      localStorage.setItem("coursePricingDraft", JSON.stringify(values));
    });
    return () => subscription.unsubscribe?.();
  }, [form]);

  useEffect(() => {
    const saved = localStorage.getItem("coursePricingDraft");
    if (saved) {
      form.reset(JSON.parse(saved));
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Pricing & Monetization</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 🏷️ Standard Course Price */}
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Standard Course Price
                </FormLabel>
                <p className="text-sm text-gray-400 mb-1">
                  The regular price students will see before discounts.
                </p>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="Enter your course price (e.g. ₦5000)"
                    className="bg-white/10 border-white/20 placeholder:text-gray-50/35 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 💸 Discounted Price */}
          <FormField
            control={form.control}
            name="currentPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Discounted Price (Optional)
                </FormLabel>
                <p className="text-sm text-gray-400 mb-1">
                  If you’re running a promotion, set the reduced price here.
                </p>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="Enter discounted price (e.g. ₦4000)"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-50/35"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 👥 Group Buying */}
          <FormField
            control={form.control}
            name="groupBuyingEnabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-white">
                    Enable Group Purchase Discount
                  </FormLabel>
                  <p className="text-sm text-gray-400">
                    Offer a discount when students buy in groups (e.g. 3 or
                    more).
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.getValues("groupBuyingEnabled") && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="groupBuyingDiscount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">
                      Group Discount Percentage
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={(field.value ?? 0) * 100}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) / 100)
                        }
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-50/35"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-400 mt-1">
                      Optional — used for legacy group discount badges.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-white">Group Tiers</FormLabel>
                  <p className="text-sm text-gray-400">
                    Define sizes, total group price, and cashback percent for
                    the creator.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      size: 3,
                      groupPrice: basePrice || currentPrice || 0,
                      cashbackPercent: 0,
                      isActive: true,
                    })
                  }
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tier
                </Button>
              </div>

              {groupTierFields.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No tiers yet. Add at least one to enable group purchase
                  options.
                </p>
              ) : (
                <div className="space-y-3">
                  {groupTierFields.map((tier, index) => (
                    <div
                      key={tier.id}
                      className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-300">
                          Tier {index + 1}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-gray-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name={`groupTiers.${index}.size`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-300">
                                Group Size
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="2"
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className="bg-white/10 border-white/20 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`groupTiers.${index}.groupPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-300">
                                Group Price (total)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className="bg-white/10 border-white/20 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`groupTiers.${index}.cashbackPercent`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-300">
                                Cashback %
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={(field.value ?? 0) * 100}
                                  onChange={(e) =>
                                    field.onChange(
                                      Number(e.target.value) / 100
                                    )
                                  }
                                  className="bg-white/10 border-white/20 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ⚡ Flash Sale */}
          <FormField
            control={form.control}
            name="isFlashSale"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-white">Run Flash Sale</FormLabel>
                  <p className="text-sm text-gray-400">
                    Activate a limited-time discount campaign.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.getValues("isFlashSale") && (
            <FormField
              control={form.control}
              name="flashSaleEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">
                    Flash Sale Ends On
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={field.value ? field.value.slice(0, 16) : ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-50/35"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* 💰 Revenue Preview */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
              <span>Your earnings per sale (after platform fee)</span>
              <span className="text-xs text-gray-500">
                Platform takes 10% service fee
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
              <span className="text-gray-300">You earn:</span>
              <span className="text-2xl font-semibold text-neon-green">
                ₦{Math.round(tutorEarnings).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 📊 Revenue Projection */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-white font-semibold">
                  Estimated Total Earnings
                </p>
                <p className="text-sm text-gray-400">
                  Based on expected enrollments
                </p>
              </div>
              <Input
                type="number"
                value={expectedEnrollments}
                onChange={(e) => setExpectedEnrollments(Number(e.target.value))}
                min={1}
                className="w-28 bg-white/10 border-white/20 text-white placeholder:text-gray-50/35 text-center"
              />
            </div>
            <motion.div
              className="bg-gradient-to-r from-neon-blue/20 to-neon-green/20 border border-white/10 rounded-xl p-5 text-center"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 120 }}>
              <p className="text-gray-400 mb-2 text-sm">
                If {expectedEnrollments} students enroll:
              </p>
              <motion.p
                className="text-3xl font-bold text-neon-green"
                style={{ display: "inline-block" }}>
                {animatedEarningsText}
              </motion.p>

              <p className="text-xs text-gray-500 mt-2 italic">
                “Great courses attract great earnings — make yours stand out.”
              </p>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
