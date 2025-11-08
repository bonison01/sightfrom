// components/checkout/CheckoutSummary.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const CheckoutSummary = ({ items, total }: { items: any[]; total: number }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <img
                  src={item.product.image_url || '/placeholder.svg'}
                  alt={item.product.name}
                  className="h-12 w-12 rounded object-cover"
                />
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="font-medium">₹{item.product.price * item.quantity}</p>
            </div>
          ))}
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₹{total}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutSummary;
