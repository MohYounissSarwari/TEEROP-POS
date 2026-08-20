import { useEffect, useState } from 'react';
import { getInventoryStatistics } from '../../api/statistics';
import Spinner from '../../components/Spinner';

export default function InventorySales() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getInventoryStatistics()
      .then((res) => setData(res.statistics))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load sales data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Sales Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Read-only view for inventory planning purposes.</p>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      {data && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500">Active Products</p>
                <p className="text-2xl font-bold text-slate-800">{data.totalActiveProducts}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500">Low Stock</p>
                <p className="text-2xl font-bold text-slate-800">{data.totalLowStockProducts}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500">Categories</p>
                <p className="text-2xl font-bold text-slate-800">{data.totalCategories}</p>
              </div>
            </div>
          </div>

          {/* Recent Transactions — Read Only */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Recent Transactions</h2>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">Read-only</span>
            </div>
            <div className="overflow-x-auto">
              {(data.recentTransactions || []).length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8">No transactions yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="px-5 py-3 font-medium">ID</th>
                      <th className="px-5 py-3 font-medium">Cashier</th>
                      <th className="px-5 py-3 font-medium">Grand Total</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-5 py-3 text-slate-500">#{tx.id}</td>
                        <td className="px-5 py-3 font-medium text-slate-800">{tx.cashier?.name || '—'}</td>
                        <td className="px-5 py-3 font-semibold text-emerald-700">₱{Number(tx.grandTotal).toFixed(2)}</td>
                        <td className="px-5 py-3 text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
