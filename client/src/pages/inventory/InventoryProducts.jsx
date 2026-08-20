import { useEffect, useRef, useState } from 'react';
import {
  getProducts,
  createProduct,
  updateProduct,
  restockProduct,
  deactivateProduct,
  uploadProductImage,
} from '../../api/products';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';

const CATEGORIES = ['Fragile', 'Cold', 'Tech', 'Cleaning', 'General'];

const emptyForm = {
  name: '', sku: '', category: 'General', price: '', quantity: '',
  reorderThreshold: '', description: '',
  isFragile: false, handlingNote: '',
  expiryDate: '', storageTemp: '',
  warrantyPeriod: '', serialNumber: '',
  isHazardous: false, safetyNote: '',
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800 text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

function ExpiryBadge({ expiryDate }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry <= 0) {
    return <Badge variant="expiring" label="Expired" />;
  }
  if (daysUntilExpiry <= 3) {
    return <Badge variant="expiring" label={`Expires in ${daysUntilExpiry}d`} />;
  }
  return null;
}

export default function InventoryProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [error, setError] = useState('');

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [restockModal, setRestockModal] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockError, setRestockError] = useState('');

  const [deactivateModal, setDeactivateModal] = useState(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const [imageModal, setImageModal] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const imageInputRef = useRef();

  const load = async () => {
    try {
      const data = await getProducts({ search, category: categoryFilter });
      setProducts(data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, categoryFilter]);

  const openAdd = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormError('');
    setShowProductModal(true);
  };

  const openEdit = (p) => {
    setEditingProduct(p);
    setForm({
      name: p.name || '', sku: p.sku || '', category: p.category || 'General',
      price: p.price ?? '', quantity: p.quantity ?? '',
      reorderThreshold: p.reorderThreshold ?? '', description: p.description || '',
      isFragile: p.isFragile || false, handlingNote: p.handlingNote || '',
      expiryDate: p.expiryDate || '', storageTemp: p.storageTemp || '',
      warrantyPeriod: p.warrantyPeriod || '', serialNumber: p.serialNumber || '',
      isHazardous: p.isHazardous || false, safetyNote: p.safetyNote || '',
    });
    setFormErrors({});
    setFormError('');
    setShowProductModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormError('');
    setFormLoading(true);
    try {
      const payload = {
        name: form.name, sku: form.sku, category: form.category,
        price: Number(form.price), quantity: Number(form.quantity),
        reorderThreshold: Number(form.reorderThreshold),
        description: form.description || undefined,
      };
      if (form.category === 'Fragile') {
        payload.isFragile = form.isFragile;
        if (form.handlingNote) payload.handlingNote = form.handlingNote;
      }
      if (form.category === 'Cold') {
        if (form.expiryDate) payload.expiryDate = form.expiryDate;
        if (form.storageTemp) payload.storageTemp = form.storageTemp;
      }
      if (form.category === 'Tech') {
        if (form.warrantyPeriod) payload.warrantyPeriod = form.warrantyPeriod;
        if (form.serialNumber) payload.serialNumber = form.serialNumber;
      }
      if (form.category === 'Cleaning') {
        payload.isHazardous = form.isHazardous;
        if (form.safetyNote) payload.safetyNote = form.safetyNote;
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      setShowProductModal(false);
      await load();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) {
        const mapped = {};
        errData.errors.forEach((e) => { mapped[e.path] = e.msg; });
        setFormErrors(mapped);
      } else {
        setFormError(errData?.message || 'Failed to save product.');
      }
    } finally {
      setFormLoading(false);
    }
  };

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

  const handleDeactivate = async () => {
    setDeactivateLoading(true);
    try {
      await deactivateProduct(deactivateModal.id);
      setDeactivateModal(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate product.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) return;
    setImageError('');
    setImageLoading(true);
    try {
      await uploadProductImage(imageModal.id, imageFile);
      setImageModal(null);
      setImageFile(null);
      await load();
    } catch (err) {
      setImageError(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setImageLoading(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Products</h1>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text" placeholder="Search by name or SKU..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        {products.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-12">No products found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="px-5 py-3 font-medium">Image</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    {p.imageUrl ? (
                      <img src={`http://localhost:5000${p.imageUrl}`} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-800">{p.name}</div>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {p.isFragile && <Badge variant="fragile" />}
                      {p.isHazardous && <Badge variant="hazardous" />}
                      {p.category === 'Cold' && p.expiryDate && (
                        <ExpiryBadge expiryDate={p.expiryDate} />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.sku}</td>
                  <td className="px-5 py-3">{p.category}</td>
                  <td className="px-5 py-3 font-medium">₱{Number(p.price).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${p.quantity === 0 ? 'text-red-600' : p.quantity <= p.reorderThreshold ? 'text-amber-600' : 'text-slate-700'}`}>
                      {p.quantity}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={p.isActive ? 'active' : 'inactive'} label={p.isActive ? 'Active' : 'Inactive'} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => openEdit(p)} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 font-medium">Edit</button>
                      <button onClick={() => { setRestockModal(p); setRestockAmount(''); setRestockError(''); }} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 font-medium">Restock</button>
                      <button onClick={() => { setImageModal(p); setImageFile(null); setImageError(''); }} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 font-medium">Image</button>
                      {p.isActive && (
                        <button onClick={() => setDeactivateModal(p)} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 font-medium">Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showProductModal && (
        <Modal title={editingProduct ? 'Edit Product' : 'Add Product'} onClose={() => setShowProductModal(false)}>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            {formError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{formError}</div>}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Product Name *" error={formErrors.name}>
                <input name="name" value={form.name} onChange={handleFormChange} required className={inputCls} />
              </Field>
              <Field label="SKU *" error={formErrors.sku}>
                <input name="sku" value={form.sku} onChange={handleFormChange} required className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category *" error={formErrors.category}>
                <select name="category" value={form.category} onChange={handleFormChange} className={inputCls + ' bg-white'}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Price (₱) *" error={formErrors.price}>
                <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleFormChange} required className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Quantity *" error={formErrors.quantity}>
                <input name="quantity" type="number" min="0" value={form.quantity} onChange={handleFormChange} required className={inputCls} />
              </Field>
              <Field label="Reorder Threshold *" error={formErrors.reorderThreshold}>
                <input name="reorderThreshold" type="number" min="0" value={form.reorderThreshold} onChange={handleFormChange} required className={inputCls} />
              </Field>
            </div>
            <Field label="Description">
              <textarea name="description" value={form.description} onChange={handleFormChange} rows={2} className={inputCls} />
            </Field>

            {form.category === 'Fragile' && (
              <div className="space-y-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide">Fragile Fields</p>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="isFragile" checked={form.isFragile} onChange={handleFormChange} className="rounded" />
                  Mark as Fragile
                </label>
                <Field label="Handling Note">
                  <textarea name="handlingNote" value={form.handlingNote} onChange={handleFormChange} rows={2} className={inputCls} />
                </Field>
              </div>
            )}
            {form.category === 'Cold' && (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Cold Storage Fields</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expiry Date">
                    <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleFormChange} className={inputCls} />
                  </Field>
                  <Field label="Storage Temp">
                    <input name="storageTemp" value={form.storageTemp} onChange={handleFormChange} placeholder="e.g. 2-8°C" className={inputCls} />
                  </Field>
                </div>
              </div>
            )}
            {form.category === 'Tech' && (
              <div className="space-y-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Tech Fields</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Warranty Period">
                    <input name="warrantyPeriod" value={form.warrantyPeriod} onChange={handleFormChange} placeholder="e.g. 1 year" className={inputCls} />
                  </Field>
                  <Field label="Serial Number">
                    <input name="serialNumber" value={form.serialNumber} onChange={handleFormChange} className={inputCls} />
                  </Field>
                </div>
              </div>
            )}
            {form.category === 'Cleaning' && (
              <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">Cleaning Fields</p>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="isHazardous" checked={form.isHazardous} onChange={handleFormChange} className="rounded" />
                  Mark as Hazardous
                </label>
                <Field label="Safety Note">
                  <textarea name="safetyNote" value={form.safetyNote} onChange={handleFormChange} rows={2} className={inputCls} />
                </Field>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={formLoading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {formLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Restock Modal */}
      {restockModal && (
        <Modal title={`Restock: ${restockModal.name}`} onClose={() => setRestockModal(null)}>
          <form onSubmit={handleRestock} className="space-y-4">
            {restockError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{restockError}</div>}
            <p className="text-sm text-slate-600">Current stock: <strong>{restockModal.quantity}</strong></p>
            <Field label="Amount to Add *">
              <input type="number" min="1" required value={restockAmount} onChange={(e) => setRestockAmount(e.target.value)} className={inputCls} placeholder="Enter quantity to add" />
            </Field>
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

      {/* Image Upload Modal */}
      {imageModal && (
        <Modal title={`Upload Image: ${imageModal.name}`} onClose={() => setImageModal(null)}>
          <form onSubmit={handleImageUpload} className="space-y-4">
            {imageError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{imageError}</div>}
            <Field label="Select Image (JPG/JPEG/PNG)">
              <input
                ref={imageInputRef}
                type="file" accept=".jpg,.jpeg,.png"
                onChange={(e) => setImageFile(e.target.files[0] || null)}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </Field>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setImageModal(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={imageLoading || !imageFile} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {imageLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Upload
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deactivate Confirm Modal */}
      {deactivateModal && (
        <Modal title="Deactivate Product" onClose={() => setDeactivateModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Are you sure you want to deactivate <strong>{deactivateModal.name}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeactivateModal(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleDeactivate} disabled={deactivateLoading} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center gap-2">
                {deactivateLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Deactivate
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
