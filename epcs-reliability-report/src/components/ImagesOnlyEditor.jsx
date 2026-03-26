import React, { useEffect, useState } from 'react';
import './ImagesOnlyEditor.css';
import LinkTargetInput from './LinkTargetInput';
import { getTemplateBadge } from '../utils/templateInfo.jsx';

const createBlockId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Normalise any legacy or new page data into a single ordered blocks array.
 * Block types: 'image' | 'text' | 'link'
 */
const normalizeBlocks = (page) => {
  if (Array.isArray(page.pageBlocks) && page.pageBlocks.length > 0) {
    return page.pageBlocks.map((b) => ({ id: b.id || createBlockId(), ...b }));
  }
  // Legacy: images/captions arrays + imageContentBlocks
  const imageBlocks = (page.images || []).map((src, idx) => ({
    id: createBlockId(),
    type: 'image',
    src: src || '',
    caption: (page.captions || [])[idx] || ''
  }));
  const extraBlocks = (page.imageContentBlocks || []).map((b) => ({
    id: b.id || createBlockId(),
    type: b.type === 'text' ? 'text' : 'link',
    text: b.text || '',
    title: b.title || '',
    target: b.target || ''
  }));
  return [...imageBlocks, ...extraBlocks];
};

const toLegacy = (blocks) => ({
  images: blocks.filter(b => b.type === 'image').map(b => b.src || ''),
  captions: blocks.filter(b => b.type === 'image').map(b => b.caption || '')
});

const ImagesOnlyEditor = ({ page, onChange }) => {
  const [blocks, setBlocks] = useState(normalizeBlocks(page));
  const [title, setTitle] = useState(page.title || '');
  const [intro, setIntro] = useState(page.intro || '');
  const [bottomText, setBottomText] = useState(page.bottomText || '');

  // mixedContentMode creates a true distinction from Just Images.
  // Backward safety: if legacy page already has non-image blocks, keep mixed UI available.
  const hasNonImageBlocks = blocks.some((b) => b.type !== 'image');
  const isMixedMode = Boolean(page.mixedContentMode) || hasNonImageBlocks;

  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkTarget, setNewLinkTarget] = useState('');
  const [newText, setNewText] = useState('');

  useEffect(() => {
    setBlocks(normalizeBlocks(page));
    setTitle(page.title || '');
    setIntro(page.intro || '');
    setBottomText(page.bottomText || '');
  }, [page.id]);

  const emit = (nextBlocks, nextTitle = title, nextIntro = intro, nextBottom = bottomText) => {
    const { images, captions } = toLegacy(nextBlocks);
    const nextMixedMode = Boolean(page.mixedContentMode) || nextBlocks.some((b) => b.type !== 'image');
    onChange({
      ...page,
      title: nextTitle,
      intro: nextIntro,
      bottomText: nextBottom,
      pageBlocks: nextBlocks,
      images,
      captions,
      imageContentBlocks: nextBlocks.filter(b => b.type !== 'image'),
      mixedContentMode: nextMixedMode
    });
  };

  const moveBlock = (id, dir) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === blocks.length - 1) return;
    const next = [...blocks];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setBlocks(next);
    emit(next);
  };

  const deleteBlock = (id) => {
    const next = blocks.filter(b => b.id !== id);
    setBlocks(next);
    emit(next);
  };

  const updateBlock = (id, fields) => {
    const next = blocks.map(b => b.id === id ? { ...b, ...fields } : b);
    setBlocks(next);
    emit(next);
  };

  const handleLocalFileSelect = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateBlock(id, { src: reader.result });
    reader.readAsDataURL(file);
  };

  const normalizeImageSrc = (value) => {
    const input = (value || '').trim();
    if (!input) return '';
    if (
      input.startsWith('http://') || input.startsWith('https://') ||
      input.startsWith('data:') || input.startsWith('/') ||
      input.startsWith('./') || input.startsWith('../')
    ) return input;
    const normalized = input.replace(/\\/g, '/');
    const fileName = normalized.split('/').pop();
    if (fileName && /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(fileName)) {
      return `/images/${fileName}`;
    }
    return input;
  };

  const addImage = () => {
    const next = [...blocks, { id: createBlockId(), type: 'image', src: '', caption: '' }];
    setBlocks(next);
    emit(next);
  };

  const addLink = () => {
    if (!isMixedMode) return;
    if (!newLinkTitle.trim() || !newLinkTarget.trim()) return;
    const next = [...blocks, { id: createBlockId(), type: 'link', title: newLinkTitle, target: newLinkTarget }];
    setBlocks(next);
    setNewLinkTitle('');
    setNewLinkTarget('');
    emit(next);
  };

  const addText = () => {
    if (!isMixedMode) return;
    if (!newText.trim()) return;
    const next = [...blocks, { id: createBlockId(), type: 'text', text: newText }];
    setBlocks(next);
    setNewText('');
    emit(next);
  };

  return (
    <div className="images-only-editor">
      {getTemplateBadge(page, true) && (
        <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
          {getTemplateBadge(page, true)}
        </div>
      )}
      <div className="editor-section">
        <label>Page Title:</label>
        <input type="text" value={title}
          onChange={e => { setTitle(e.target.value); emit(blocks, e.target.value, intro, bottomText); }}
          placeholder="Enter page title" className="title-input" />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.85rem', color: '#555' }}>
          Title banner color:
          <input
            type="color"
            value={page.titleColor || '#0052a3'}
            onChange={(e) => onChange({ ...page, titleColor: e.target.value })}
            style={{ width: '36px', height: '28px', padding: '2px', border: '1px solid #b9c7da', borderRadius: '4px', cursor: 'pointer' }}
          />
        </label>
      </div>
      <div className="editor-section">
        <label>Intro Text (optional):</label>
        <textarea value={intro}
          onChange={e => { setIntro(e.target.value); emit(blocks, title, e.target.value, bottomText); }}
          placeholder="Introductory text before content..." className="title-input" rows={3} />
      </div>
      <div className="editor-section">
        <label>Bottom Text (optional):</label>
        <textarea value={bottomText}
          onChange={e => { setBottomText(e.target.value); emit(blocks, title, intro, e.target.value); }}
          placeholder="Text after all content..." className="title-input" rows={3} />
      </div>

      {/* ── Add actions ── */}
      <div className="editor-section">
        <label>{isMixedMode ? 'Add Content:' : 'Add Images:'}</label>

        <div className="content-block-add-section">
          <h4>Image</h4>
          <button className="add-image-btn" onClick={addImage}>🖼️ Add Image</button>
        </div>

        {isMixedMode && (
          <>
            <div className="content-block-add-section">
              <h4>Link</h4>
              <input type="text" value={newLinkTitle} onChange={e => setNewLinkTitle(e.target.value)}
                placeholder="Link title" className="title-input" style={{ marginBottom: '0.5rem' }} />
              <LinkTargetInput
                value={newLinkTarget}
                onValueChange={setNewLinkTarget}
                placeholder="Target (page ID, URL, file path, or choose file)"
                inputClassName="title-input"
              />
              <div className="block-add-btn-row">
                <button className="add-image-btn" onClick={addLink}
                  disabled={!newLinkTitle.trim() || !newLinkTarget.trim()}>
                  🔗 Add Link
                </button>
              </div>
            </div>

            <div className="content-block-add-section">
              <h4>Text Block</h4>
              <textarea value={newText} onChange={e => setNewText(e.target.value)}
                placeholder="Enter paragraph text" className="title-input" rows={3} />
              <div className="block-add-btn-row">
                <button className="add-image-btn" onClick={addText} disabled={!newText.trim()}>
                  📝 Add Text
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Unified block list ── */}
      <div className="editor-section">
        <label>Content ({blocks.length} block{blocks.length !== 1 ? 's' : ''}):</label>
        {blocks.length === 0 ? (
          <div className="empty-state">No content yet. Use the Add section above to add images, links, or text.</div>
        ) : (
          <div className="images-list">
            {blocks.map((block, idx) => (
              <div key={block.id} className="image-item">
                <div className="image-controls">
                  <span className="block-index">{idx + 1}</span>
                  <span className="block-type-badge">{block.type}</span>
                  <button className="move-btn" onClick={() => moveBlock(block.id, 'up')} disabled={idx === 0}>↑ Up</button>
                  <button className="move-btn" onClick={() => moveBlock(block.id, 'down')} disabled={idx === blocks.length - 1}>↓ Down</button>
                  <button className="delete-btn" onClick={() => deleteBlock(block.id)}>🗑 Delete</button>
                </div>

                <div className="image-fields">
                  {block.type === 'image' && (
                    <>
                      <div className="image-preview">
                        {block.src
                          ? <img src={block.src} alt={`Block ${idx + 1}`} />
                          : <div className="placeholder">No image</div>}
                      </div>
                      <label>Image URL:</label>
                      <input type="text" value={block.src || ''}
                        onChange={e => updateBlock(block.id, { src: normalizeImageSrc(e.target.value) })}
                        placeholder="https://... or /images/image.png" className="url-input" />
                      <input type="file" accept="image/*"
                        onChange={e => handleLocalFileSelect(block.id, e.target.files?.[0])}
                        className="url-input" />
                      <label>Caption:</label>
                      <textarea value={block.caption || ''}
                        onChange={e => updateBlock(block.id, { caption: e.target.value })}
                        placeholder="Optional caption" rows={2} className="caption-input" />
                    </>
                  )}
                  {block.type === 'link' && (
                    <>
                      <label>Link Title:</label>
                      <input type="text" value={block.title || ''}
                        onChange={e => updateBlock(block.id, { title: e.target.value })}
                        placeholder="Link title" className="url-input" />
                      <label>Link Target:</label>
                      <LinkTargetInput
                        value={block.target || ''}
                        onValueChange={v => updateBlock(block.id, { target: v })}
                        placeholder="Page ID, URL, or file path"
                        inputClassName="url-input"
                      />
                    </>
                  )}
                  {block.type === 'text' && (
                    <>
                      <label>Text:</label>
                      <textarea value={block.text || ''}
                        onChange={e => updateBlock(block.id, { text: e.target.value })}
                        placeholder="Paragraph text" rows={3} className="caption-input" />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagesOnlyEditor;

