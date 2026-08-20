import { useEffect, useState } from 'react';
import { getDashboardStatistics, getSalesStatistics } from '../../api/statistics';
import { getLowStockProducts } from '../../api/products';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';

function StatCard({ title, value, icon, color }) {
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

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [dashData, salesData, lowStockData] = await Promise.all([
          getDashboardStatistics(),
          getSalesStatistics(),
          getLowStockProducts(),
        ]);
        setStats(dashData.statistics);
        setRecentSales(salesData.transactions.slice(0, 5));
        setLowStock(lowStockData.products || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard title="Total Products" value={stats.totalProducts} color="bg-indigo-500" icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        <StatCard title="Total Users" value={stats.totalUsers} color="bg-blue-500" icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        <StatCard title="Total Transactions" value={stats.totalTransactions} color="bg-emerald-500" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </div>

      {/* Sales banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-indigo-600 rounded-xl p-5 text-white">
          <p className="text-indigo-200 text-sm">Today's Sales</p>
          <p className="text-3xl font-bold mt-1">₱{Number(stats.todaySales ?? 0).toFixed(2)}</p>
        </div>
        <div className="bg-emerald-600 rounded-xl p-5 text-white">
          <p className="text-emerald-200 text-sm">All-Time Sales</p>
          <p className="text-3xl font-bold mt-1">₱{Number(stats.totalSales).toFixed(2)}</p>
        </div>
      </div>

      {stats.lowStockProducts > 0 && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span><strong>{stats.lowStockProducts}</strong> product(s) are at or below reorder threshold.</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Low Stock Products</h2>
          </div>
          <div className="overflow-x-auto">
            {lowStock.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No low stock products.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">SKU</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Qty</th>
                    <th className="px-5 py-3 font-medium">Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{p.name}</td>
                      <td className="px-5 py-3 text-slate-600">{p.sku}</td>
                      <td className="px-5 py-3">{p.category}</td>
                      <td className={`px-5 py-3 font-semibold ${p.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>{p.quantity}</td>
                      <td className="px-5 py-3 text-slate-600">{p.reorderThreshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            {recentSales.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No transactions yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 font-medium">ID</th>
                    <th className="px-5 py-3 font-medium">Cashier</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-500">#{tx.id}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{tx.cashier?.name || '—'}</td>
                      <td className="px-5 py-3 font-semibold text-emerald-700">₱{Number(tx.grandTotal).toFixed(2)}</td>
                      <td className="px-5 py-3 text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
    </div>
  );
}
