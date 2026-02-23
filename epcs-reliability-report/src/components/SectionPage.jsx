import React from 'react';

import Table from './Table';
import HeadingSection from './HeadingSection';
import ImageSection from './ImageSection';
import SplitContentImageSection from './SplitContentImageSection';
import ContentSection from './ContentSection';

const SectionPage = ({ page, onLinkClick, isEditMode, onCellChange, onHeadingChange, onImageChange, onImageClick }) => {
  if (!page) return <div style={{ padding: '1.5rem 0' }}>No page data available.</div>;

  // Render heading page (just title + subtitle)
  if (page.pageType === 'heading') {
    // Ensure all heading pages (4, 8, 10) use the same styling and structure
    // Use backgroundClass for all, default to 'heading-derating' if not provided
    const headingClass = page.backgroundClass || 'heading-derating';
    return (
      <div className={`page-heading ${headingClass}`}>
        <div className="page-heading-content">
          <HeadingSection
            heading={page.title}
            isEditMode={isEditMode}
            onChange={(newValue) => onHeadingChange(page.id, newValue)}
          />
          {page.subtitle && (
            <h3 className="page-heading-subtitle">{page.subtitle}</h3>
          )}
        </div>
      </div>
    );
  }

  // Render index page (as true hyperlinks)
  if (page.pageType === 'index') {
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
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.2rem', color: '#fff' }}>
          {page.title}
        </h2>
        <Table columns={page.table.columns} data={page.table.data} isEditMode={isEditMode} pageId={page.id} onCellChange={onCellChange} />
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
