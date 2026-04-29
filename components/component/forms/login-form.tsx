"use client";

import { login } from "@/actions/auth";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import FormError from "@/components/shared/form-error";
import FormSuccess from "@/components/shared/form-success";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const urlError =
    searchParams?.get("error") === "OAuthAccountNotLinked"
      ? "Email already in use with different provider!"
      : "";
  const callbackUrl = searchParams?.get("callbackUrl") ?? undefined;
  // console.log("callback url from search params", { callbackUrl });
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isCooldown, setIsCooldown] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { update } = useSession();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = debounce((data: z.infer<typeof loginSchema>) => {
    if (isCooldown) return;
    setError(""), setSuccess("");
    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), 2000);
    setIsLoading(true);

    startTransition(async () => {
      const result = await login(data, callbackUrl);
      console.log({ data: result });
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result?.success) {
        await update();
        setSuccess(result.success);
        toast.success(result.success);
        if (result.redirectUrl) {
          router.push(String(result.redirectUrl));
        } else {
          router.refresh();
        }
      }
      setIsLoading(false);
    });
  }, 300);

  return (
    <div className="space-y-6">
      <OAuthButtons mode="login" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
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

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
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
                </FormItem>
              )}
            />
          </motion.div>

          {/* Remember Me & Forgot Password */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="border-white/30 data-[state=checked]:bg-neon-blue data-[state=checked]:border-neon-blue"
              />
              <Label
                htmlFor="remember"
                className="text-white/70 text-sm cursor-pointer">
                Remember me
              </Label>
            </div>
            <Link
              href="/forgot-password"
              className="text-neon-blue hover:text-neon-blue/80 text-sm transition-colors">
              Forgot password?
            </Link>
          </motion.div>

          <FormError message={error} />
          <FormSuccess message={success} />

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}>
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 transition-all duration-300 hover-glow"
              disabled={isPending || isCooldown}>
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </motion.div>
        </form>
      </Form>
      {/* Sign Up Link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center">
        <p className="text-white/70">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-neon-blue hover:text-neon-blue/80 font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
