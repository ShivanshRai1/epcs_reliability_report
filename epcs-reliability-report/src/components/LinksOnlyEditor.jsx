import React, { useEffect, useState } from 'react';
import './LinksOnlyEditor.css';
import LinkTargetInput from './LinkTargetInput';

const LinksOnlyEditor = ({ page, onChange }) => {
  const [links, setLinks] = useState(page.links || []);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkTarget, setNewLinkTarget] = useState('');

  useEffect(() => {
    setLinks(page.links || []);
  }, [page.id, page.links]);

  const handleAddLink = () => {
    console.log('🔗 Add Link clicked - title:', newLinkTitle, 'target:', newLinkTarget);
    
    if (newLinkTitle.trim() && newLinkTarget.trim()) {
      console.log('✅ Link is valid, adding...');
      const linkId = Date.now();
      const newLink = { id: linkId, title: newLinkTitle, target: newLinkTarget };
      console.log('📝 New link:', newLink);
      
      const updatedLinks = [...links, newLink];
      console.log('📋 Updated links array:', updatedLinks);
      
      setLinks(updatedLinks);
      setNewLinkTitle('');
      setNewLinkTarget('');
      updatePage(updatedLinks);
      
      console.log('✅ Link added successfully');
    } else {
      console.warn('⚠️ Link validation failed - title or target empty');
    }
  };

  const handleDeleteLink = (linkId) => {
    const updatedLinks = links.filter(l => l.id !== linkId);
    setLinks(updatedLinks);
    updatePage(updatedLinks);
  };

  const handleLinkChange = (linkId, field, value) => {
    const updatedLinks = links.map(l =>
      l.id === linkId ? { ...l, [field]: value } : l
    );
    setLinks(updatedLinks);
    updatePage(updatedLinks);
  };

  const handleMoveLink = (linkId, direction) => {
    const index = links.findIndex(l => l.id === linkId);
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < links.length - 1)) {
      const updatedLinks = [...links];
      const moveIndex = direction === 'up' ? index - 1 : index + 1;
      [updatedLinks[index], updatedLinks[moveIndex]] = [updatedLinks[moveIndex], updatedLinks[index]];
      setLinks(updatedLinks);
      updatePage(updatedLinks);
    }
  };

  const updatePage = (updatedLinks) => {
    onChange({
      ...page,
      links: updatedLinks
    });
  };

  return (
    <div className="links-only-editor">
      <div className="editor-header">
        <h3>Page Title</h3>
        <input
          type="text"
          value={page.title || ''}
          onChange={(e) => onChange({ ...page, title: e.target.value })}
          placeholder="Enter page title"
          className="title-input"
        />
      </div>

      {/* Add New Link */}
      <div className="add-link-section">
        <h3>Add New Link</h3>
        <div className="add-link-form">
          <input
            type="text"
            value={newLinkTitle}
            onChange={(e) => setNewLinkTitle(e.target.value)}
            placeholder="Link title"
            className="form-input"
          />
          <LinkTargetInput
            value={newLinkTarget}
            onValueChange={setNewLinkTarget}
            placeholder="Target (page ID/number, URL, file path, or choose file)"
            inputClassName="form-input"
          />
          <button 
            className="add-btn"
            onClick={handleAddLink}
            disabled={!newLinkTitle.trim() || !newLinkTarget.trim()}
          >
            ➕ Add Link
          </button>
        </div>
      </div>

      {/* Links List */}
      <div className="links-list">
        <h3>Links ({links.length})</h3>
        {links.length === 0 ? (
          <p className="empty-message">No links yet. Add one above.</p>
        ) : (
          <div className="links-container">
            {links.map((link, index) => (
              <div key={link.id} className="link-item">
                <div className="link-order">{index + 1}</div>
                
                <div className="link-inputs">
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => handleLinkChange(link.id, 'title', e.target.value)}
                    placeholder="Link title"
                    className="link-title-input"
                  />
                  <LinkTargetInput
                    value={link.target}
                    onValueChange={(value) => handleLinkChange(link.id, 'target', value)}
                    placeholder="Page ID/number, URL, file path, or choose file"
                    inputClassName="link-target-input"
                    buttonText="📁"
                  />
                </div>

                <div className="link-actions">
                  <button
                    className="action-btn"
                    onClick={() => handleMoveLink(link.id, 'up')}
                    disabled={index === 0}
                    title="Move up"
                  >
                    ⬆️
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleMoveLink(link.id, 'down')}
                    disabled={index === links.length - 1}
                    title="Move down"
                  >
                    ⬇️
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteLink(link.id)}
                    title="Delete link"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="preview-section">
        <h4>Preview</h4>
        <div className="links-preview">
          <h2>{page.title}</h2>
          <ul className="preview-list">
            {links.map((link, idx) => (
              <li key={idx}>
                <a href="#">{link.title}</a> → {link.target}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LinksOnlyEditor;
