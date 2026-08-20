import { useCallback, useEffect, useRef, useState } from 'react';
import { getProducts } from '../../api/products';
import { createTransaction } from '../../api/transactions';
import { useAuth } from '../../context/AuthContext';

const TAX_RATE = 0.05;

function ReceiptModal({ transaction, onClose, cashierName }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 bg-indigo-600 rounded-t-xl text-white text-center">
          <p className="font-bold text-lg">TEEROP POS</p>
          <p className="text-indigo-200 text-xs mt-0.5">Official Receipt</p>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="text-center border-b border-dashed border-slate-300 pb-4">
            <p className="text-xs text-slate-500">
              Transaction #{transaction.id}
            </p>
            <p className="text-xs text-slate-500">{new Date(transaction.createdAt).toLocaleString()}</p>
            <p className="text-xs text-slate-500">Cashier: {transaction.cashier?.name || cashierName}</p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium text-right">Qty</th>
                <th className="pb-2 font-medium text-right">Unit</th>
                <th className="pb-2 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(transaction.items || []).map((item) => (
                <tr key={item.id} className="border-b border-slate-50">
                  <td className="py-2 text-slate-700 text-xs">{item.productName}</td>
                  <td className="py-2 text-right text-slate-600 text-xs">{item.quantity}</td>
                  <td className="py-2 text-right text-slate-600 text-xs">₱{Number(item.unitPrice).toFixed(2)}</td>
                  <td className="py-2 text-right font-medium text-slate-800 text-xs">₱{Number(item.lineSubtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 pt-2 border-t border-dashed border-slate-300">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span><span>₱{Number(transaction.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Tax (5%)</span><span>₱{Number(transaction.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-800 pt-2 border-t border-slate-300">
              <span>GRAND TOTAL</span><span>₱{Number(transaction.grandTotal).toFixed(2)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 pt-2">Thank you for your purchase!</p>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}

export default function POSPage() {
  const { user } = useAuth();
  const skuInputRef = useRef(null);
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [skuInput, setSkuInput] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [productsLoading, setProductsLoading] = useState(true);

  // Load all active products
  const loadProducts = useCallback(async () => {
    try {
      const data = await getProducts({ isActive: true });
      setProducts(data.products || []);
    } catch (err) {
      // silently fail on load; search will still work
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Auto-focus SKU input on mount
  useEffect(() => {
    skuInputRef.current?.focus();
  }, []);

  // Filter products by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredProducts(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, products]);

  // Cart helpers
  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, product.quantity);
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQty, lineSubtotal: Number((item.unitPrice * newQty).toFixed(2)) }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: Number(product.price),
          quantity: Math.min(qty, product.quantity),
          maxStock: product.quantity,
          lineSubtotal: Number(Number(product.price).toFixed(2)) * Math.min(qty, product.quantity),
        },
      ];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = Math.max(0, Math.min(item.quantity + delta, item.maxStock));
          return { ...item, quantity: newQty, lineSubtotal: Number((item.unitPrice * newQty).toFixed(2)) };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // SKU scanner
  const handleSkuScan = (e) => {
    if (e.key !== 'Enter') return;
    const sku = skuInput.trim();
    if (!sku) return;
    const product = products.find((p) => p.sku.toLowerCase() === sku.toLowerCase() && p.isActive);
    if (product) {
      if (product.quantity > 0) {
        addToCart(product);
      }
    }
    setSkuInput('');
    skuInputRef.current?.focus();
  };

  // Billing
  const subtotal = Number(cart.reduce((sum, item) => sum + item.lineSubtotal, 0).toFixed(2));
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const grandTotal = Number((subtotal + tax).toFixed(2));

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutError('');
    setCheckoutLoading(true);
    try {
      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      const data = await createTransaction(items);
      setReceipt(data.transaction);
      setCart([]);
    } catch (err) {
      setCheckoutError(err.response?.data?.message || 'Transaction failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleReceiptClose = () => {
    setReceipt(null);
    setSearchQuery('');
    setSkuInput('');
    // Reload products to get fresh stock
    loadProducts();
    skuInputRef.current?.focus();
  };

  return (
    <div className="h-full flex gap-4">
      {/* LEFT: Cart Panel */}
      <div className="flex flex-col w-full md:w-96 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-800">Cart</h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
              <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-slate-400 text-sm">Cart is empty</p>
              <p className="text-slate-400 text-xs mt-1">Scan a SKU or search for products</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.productId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">₱{Number(item.unitPrice).toFixed(2)} each</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-slate-400 hover:text-red-500 flex-shrink-0 mt-0.5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.productId, -1)}
                        className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-sm font-medium"
                      >−</button>
                      <span className="text-sm font-semibold text-slate-700 w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, 1)}
                        disabled={item.quantity >= item.maxStock}
                        className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                      >+</button>
                      <span className="text-xs text-slate-400">/ {item.maxStock}</span>
                    </div>
                    <p className="text-sm font-bold text-indigo-700">₱{Number(item.lineSubtotal).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Billing Summary */}
        <div className="border-t border-slate-200 px-5 py-4 space-y-2 bg-slate-50">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Tax (5%)</span><span>₱{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-800 pt-2 border-t border-slate-200">
            <span>Grand Total</span><span>₱{grandTotal.toFixed(2)}</span>
          </div>

          {checkoutError && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{checkoutError}</p>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutLoading}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-1"
          >
            {checkoutLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {checkoutLoading ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>

      {/* RIGHT: Product Finder Panel */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* SKU Scanner */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            SKU Scanner — press Enter to add
          </label>
          <input
            ref={skuInputRef}
            type="text"
            value={skuInput}
            onChange={(e) => setSkuInput(e.target.value)}
            onKeyDown={handleSkuScan}
            placeholder="Scan or type SKU and press Enter..."
            className="w-full px-3 py-2.5 border-2 border-indigo-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Manual Search */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-slate-100">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Product Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="overflow-y-auto flex-1 p-4">
            {productsLoading ? (
              <div className="flex items-center justify-center h-20">
                <span className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchQuery.trim() === '' ? (
              <div className="text-center text-slate-400 text-sm py-8">
                <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Type a product name or SKU to search
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-8">No products found for "{searchQuery}"</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const inCart = cart.find((c) => c.productId === p.id);
                  const outOfStock = p.quantity === 0;
                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl border p-3 flex flex-col gap-2 transition-colors ${
                        outOfStock ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Product image */}
                      <div className="w-full aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {p.imageUrl ? (
                          <img src={`http://localhost:5000${p.imageUrl}`} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.sku}</p>
                        <p className="text-sm font-bold text-indigo-700 mt-1">₱{Number(p.price).toFixed(2)}</p>
                        <p className={`text-xs mt-0.5 ${outOfStock ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                          {outOfStock ? 'Out of Stock' : `Stock: ${p.quantity}`}
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(p)}
                        disabled={outOfStock}
                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {outOfStock ? 'Out of Stock' : inCart ? 'Add More' : 'Add to Cart'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {receipt && (
        <ReceiptModal
          transaction={receipt}
          cashierName={user?.name}
          onClose={handleReceiptClose}
        />
      )}
    </div>
  );
}
