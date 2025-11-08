///Users/apple/Documents/GitHub/sight/src/components/checkout/CheckoutPlaceOrderButton.tsx

import React from "react";

interface Props {
  selectedMethod: string;
  screenshot: File | null;
}

export default function CheckoutPlaceOrderButton({ selectedMethod, screenshot }: Props) {
  const handlePlaceOrder = () => {
    if (!selectedMethod) {
      alert("Please select a payment method");
      return;
    }

    if (selectedMethod !== "cod" && !screenshot) {
      alert("Please upload screenshot before placing order");
      return;
    }

    // TODO: Connect to backend
    console.log("Order Placed With:", { selectedMethod, screenshot });

    alert("✅ Order Successfully Placed!");
  };

  return (
    <button
      onClick={handlePlaceOrder}
      className="w-full bg-[#14710F] text-white py-3 rounded-lg mt-4 text-lg font-semibold"
    >
      Place Order
    </button>
  );
}
