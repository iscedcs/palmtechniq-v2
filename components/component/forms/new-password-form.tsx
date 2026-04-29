"use client";

import { resetPassword } from "@/actions/auth";
import FormError from "@/components/shared/form-error";
import FormSuccess from "@/components/shared/form-success";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getPasswordStrength } from "@/lib/utils";
import { resetPasswordSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

export function NewPasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = useWatch({
    control: form.control,
    name: "password",
  });

  const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    if (!token) {
      setError("Missing token!");
      toast.error("Missing token!");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");

    startTransition(() => {
      resetPassword(data, token).then((data) => {
        if (data?.error) {
          setError(data?.error);
          toast.error(data?.error);
        }
        setSuccess(data?.success);
        if (data.success) {
          form.reset();
          onSuccess?.();
        }
        setIsLoading(false);
      });
    });
  };

  const passwordStrength = getPasswordStrength(password || "");

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-primary">
            Password Reset Successfully!
          </h2>
          <p className="text-primary/90">
            Your password has been updated. You can now sign in with your new
            password.
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = "/login")}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          Sign In Now
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          const messages = Object.values(errors)
            .map((error) => error?.message)
            .filter((message): message is string => Boolean(message));
          if (messages.length > 0) {
            toast.error(messages[0]);
          }
        })}
        className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
          <p className="text-gray-600">
            Enter your new password below. Make sure it's strong and secure.
          </p>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* New Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90">New Password</FormLabel>

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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password */}
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
                <FormMessage />

                {/* Move the password strength indicator inside here */}
                {field.value && (
                  <div className="space-y-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => {
                        const strength = getPasswordStrength(
                          field.value || "",
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
        </div>

        <FormError message={error} />
        <FormSuccess message={success} />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Updating Password...</span>
            </div>
          ) : (
            "Update Password"
          )}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <a
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Sign in here
            </a>
          </p>
        </div>
      </form>
    </Form>
  );
}
