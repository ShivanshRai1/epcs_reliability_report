import React from 'react';

import Table from './Table';
import HeadingSection from './HeadingSection';
import HeadingPageEditor from './HeadingPageEditor';
import AdvancedTableEditor from './AdvancedTableEditor';
import TextOnlyEditor from './TextOnlyEditor';
import LinksOnlyEditor from './LinksOnlyEditor';
import FlexibleLayoutEditor from './FlexibleLayoutEditor';
import ImagesOnlyEditor from './ImagesOnlyEditor';
import ImageSection from './ImageSection';
import SplitContentImageSection from './SplitContentImageSection';
import ContentSection from './ContentSection';
import IndexEditor from './IndexEditor';

const SectionPage = ({ page, onLinkClick, isEditMode, onCellChange, onHeadingChange, onImageChange, onIndexChange, onImageClick }) => {
  if (!page) return <div style={{ padding: '1.5rem 0' }}>No page data available.</div>;

  // Render heading page (just title + subtitle)
  if (page.pageType === 'heading') {
    // Ensure all heading pages (4, 8, 10) use the same styling and structure
    // Use backgroundClass for all, default to 'heading-derating' if not provided
    const headingClass = page.backgroundClass || 'heading-derating';
    
    if (isEditMode) {
      return (
        <div className={`page-heading ${headingClass}`}>
          <div className="page-heading-content">
            <HeadingPageEditor
              page={page}
              onChange={(updatedPage) => onHeadingChange(page.id, updatedPage)}
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className={`page-heading ${headingClass}`}>
        <div className="page-heading-content">
          <HeadingSection
            heading={page.title}
            isEditMode={false}
            onChange={(newValue) => onHeadingChange(page.id, newValue)}
          />
          {page.subtitle && (
            <h3 className="page-heading-subtitle">{page.subtitle}</h3>
          )}
        </div>
      </div>
    );
  }

  // Render text-only page
  if (page.pageType === 'text-only') {
    if (isEditMode) {
      return <TextOnlyEditor page={page} onChange={(updatedPage) => onCellChange(page.id, updatedPage)} />;
    }
    
    return (
      <div style={{ color: '#e0e6f0', lineHeight: 1.6 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.2rem', color: '#fff' }}>
          {page.title}
        </h2>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{page.content}</div>
      </div>
    );
  }

  // Render just-links page
  if (page.pageType === 'just-links') {
    if (isEditMode) {
      return <LinksOnlyEditor page={page} onChange={(updatedPage) => onCellChange(page.id, updatedPage)} />;
    }
    
    return (
      <div>
        <h2 className="index-title">{page.title}</h2>
        <ul className="index-list">
          {page.links && page.links.map((link, idx) => (
            <li key={idx}>
              <a href="#" className="index-link" onClick={(e) => {
                e.preventDefault();
                if (onLinkClick) onLinkClick(link.target);
              }}>
                {link.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Render just-tables page
  if (page.pageType === 'just-tables') {
    if (isEditMode) {
      return (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.2rem', color: '#fff' }}>
            {page.title}
          </h2>
          <AdvancedTableEditor page={page} onChange={(updatedPage) => onCellChange(page.id, updatedPage)} />
        </div>
      );
    }
    
    // Handle both old (.data) and new (.rows) table structures
    const tableRows = page.table?.rows || page.table?.data || [];
    
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.2rem', color: '#fff' }}>
          {page.title}
        </h2>
        {page.captionTop && <div style={{ marginBottom: '1rem', fontSize: '0.95rem', color: '#ddd' }}>{page.captionTop}</div>}
        <Table columns={page.table?.columns} data={tableRows} isEditMode={false} pageId={page.id} onCellChange={onCellChange} />
        {page.captionBottom && <div style={{ marginTop: '1rem', fontSize: '0.95rem', color: '#ddd' }}>{page.captionBottom}</div>}
      </div>
    );
  }

  // Render just-images page
  if (page.pageType === 'just-images') {
    if (isEditMode) {
      return <ImagesOnlyEditor page={page} onChange={(updatedPage) => onCellChange(page.id, updatedPage)} />;
    }
    
    return (
      <div style={{ textAlign: 'center' }}>
        {page.title && (
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.2rem', color: '#fff' }}>
            {page.title}
          </h2>
        )}
        {page.intro && (
          <p style={{ fontSize: '0.95rem', color: '#e0e6f0', marginBottom: '1.5rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {page.intro}
          </p>
        )}
        {page.images && page.images.map((img, idx) => (
          <div key={idx} style={{ marginBottom: '2rem' }}>
            <img 
              src={img} 
              alt={`Image ${idx + 1}`} 
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', cursor: 'pointer' }} 
              onClick={() => onImageClick(img, page.captions?.[idx] || `Image ${idx + 1}`)} 
            />
            {page.captions?.[idx] && (
              <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
                {page.captions[idx]}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Render image-text page (flexible layout)
  if (page.pageType === 'image-text') {
    if (isEditMode) {
      return <FlexibleLayoutEditor page={page} onChange={(updatedPage) => onCellChange(page.id, updatedPage)} />;
    }
    
    return (
      <div style={{ display: 'grid', gridTemplateColumns: page.imagePosition === 'left' ? '1fr 1fr' : '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
        {page.imagePosition === 'left' && page.imageUrl && (
          <div onClick={() => onImageClick(page.imageUrl, page.imageCaption)} style={{ cursor: 'pointer' }}>
            <img src={page.imageUrl} alt={page.imageCaption} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />
            {page.imageCaption && <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>{page.imageCaption}</p>}
          </div>
        )}
        
        <div style={{ color: '#e0e6f0', fontSize: '0.95rem', lineHeight: 1.6 }}>
          <p>{page.content}</p>
          {page.link && <a href="#" style={{ color: '#2e7be6', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); onLinkClick(page.link); }}>Continue →</a>}
        </div>
        
        {page.imagePosition === 'right' && page.imageUrl && (
          <div onClick={() => onImageClick(page.imageUrl, page.imageCaption)} style={{ cursor: 'pointer' }}>
            <img src={page.imageUrl} alt={page.imageCaption} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />
            {page.imageCaption && <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>{page.imageCaption}</p>}
          </div>
        )}
      </div>
    );
  }

  // Render index page (as true hyperlinks)
  if (page.pageType === 'index') {
    // If in edit mode, show the editor
    if (isEditMode) {
      return (
        <div>
          <IndexEditor 
            page={page} 
            onChange={(updatedPage) => onIndexChange(page.id, updatedPage)}
          />
        </div>
      );
    }

    // Otherwise show read-only view
    return (
      <div>
        <h2 className="index-title">{page.title}</h2>
        <ul className="index-list">
          {page.content && page.content.map((item, idx) => (
            <li key={idx}>
              <a
                href="#"
                className="index-link"
                onClick={e => {
                  e.preventDefault();
                  if (onLinkClick && item.target) {
                    onLinkClick(item.target);
                  }
                }}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Render table page
  if (page.pageType === 'table' && page.table) {
    if (isEditMode) {
      return (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.2rem', color: '#fff' }}>
            {page.title}
          </h2>
          <AdvancedTableEditor 
            page={page}
            onChange={(updatedPage) => onCellChange(page.id, updatedPage)}
          />
        </div>
      );
    }
    
    // Handle both old (.data) and new (.rows) table structures
    const tableRows = page.table.rows || page.table.data || [];
    
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.2rem', color: '#fff' }}>
          {page.title}
        </h2>
        {page.captionTop && <div style={{ marginBottom: '1rem', fontSize: '0.95rem', color: '#ddd' }}>{page.captionTop}</div>}
        <Table columns={page.table.columns} data={tableRows} isEditMode={false} pageId={page.id} onCellChange={onCellChange} />
        {page.captionBottom && <div style={{ marginTop: '1rem', fontSize: '0.95rem', color: '#ddd' }}>{page.captionBottom}</div>}
      </div>
    );
  }

  // Render image page
  if (page.pageType === 'image') {
    return (
      <div style={{ textAlign: 'center' }}>
        {page.title && (
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.2rem', color: '#fff' }}>
            {page.title}
          </h2>
        )}
        <ImageSection
          imageSrc={page.imageUrl}
          isEditMode={isEditMode}
          onChange={(newImageUrl) => onImageChange(page.id, newImageUrl)}
          onImageClick={page.imageUrl ? () => onImageClick(page.imageUrl, page.title) : undefined}
        />
        {page.description && (
          <p style={{ fontSize: '0.9rem', color: '#e0e6f0', marginTop: '1rem' }}>{page.description}</p>
        )}
      </div>
    );
  }

  // Render split content image page
  if (page.pageType === 'split-content-image') {
    return (
      <SplitContentImageSection
        title={page.title}
        leftHeader={page.leftHeader}
        rightHeader={page.rightHeader}
        content={page.content}
        leftContent={page.leftContent}
        imageUrl={page.imageUrl}
        layout={page.layout}
        isEditing={isEditMode}
        onChange={(updatedData) => onImageChange(page.id, updatedData)}
        onImageModalOpen={page.imageUrl ? () => onImageClick(page.imageUrl, page.title) : undefined}
      />
    );
  }

  // Render content page (pure text, editable)
  if (page.pageType === 'content') {
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.2rem', color: '#fff' }}>
          {page.title}
        </h2>
        <ContentSection
          content={page.content}
          isEditing={isEditMode}
          onChange={(newContent) => onHeadingChange(page.id, newContent)}
        />
      </div>
    );
  }

  // Render content page (generic text/list)
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.2rem', color: '#fff' }}>
        {page.title}
      </h2>
      {page.content && (
        <ul>
          {page.content.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SectionPage;
