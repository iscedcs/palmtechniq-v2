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
import { Percent, Timer, Users, Plus, Trash2 } from "lucide-react";
import { NairaIcon } from "@/components/shared/nairaicon";
import { useFieldArray } from "react-hook-form";

interface CoursePricingFormProps {
  form: any;
}

export function CoursePricingForm({ form }: CoursePricingFormProps) {
  const { fields: groupTierFields, append, remove } = useFieldArray({
    control: form.control,
    name: "groupTiers",
  });

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
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : Number(e.target.value)
                      )
                    }
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
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : Number(e.target.value)
                      )
                    }
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
              <div className="space-y-4">
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

                <div className="flex items-center justify-between">
                  <div>
                    <FormLabel className="text-white">Group Tiers</FormLabel>
                    <p className="text-sm text-gray-400">
                      Add tier sizes, total group price, and cashback percent.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      append({
                        size: 3,
                        groupPrice:
                          form.getValues("basePrice") ||
                          form.getValues("currentPrice") ||
                          0,
                        cashbackPercent: 0,
                        isActive: true,
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10">
                    <Plus className="w-4 h-4" />
                    Add Tier
                  </button>
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
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
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
