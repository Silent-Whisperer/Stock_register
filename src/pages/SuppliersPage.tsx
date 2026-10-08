import React, { useEffect, useState } from 'react';
import { getSuppliers, createSupplier, deleteSupplier, clearAllSuppliers } from '../services/supplierService';
import type { Supplier } from '../types';
import { SupplierTable } from '../components/suppliers/SupplierTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Plus, Trash2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const SuppliersPage: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gstin: '',
    email: '',
    phone: '',
    address: '',
    state_code: '',
  });

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      notifySuccess('Supplier Deleted', 'Supplier removed from directory.');
    } catch (err: any) {
      notifyError('Delete Failed', err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear the entire supplier directory? This action cannot be undone.')) {
      return;
    }
    try {
      await clearAllSuppliers();
      setSuppliers([]);
      notifySuccess('Suppliers Cleared', 'All supplier records have been removed.');
    } catch (err: any) {
      notifyError('Clear Failed', err.message);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      notifyError('Validation Error', 'Supplier business name is required.');
      return;
    }

    try {
      const created = await createSupplier({
        ...formData,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        gstin: formData.gstin ? formData.gstin.toUpperCase() : null,
        state_code: formData.state_code || (formData.gstin ? formData.gstin.slice(0, 2) : null),
      });
      setSuppliers([created, ...suppliers]);
      notifySuccess('Supplier Registered', `Successfully added ${created.name}`);
      setIsModalOpen(false);
      setFormData({
        name: '',
        gstin: '',
        email: '',
        phone: '',
        address: '',
        state_code: '',
      });
    } catch (err: any) {
      notifyError('Failed to create supplier', err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-6 py-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Suppliers</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered vendors, statutory GSTIN records, and contact details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {suppliers.length > 0 && (
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
            Add Supplier
          </Button>
        </div>
      </div>

      <SupplierTable
        suppliers={suppliers}
        loading={loading}
        onDeleteSupplier={handleDeleteSupplier}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Supplier Vendor">
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <Input
            label="Supplier Legal Business Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Apex Industrial Supplies Pvt Ltd"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="GSTIN"
              value={formData.gstin}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setFormData({
                  ...formData,
                  gstin: val,
                  state_code: val.length >= 2 ? val.slice(0, 2) : formData.state_code,
                });
              }}
              placeholder="27AABCA1234F1Z8"
            />
            <Input
              label="State Code"
              value={formData.state_code}
              onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
              placeholder="27 (Maharashtra)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Billing Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="billing@apexsupplies.in"
            />
            <Input
              label="Contact Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 22 2847 9100"
            />
          </div>
          <Input
            label="Registered Billing Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Plot 42, MIDC Industrial Area, Pune 411018"
          />
          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Register Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
