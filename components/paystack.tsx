"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@nextui-org/input";
import { toast } from "react-toastify";
import { PaystackButton } from "react-paystack";
import { Card, CardContent, CardHeader } from "./ui/card";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  amount: z.number(),
});
type FormData = z.infer<typeof schema>;

export default function PayStackPayment() {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

  if (!publicKey) {
    toast.error("PayStack public key is not set");
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const email = watch("email");
  const amount = watch("amount");

  const paystackConfig = {
    email,
    amount: amount * 100,
    publicKey,
    currency: "NGN",
    metadata: {
      custom_fields: [
        {
          display_name: "Email",
          variable_name: "email",
          value: email,
        },
        {
          display_name: "Amount",
          variable_name: "amount",
          value: amount,
        },
      ],
    },
    onSuccess: () => {
      toast.success("Payment successful");
      reset({
        email: "",
        amount: undefined,
      });
    },
    onClose: () => {
      toast.error("Payment cancelled");
    },
    onError: () => {
      toast.error("Payment failed");
    },
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md shadow-xl bg-white p-6">
        <CardHeader className="text-center py-6">
          <h2 className="text-2xl font-bold text-gray-800">Proceed Payment</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 text-gray-600">
            <Input
              {...register("email")}
              label="Email Address"
              type="email"
              variant="faded"
              size="lg"
              isRequired
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
            <Input
              {...register("amount")}
              label="Amount (NGN)"
              type="number"
              variant="faded"
              size="lg"
              isRequired
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
            {email && amount !== undefined && (
              <PaystackButton
                {...paystackConfig}
                text="Pay Now"
                className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
