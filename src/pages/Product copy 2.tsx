import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuthContext';
import { useCart } from '@/hooks/useCartContext';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import ReviewsList from '@/components/ReviewsList';
import ReviewForm from '@/components/ReviewForm';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';

export interface ProductType {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  offer_price?: number;
  stock_quantity?: number;
  image_url?: string;
  image_urls?: string[];
  ingredients?: string;
  features?: string[];
  featured?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  color_options?: string;
  major_color?: string;
  size?: string;
  shape_category?: string;
}

export interface VariantType {
  id: string;
  product_id: string;
  color?: string | null;
  size?: string | null;
  price?: number | null;
  quantity?: number | null;
  stock_quantity?: number | null;
  image_url?: string | null;
  created_at?: string | null;
}
const navigate = useNavigate();

const Product = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<ProductType | null>(null);
  const [variants, setVariants] = useState<VariantType[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<VariantType | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [allImages, setAllImages] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) throw productError;
      setProduct(productData as ProductType);

      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);

      if (variantsError) throw variantsError;
      setVariants((variantsData || []) as VariantType[]);

      const images: string[] = [];
      if (productData.image_url) images.push(productData.image_url);
      if (productData.image_urls && productData.image_urls.length > 0) {
        images.push(...productData.image_urls);
      }
      setAllImages(images);
      setSelectedImage(images[0] || '');
    } catch (error) {
      console.error('Error fetching product or variants:', error);
      toast({
        title: 'Error loading product',
        description: 'Could not load product details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to add items to cart',
        variant: 'destructive',
      });
      return;
    }

    if (!product) return;

    const itemToAdd = selectedVariant
      ? selectedVariant.id
      : product.id;

    const stockAvailable =
      selectedVariant?.quantity ?? selectedVariant?.stock_quantity ?? product.stock_quantity ?? 0;

    if (stockAvailable < quantity) {
      toast({
        title: 'Out of stock',
        description: `Only ${stockAvailable} left in stock.`,
        variant: 'destructive',
      });
      return;
    }

    await addToCart(itemToAdd, quantity);

    toast({
      title: 'Added to cart',
      description: `${quantity} × ${product.name}${
        selectedVariant ? ` (${selectedVariant.size || ''} ${selectedVariant.color || ''})` : ''
      } added to your cart`,
    });
  };

  const handleBuyNow = async () => {
  if (!isAuthenticated) {
    toast({
      title: 'Please sign in',
      description: 'You need to be signed in to buy items',
      variant: 'destructive',
    });
    return;
  }

  if (!product) return;

  const itemToAdd = selectedVariant ? selectedVariant.id : product.id;
  const stockAvailable =
    selectedVariant?.quantity ?? selectedVariant?.stock_quantity ?? product.stock_quantity ?? 0;

  if (stockAvailable < quantity) {
    toast({
      title: 'Out of stock',
      description: `Only ${stockAvailable} left in stock.`,
      variant: 'destructive',
    });
    return;
  }

  await addToCart(itemToAdd, quantity);

  // Redirect to checkout using navigate
  navigate('/checkout');
};



  const handleReviewSubmitted = () => {
    setRefreshTrigger((prev) => prev + 1);
    fetchProduct();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4">Loading product...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
            <Link to="/shop">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const effectivePrice =
    selectedVariant?.price || product.offer_price || product.price;
  const hasOffer = product.offer_price && product.offer_price < product.price;
  const effectiveStock =
    selectedVariant?.quantity ?? selectedVariant?.stock_quantity ?? product.stock_quantity ?? 0;
  const isInStock = effectiveStock > 0;

  const uniqueSizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));
  const uniqueColors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/shop"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* --- Image Gallery --- */}
          <div>
            <img
              src={selectedImage || '/placeholder.svg'}
              alt={product.name}
              className="w-full object-cover rounded-lg"
            />
            <div className="mt-4 grid grid-cols-4 gap-2">
              {allImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${product.name} view ${idx}`}
                  onClick={() => setSelectedImage(img)}
                  className={`w-full object-cover rounded cursor-pointer border ${
                    selectedImage === img ? 'border-blue-600' : 'hover:border-blue-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* --- Product Details --- */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {hasOffer && (
              <Badge className="mb-2 bg-red-100 text-red-700">Sale</Badge>
            )}
            <p className="text-xl font-semibold mb-4">
              ₹{effectivePrice}{' '}
              {hasOffer && (
                <span className="line-through text-gray-400 ml-2">
                  ₹{product.price}
                </span>
              )}
            </p>
            <p className="mb-4 text-gray-700">{product.description}</p>

            {/* --- Variant Selectors --- */}
            {variants.length > 0 && (
              <div className="mb-4 space-y-4">
                {/* Size Selector */}
                {uniqueSizes.length > 0 && (
                  <div>
                    <label className="block mb-1 text-sm text-gray-600">
                      Size:
                    </label>
                    <Select
                      value={selectedVariant?.size || ''}
                      onValueChange={(value) => {
                        const variant = variants.find(
                          (v) =>
                            v.size === value &&
                            (!selectedVariant?.color || v.color === selectedVariant.color)
                        );
                        setSelectedVariant(variant || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueSizes.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Color Swatches */}
                {uniqueColors.length > 0 && (
                  <div>
                    <label className="block mb-1 text-sm text-gray-600">
                      Color:
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {uniqueColors.map((color) => {
                        const isSelected = selectedVariant?.color === color;
                        return (
                          <button
                            key={color}
                            onClick={() => {
                              const variant = variants.find(
                                (v) =>
                                  v.color === color &&
                                  (!selectedVariant?.size || v.size === selectedVariant.size)
                              );
                              setSelectedVariant(variant || null);
                            }}
                            className={`relative w-8 h-8 rounded-full border-2 transition-all ${
                              isSelected
                                ? 'border-blue-600 scale-110'
                                : 'border-gray-300 hover:border-blue-300'
                            }`}
                            style={{
                              backgroundColor:
                                color.toLowerCase() === 'white'
                                  ? '#fff'
                                  : color.toLowerCase(),
                            }}
                            title={color}
                          >
                            {color.toLowerCase() === 'white' && (
                              <div className="absolute inset-0 rounded-full border border-gray-300"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- Quantity Selector --- */}
            <div className="flex items-center mb-4 space-x-4">
              <Button
                variant="outline"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                −
              </Button>
              <span className="text-lg">{quantity}</span>
              <Button
                variant="outline"
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </Button>
            </div>

            {/* --- Stock & Add to Cart / Buy Now --- */}
            <p className="mb-4 text-sm text-gray-500">
              {isInStock
                ? effectiveStock < 10
                  ? `Only ${effectiveStock} left in stock!`
                  : `${effectiveStock} in stock`
                : 'Out of stock'}
            </p>

            <Button
              onClick={handleAddToCart}
              disabled={!isInStock}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 py-2"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isInStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>

            <Button
              onClick={handleBuyNow}
              disabled={!isInStock}
              className="w-full mt-2 bg-green-600 text-white hover:bg-green-700 py-2"
            >
              Buy Now
            </Button>
          </div>
        </div>

        {/* --- Product Extras --- */}
        {product.features && product.features.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-2">Features</h2>
            <ul className="list-disc list-inside text-gray-700">
              {product.features.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {product.ingredients && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-2">Ingredients</h2>
            <p className="text-gray-700">{product.ingredients}</p>
          </div>
        )}

        {/* --- Reviews --- */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
          <ReviewsList productId={id} refreshTrigger={refreshTrigger} />
          {isAuthenticated && (
            <ReviewForm productId={id} onReviewSubmitted={handleReviewSubmitted} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Product;
