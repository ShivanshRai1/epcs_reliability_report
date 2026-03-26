import React from 'react';

import Table from './Table';
import HeadingSection from './HeadingSection';
import HeadingPageEditor from './HeadingPageEditor';
import AdvancedTableEditor from './AdvancedTableEditor';
import TextOnlyEditor from './TextOnlyEditor';
import LinksOnlyEditor from './LinksOnlyEditor';
import FlexibleLayoutEditor from './FlexibleLayoutEditor';
import ImagesOnlyEditor from './ImagesOnlyEditor';
import VideoEditor from './VideoEditor';
import ImageSection from './ImageSection';
import SplitContentImageSection from './SplitContentImageSection';
import SplitContentEditor from './SplitContentEditor';
import SplitContentRenderer from './SplitContentRenderer';
import ContentSection from './ContentSection';
import IndexEditor from './IndexEditor';

const SectionPage = ({ page, onLinkClick, isEditMode, isLiveMode = false, indexPageOrdinal = null, onCellChange, onHeadingChange, onImageChange, onIndexChange, onImageClick, allIndexItems }) => {
  if (!page) return <div style={{ padding: '1.5rem 0' }}>No page data available.</div>;

  // Render heading page (just title + subtitle)
  if (page.pageType === 'heading') {
    // Ensure all heading pages (4, 8, 10) use the same styling and structure
    // Use backgroundClass for all, default to 'heading-derating' if not provided
    const headingClass = page.backgroundClass || 'heading-derating';

    if (isLiveMode && !isEditMode) {
      return (
        <div className="legacy-live-heading-page" style={{ backgroundImage: "url('/images/bg2.png')" }}>
          <h2 className="legacy-live-heading-title">{page.title}</h2>
          {page.subtitle && <h3 className="legacy-live-heading-subtitle">{page.subtitle}</h3>}
        </div>
      );
    }
    
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
      <div className={`page-heading ${headingClass}`} style={{ color: '#ffffff' }}>
        <div className="page-heading-content" style={{ color: '#ffffff' }}>
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

    const mixedBlocks = Array.isArray(page.linkBlocks) && page.linkBlocks.length > 0
      ? page.linkBlocks
      : (Array.isArray(page.links)
        ? page.links.map((link, idx) => ({ id: link.id || `legacy-${idx}`, type: 'link', title: link.title, target: link.target }))
        : []);
    
    return (
      <div>
        <h2 className="index-title">{page.title}</h2>
        <div className="index-list">
          {mixedBlocks.map((block, idx) => {
            if (block.type === 'text') {
              return (
                <p key={block.id || `text-${idx}`} style={{ color: '#e0e6f0', lineHeight: 1.6, margin: '0 0 0.8rem 0', whiteSpace: 'pre-wrap' }}>
                  {block.text}
                </p>
              );
            }

            return (
              <div key={block.id || `link-${idx}`} style={{ marginBottom: '0.5rem' }}>
                <a href="#" className="index-link" onClick={(e) => {
                  e.preventDefault();
                  if (onLinkClick) onLinkClick(block.target);
                }}>
                  {block.title}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render video-gallery page (maps to just-images with videoGalleryMode flag)
  if (page.pageType === 'just-images' && page.videoGalleryMode) {
    if (isEditMode) {
      return <VideoEditor page={page} onPageUpdate={(updatedPage) => onCellChange(page.id, updatedPage)} isEditMode={true} />;
    }

    return <VideoEditor page={page} isEditMode={false} />;
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
          <p style={{ fontSize: '0.95rem', color: '#e0e6f0', marginTop: '1rem', marginBottom: '1.5rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {page.intro}
          </p>
        )}

        {/* Unified pageBlocks (new format) */}
        {Array.isArray(page.pageBlocks) && page.pageBlocks.length > 0 ? (
          <div>
            {page.pageBlocks.map((block, bIdx) => {
              if (block.type === 'image') {
                return (
                  <div key={block.id || bIdx} style={{ marginBottom: '2rem' }}>
                    <img
                      src={block.src}
                      alt={block.caption || `Image ${bIdx + 1}`}
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', cursor: 'pointer' }}
                      onClick={() => onImageClick(block.src, block.caption || `Image ${bIdx + 1}`)}
                    />
                    {block.caption && (
                      <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>{block.caption}</p>
                    )}
                  </div>
                );
              }
              if (block.type === 'link') {
                return (
                  <div key={block.id || bIdx} style={{ marginBottom: '0.6rem', textAlign: 'left' }}>
                    <a href="#" style={{ color: '#2e7be6', textDecoration: 'none', fontSize: '0.95rem' }}
                      onClick={e => { e.preventDefault(); if (onLinkClick) onLinkClick(block.target); }}>
                      {block.title}
                    </a>
                  </div>
                );
              }
              if (block.type === 'text') {
                return (
                  <p key={block.id || bIdx} style={{ fontSize: '0.95rem', color: '#e0e6f0', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '0.8rem', textAlign: 'left' }}>
                    {block.text}
                  </p>
                );
              }
              return null;
            })}
          </div>
        ) : (
          /* Legacy format fallback */
          <>
            {page.images && page.images.map((img, idx) => (
              <div key={idx} style={{ marginBottom: '2rem' }}>
                <img
                  src={img}
                  alt={`Image ${idx + 1}`}
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', cursor: 'pointer' }}
                  onClick={() => onImageClick(img, page.captions?.[idx] || `Image ${idx + 1}`)}
                />
                {page.captions?.[idx] && (
                  <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>{page.captions[idx]}</p>
                )}
              </div>
            ))}
            {Array.isArray(page.imageContentBlocks) && page.imageContentBlocks.map((block, bIdx) => (
              block.type === 'link'
                ? <div key={block.id || bIdx} style={{ marginBottom: '0.6rem', textAlign: 'left' }}>
                    <a href="#" style={{ color: '#2e7be6', textDecoration: 'none', fontSize: '0.95rem' }}
                      onClick={e => { e.preventDefault(); if (onLinkClick) onLinkClick(block.target); }}>
                      {block.title}
                    </a>
                  </div>
                : <p key={block.id || bIdx} style={{ fontSize: '0.95rem', color: '#e0e6f0', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '0.8rem', textAlign: 'left' }}>
                    {block.text}
                  </p>
            ))}
          </>
        )}

        {page.bottomText && (
          <p style={{ fontSize: '0.95rem', color: '#e0e6f0', marginTop: '1.5rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {page.bottomText}
          </p>
        )}
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
    const hasPageContent = Array.isArray(page.content) && page.content.length > 0;
    const itemsToRender = hasPageContent
      ? page.content
      : (isLiveMode ? [] : (Array.isArray(allIndexItems) ? allIndexItems : []));

    const groupedItems = [];
    let currentParent = null;

    itemsToRender.forEach((item, idx) => {
      const isChild = Number(item?.level) === 1;
      if (!isChild) {
        currentParent = { item, idx, children: [] };
        groupedItems.push(currentParent);
        return;
      }

      if (currentParent) {
        currentParent.children.push({ item, idx });
      } else {
        groupedItems.push({ item, idx, children: [], orphanChild: true });
      }
    });

    if (isLiveMode) {
      const tone = Number(indexPageOrdinal) || 1;
      const bannerTitle = page?.title || (tone === 1 ? 'INDEX' : 'INDEX cntd.');
      const showContinued = tone < 3;

      return (
        <div className={`legacy-live-index legacy-live-index-tone-${tone}`}>
          <div className="legacy-live-index-logo">EPC-SPACE</div>
          <div className="legacy-live-index-banner">{bannerTitle}</div>

          <div className="legacy-live-index-lines">
            {groupedItems.map(group => {
              const topIsChild = Boolean(group.orphanChild);
              return (
                <div key={group.idx} className={`legacy-live-index-group${topIsChild ? ' orphan-child' : ''}`}>
                  <a
                    href="#"
                    className={`legacy-live-index-link ${topIsChild ? 'legacy-live-index-child-link' : 'legacy-live-index-parent-link'}`}
                    onClick={e => {
                      e.preventDefault();
                      if (onLinkClick && group.item.target) onLinkClick(group.item.target);
                    }}
                  >
                    {group.item.title}
                  </a>

                  {group.children.length > 0 && (
                    <div className="legacy-live-index-children">
                      {group.children.map(child => (
                        <a
                          key={child.idx}
                          href="#"
                          className="legacy-live-index-link legacy-live-index-child-link"
                          onClick={e => {
                            e.preventDefault();
                            if (onLinkClick && child.item.target) onLinkClick(child.item.target);
                          }}
                        >
                          {child.item.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {showContinued && <div className="legacy-live-index-continued">Continued on next page..</div>}
        </div>
      );
    }

    return (
      <div>
        <h2 className="index-title">INDEX</h2>
        <div className="index-scroll-container">
        <ul className="index-list">
          {groupedItems.map(group => {
            const topIsChild = Boolean(group.orphanChild);
            return (
              <li key={group.idx} className={topIsChild ? 'index-item-child' : 'index-item-parent'}>
                <a
                  href="#"
                  className={`index-link${topIsChild ? ' index-link-child' : ''}`}
                  onClick={e => {
                    e.preventDefault();
                    if (onLinkClick && group.item.target) {
                      onLinkClick(group.item.target);
                    }
                  }}
                >
                  {group.item.title}
                </a>

                {group.children.length > 0 && (
                  <ul className="index-child-list">
                    {group.children.map(child => (
                      <li key={child.idx} className="index-item-child">
                        <a
                          href="#"
                          className="index-link index-link-child"
                          onClick={e => {
                            e.preventDefault();
                            if (onLinkClick && child.item.target) {
                              onLinkClick(child.item.target);
                            }
                          }}
                        >
                          {child.item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        </div>
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
    const pageNumber = Number(page?.pageNumber);
    const isLivePage6 = isLiveMode && pageNumber === 6;
    const isLivePage7 = isLiveMode && pageNumber === 7;
    const useLegacyLiveTableChrome = isLivePage6 || isLivePage7;
    const headingStyle = useLegacyLiveTableChrome
      ? undefined
      : { fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.2rem', color: '#fff' };
    const captionStyle = useLegacyLiveTableChrome
      ? undefined
      : { fontSize: '0.95rem', color: '#ddd' };
    const containerClassName = isLivePage6
      ? 'legacy-live-page-6-table'
      : isLivePage7
        ? 'legacy-live-page-7-table'
        : '';
    const headingClassName = isLivePage6
      ? 'legacy-live-page-6-title'
      : isLivePage7
        ? 'legacy-live-page-7-title'
        : '';
    const captionClassName = isLivePage6
      ? 'legacy-live-page-6-caption'
      : isLivePage7
        ? 'legacy-live-page-7-caption'
        : '';

    return (
      <div className={containerClassName}>
        {isLivePage6 && <div className="legacy-live-page-6-logo">EPC·SPACE</div>}
        {isLivePage7 && <div className="legacy-live-page-7-logo">EPC·SPACE</div>}
        <h2 className={headingClassName} style={headingStyle}>
          {page.title}
        </h2>
        {page.captionTop && (
          <div className={captionClassName} style={{ marginBottom: '1rem', ...(captionStyle || {}) }}>
            {page.captionTop}
          </div>
        )}
        <Table columns={page.table.columns} data={tableRows} isEditMode={false} pageId={page.id} onCellChange={onCellChange} />
        {page.captionBottom && (
          <div className={captionClassName} style={{ marginTop: '1rem', ...(captionStyle || {}) }}>
            {page.captionBottom}
          </div>
        )}
        {Array.isArray(page.tableContentBlocks) && page.tableContentBlocks.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            {page.tableContentBlocks.map((block, bIdx) => {
              if (block.type === 'link') {
                return (
                  <div key={block.id || bIdx} style={{ marginBottom: '0.6rem' }}>
                    <a
                      href="#"
                      style={{ color: '#2e7be6', textDecoration: 'none', fontSize: '0.95rem' }}
                      onClick={(e) => {
                        e.preventDefault();
                        if (onLinkClick) onLinkClick(block.target);
                      }}
                    >
                      {block.title}
                    </a>
                  </div>
                );
              }
              return (
                <p key={block.id || bIdx} style={{ fontSize: '0.95rem', color: '#e0e6f0', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '0.8rem' }}>
                  {block.text}
                </p>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Render image page
  if (page.pageType === 'image') {
    return (
      <div className={isLiveMode ? 'legacy-live-image-page' : ''} style={{ textAlign: 'center' }}>
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

  // Render split content image page and split image variants
  if (
    page.pageType === 'split-content-image' ||
    page.pageType === 'split-text-image' ||
    page.pageType === 'split-links-image' ||
    page.pageType === 'split-image-links' ||
    page.pageType === 'split-image-image' ||
    (page.pageType === 'split-content' && (page.splitTextImageMode || page.splitLinksImageMode))
  ) {
    return (
      <SplitContentImageSection
        title={page.title}
        pageNumber={page.pageNumber}
        leftHeader={page.leftHeader}
        rightHeader={page.rightHeader}
        content={page.content}
        leftContent={page.leftContent}
        imageUrl={page.imageUrl}
        layout={page.layout}
        isLiveMode={isLiveMode}
        splitTextImageMode={page.splitTextImageMode}
        splitLinksImageMode={page.splitLinksImageMode}
        splitImageLinksMode={page.splitImageLinksMode}
        splitImageImageMode={page.splitImageImageMode}
        leftImageUrl={page.leftImageUrl}
        isEditing={isEditMode}
        onChange={(updatedData) => onImageChange(page.id, updatedData)}
        onImageModalOpen={page.imageUrl ? () => onImageClick(page.imageUrl, page.title) : undefined}
      />
    );
  }

  // Render split content page (new two-column layout)
  if (page.pageType === 'split-content') {
    if (isEditMode) {
      return (
        <SplitContentEditor
          page={page}
          onChange={(updatedPage) => onCellChange(page.id, updatedPage)}
        />
      );
    }

    return (
      <SplitContentRenderer
        title={page.title}
        leftHeader={page.leftHeader}
        rightHeader={page.rightHeader}
        leftContentType={page.leftContentType}
        rightContentType={page.rightContentType}
        leftContent={page.leftContent}
        rightContent={page.rightContent}
        leftImage={page.leftImage}
        rightImage={page.rightImage}
        leftBlocks={page.leftBlocks}
        rightBlocks={page.rightBlocks}
        onLinkClick={onLinkClick}
        onImageClick={onImageClick}
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
