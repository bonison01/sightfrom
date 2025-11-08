// src/pages/Shop.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuthContext';
import { useCart } from '@/hooks/useCartContext';
import Layout from '@/components/Layout';
import CartSidebar from '@/components/CartSidebar';
import {
  Loader2,
  Package,
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

interface Variant {
  id: string;
  product_id: string;
  color?: string | null;
  size?: string | null;
  price?: number | null;
  stock_quantity?: number | null;
  image_url?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  offer_price: number | null;
  image_url: string | null;
  description: string | null;
  category: string | null;
  is_active: boolean;
  stock_quantity: number | null;
  // add variant list
  variants?: Variant[];
}

interface GroupedProducts {
  [category: string]: Product[];
}

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [groupedProducts, setGroupedProducts] = useState<GroupedProducts>({});
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, cartCount, refreshCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Fetch products
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('id, name, price, offer_price, image_url, description, category, is_active, stock_quantity')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('created_at', { ascending: false });

      if (prodErr) throw prodErr;

      const productsRaw = prodData || [];

      // Fetch variants
      const { data: varData, error: varErr } = await supabase
        .from('product_variants')
        .select('id, product_id, color, size, price, stock_quantity, image_url');

      if (varErr) throw varErr;

      const variantsRaw = varData || [];

      // Map variants into products
      const productsWithVariants: Product[] = productsRaw.map((p) => ({
        ...p,
        variants: variantsRaw.filter((v) => v.product_id === p.id)
      }));

      setProducts(productsWithVariants);

      // Set default quantities
      const initialQuantities: { [key: string]: number } = {};
      productsWithVariants.forEach((p) => {
        initialQuantities[p.id] = 1;
      });
      setQuantities(initialQuantities);

    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products and variants. Please try again later.',
        variant: 'destructive'
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description &&
            product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    setFilteredProducts(filtered);

    const grouped = filtered.reduce((acc: GroupedProducts, product) => {
      const category = product.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});

    setGroupedProducts(grouped);
  };

  const updateQuantity = (productId: string, change: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + change)
    }));
  };

  const handleBuyNow = async (product: Product) => {
    if (isAuthenticated) {
      try {
        await addToCart(product.id, quantities[product.id] || 1);
        await refreshCart();
        navigate('/checkout');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to process purchase. Please try again.',
          variant: 'destructive'
        });
      }
    } else {
      navigate('/checkout', {
        state: {
          guestCheckout: true,
          product: product,
          quantity: quantities[product.id] || 1
        }
      });
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product.id, quantities[product.id] || 1);
      toast({
        title: 'Added to cart',
        description: `${quantities[product.id] || 1} × ${product.name} added`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add to cart.',
        variant: 'destructive'
      });
    }
  };

  const getCategories = () => {
    const cats = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    );
    return cats.map((cat) => ({
      value: cat!,
      label: cat!
    }));
  };

  const renderProductCard = (product: Product) => {
    // Determine display price
    const displayPrice = product.offer_price && product.offer_price < product.price
      ? product.offer_price
      : product.price;

    // Compute total stock
    const totalStock = product.variants && product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
      : product.stock_quantity || 0;

    const lowStock = totalStock > 0 && totalStock < 10;

    // Variant info
    const sizes = product.variants
      ? Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean)))
      : [];
    const colors = product.variants
      ? Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean)))
      : [];

    return (
      <div key={product.id} className="bg-white rounded-xl border border-blue-100 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="aspect-square overflow-hidden">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
        <div className="p-4">
          <h3 className="text-blue-900 text-lg font-semibold mb-1 line-clamp-1">{product.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-2">{product.description || 'No description available'}</p>

          {/* Variant info */}
          { (sizes.length > 0 || colors.length > 0) && (
            <div className="text-xs text-blue-700 mb-2">
              { sizes.length > 0 && <p>Sizes: {sizes.join(', ')}</p> }
              { colors.length > 0 && <p>Colors: {colors.join(', ')}</p> }
            </div>
          ) }

          {/* Stock + price */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-xl font-bold text-blue-800">₹{displayPrice}</span>
              {product.offer_price && product.offer_price < product.price && (
                <span className="text-sm line-through text-gray-400 ml-2">₹{product.price}</span>
              )}
            </div>
            <span className={`text-xs font-medium ${
              totalStock === 0 ? 'text-red-600'
              : lowStock ? 'text-orange-500 animate-pulse'
              : 'text-gray-500'
            }`}>
              { totalStock === 0
                ? 'Out of Stock'
                : lowStock
                ? `Only ${totalStock} left!`
                : `Stock: ${totalStock}` }
            </span>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Button variant="outline" size="sm" onClick={() => updateQuantity(product.id, -1)} disabled={quantities[product.id] <= 1} className="h-8 w-8 p-0 border-blue-300 hover:bg-blue-50 text-blue-700">
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-sm font-medium px-2">{quantities[product.id] || 1}</span>
            <Button variant="outline" size="sm" onClick={() => updateQuantity(product.id, 1)} className="h-8 w-8 p-0 border-blue-300 hover:bg-blue-50 text-blue-700">
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => handleBuyNow(product)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 text-sm py-2 transition-all duration-300 transform hover:scale-105"
              disabled={totalStock === 0}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              { totalStock === 0 ? 'Out of Stock' : 'Buy Now' }
            </Button>

            <Button
              onClick={() => handleAddToCart(product)}
              variant="outline"
              className="w-full text-sm py-2 border-blue-400 text-blue-700 hover:bg-blue-50 transition-all duration-300"
              disabled={totalStock === 0}
            >
              Add to Cart
            </Button>

            <Button
              onClick={() => navigate(`/product/${product.id}`)}
              variant="ghost"
              className="w-full text-sm py-2 text-blue-700 hover:bg-blue-50"
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <Button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full h-14 w-14 bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-xl transition-all duration-300 transform hover:scale-110"
      >
        <ShoppingCart className="h-6 w-6" />
        { cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
            {cartCount}
          </span>
        ) }
      </Button>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-blue-50">
        <div className="absolute inset-0 bg-blue-700/10 backdrop-blur-sm"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Our Products
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-8 text-blue-100">
            Discover fresh, flavorful, and authentic selections — straight from our kitchen.
          </p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-10 bg-blue-50 border-y border-blue-100 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search fresh products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-blue-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3 text-blue-800">
            <Filter className="h-4 w-4" />
            <span className="font-medium text-sm">Filter by:</span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 border-blue-300 focus:ring-blue-600">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                { getCategories().map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                )) }
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          { loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-blue-700">Loading products...</span>
            </div>
          ) : Object.keys(groupedProducts).length > 0 ? (
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-blue-700 mb-4">
                  Available Products
                </h2>
                <p className="text-blue-700 mb-4 max-w-2xl mx-auto">
                  Choose from our selection of {filteredProducts.length} premium products
                </p>
              </div>

              { Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                <div key={category} className="mb-16">
                  <div className="flex items-center mb-8">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">{category}</h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-blue-300 to-transparent ml-4"></div>
                    <span className="text-sm text-blue-600 ml-4">{categoryProducts.length} items</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                    {categoryProducts.map(renderProductCard)}
                  </div>
                </div>
              )) }
            </>
          ) : (
            <div className="text-center py-24">
              <Package className="h-20 w-20 text-blue-300 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-blue-700 mb-4">No Products Found</h3>
              <p className="text-blue-700 mb-8 max-w-md mx-auto">
                Try adjusting your search or filter — we’re always adding new items!
              </p>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              >
                View All Products
              </Button>
            </div>
          )}

          { filteredProducts.length > 0 && (
            <div className="mt-20 text-center">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-8 rounded-2xl shadow-lg max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-blue-800 mb-4">More Products Coming Soon!</h3>
                <p className="text-blue-700 mb-6">
                  We’re constantly adding new products — stay tuned!
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Shop;
