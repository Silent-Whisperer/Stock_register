import React, { useEffect, useState } from 'react';
import { getProducts, createProduct, deleteProduct, clearAllProducts } from '../services/productService';
import type { Product } from '../types';
import { ProductTable } from '../components/products/ProductTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Plus, Trash2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const ProductsPage: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    hsn_sac: '',
    unit: 'PCS',
    purchase_rate: 0,
    selling_rate: 0,
    current_stock: 0,
    min_stock_alert: 10,
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      notifySuccess('Product Deleted', 'Product removed from catalog.');
    } catch (err: any) {
      notifyError('Delete Failed', err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all catalog products? This action cannot be undone.')) {
      return;
    }
    try {
      await clearAllProducts();
      setProducts([]);
      notifySuccess('Products Cleared', 'All products have been removed from the catalog.');
    } catch (err: any) {
      notifyError('Clear Failed', err.message);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.name) {
      notifyError('Validation Error', 'SKU and Product Name are required.');
      return;
    }

    try {
      const created = await createProduct({
        ...formData,
        purchase_rate: Number(formData.purchase_rate),
        selling_rate: Number(formData.selling_rate),
        current_stock: Number(formData.current_stock),
        min_stock_alert: Number(formData.min_stock_alert),
      });
      setProducts([created, ...products]);
      notifySuccess('Product Cataloged', `Successfully added ${created.name}`);
      setIsModalOpen(false);
      setFormData({
        sku: '',
        name: '',
        description: '',
        hsn_sac: '',
        unit: 'PCS',
        purchase_rate: 0,
        selling_rate: 0,
        current_stock: 0,
        min_stock_alert: 10,
      });
    } catch (err: any) {
      notifyError('Failed to create product', err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-6 py-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Products</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            SKU specifications, HSN tax classifications, and purchase rates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {products.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-300"
            >
              Clear Table
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Product SKU
          </Button>
        </div>
      </div>

      <ProductTable
        products={products}
        loading={loading}
        onDeleteProduct={handleDeleteProduct}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New SKU">
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <Input
            label="SKU Code *"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
            required
            placeholder="SKU-BOLT-M8"
          />
          <Input
            label="Product Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Hex Bolt Fastener 40mm"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="HSN / SAC Code"
              value={formData.hsn_sac}
              onChange={(e) => setFormData({ ...formData, hsn_sac: e.target.value })}
              placeholder="7318"
            />
            <Input
              label="Unit of Measure"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value.toUpperCase() })}
              placeholder="PCS, KGS, NOS"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Purchase Rate (₹)"
              type="number"
              step="0.01"
              value={formData.purchase_rate}
              onChange={(e) => setFormData({ ...formData, purchase_rate: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Selling Rate (₹)"
              type="number"
              step="0.01"
              value={formData.selling_rate}
              onChange={(e) => setFormData({ ...formData, selling_rate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial Stock"
              type="number"
              value={formData.current_stock}
              onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Min Stock Alert Threshold"
              type="number"
              value={formData.min_stock_alert}
              onChange={(e) => setFormData({ ...formData, min_stock_alert: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
