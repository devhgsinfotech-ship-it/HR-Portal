import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../../core/common/dataTable/index';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import { all_routes } from '../../../router/all_routes';
import apiClient from '../../../core/utils/apiClient';

interface AssetCategoryItem {
  id: number;
  name: string;
  totalAssets: number;
}

const AssetsCategory = () => {
  const [categories, setCategories] = useState<AssetCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/assets/categories');
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Error fetching asset categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert('Please enter category name');
      return;
    }
    try {
      await apiClient.post('/assets/categories', { name: newCategoryName });
      alert('Asset Category created successfully!');
      setNewCategoryName('');
      fetchCategories();
      const closeBtn = document.getElementById('close_add_cat_modal');
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create asset category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this asset category?')) return;
    try {
      await apiClient.delete(`/assets/categories/${id}`);
      alert('Category deleted successfully');
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const columns = [
    {
      title: "Category Name",
      dataIndex: "name",
      render: (text: string) => (
        <h6 className="fs-14 fw-medium text-dark">{text}</h6>
      ),
      sorter: (a: AssetCategoryItem, b: AssetCategoryItem) => a.name.localeCompare(b.name),
    },
    {
      title: "Total Assets",
      dataIndex: "totalAssets",
      render: (val: number) => (
        <span className="badge bg-soft-primary text-primary px-3 py-1 fs-12 fw-medium">
          {val || 0} Assets
        </span>
      ),
      sorter: (a: AssetCategoryItem, b: AssetCategoryItem) => a.totalAssets - b.totalAssets,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: AssetCategoryItem) => (
        <div className="action-icon d-inline-flex">
          <button
            type="button"
            className="btn btn-icon btn-sm text-danger border-0 bg-transparent"
            onClick={() => handleDeleteCategory(record.id)}
            title="Delete Category"
          >
            <i className="ti ti-trash fs-16" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Asset Categories</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Administration</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Asset Categories
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2">
                <button
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#add_assets_category"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add New Category
                </button>
              </div>
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Asset Category List */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Asset Category List ({categories.length})</h5>
            </div>
            <div className="card-body p-0">
              <Table dataSource={categories} columns={columns} Selection={false} />
            </div>
          </div>
        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2026 © SmartHR.</p>
        </div>
      </div>
      {/* /Page Wrapper */}

      {/* Add Category Modal */}
      <div className="modal fade" id="add_assets_category">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Asset Category</h4>
              <button
                type="button"
                id="close_add_cat_modal"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAddCategorySubmit}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Category Name<span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Laptops, Monitors, Mobile Devices"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Category Modal */}
    </>
  );
};

export default AssetsCategory;
