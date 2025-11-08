///Users/apple/Documents/GitHub/sight/src/hooks/useCartContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuthContext';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

interface GuestCartItem {
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItemQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalAmount: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const GUEST_CART_KEY = 'guest_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Load guest cart from localStorage
  const loadGuestCart = async () => {
    try {
      const guestCartData = localStorage.getItem(GUEST_CART_KEY);
      if (!guestCartData) return [];

      const guestItems: GuestCartItem[] = JSON.parse(guestCartData);
      
      // Convert guest cart items to regular cart items format
      const cartItemsWithIds: CartItem[] = guestItems.map((item, index) => ({
        id: `guest_${index}`,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.product
      }));

      return cartItemsWithIds;
    } catch (error) {
      console.error('Error loading guest cart:', error);
      return [];
    }
  };

  // Save guest cart to localStorage
  const saveGuestCart = (items: CartItem[]) => {
    try {
      const guestItems: GuestCartItem[] = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.product
      }));
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestItems));
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  };

  const fetchCart = async () => {
    if (!isAuthenticated || !user) {
      // Load guest cart from localStorage
      const guestCart = await loadGuestCart();
      setCartItems(guestCart);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching cart items for user:', user.id);

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          product:products(id, name, price, image_url)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching cart:', error);
        throw error;
      }

      console.log('Cart items fetched:', data?.length || 0);
      setCartItems(data || []);
    } catch (error: any) {
      console.error('Exception fetching cart:', error);
      toast({
        title: "Error",
        description: "Failed to load cart items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!isAuthenticated || !user) {
      // Handle guest cart
      try {
        // Fetch product details
        const { data: product, error } = await supabase
          .from('products')
          .select('id, name, price, image_url')
          .eq('id', productId)
          .single();

        if (error || !product) {
          throw new Error('Product not found');
        }

        const currentCart = await loadGuestCart();
        const existingItemIndex = currentCart.findIndex(item => item.product_id === productId);

        let updatedCart: CartItem[];
        if (existingItemIndex >= 0) {
          // Update existing item
          updatedCart = [...currentCart];
          updatedCart[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `guest_${currentCart.length}`,
            product_id: productId,
            quantity: quantity,
            product: product
          };
          updatedCart = [...currentCart, newItem];
        }

        setCartItems(updatedCart);
        saveGuestCart(updatedCart);

        toast({
          title: "Added to Cart",
          description: "Item has been added to your cart",
        });
      } catch (error: any) {
        console.error('Exception adding to guest cart:', error);
        toast({
          title: "Error",
          description: "Failed to add item to cart",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      console.log('Adding to cart:', { productId, quantity, userId: user.id });

      // Check if item already exists in cart
      const { data: existing, error: checkError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing cart item:', checkError);
        throw checkError;
      }

      if (existing) {
        // Update existing item
        const newQuantity = existing.quantity + quantity;
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating cart item:', updateError);
          throw updateError;
        }
      } else {
        // Insert new item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity: quantity
          });

        if (insertError) {
          console.error('Error inserting cart item:', insertError);
          throw insertError;
        }
      }

      await fetchCart();
      toast({
        title: "Added to Cart",
        description: "Item has been added to your cart",
      });
    } catch (error: any) {
      console.error('Exception adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const updateCartItemQuantity = async (cartItemId: string, quantity: number) => {
    if (!isAuthenticated || !user) {
      // Handle guest cart
      const currentCart = [...cartItems];
      const itemIndex = currentCart.findIndex(item => item.id === cartItemId);
      
      if (itemIndex >= 0) {
        currentCart[itemIndex].quantity = quantity;
        setCartItems(currentCart);
        saveGuestCart(currentCart);
        
        toast({
          title: "Cart Updated",
          description: "Item quantity has been updated",
        });
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('id', cartItemId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchCart();
      toast({
        title: "Cart Updated",
        description: "Item quantity has been updated",
      });
    } catch (error: any) {
      console.error('Error updating cart item:', error);
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!isAuthenticated || !user) {
      // Handle guest cart
      const currentCart = cartItems.filter(item => item.id !== cartItemId);
      setCartItems(currentCart);
      saveGuestCart(currentCart);
      
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchCart();
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart",
      });
    } catch (error: any) {
      console.error('Error removing cart item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated || !user) {
      // Handle guest cart
      setCartItems([]);
      localStorage.removeItem(GUEST_CART_KEY);
      
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems([]);
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart",
      });
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    }
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  // Fetch cart when user changes or on mount
  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, user]);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const value: CartContextType = {
    cartItems,
    cartCount,
    loading,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getTotalAmount,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
