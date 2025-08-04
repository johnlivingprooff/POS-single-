import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

const CategorySettingsSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{ name: string; description: string }>({ name: '', description: '' });
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch categories
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });
  const categories: Category[] = data?.categories || [];

  // Create category
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create category');
      return res.json();
    },
    onSuccess: () => {
      setForm({ name: '', description: '' });
      queryClient.invalidateQueries(['categories']);
    }
  });

  // Update category
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/categories/${editCategory?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update category');
      return res.json();
    },
    onSuccess: () => {
      setEditCategory(null);
      setForm({ name: '', description: '' });
      queryClient.invalidateQueries(['categories']);
    }
  });

  // Delete category
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete category');
      return res.text();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editCategory) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
    setShowModal(false);
  };

  const handleEdit = (cat: Category) => {
    setEditCategory(cat);
    setForm({ name: cat.name, description: cat.description || '' });
    setShowModal(true);
  };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Category Management</h2>
        <button
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => { setEditCategory(null); setForm({ name: '', description: '' }); setShowModal(true); }}
        >
          Add Category
        </button>
      </div>

      {/* Modal for Add/Edit Category */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">{editCategory ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  name="description"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setShowModal(false); setEditCategory(null); setForm({ name: '', description: '' }); }} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                  {editCategory ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-lg font-semibold text-gray-700">Existing Categories</h3>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <table className="min-w-full mb-4 divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td className="px-4 py-2">{cat.name}</td>
                  <td className="px-4 py-2">{cat.description}</td>
                  <td className="px-4 py-2">
                    <button className="mr-2 text-blue-600 hover:text-blue-900" onClick={() => handleEdit(cat)}>Edit</button>
                    <button className="text-red-600 hover:text-red-900" onClick={() => deleteMutation.mutate(cat.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CategorySettingsSection;
