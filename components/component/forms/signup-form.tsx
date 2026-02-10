"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { useForm, UseFormWatch, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signupSchema, type SignupFormData } from "@/schemas";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import Link from "next/link";
import z from "zod";
import { signup } from "@/actions/auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FormError from "@/components/shared/form-error";
import FormSuccess from "@/components/shared/form-success";

interface SignUpProps {
  watch: UseFormWatch<z.infer<typeof signupSchema>>;
}

export function SignupForm() {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      phone: "",
      terms: true,
    },
  });
  const password = useWatch({
    control: form.control,
    name: "password",
  });

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    setError(""), setSuccess(""), setIsLoading(true);

    startTransition(() => {
      signup(data).then((data) => {
        setError(data.error);
        setSuccess(data.success);
        if (data.success) {
          form.reset();
        }
        setIsLoading(false);
      });
    });
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "" };

    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[@$!%*?&]/.test(password),
    ];

    strength = checks.filter(Boolean).length;

    const labels = ["", "Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = [
      "",
      "text-red-400",
      "text-orange-400",
      "text-yellow-400",
      "text-blue-400",
      "text-green-400",
    ];

    return { strength, label: labels[strength], color: colors[strength] };
  };

  const passwordStrength = getPasswordStrength(password || "");

  return (
    <div className="space-y-6">
      <OAuthButtons mode="signup" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute z-50 left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                      <Input
                        {...field}
                        type="text"
                        disabled={isPending}
                        placeholder="Enter your full name"
                        className={`pl-12 h-12 glass-card border-white/20 focus:border-neon-blue/50 transition-all duration-300 `}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/90">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute z-50 left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                      <Input
                        {...field}
                        type="email"
                        disabled={isPending}
                        placeholder="Enter your email address"
                        className={`pl-12 h-12 glass-card border-white/20 focus:border-neon-blue/50 transition-all duration-300`}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          {/* Phone Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/90">Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute z-50 left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                      <Input
                        {...field}
                        type="tel"
                        disabled={isPending}
                        placeholder="+234 (555) 123-4567"
                        className={`pl-12 h-12 glass-card border-white/20 focus:border-neon-blue/50 transition-all duration-300`}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/90">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 z-50 top-1/2 transform -translate-y-1/2 text-white/15 w-5 h-5" />
                      <Input
                        {...field}
                        disabled={isPending}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className={`pl-12 pr-12 h-12 glass-card border-white/20 focus:border-neon-blue/50 transition-all duration-300`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-white/40" />
                        ) : (
                          <Eye className="w-4 h-4 text-white/40" />
                        )}
                      </Button>
                    </div>
                  </FormControl>

                  {/* Move the password strength indicator inside here */}
                  {field.value && (
                    <div className="space-y-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => {
                          const strength = getPasswordStrength(
                            field.value || ""
                          ).strength;
                          return (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ₦{
                                level <= strength
                                  ? level <= 2
                                    ? "bg-red-400"
                                    : level <= 3
                                    ? "bg-yellow-400"
                                    : level <= 4
                                    ? "bg-blue-400"
                                    : "bg-green-400"
                                  : "bg-white/20"
                              }`}
                            />
                          );
                        })}
                      </div>
                      <p
                        className={`text-sm ₦{
                          getPasswordStrength(field.value || "").color
                        }`}>
                        {getPasswordStrength(field.value || "").label}
                      </p>
                    </div>
                  )}
                </FormItem>
              )}
            />
          </motion.div>

          {/* Confirm Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-2">
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/90">
                    Confirm Password
                  </FormLabel>

                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 z-50 top-1/2 transform -translate-y-1/2 text-white/15 w-5 h-5" />
                      <Input
                        {...field}
                        disabled={isPending}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className={`pl-12 pr-12 h-12 glass-card border-white/20 focus:border-neon-blue/50 transition-all duration-300`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-white/40" />
                        ) : (
                          <Eye className="w-4 h-4 text-white/40" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </motion.div>

          {/* Terms and Conditions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-2">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                className="border-white/30 data-[state=checked]:bg-neon-blue data-[state=checked]:border-neon-blue mt-1"
              />
              <Label
                htmlFor="terms"
                className="text-white/70 text-sm cursor-pointer leading-relaxed">
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-neon-blue hover:text-neon-blue/80 transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-neon-blue hover:text-neon-blue/80 transition-colors">
                  Privacy Policy
                </Link>
              </Label>
            </div>
          </motion.div>

          <FormError message={error} />
          <FormSuccess message={success} />
          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}>
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 transition-all duration-300 hover-glow"
              disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </Form>

      {/* Sign In Link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="text-center">
        <p className="text-white/70">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-neon-blue hover:text-neon-blue/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
