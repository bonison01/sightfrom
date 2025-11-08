export interface VariantType {
  id: string;
  product_id: string;
  color?: string | null;
  size?: string | null;
  price?: number | null;
  stock_quantity?: number | null;
  image_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
