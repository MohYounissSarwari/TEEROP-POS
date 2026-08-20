import { useEffect, useState } from 'react';
import { getDashboardStatistics, getSalesStatistics } from '../../api/statistics';
import Spinner from '../../components/Spinner';

function StatCard({ title, value, color, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default function AdminStatistics() {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getDashboardStatistics(), getSalesStatistics()])
      .then(([dashData, salesData]) => {
        setStats(dashData.statistics);
        setTransactions(salesData.transactions || []);
        setTotalSales(salesData.totalSales || 0);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load statistics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Statistics</h1>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      {stats && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Total Products" value={stats.totalProducts} color="bg-indigo-500" icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            <StatCard title="Total Users" value={stats.totalUsers} color="bg-blue-500" icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            <StatCard title="Total Transactions" value={stats.totalTransactions} color="bg-emerald-500" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            <StatCard title="Low Stock" value={stats.lowStockProducts} color="bg-amber-500" icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </div>

          {/* Sales banners */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-600 rounded-xl p-6 text-white">
              <p className="text-emerald-100 text-sm font-medium">All-Time Revenue</p>
              <p className="text-3xl font-bold mt-1">₱{Number(totalSales).toFixed(2)}</p>
              <p className="text-emerald-200 text-sm mt-1">{transactions.length} transaction(s)</p>
            </div>
            <div className="bg-indigo-600 rounded-xl p-6 text-white">
              <p className="text-indigo-100 text-sm font-medium">Today's Sales</p>
              <p className="text-3xl font-bold mt-1">₱{Number(stats.todaySales ?? 0).toFixed(2)}</p>
              <p className="text-indigo-200 text-sm mt-1">UTC day total</p>
            </div>
          </div>

          {/* Top Selling Products */}
          {stats.topSellingProducts && stats.topSellingProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Top Selling Products</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="px-5 py-3 font-medium">Rank</th>
                      <th className="px-5 py-3 font-medium">Product</th>
                      <th className="px-5 py-3 font-medium">SKU</th>
                      <th className="px-5 py-3 font-medium">Units Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topSellingProducts.map((p, i) => (
                      <tr key={p.productId} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-5 py-3 font-bold text-indigo-700">#{i + 1}</td>
                        <td className="px-5 py-3 font-medium text-slate-800">{p.productName}</td>
                        <td className="px-5 py-3 text-slate-500">{p.sku}</td>
                        <td className="px-5 py-3 font-semibold text-emerald-700">{p.totalSold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* All Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">All Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-12">No transactions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Cashier</th>
                  <th className="px-5 py-3 font-medium">Subtotal</th>
                  <th className="px-5 py-3 font-medium">Tax</th>
                  <th className="px-5 py-3 font-medium">Grand Total</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500">#{tx.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{tx.cashier?.name || '—'}</td>
                    <td className="px-5 py-3 text-slate-600">₱{Number(tx.subtotal).toFixed(2)}</td>
                    <td className="px-5 py-3 text-slate-600">₱{Number(tx.tax).toFixed(2)}</td>
                    <td className="px-5 py-3 font-semibold text-emerald-700">₱{Number(tx.grandTotal).toFixed(2)}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
