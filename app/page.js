'use client';

import { useEffect, useState, useRef } from 'react';

const emptyForm = { name: '', description: '', price: '', image_url: '' };

export default function Home() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewModalImg, setPreviewModalImg] = useState(null);

  const fileInputRef = useRef(null);

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data');
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'image_url' && uploadMode === 'url') {
      setImagePreview(value.trim());
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Harap pilih file gambar (JPG, PNG, GIF, WebP)');
        return;
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setError('');
    }
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview('');
    setForm((prev) => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      image_url: product.image_url || '',
    });
    setImageFile(null);
    setImagePreview(product.image_url || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let finalImageUrl = form.image_url;

      // Jika pengguna memilih file baru, upload terlebih dahulu
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Gagal mengupload gambar');
        }

        finalImageUrl = uploadData.url;
      }

      const payload = {
        name: form.name,
        description: form.description,
        price: form.price,
        image_url: finalImageUrl ? finalImageUrl.trim() : null,
      };

      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data');

      setForm(emptyForm);
      setImageFile(null);
      setImagePreview('');
      setEditingId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    setError('');
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus data');
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <header className="header">
        <h1>CRUD Produk</h1>
        <p className="subtitle">Next.js + MySQL (Aiven) dengan Fitur Upload & Edit Gambar</p>
      </header>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h3>{editingId ? '✏️ Edit Produk' : '➕ Tambah Produk Baru'}</h3>
          {editingId && (
            <span className="badge-editing">Sedang Mengedit ID #{editingId}</span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="name">Nama Produk *</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Misal: Kopi Susu Aren"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="description">Deskripsi</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Deskripsi singkat produk (opsional)"
            />
          </div>

          <div className="form-row">
            <label htmlFor="price">Harga (Rp) *</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              placeholder="Misal: 18000"
              required
            />
          </div>

          {/* Bagian Upload / Gambar */}
          <div className="form-row">
            <label>Gambar Produk</label>
            
            <div className="upload-tab-buttons">
              <button
                type="button"
                className={`tab-btn ${uploadMode === 'file' ? 'active' : ''}`}
                onClick={() => setUploadMode('file')}
              >
                📁 Unggah File
              </button>
              <button
                type="button"
                className={`tab-btn ${uploadMode === 'url' ? 'active' : ''}`}
                onClick={() => setUploadMode('url')}
              >
                🔗 Masukkan URL Gambar
              </button>
            </div>

            {uploadMode === 'file' ? (
              <div className="file-upload-box">
                <input
                  type="file"
                  id="imageFile"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <p className="hint">Mendukung format PNG, JPG, WebP, GIF (Maks 5MB)</p>
              </div>
            ) : (
              <div className="url-upload-box">
                <input
                  type="url"
                  name="image_url"
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/gambar-produk.jpg"
                />
                <p className="hint">Tempel tautan URL gambar eksternal yang dapat diakses publik</p>
              </div>
            )}

            {/* Preview Gambar */}
            {imagePreview && (
              <div className="image-preview-container">
                <div className="preview-label">
                  <span>Pratinjau Gambar:</span>
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={handleRemoveImage}
                    title="Hapus gambar ini"
                  >
                    ✕ Hapus Gambar
                  </button>
                </div>
                <div className="preview-image-wrapper">
                  <img
                    src={imagePreview}
                    alt="Pratinjau Produk"
                    className="preview-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                {editingId && !imageFile && (
                  <p className="preview-note">ℹ️ Gambar saat ini. Pilih file baru untuk menggantinya.</p>
                )}
                {imageFile && (
                  <p className="preview-note success">✓ File siap diunggah saat disimpan: <strong>{imageFile.name}</strong></p>
                )}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : editingId ? 'Perbarui Produk' : 'Simpan Produk'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="status">
        {loading ? 'Memuat data...' : `${products.length} produk terdaftar`}
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Gambar</th>
              <th>Nama</th>
              <th>Deskripsi</th>
              <th>Harga</th>
              <th style={{ width: '150px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="table-img-thumb"
                      onClick={() => setPreviewModalImg(p.image_url)}
                      title="Klik untuk memperbesar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
                      }}
                    />
                  ) : (
                    <div className="no-image-placeholder" title="Tidak ada gambar">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="product-name">{p.name}</td>
                <td className="product-desc">{p.description || '-'}</td>
                <td className="product-price">
                  Rp {Number(p.price).toLocaleString('id-ID')}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(p.id)}>
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && products.length === 0 && (
        <div className="empty">Belum ada produk. Tambahkan produk pertama di atas.</div>
      )}

      {/* Modal Zoom Gambar */}
      {previewModalImg && (
        <div className="modal-backdrop" onClick={() => setPreviewModalImg(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setPreviewModalImg(null)}
            >
              ✕
            </button>
            <img src={previewModalImg} alt="Preview Besar" className="modal-img" />
          </div>
        </div>
      )}
    </main>
  );
}
