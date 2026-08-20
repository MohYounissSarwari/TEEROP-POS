const variantClasses = {
  admin: 'bg-purple-100 text-purple-800',
  inventory_manager: 'bg-blue-100 text-blue-800',
  cashier: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
  active: 'bg-emerald-100 text-emerald-700',
  'low-stock': 'bg-red-100 text-red-700',
  fragile: 'bg-yellow-100 text-yellow-800',
  hazardous: 'bg-orange-100 text-orange-800',
  expiring: 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-700',
};

const variantLabels = {
  admin: 'Admin',
  inventory_manager: 'Inventory Mgr',
  cashier: 'Cashier',
  inactive: 'Inactive',
  active: 'Active',
  'low-stock': 'Low Stock',
  fragile: 'Fragile',
  hazardous: 'Hazardous',
  expiring: 'Expiring Soon',
};

export default function Badge({ variant, label, className = '' }) {
  const classes = variantClasses[variant] || variantClasses.default;
  const text = label ?? variantLabels[variant] ?? variant;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes} ${className}`}>
      {text}
    </span>
  );
}
