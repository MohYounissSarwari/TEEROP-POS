import { useEffect, useState } from 'react';
import { getLowStockProducts, restockProduct } from '../../api/products';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800 text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

export default function InventoryLowStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [restockModal, setRestockModal] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockError, setRestockError] = useState('');

  const load = async () => {
    try {
      const data = await getLowStockProducts();
      setProducts(data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load low stock products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRestock = async (e) => {
    e.preventDefault();
    setRestockError('');
    setRestockLoading(true);
    try {
      await restockProduct(restockModal.id, Number(restockAmount));
      setRestockModal(null);
      setRestockAmount('');
      await load();
    } catch (err) {
      setRestockError(err.response?.data?.message || 'Failed to restock.');
    } finally {
      setRestockLoading(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Low Stock Products</h1>
        <span className="text-sm text-slate-500">{products.length} product(s) need attention</span>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      {products.length > 0 && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          These products are at or below their reorder threshold and need restocking.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">All products are well-stocked!</p>
            <p className="text-slate-400 text-sm mt-1">No products are at or below reorder threshold.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Current Qty</th>
                <th className="px-5 py-3 font-medium">Reorder Threshold</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-slate-100 ${p.quantity === 0 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {p.name}
                    {p.quantity === 0 && (
                      <span className="ml-2 text-xs text-red-600 font-semibold">OUT OF STOCK</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.sku}</td>
                  <td className="px-5 py-3">{p.category}</td>
                  <td className={`px-5 py-3 font-bold ${p.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {p.quantity}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.reorderThreshold}</td>
                  <td className="px-5 py-3 text-slate-600">₱{Number(p.price).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => { setRestockModal(p); setRestockAmount(''); setRestockError(''); }}
                      className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                    >
                      Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Restock Modal */}
      {restockModal && (
        <Modal title={`Restock: ${restockModal.name}`} onClose={() => setRestockModal(null)}>
          <form onSubmit={handleRestock} className="space-y-4">
            {restockError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{restockError}</div>}
            <div>
              <p className="text-sm text-slate-600">Current stock: <strong className="text-red-600">{restockModal.quantity}</strong></p>
              <p className="text-sm text-slate-600">Reorder threshold: <strong>{restockModal.reorderThreshold}</strong></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount to Add *</label>
              <input
                type="number" min="1" required
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                placeholder="Enter quantity to add"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setRestockModal(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={restockLoading} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-2">
                {restockLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Restock
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
