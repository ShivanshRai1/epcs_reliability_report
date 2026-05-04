import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { getTemplateBadge } from '../utils/templateInfo.jsx';
import { getUploadApiBase } from '../services/api';

// ── Toolbar button ──────────────────────────────────────────────────
const Btn = ({ onClick, active, title, children, style = {} }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    style={{
      padding: '3px 7px',
      margin: '1px',
      border: '1px solid',
      borderColor: active ? '#0052a3' : '#d1d5db',
      borderRadius: '4px',
      background: active ? '#dbeafe' : '#fff',
      color: active ? '#0052a3' : '#374151',
      cursor: 'pointer',
      fontSize: '0.82rem',
      fontWeight: active ? 700 : 400,
      lineHeight: 1.4,
      ...style,
    }}
  >
    {children}
  </button>
);

// ── Toolbar ─────────────────────────────────────────────────────────
const Toolbar = ({ editor, onImageUpload, uploading }) => {
  if (!editor) return null;
  const fileRef = useRef(null);

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '2px',
      padding: '6px 8px',
      borderBottom: '1px solid #e5e7eb',
      background: '#f9fafb',
      borderRadius: '6px 6px 0 0',
    }}>
      {/* History */}
      <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo">↩</Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo">↪</Btn>
      <span style={{ width: 1, background: '#e5e7eb', margin: '0 4px', alignSelf: 'stretch' }} />

      {/* Headings */}
      {[1, 2, 3].map(level => (
        <Btn key={level} onClick={() => editor.chain().focus().toggleHeading({ level }).run()} active={editor.isActive('heading', { level })} title={`Heading ${level}`}>H{level}</Btn>
      ))}
      <Btn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Paragraph">¶</Btn>
      <span style={{ width: 1, background: '#e5e7eb', margin: '0 4px', alignSelf: 'stretch' }} />

      {/* Inline */}
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><strong>B</strong></Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><em>I</em></Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline" style={{ textDecoration: 'underline' }}>U</Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough" style={{ textDecoration: 'line-through' }}>S</Btn>
      <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">{'<>'}</Btn>
      <span style={{ width: 1, background: '#e5e7eb', margin: '0 4px', alignSelf: 'stretch' }} />

      {/* Align */}
      <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">⬅</Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">≡</Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">➡</Btn>
      <span style={{ width: 1, background: '#e5e7eb', margin: '0 4px', alignSelf: 'stretch' }} />

      {/* Lists */}
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">• List</Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">1. List</Btn>
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">❝</Btn>
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">─</Btn>
      <span style={{ width: 1, background: '#e5e7eb', margin: '0 4px', alignSelf: 'stretch' }} />

      {/* Table */}
      <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table">⊞ Table</Btn>
      <Btn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column">+Col</Btn>
      <Btn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row">+Row</Btn>
      <Btn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table" style={{ color: '#dc2626' }}>✕Table</Btn>
      <span style={{ width: 1, background: '#e5e7eb', margin: '0 4px', alignSelf: 'stretch' }} />

      {/* Image upload */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageUpload} />
      <Btn onClick={() => fileRef.current?.click()} title="Insert image" style={{ color: uploading ? '#9ca3af' : '#0052a3' }}>
        {uploading ? 'Uploading…' : '🖼 Image'}
      </Btn>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────
const TipTapEditor = ({ page, onChange }) => {
  const [title, setTitle] = useState(page.title || '');
  const [titleColor, setTitleColor] = useState(page.titleColor || '#0052a3');
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image.configure({ resizable: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: page.tiptapHtml || '',
    onUpdate({ editor }) {
      onChange({ ...page, title, titleColor, tiptapHtml: editor.getHTML() });
    },
  });

  // Sync page.id changes (different page loaded)
  useEffect(() => {
    setTitle(page.title || '');
    setTitleColor(page.titleColor || '#0052a3');
    if (editor && editor.getHTML() !== (page.tiptapHtml || '')) {
      editor.commands.setContent(page.tiptapHtml || '');
    }
  }, [page.id]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    onChange({ ...page, title: val, titleColor, tiptapHtml: editor?.getHTML() || '' });
  };

  const handleTitleColorChange = (e) => {
    const val = e.target.value;
    setTitleColor(val);
    onChange({ ...page, title, titleColor: val, tiptapHtml: editor?.getHTML() || '' });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('upload', file);
      const res = await fetch(`${getUploadApiBase()}/cms/upload-image`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        const url = data.url.startsWith('/') || /^https?:\/\//i.test(data.url) ? data.url : `/${data.url}`;
        editor.chain().focus().setImage({ src: url }).run();
      }
    } catch (err) {
      console.error('TipTap image upload error:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="managed-content-editor">
      <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
        {getTemplateBadge(page, true)}
      </div>

      {/* Title */}
      <div style={{ marginBottom: '14px' }}>
        <h3 style={{ marginBottom: '6px', fontSize: '0.9rem' }}>Page Title</h3>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter page title"
          className="title-input"
          style={{ width: '100%', padding: '9px 12px', border: '1px solid #b9c7da', borderRadius: '6px', fontSize: '1rem', marginBottom: '8px' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#555' }}>
          Title banner color:
          <input type="color" value={titleColor} onChange={handleTitleColorChange}
            style={{ width: '36px', height: '28px', padding: '2px', border: '1px solid #b9c7da', borderRadius: '4px', cursor: 'pointer' }} />
        </label>
      </div>

      {/* Editor */}
      <div style={{ border: '1px solid #b9c7da', borderRadius: '6px', overflow: 'hidden' }}>
        <Toolbar editor={editor} onImageUpload={handleImageUpload} uploading={uploading} />
        <EditorContent
          editor={editor}
          style={{ minHeight: '420px', padding: '14px 16px', fontSize: '0.95rem', lineHeight: 1.6, background: '#fff', outline: 'none' }}
        />
      </div>

      <style>{`
        .tiptap:focus { outline: none; }
        .tiptap table { border-collapse: collapse; width: 100%; margin: 8px 0; }
        .tiptap th, .tiptap td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; }
        .tiptap th { background: #f3f4f6; font-weight: 600; }
        .tiptap p { margin: 0 0 0.5em; }
        .tiptap h1 { font-size: 1.5rem; font-weight: 700; margin: 0.5em 0; }
        .tiptap h2 { font-size: 1.2rem; font-weight: 700; margin: 0.5em 0; }
        .tiptap h3 { font-size: 1rem; font-weight: 700; margin: 0.5em 0; }
        .tiptap ul, .tiptap ol { padding-left: 1.5em; margin: 0.4em 0; }
        .tiptap blockquote { border-left: 3px solid #d1d5db; padding-left: 12px; color: #6b7280; margin: 0.5em 0; }
        .tiptap img { max-width: 100%; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default TipTapEditor;
