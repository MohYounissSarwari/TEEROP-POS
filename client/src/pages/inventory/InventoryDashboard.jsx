import { useEffect, useState } from 'react';
import { getProducts, getLowStockProducts } from '../../api/products';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';

export default function InventoryDashboard() {
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getProducts({ isActive: true }),
      getLowStockProducts(),
    ])
      .then(([productsData, lowStockData]) => {
        setProducts(productsData.products || []);
        setLowStock(lowStockData.products || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const recentProducts = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Inventory Dashboard</h1>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Active Products</p>
            <p className="text-2xl font-bold text-slate-800">{products.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-500">Low Stock Products</p>
            <p className="text-2xl font-bold text-slate-800">{lowStock.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Low Stock Alert</h2>
          </div>
          <div className="overflow-x-auto">
            {lowStock.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">All products are well-stocked.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">SKU</th>
                    <th className="px-5 py-3 font-medium">Qty</th>
                    <th className="px-5 py-3 font-medium">Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{p.name}</td>
                      <td className="px-5 py-3 text-slate-600">{p.sku}</td>
                      <td className={`px-5 py-3 font-semibold ${p.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>{p.quantity}</td>
                      <td className="px-5 py-3 text-slate-600">{p.reorderThreshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Products */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Recently Added Products</h2>
          </div>
          <div className="overflow-x-auto">
            {recentProducts.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">No products yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Price</th>
                    <th className="px-5 py-3 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{p.name}</td>
                      <td className="px-5 py-3">{p.category}</td>
                      <td className="px-5 py-3 text-slate-600">₱{Number(p.price).toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold ${p.quantity === 0 ? 'text-red-600' : p.quantity <= p.reorderThreshold ? 'text-amber-600' : 'text-slate-700'}`}>
                          {p.quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
