// components/checkout/CheckoutCustomerInfo.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

const CheckoutCustomerInfo = ({ formData, onChange }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Full Name *</Label>
          <Input value={formData.full_name} onChange={(e) => onChange("full_name", e.target.value)} />
        </div>

        <div>
          <Label>Email *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input className="pl-10" value={formData.email} onChange={(e) => onChange("email", e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Phone *</Label>
          <Input value={formData.phone} onChange={(e) => onChange("phone", e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutCustomerInfo;
