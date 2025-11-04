"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Percent, Timer, Users } from "lucide-react";
import { NairaIcon } from "@/components/shared/nairaicon";

interface CoursePricingFormProps {
  form: any;
}

export function CoursePricingForm({ form }: CoursePricingFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}>
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <NairaIcon className="w-5 h-5 text-neon-green" />
            Pricing & Monetization
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Base Price */}
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Base Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="e.g. 25000"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Current Price */}
          <FormField
            control={form.control}
            name="currentPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Current (Discounted) Price
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="e.g. 20000"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Group Buying */}
          <div className="border-t border-white/10 pt-6">
            <FormField
              control={form.control}
              name="groupBuyingEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel className="flex items-center gap-2 text-white">
                      <Users className="w-4 h-4 text-neon-blue" /> Enable Group
                      Buying
                    </FormLabel>
                    <p className="text-sm text-gray-400">
                      Offer discounts for bulk or team enrollments
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
          </div>

          {form.getValues("groupBuyingEnabled") && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}>
              <FormField
                control={form.control}
                name="groupBuyingDiscount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-white">
                      <Percent className="w-4 h-4 text-neon-green" />
                      Group Discount (%)
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
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          )}

          {/* Flash Sale */}
          <div className="border-t border-white/10 pt-6">
            <FormField
              control={form.control}
              name="isFlashSale"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel className="flex items-center gap-2 text-white">
                      <Timer className="w-4 h-4 text-yellow-400" /> Enable Flash
                      Sale
                    </FormLabel>
                    <p className="text-sm text-gray-400">
                      Temporarily offer your course at a discounted price
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
          </div>

          {form.getValues("isFlashSale") && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}>
              <FormField
                control={form.control}
                name="flashSaleEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">
                      Flash Sale End Date
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={
                          field.value
                            ? new Date(field.value).toISOString().slice(0, 16)
                            : ""
                        }
                        onChange={(e) => field.onChange(e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
