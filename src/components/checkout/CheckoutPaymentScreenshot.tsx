///Users/apple/Documents/GitHub/sight/src/components/checkout/CheckoutPaymentScreenshot.tsx

import React from "react";

interface Props {
  screenshot: File | null;
  setScreenshot: (file: File | null) => void;
}

export default function CheckoutPaymentScreenshot({ screenshot, setScreenshot }: Props) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="font-semibold text-lg mb-3">Upload Payment Screenshot</h2>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setScreenshot(e.target.files ? e.target.files[0] : null)}
      />

      {screenshot && (
        <p className="text-sm text-green-600 mt-2">
          ✅ Screenshot selected: {screenshot.name}
        </p>
      )}
    </div>
  );
}
