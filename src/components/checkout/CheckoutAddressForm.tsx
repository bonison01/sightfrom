// components/checkout/CheckoutAddressForm.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const CheckoutAddressForm = ({ formData, onChange, isAuthenticated, saveProfile, setSaveProfile }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Address</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Address Line 1 *</Label>
          <Input value={formData.address_line_1} onChange={(e) => onChange("address_line_1", e.target.value)} />
        </div>

        <div>
          <Label>Address Line 2</Label>
          <Input value={formData.address_line_2} onChange={(e) => onChange("address_line_2", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>City *</Label>
            <Input value={formData.city} onChange={(e) => onChange("city", e.target.value)} />
          </div>
          <div>
            <Label>State *</Label>
            <Input value={formData.state} onChange={(e) => onChange("state", e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Postal Code *</Label>
          <Input value={formData.postal_code} onChange={(e) => onChange("postal_code", e.target.value)} />
        </div>

        {isAuthenticated && (
          <div className="flex items-center space-x-2">
            <Checkbox checked={saveProfile} onCheckedChange={(val) => setSaveProfile(val as boolean)} />
            <Label className="text-sm">Save for future orders</Label>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckoutAddressForm;
