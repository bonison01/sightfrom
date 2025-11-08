import React from 'react';
import { Product, Variant } from '@/types/product';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, X } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface ProductFormProps {
  product: Product & { variants?: Variant[] };
  images: string[];
  onProductChange: (product: Product & { variants?: Variant[] }) => void;
  onImagesChange: (images: string[]) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing: boolean;
  saving?: boolean;
}

const sizes = ['S', 'M', 'L', 'XL'];
const colors = ['Red', 'Blue', 'Green', 'Black'];

const ProductForm = ({
  product,
  images,
  onProductChange,
  onImagesChange,
  onSave,
  onCancel,
  isEditing,
  saving,
}: ProductFormProps) => {
  // Add a new variant with default values
  const addVariant = () => {
    const newVariant: Variant = {
      id: Date.now().toString(),
      size: sizes[0],
      color: colors[0],
      stock_quantity: 0,
    };
    onProductChange({
      ...product,
      variants: [...(product.variants || []), newVariant],
    });
  };

  // Update a variant property by id
  const updateVariant = (id: string, updatedFields: Partial<Variant>) => {
    const updatedVariants = (product.variants || []).map((variant) =>
      variant.id === id ? { ...variant, ...updatedFields } : variant,
    );
    onProductChange({ ...product, variants: updatedVariants });
  };

  // Remove variant by id
  const removeVariant = (id: string) => {
    const filteredVariants = (product.variants || []).filter(
      (variant) => variant.id !== id,
    );
    onProductChange({ ...product, variants: filteredVariants });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-4 w-full max-w-2xl h-full md:h-auto">
        <Card className="relative max-h-screen overflow-y-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="absolute top-2 right-2 z-10"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Product' : 'Create Product'}</CardTitle>
            <CardDescription>
              {isEditing
                ? 'Update product details'
                : 'Add a new product to your inventory'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <ImageUpload
                images={images}
                onImagesChange={onImagesChange}
                maxImages={5}
                maxSizePerImageMB={2}
              />

              {/* Other product fields here... */}

              {/* Variants section */}
              <div className="space-y-4">
                <Label>Variants</Label>
                {(product.variants || []).map((variant) => (
                  <div
                    key={variant.id}
                    className="grid grid-cols-4 gap-2 items-center"
                  >
                    <Select
                      value={variant.size}
                      onValueChange={(value) =>
                        updateVariant(variant.id, { size: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={variant.color}
                      onValueChange={(value) =>
                        updateVariant(variant.id, { color: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colors.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min={0}
                      value={variant.stock_quantity}
                      onChange={(e) =>
                        updateVariant(variant.id, {
                          stock_quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Stock Quantity"
                    />

                    <Button
                      variant="destructive"
                      onClick={() => removeVariant(variant.id)}
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button onClick={addVariant} variant="outline">
                  Add Variant
                </Button>
              </div>

              <Button onClick={onSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductForm;
