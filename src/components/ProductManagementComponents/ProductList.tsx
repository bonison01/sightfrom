import React, { useMemo, useState } from 'react';
import { Product } from '@/types/product';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash, Search as SearchIcon, X } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export default function ProductList({ products, onEdit, onDelete, loading }: ProductListProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  // derive unique categories from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // filtered + alphabetical
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      // category filter
      if (category !== 'all' && (p.category || '') !== category) return false;
      // search match against name and description
      if (!q) return true;
      const nameMatch = p.name?.toLowerCase().includes(q);
      const descMatch = (p.description || '').toLowerCase().includes(q);
      return nameMatch || descMatch;
    });

    // alphabetical by name (A -> Z)
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return list;
  }, [products, query, category]);

  if (loading) return <div className="text-center">Loading products...</div>;

  return (
    <div>
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="flex items-center w-full md:w-1/2 bg-white border rounded-md px-3 py-2 shadow-sm">
          <SearchIcon className="h-4 w-4 mr-2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or description..."
            className="flex-1 outline-none text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="ml-2 p-1 rounded hover:bg-gray-100"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="sr-only">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All categories' : c}
              </option>
            ))}
          </select>

          <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setCategory('all'); }}>
            Reset
          </Button>
        </div>
      </div>

      {/* Product grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center text-sm text-gray-500">No products found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {product.name}
                  {product.featured && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  <div className="space-y-1">
                    <div>Price: ₹{product.price}</div>
                    {product.offer_price && (
                      <div className="text-green-600">Offer: ₹{product.offer_price}</div>
                    )}
                    <div>Stock: {product.stock_quantity || 0}</div>
                    <div>Category: {product.category || 'None'}</div>
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <img
                  src={product.image_url || '/placeholder-image.png'}
                  alt={product.name}
                  className="w-full h-48 object-cover mb-4 rounded-md"
                />

                <p className="text-sm text-gray-500 mb-4">
                  {product.description ? `${product.description.substring(0, 100)}...` : 'No description'}
                </p>

                <div className="flex justify-end space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => onEdit(product)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(product.id)}>
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
