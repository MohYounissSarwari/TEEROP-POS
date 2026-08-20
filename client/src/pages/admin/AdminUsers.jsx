import { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, changePassword, deactivateUser } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';

const ROLES = ['admin', 'inventory_manager', 'cashier'];

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

const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState('');

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'cashier' });
  const [addErrors, setAddErrors] = useState({});
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Edit User Modal
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'cashier' });
  const [editErrors, setEditErrors] = useState({});
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Change Password Modal
  const [pwModal, setPwModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Deactivate Confirm
  const [deactivateModal, setDeactivateModal] = useState(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const load = async () => {
    try {
      const data = await getUsers({ search, role: roleFilter });
      setUsers(data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, roleFilter]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddErrors({});
    setAddError('');
    setAddLoading(true);
    try {
      await createUser(addForm);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', role: 'cashier' });
      await load();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) {
        const mapped = {};
        errData.errors.forEach((e) => { mapped[e.path] = e.msg; });
        setAddErrors(mapped);
      } else {
        setAddError(errData?.message || 'Failed to create user.');
      }
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (u) => {
    setEditModal(u);
    setEditForm({ name: u.name, email: u.email, role: u.role, isActive: u.isActive ?? true });
    setEditErrors({});
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditErrors({});
    setEditError('');
    setEditLoading(true);
    try {
      await updateUser(editModal.id, editForm);
      setEditModal(null);
      await load();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) {
        const mapped = {};
        errData.errors.forEach((e) => { mapped[e.path] = e.msg; });
        setEditErrors(mapped);
      } else {
        setEditError(errData?.message || 'Failed to update user.');
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwLoading(true);
    try {
      await changePassword(pwModal.id, newPassword);
      setPwModal(null);
      setNewPassword('');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivateLoading(true);
    try {
      await deactivateUser(deactivateModal.id);
      setDeactivateModal(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate user.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <button
          onClick={() => { setShowAddModal(true); setAddForm({ name: '', email: '', password: '', role: 'cashier' }); setAddErrors({}); setAddError(''); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        {users.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-12">No users found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {u.name}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-indigo-600 font-normal">(you)</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3"><Badge variant={u.role} /></td>
                  <td className="px-5 py-3">
                    <Badge variant={u.isActive ? 'active' : 'inactive'} label={u.isActive ? 'Active' : 'Inactive'} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u)} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 font-medium">Edit</button>
                      <button onClick={() => { setPwModal(u); setNewPassword(''); setPwError(''); }} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 font-medium">Password</button>
                      {u.isActive && u.id !== currentUser?.id && u.role !== 'admin' && (
                        <button onClick={() => setDeactivateModal(u)} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 font-medium">Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <Modal title="Add User" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {addError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{addError}</div>}
            <Field label="Full Name *" error={addErrors.name}>
              <input value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} required className={inputCls} />
            </Field>
            <Field label="Email *" error={addErrors.email}>
              <input type="email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} required className={inputCls} />
            </Field>
            <Field label="Password *" error={addErrors.password}>
              <input type="password" value={addForm.password} onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))} required className={inputCls} />
            </Field>
            <Field label="Role *" error={addErrors.role}>
              <select value={addForm.role} onChange={(e) => setAddForm((p) => ({ ...p, role: e.target.value }))} className={inputCls + ' bg-white'}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={addLoading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {addLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Create User
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editModal && (
        <Modal title="Edit User" onClose={() => setEditModal(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{editError}</div>}
            <Field label="Full Name *" error={editErrors.name}>
              <input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required className={inputCls} />
            </Field>
            <Field label="Email *" error={editErrors.email}>
              <input type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} required className={inputCls} />
            </Field>
            <Field label="Role *" error={editErrors.role}>
              <select value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))} className={inputCls + ' bg-white'}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Status">
              {editModal?.role === 'admin' ? (
                <div className="flex items-center gap-2">
                  <span className={inputCls + ' bg-slate-50 text-slate-500 cursor-not-allowed'}>Active (Admin accounts cannot be deactivated)</span>
                </div>
              ) : (
                <select
                  value={editForm.isActive ? 'true' : 'false'}
                  onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.value === 'true' }))}
                  className={inputCls + ' bg-white'}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              )}
            </Field>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setEditModal(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={editLoading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {editLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Password Modal */}
      {pwModal && (
        <Modal title={`Change Password: ${pwModal.name}`} onClose={() => setPwModal(null)}>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{pwError}</div>}
            <Field label="New Password *">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className={inputCls} placeholder="Min. 6 characters" />
            </Field>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setPwModal(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={pwLoading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {pwLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Update Password
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deactivate Confirm Modal */}
      {deactivateModal && (
        <Modal title="Deactivate User" onClose={() => setDeactivateModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Are you sure you want to deactivate <strong>{deactivateModal.name}</strong>? They will no longer be able to log in.
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
