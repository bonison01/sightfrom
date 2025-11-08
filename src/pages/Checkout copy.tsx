import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuthContext';
import { useCart } from '@/hooks/useCartContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import OrderConfirmationModal from '@/components/OrderConfirmationModal';
import PaymentScreenshotUpload from '@/components/PaymentScreenshotUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, CreditCard, Truck, User, Mail } from 'lucide-react';

interface UserProfile {
  full_name?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
}

interface GuestCheckoutItem {
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
  quantity: number;
}

const Checkout = () => {
  const { user, isAuthenticated } = useAuth();
  const { cartItems, getTotalAmount, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({});
  const [saveProfile, setSaveProfile] = useState(true);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [confirmedOrderData, setConfirmedOrderData] = useState<any>(null);
  const [checkoutInitialized, setCheckoutInitialized] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  
  // Guest checkout data from navigation state
  const guestCheckoutData = location.state as { guestCheckout?: boolean; product?: any; quantity?: number } | null;
  const isGuestCheckout = guestCheckoutData?.guestCheckout;
  const guestItem: GuestCheckoutItem | null = guestCheckoutData?.product ? {
    product: guestCheckoutData.product,
    quantity: guestCheckoutData.quantity || 1
  } : null;

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    phone: ''
  });

  useEffect(() => {
    const initializeCheckout = async () => {
      if (checkoutInitialized) return;
      
      console.log('🔍 Initializing checkout once...');
      console.log('isGuestCheckout:', isGuestCheckout);
      console.log('guestItem:', guestItem);
      console.log('isAuthenticated:', isAuthenticated);
      console.log('cartItems.length:', cartItems.length);
      
      // For guest checkout with specific item, proceed
      if (isGuestCheckout && guestItem) {
        console.log('✅ Guest checkout with item, proceeding...');
        setCheckoutInitialized(true);
        return;
      }

      // For authenticated users, check cart
      if (isAuthenticated) {
        console.log('🔄 Authenticated user - checking existing cart...');
        
        if (cartItems.length === 0) {
          console.log('❌ Authenticated user with empty cart - redirecting to shop');
          toast({
            title: "Empty Cart",
            description: "Please add items to your cart before checkout",
            variant: "destructive",
          });
          navigate('/shop');
          return;
        }
        
        console.log('✅ Cart has items, proceeding with checkout');
        setCheckoutInitialized(true);
        return;
      }

      // For guest users with cart items, allow checkout
      if (!isAuthenticated && cartItems.length > 0) {
        console.log('✅ Guest user with cart items, proceeding with guest checkout');
        setCheckoutInitialized(true);
        return;
      }

      // If no items in cart and not guest checkout, redirect to shop
      if (!isAuthenticated && cartItems.length === 0 && !isGuestCheckout) {
        console.log('❌ Guest user with empty cart - redirecting to shop');
        toast({
          title: "Empty Cart",
          description: "Please add items to your cart before checkout",
          variant: "destructive",
        });
        navigate('/shop');
        return;
      }
      
      setCheckoutInitialized(true);
    };

    initializeCheckout();
  }, [isGuestCheckout, guestItem, isAuthenticated, cartItems.length, navigate, toast, checkoutInitialized]);

  useEffect(() => {
    // If authenticated, fetch user profile
    if (isAuthenticated && user && !profile.full_name) {
      fetchUserProfile();
    }
  }, [isAuthenticated, user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      console.log('Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, address_line_1, address_line_2, city, state, postal_code, phone')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        console.log('Profile data fetched:', data);
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          email: user.email || '',
          address_line_1: data.address_line_1 || '',
          address_line_2: data.address_line_2 || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || '',
          phone: data.phone || ''
        });
      }
    } catch (error) {
      console.error('Exception fetching profile:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScreenshotUpload = (file: File) => {
    setIsUploadingScreenshot(true);
    setPaymentScreenshot(file);
    setIsUploadingScreenshot(false);
    
    toast({
      title: "Screenshot Uploaded",
      description: "Payment screenshot has been attached to your order",
    });
  };

  const validateForm = () => {
    const required = ['full_name', 'email', 'address_line_1', 'city', 'state', 'postal_code', 'phone'];
    const missing = required.filter(field => !formData[field as keyof typeof formData]?.trim());
    
    if (missing.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in: ${missing.join(', ').replace(/_/g, ' ')}`,
        variant: "destructive",
      });
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    // Validate payment screenshot for online payment
    if (paymentMethod === 'online' && !paymentScreenshot) {
      toast({
        title: "Payment Screenshot Required",
        description: "Please upload your payment screenshot to complete the order",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const sendOrderConfirmationEmail = async (orderData: any, email: string) => {
    try {
      console.log('📧 Sending order confirmation email to:', email);
      
      const { error } = await supabase.functions.invoke('send-order-confirmation', {
        body: {
          email,
          orderData
        }
      });

      if (error) {
        console.error('❌ Email sending error:', error);
        toast({
          title: "Email Warning",
          description: "Order placed successfully, but confirmation email could not be sent.",
          variant: "default",
        });
      } else {
        console.log('✅ Order confirmation email sent successfully');
      }
    } catch (error) {
      console.error('❌ Email sending exception:', error);
      // Don't show error to user as order was successful
    }
  };

  const uploadPaymentScreenshot = async (file: File, orderId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-screenshot-${orderId}.${fileExt}`;
      
      // For now, we'll create a data URL since we don't have storage set up
      // In a real implementation, you'd upload to Supabase Storage
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      return new Promise((resolve) => {
        reader.onload = () => {
          resolve(reader.result as string);
        };
      });
    } catch (error) {
      console.error('Error uploading payment screenshot:', error);
      return null;
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      console.log('🚀 Starting order placement process...');
      
      let totalAmount: number;
      let orderItems: any[];

      // Calculate total and prepare order items based on checkout type
      if (isGuestCheckout && guestItem) {
        totalAmount = guestItem.product.price * guestItem.quantity;
        orderItems = [{
          product_id: guestItem.product.id,
          quantity: guestItem.quantity,
          price: guestItem.product.price
        }];
        console.log('🛒 Guest checkout - Total:', totalAmount, 'Items:', orderItems);
      } else if (cartItems.length > 0) {
        totalAmount = getTotalAmount();
        orderItems = cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product.price
        }));
        console.log('🛒 Cart checkout - Total:', totalAmount, 'Items:', orderItems);
      } else {
        throw new Error('No items to checkout');
      }

      const deliveryAddress = {
        full_name: formData.full_name,
        address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code
      };

      // Save profile if user is authenticated and requested
      if (isAuthenticated && user && saveProfile) {
        console.log('💾 Updating user profile with address info');
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: formData.full_name,
              address_line_1: formData.address_line_1,
              address_line_2: formData.address_line_2,
              city: formData.city,
              state: formData.state,
              postal_code: formData.postal_code,
              phone: formData.phone,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (profileError) {
            console.error('❌ Error updating profile:', profileError);
          } else {
            console.log('✅ Profile updated successfully');
          }
        } catch (err) {
          console.error('❌ Exception updating profile:', err);
        }
      }

      // Create order
      const orderData = {
        user_id: isAuthenticated && user ? user.id : null,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        delivery_address: deliveryAddress,
        phone: formData.phone,
        status: 'pending',
        payment_screenshot_url: null // Will be updated after upload
      };

      console.log('📦 Creating order with data:', orderData);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error('❌ Order creation error:', orderError);
        throw new Error(`Order creation failed: ${orderError.message}`);
      }

      if (!order) {
        throw new Error('Order creation failed - no order returned');
      }

      console.log('✅ Order created successfully:', order.id);

      // Upload payment screenshot if provided
      let screenshotUrl = null;
      if (paymentScreenshot && paymentMethod === 'online') {
        screenshotUrl = await uploadPaymentScreenshot(paymentScreenshot, order.id);
        
        if (screenshotUrl) {
          // Update order with screenshot URL
          const { error: updateError } = await supabase
            .from('orders')
            .update({ payment_screenshot_url: screenshotUrl })
            .eq('id', order.id);

          if (updateError) {
            console.error('❌ Error updating order with screenshot:', updateError);
          } else {
            console.log('✅ Order updated with payment screenshot');
          }
        }
      }

      // Create order items
      const orderItemsWithOrderId = orderItems.map(item => ({
        ...item,
        order_id: order.id
      }));

      console.log('📝 Creating order items:', orderItemsWithOrderId);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsWithOrderId);

      if (itemsError) {
        console.error('❌ Order items error:', itemsError);
        throw new Error(`Order items creation failed: ${itemsError.message}`);
      }

      console.log('✅ Order items created successfully');

      // Fetch complete order data for confirmation
      const { data: completeOrder, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            id,
            quantity,
            price,
            product:products(name, image_url)
          )
        `)
        .eq('id', order.id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching complete order:', fetchError);
      }

      // Send confirmation email
      await sendOrderConfirmationEmail(completeOrder || order, formData.email);

      // Clear cart for both authenticated and guest users
      if (!isGuestCheckout) {
        await clearCart();
      }

      // Show order confirmation modal
      setConfirmedOrderData(completeOrder || {
        ...order,
        order_items: orderItems.map((item, index) => ({
          ...item,
          product: isGuestCheckout && guestItem ? guestItem.product : cartItems[index]?.product
        }))
      });
      setShowOrderConfirmation(true);

      toast({
        title: "Order Placed Successfully! 🎉",
        description: `Order #${order.id.slice(0, 8)} has been placed for ₹${totalAmount}. Confirmation email sent to ${formData.email}.`,
      });

    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      
      toast({
        title: "Checkout Failed",
        description: error.message || "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderConfirmationClose = () => {
    setShowOrderConfirmation(false);
    setConfirmedOrderData(null);
    
    // Navigate based on user type
    if (isAuthenticated) {
      navigate('/customer-dashboard');
    } else {
      navigate('/shop');
    }
  };

  // Show loading while checkout is being initialized
  if (!checkoutInitialized) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <span className="ml-2 text-gray-600">Loading checkout...</span>
          </div>
        </div>
      </Layout>
    );
  }

  // Get items to display (either cart items or guest item)
  const displayItems = isGuestCheckout && guestItem ? [guestItem] : 
    cartItems.map(item => ({
      product: item.product,
      quantity: item.quantity
    }));

  const displayTotal = isGuestCheckout && guestItem ? 
    guestItem.product.price * guestItem.quantity : getTotalAmount();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/shop')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
          
          {/* Show checkout type indicator */}
          {!isAuthenticated ? (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 font-medium">Guest Checkout</span>
                <span className="text-blue-600">•</span>
                <span className="text-blue-700">
                  <Button 
                    variant="link" 
                    className="text-blue-700 p-0 h-auto" 
                    onClick={() => navigate('/auth')}
                  >
                    Sign in
                  </Button> 
                  {" "}to save your information and track your order
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">Welcome back, {user?.email}</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayItems.map((item, index) => (
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
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span>₹{displayTotal}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email address"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address_line_1">Address Line 1 *</Label>
                  <Input
                    id="address_line_1"
                    value={formData.address_line_1}
                    onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                    placeholder="Street address, building name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="address_line_2">Address Line 2</Label>
                  <Input
                    id="address_line_2"
                    value={formData.address_line_2}
                    onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                    placeholder="Apartment, suite, unit (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="postal_code">Postal Code *</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    placeholder="Postal Code"
                    required
                  />
                </div>

                {/* Only show save profile option for authenticated users */}
                {isAuthenticated && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="save-profile"
                      checked={saveProfile}
                      onCheckedChange={(checked) => setSaveProfile(checked as boolean)}
                    />
                    <Label htmlFor="save-profile" className="text-sm">
                      Save this information for future orders
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center space-x-2 cursor-pointer flex-1">
                      <Truck className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Cash on Delivery (COD)</p>
                        <p className="text-sm text-gray-600">Pay when your order arrives</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="flex items-center space-x-2 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Online Payment (UPI)</p>
                        <p className="text-sm text-gray-600">Pay using UPI, scan QR code below</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Screenshot Upload - Show only for online payment */}
            {paymentMethod === 'online' && (
              <PaymentScreenshotUpload 
                onScreenshotUpload={handleScreenshotUpload}
                isUploading={isUploadingScreenshot}
                uploadedFile={paymentScreenshot}
              />
            )}

            {/* Place Order Button */}
            <Button
              onClick={handlePlaceOrder}
              disabled={isLoading}
              className="w-full bg-black text-white hover:bg-gray-800 py-3"
              size="lg"
            >
              {isLoading ? 'Processing Order...' : `Place Order - ₹${displayTotal}`}
            </Button>
          </div>
        </div>
      </div>

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={showOrderConfirmation}
        onClose={handleOrderConfirmationClose}
        orderData={confirmedOrderData}
        customerEmail={formData.email}
      />
    </Layout>
  );
};

export default Checkout;
