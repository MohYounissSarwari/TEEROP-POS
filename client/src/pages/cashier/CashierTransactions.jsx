import { useEffect, useState } from 'react';
import { getTransactions } from '../../api/transactions';
import Spinner from '../../components/Spinner';

function ReceiptModal({ transaction, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 bg-indigo-600 rounded-t-xl text-white text-center">
          <p className="font-bold text-lg">TEEROP POS</p>
          <p className="text-indigo-200 text-xs mt-0.5">Official Receipt</p>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="text-center border-b border-dashed border-slate-300 pb-4">
            <p className="font-semibold text-slate-800">Receipt #{transaction.id}</p>
            <p className="text-xs text-slate-500 mt-1">{new Date(transaction.createdAt).toLocaleString()}</p>
            <p className="text-xs text-slate-500">Cashier: {transaction.cashier?.name || '—'}</p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium text-right">Qty</th>
                <th className="pb-2 font-medium text-right">Unit Price</th>
                <th className="pb-2 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(transaction.items || []).map((item) => (
                <tr key={item.id} className="border-b border-slate-50">
                  <td className="py-2 text-slate-700">{item.productName}</td>
                  <td className="py-2 text-right text-slate-600">{item.quantity}</td>
                  <td className="py-2 text-right text-slate-600">₱{Number(item.unitPrice).toFixed(2)}</td>
                  <td className="py-2 text-right font-medium text-slate-800">₱{Number(item.lineSubtotal).toFixed(2)}</td>
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
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 font-medium">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function CashierTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getTransactions()
      .then((data) => setTransactions(data.transactions || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load transactions.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">My Transactions</h1>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-500 text-sm">No transactions yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Subtotal</th>
                <th className="px-5 py-3 font-medium">Tax</th>
                <th className="px-5 py-3 font-medium">Grand Total</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setSelected(tx)}
                >
                  <td className="px-5 py-3 text-slate-500">#{tx.id}</td>
                  <td className="px-5 py-3 text-slate-600">{tx.items?.length ?? 0} item(s)</td>
                  <td className="px-5 py-3 text-slate-600">₱{Number(tx.subtotal).toFixed(2)}</td>
                  <td className="px-5 py-3 text-slate-600">₱{Number(tx.tax).toFixed(2)}</td>
                  <td className="px-5 py-3 font-semibold text-emerald-700">₱{Number(tx.grandTotal).toFixed(2)}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelected(tx)}
                      className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && <ReceiptModal transaction={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
