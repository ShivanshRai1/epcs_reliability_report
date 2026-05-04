import React, { useState, useRef } from 'react';
import { getTemplateBadge } from '../utils/templateInfo.jsx';
import { getUploadApiBase } from '../services/api';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf'];
const ACCEPTED_EXT = '.png,.jpg,.jpeg,.gif,.webp,.pdf';

const PPTImportEditor = ({ page, onChange }) => {
  const [title, setTitle] = useState(page.title || '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const currentUrl = page.importedFileUrl || '';
  const currentFileType = page.importedFileType || '';

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onChange({ ...page, title: newTitle });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Unsupported file type. Please upload PNG, JPG, GIF, WEBP or PDF.');
      return;
    }

    setUploadError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('upload', file);

      const apiBase = getUploadApiBase();
      const res = await fetch(`${apiBase}/cms/upload-image`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        setUploadError(data.error);
        return;
      }

      const rawUrl = String(data.url || '').trim();
      const resolvedUrl = rawUrl.startsWith('/') || /^https?:\/\//i.test(rawUrl)
        ? rawUrl
        : `/${rawUrl}`;

      onChange({
        ...page,
        title,
        importedFileUrl: resolvedUrl,
        importedFileType: file.type,
      });
    } catch (err) {
      setUploadError('Upload failed. Please try again.');
      console.error('PPTImportEditor upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="managed-content-editor" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
        {getTemplateBadge(page, true)}
        <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
          Upload a PNG, JPG, GIF, WEBP or PDF to display as a full page.
        </p>
      </div>

      {/* Title */}
      <div>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px', color: '#1f2937' }}>
          Page Title
        </label>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter page title"
          className="title-input"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #b9c7da',
            borderRadius: '6px',
            fontSize: '1rem',
          }}
        />
      </div>

      {/* Upload area */}
      <div style={{ border: '2px dashed #b9c7da', borderRadius: '8px', padding: '24px', textAlign: 'center', background: '#f9fafb' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📎</div>
        <p style={{ margin: '0 0 12px', color: '#374151', fontWeight: 600 }}>
          {currentUrl ? 'Replace uploaded file' : 'Upload your file'}
        </p>
        <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '0.85rem' }}>
          Supports PNG, JPG, GIF, WEBP, PDF
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXT}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="ppt-import-file-input"
        />
        <label
          htmlFor="ppt-import-file-input"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            background: uploading ? '#9ca3af' : '#0052a3',
            color: '#fff',
            borderRadius: '6px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {uploading ? 'Uploading...' : 'Choose File'}
        </label>
        {uploadError && (
          <p style={{ marginTop: '10px', color: '#dc2626', fontSize: '0.85rem' }}>{uploadError}</p>
        )}
      </div>

      {/* Preview */}
      {currentUrl && (
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px', color: '#1f2937' }}>Current file:</p>
          {currentFileType === 'application/pdf' ? (
            <iframe
              src={currentUrl}
              title="Uploaded PDF"
              style={{ width: '100%', height: '600px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          ) : (
            <img
              src={currentUrl}
              alt="Uploaded file"
              style={{ maxWidth: '100%', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PPTImportEditor;
