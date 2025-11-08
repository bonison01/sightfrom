// src/components/checkout/CheckoutPaymentMethod.tsx
import React from "react";

interface Props {
  selectedMethod: string;
  setSelectedMethod: (method: string) => void;
}

const paymentMethods = [
  { id: "upi", label: "UPI" },
  { id: "wallet", label: "Wallet" },
  { id: "cod", label: "Cash On Delivery" },
];

export default function CheckoutPaymentMethod({ selectedMethod, setSelectedMethod }: Props) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="font-semibold text-lg mb-3">Select Payment Method</h2>
      <div className="space-y-2">
        {paymentMethods.map((method) => (
          <label key={method.id} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              checked={selectedMethod === method.id}
              onChange={() => setSelectedMethod(method.id)}
              name="paymentMethod"
            />
            <span>{method.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
