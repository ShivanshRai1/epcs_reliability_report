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

  const toPositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  const fontFamily = page.fontFamily || 'inherit';
  const titleFontSize = toPositiveNumber(page.titleFontSize, 1.2);
  const headerFontSize = toPositiveNumber(page.headerFontSize, 0.95);
  const contentFontSize = toPositiveNumber(page.contentFontSize, 0.95);
  const pageTextColor = page.textColor || '#e0e6f0';
  const headingTitleFontSize = toPositiveNumber(page.headingTitleFontSize, 3.25);
  const headingSubtitleFontSize = toPositiveNumber(page.headingSubtitleFontSize, 1.5);
  const imageWidth = toPositiveNumber(page.imageWidth, 0);
  const imageHeight = toPositiveNumber(page.imageHeight, 0);

  const pageTextStyle = {
    fontFamily,
    color: pageTextColor,
  };

  const imageSizingStyle = {
    width: imageWidth > 0 ? `${imageWidth}px` : undefined,
    height: imageHeight > 0 ? `${imageHeight}px` : undefined,
    objectFit: (imageWidth > 0 || imageHeight > 0) ? 'contain' : undefined,
  };

  const hasImageSizing = [
    'image',
    'just-images',
    'split-content-image',
    'split-text-image',
    'split-links-image',
    'split-image-links',
    'split-image-image',
    'split-content'
  ].includes(page.pageType);

  const updatePageDisplaySettings = (field, value) => {
    if (!onCellChange) return;
    onCellChange(page.id, { [field]: value });
  };

  const renderDisplaySettingsPanel = () => {
    if (!isEditMode || isLiveMode) return null;
    const isHeadingPage = page.pageType === 'heading';

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const formatValue = (value, unit, allowAuto = false) => {
      const numeric = Number(value || 0);
      if (allowAuto && numeric <= 0) return 'Auto';
      if (unit === 'px') return `${Math.round(numeric)} px`;
      return `${numeric.toFixed(2).replace(/\.00$/, '').replace(/(\.\d*[1-9])0$/, '$1')} ${unit}`;
    };

    const renderStepper = ({ label, value, unit, allowAuto = false, onDecrease, onIncrease }) => (
      <div style={{ display: 'grid', gap: '4px', fontSize: '0.8rem', color: '#334155' }}>
        <div>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button type="button" onClick={onDecrease} style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #7d8fb3', background: '#ffffff', color: '#0f172a', cursor: 'pointer', fontWeight: 700, fontSize: '18px', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
          <button type="button" onClick={onIncrease} style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #7d8fb3', background: '#ffffff', color: '#0f172a', cursor: 'pointer', fontWeight: 700, fontSize: '18px', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#1f2937', fontWeight: 700, textAlign: 'center', minHeight: '18px' }}>
          {formatValue(value, unit, allowAuto)}
        </div>
      </div>
    );

    return (
      <div style={{ marginBottom: '12px', padding: '10px 12px', border: '1px solid #d6deec', borderRadius: '8px', background: '#f4f7fc' }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', color: '#1f2937', fontSize: '0.9rem' }}>Display Settings</div>
        <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <label style={{ display: 'grid', gap: '4px', fontSize: '0.8rem', color: '#334155' }}>
            Font family
            <select
              value={fontFamily}
              onChange={(e) => updatePageDisplaySettings('fontFamily', e.target.value)}
              style={{ padding: '6px 8px', border: '1px solid #c8d3e7', borderRadius: '6px' }}
            >
              <option value="inherit">Default</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Verdana, sans-serif">Verdana</option>
              <option value="Tahoma, sans-serif">Tahoma</option>
              <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: '4px', fontSize: '0.8rem', color: '#334155' }}>
            Text color
            <input
              type="color"
              value={page.textColor || '#e0e6f0'}
              onChange={(e) => updatePageDisplaySettings('textColor', e.target.value)}
              style={{ width: '100%', height: '32px', padding: '2px', border: '1px solid #c8d3e7', borderRadius: '6px', cursor: 'pointer' }}
              title="Page text color"
            />
          </label>
          {renderStepper({
            label: 'Title size',
            value: isHeadingPage ? headingTitleFontSize : titleFontSize,
            unit: 'rem',
            onDecrease: () => {
              if (isHeadingPage) {
                onHeadingChange?.(page.id, { headingTitleFontSize: clamp(headingTitleFontSize - 0.1, 1.4, 6) });
                return;
              }
              updatePageDisplaySettings('titleFontSize', clamp(titleFontSize - 0.05, 0.8, 3));
            },
            onIncrease: () => {
              if (isHeadingPage) {
                onHeadingChange?.(page.id, { headingTitleFontSize: clamp(headingTitleFontSize + 0.1, 1.4, 6) });
                return;
              }
              updatePageDisplaySettings('titleFontSize', clamp(titleFontSize + 0.05, 0.8, 3));
            }
          })}
          {renderStepper({
            label: isHeadingPage ? 'Subtitle size' : 'Header size',
            value: isHeadingPage ? headingSubtitleFontSize : headerFontSize,
            unit: 'rem',
            onDecrease: () => {
              if (isHeadingPage) {
                onHeadingChange?.(page.id, { headingSubtitleFontSize: clamp(headingSubtitleFontSize - 0.05, 0.8, 3) });
                return;
              }
              updatePageDisplaySettings('headerFontSize', clamp(headerFontSize - 0.05, 0.75, 2.5));
            },
            onIncrease: () => {
              if (isHeadingPage) {
                onHeadingChange?.(page.id, { headingSubtitleFontSize: clamp(headingSubtitleFontSize + 0.05, 0.8, 3) });
                return;
              }
              updatePageDisplaySettings('headerFontSize', clamp(headerFontSize + 0.05, 0.75, 2.5));
            }
          })}
          {!isHeadingPage && renderStepper({
            label: 'Content size',
            value: contentFontSize,
            unit: 'rem',
            onDecrease: () => updatePageDisplaySettings('contentFontSize', clamp(contentFontSize - 0.05, 0.7, 2)),
            onIncrease: () => updatePageDisplaySettings('contentFontSize', clamp(contentFontSize + 0.05, 0.7, 2))
          })}
          {hasImageSizing && (
            <>
              {renderStepper({
                label: 'image width',
                value: imageWidth,
                unit: 'px',
                allowAuto: true,
                onDecrease: () => updatePageDisplaySettings('imageWidth', Math.max(0, imageWidth - 50) || null),
                onIncrease: () => updatePageDisplaySettings('imageWidth', (imageWidth > 0 ? imageWidth : 0) + 50)
              })}
              {renderStepper({
                label: 'image height',
                value: imageHeight,
                unit: 'px',
                allowAuto: true,
                onDecrease: () => updatePageDisplaySettings('imageHeight', Math.max(0, imageHeight - 50) || null),
                onIncrease: () => updatePageDisplaySettings('imageHeight', (imageHeight > 0 ? imageHeight : 0) + 50)
              })}
            </>
          )}
        </div>
      </div>
    );
  };

  const wrapEditContent = (content) => (
    <div style={pageTextStyle}>
      {renderDisplaySettingsPanel()}
      {content}
    </div>
  );

  // Render heading page (just title + subtitle)
  if (page.pageType === 'heading') {
    // Ensure all heading pages (4, 8, 10) use the same styling and structure
    // Use backgroundClass for all, default to 'heading-derating' if not provided
    const headingClass = page.backgroundClass || 'heading-derating';
    const headingHorizontalAlign = page.headingHorizontalAlign || (page.headingVerticalAlign === 'top' ? 'left' : page.headingVerticalAlign === 'bottom' ? 'right' : 'center');
    const headingVerticalPosition = page.headingVerticalPosition || 'center';
    const headingJustifyContent = headingHorizontalAlign === 'left' ? 'flex-start' : headingHorizontalAlign === 'right' ? 'flex-end' : 'center';
    const headingAlignItems = headingVerticalPosition === 'top' ? 'flex-start' : headingVerticalPosition === 'bottom' ? 'flex-end' : 'center';
    const headingFontFamily = page.headingFontFamily || page.fontFamily || 'inherit';
    const defaultHeadingBackground = '/images/bg2.png';
    const customHeadingBackground = typeof page.headingBackgroundImage === 'string' ? page.headingBackgroundImage.trim() : '';
    const useCustomHeadingBackground = page.headingBackgroundMode === 'custom' && Boolean(customHeadingBackground);
    const effectiveHeadingBackground = useCustomHeadingBackground ? customHeadingBackground : defaultHeadingBackground;
    const headingBackgroundStyle = {
      backgroundColor: '#061427',
      backgroundImage: `url('${effectiveHeadingBackground}')`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      justifyContent: headingJustifyContent,
      alignItems: isEditMode ? 'flex-start' : headingAlignItems
    };
    const headingContentStyle = {
      color: pageTextColor,
      fontFamily: headingFontFamily
    };
    const headingTitleStyle = {
      fontFamily: headingFontFamily,
      fontSize: `${headingTitleFontSize}rem`,
      color: pageTextColor
    };
    const headingSubtitleStyle = {
      fontFamily: headingFontFamily,
      fontSize: `${headingSubtitleFontSize}rem`,
      color: pageTextColor
    };
    const legacyHeadingVars = {
      '--legacy-heading-title-size': `${headingTitleFontSize}rem`,
      '--legacy-heading-subtitle-size': `${headingSubtitleFontSize}rem`
    };

    if (isLiveMode && !isEditMode) {
      return (
        <div className="legacy-live-heading-page" style={{ ...headingBackgroundStyle, ...headingContentStyle, ...legacyHeadingVars }}>
          <h2 className="legacy-live-heading-title" style={headingTitleStyle}>{page.title}</h2>
          {page.subtitle && <h3 className="legacy-live-heading-subtitle" style={headingSubtitleStyle}>{page.subtitle}</h3>}
        </div>
      );
    }
    
    if (isEditMode) {
      return wrapEditContent(
        <div className={`page-heading ${headingClass}`} style={headingBackgroundStyle}>
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
      <div className={`page-heading ${headingClass}`} style={{ ...headingContentStyle, ...headingBackgroundStyle }}>
        <div className="page-heading-content" style={headingContentStyle}>
          <HeadingSection
            heading={page.title}
            isEditMode={false}
            onChange={(newValue) => onHeadingChange(page.id, newValue)}
            headingStyle={headingTitleStyle}
          />
          {page.subtitle && (
            <h3 className="page-heading-subtitle" style={headingSubtitleStyle}>{page.subtitle}</h3>
          )}
        </div>
      </div>
    );
  }

  // Render text-only page
  if (page.pageType === 'text-only') {
    if (isEditMode) {
      return wrapEditContent(<TextOnlyEditor page={page} onChange={(updatedPage) => onCellChange(page.id, updatedPage)} />);
    }
    
    return (
      <div style={{ lineHeight: 1.6, ...pageTextStyle }}>
        {page.title && (
          <div style={{
            background: page.titleColor || 'linear-gradient(135deg, #0052a3 0%, #0066cc 100%)',
            color: 'white',
            padding: '14px 24px',
            fontSize: `${titleFontSize}rem`,
            fontWeight: 600,
            textAlign: 'center',
            letterSpacing: '0.5px',
            marginBottom: '1.2rem',
          }}>
            {page.title}
          </div>
        )}
        <div style={{ whiteSpace: 'pre-wrap', fontSize: `${contentFontSize}rem` }}>{page.content}</div>
      </div>
    );
  }

  // Render just-links page
  if (page.pageType === 'just-links') {
    if (isEditMode) {
      return wrapEditContent(<LinksOnlyEditor page={page} onChange={(updatedPage) => onCellChange(page.id, updatedPage)} />);
    }

    const mixedBlocks = Array.isArray(page.linkBlocks) && page.linkBlocks.length > 0
      ? page.linkBlocks
      : (Array.isArray(page.links)
        ? page.links.map((link, idx) => ({ id: link.id || `legacy-${idx}`, type: 'link', title: link.title, target: link.target }))
        : []);
    
    return (
      <div style={pageTextStyle}>
        {page.title && (
          <div style={{
            background: page.titleColor || 'linear-gradient(135deg, #0052a3 0%, #0066cc 100%)',
            color: 'white',
            padding: '14px 24px',
            fontSize: `${titleFontSize}rem`,
            fontWeight: 600,
            textAlign: 'center',
            letterSpacing: '0.5px',
            marginBottom: '1rem',
          }}>
            {page.title}
          </div>
        )}
        <div className="index-list">
          {mixedBlocks.map((block, idx) => {
            if (block.type === 'text') {
              return (
                <p key={block.id || `text-${idx}`} style={{ color: pageTextColor, lineHeight: 1.6, margin: '0 0 0.8rem 0', whiteSpace: 'pre-wrap' }}>
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
      return wrapEditContent(<ImagesOnlyEditor page={page} onChange={(updatedPage) => onCellChange(page.id, updatedPage)} />);
    }
    
    return (
      <div style={{ textAlign: 'center', ...pageTextStyle }}>
        {page.title && (
          <div style={{
            background: page.titleColor || 'linear-gradient(135deg, #0052a3 0%, #0066cc 100%)',
            color: 'white',
            padding: '14px 24px',
            fontSize: `${titleFontSize}rem`,
            fontWeight: 600,
            textAlign: 'center',
            letterSpacing: '0.5px',
            marginBottom: '1.2rem',
          }}>
            {page.title}
          </div>
        )}
        {page.intro && (
          <p style={{ fontSize: `${contentFontSize}rem`, color: pageTextColor, marginTop: '1rem', marginBottom: '1.5rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
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
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', cursor: 'pointer', ...imageSizingStyle }}
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
                  <p key={block.id || bIdx} style={{ fontSize: '0.95rem', color: pageTextColor, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '0.8rem', textAlign: 'left' }}>
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
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', cursor: 'pointer', ...imageSizingStyle }}
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
                : <p key={block.id || bIdx} style={{ fontSize: '0.95rem', color: pageTextColor, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '0.8rem', textAlign: 'left' }}>
                    {block.text}
                  </p>
            ))}
          </>
        )}

        {page.bottomText && (
          <p style={{ fontSize: `${contentFontSize}rem`, color: pageTextColor, marginTop: '1.5rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {page.bottomText}
          </p>
        )}
      </div>
    );
  }

  // Render image-text page (flexible layout)
  if (page.pageType === 'image-text') {
    if (isEditMode) {
      return wrapEditContent(<FlexibleLayoutEditor page={page} onChange={(updatedPage) => onCellChange(page.id, updatedPage)} />);
    }
    
    return (
      <div style={{ display: 'grid', gridTemplateColumns: page.imagePosition === 'left' ? '1fr 1fr' : '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
        {page.imagePosition === 'left' && page.imageUrl && (
          <div onClick={() => onImageClick(page.imageUrl, page.imageCaption)} style={{ cursor: 'pointer' }}>
            <img src={page.imageUrl} alt={page.imageCaption} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />
            {page.imageCaption && <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>{page.imageCaption}</p>}
          </div>
        )}
        
        <div style={{ color: pageTextColor, fontSize: '0.95rem', lineHeight: 1.6 }}>
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
      return wrapEditContent(
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
      return wrapEditContent(
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.2rem', color: pageTextColor }}>
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
      : { fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.2rem', color: pageTextColor };
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
                <p key={block.id || bIdx} style={{ fontSize: '0.95rem', color: pageTextColor, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '0.8rem' }}>
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
      <div className={isLiveMode ? 'legacy-live-image-page' : ''} style={{ textAlign: 'center', ...pageTextStyle }}>
        {page.title && !isEditMode && (
          <div style={{
            background: page.titleColor || 'linear-gradient(135deg, #0052a3 0%, #0066cc 100%)',
            color: 'white',
            padding: '20px 24px',
            fontSize: `${titleFontSize}rem`,
            fontWeight: 600,
            textAlign: 'center',
            letterSpacing: '0.5px',
            marginBottom: '1.2rem',
          }}>
            {page.title}
          </div>
        )}
        {isEditMode && renderDisplaySettingsPanel()}
        <ImageSection
          imageSrc={page.imageUrl}
          pageTitle={page.title}
          titleColor={page.titleColor}
          imageWidth={page.imageWidth}
          imageHeight={page.imageHeight}
          contentFontSize={contentFontSize}
          isEditMode={isEditMode}
          onChange={(newImageUrl) => onImageChange(page.id, newImageUrl)}
          onTitleChange={(newTitle) => onCellChange(page.id, { title: newTitle })}
          onTitleColorChange={(newColor) => onImageChange(page.id, { titleColor: newColor })}
          onImageSizeChange={(sizePatch) => onImageChange(page.id, sizePatch)}
          onImageClick={page.imageUrl ? () => onImageClick(page.imageUrl, page.title) : undefined}
        />
        {page.description && (
          <p style={{ fontSize: `${contentFontSize}rem`, color: pageTextColor, marginTop: '1rem' }}>{page.description}</p>
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
        titleColor={page.titleColor}
        leftHeaderColor={page.leftHeaderColor}
        rightHeaderColor={page.rightHeaderColor}
        textColor={pageTextColor}
        fontFamily={fontFamily}
        titleFontSize={titleFontSize}
        headerFontSize={headerFontSize}
        contentFontSize={contentFontSize}
        imageWidth={page.imageWidth}
        imageHeight={page.imageHeight}
        leftImageWidth={page.leftImageWidth}
        leftImageHeight={page.leftImageHeight}
        rightImageWidth={page.rightImageWidth}
        rightImageHeight={page.rightImageHeight}
        isEditing={isEditMode}
        onChange={(updatedData) => onImageChange(page.id, updatedData)}
        onImageModalOpen={page.imageUrl ? () => onImageClick(page.imageUrl, page.title) : undefined}
      />
    );
  }

  // Render split content page (new two-column layout)
  if (page.pageType === 'split-content') {
    if (isEditMode) {
      return wrapEditContent(
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
        titleColor={page.titleColor}
        leftHeaderColor={page.leftHeaderColor}
        rightHeaderColor={page.rightHeaderColor}
        textColor={pageTextColor}
        fontFamily={fontFamily}
        titleFontSize={titleFontSize}
        headerFontSize={headerFontSize}
        contentFontSize={contentFontSize}
        imageWidth={page.imageWidth}
        imageHeight={page.imageHeight}
        leftImageWidth={page.leftImageWidth}
        leftImageHeight={page.leftImageHeight}
        rightImageWidth={page.rightImageWidth}
        rightImageHeight={page.rightImageHeight}
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
    if (isEditMode) {
      return wrapEditContent(
        <div>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '1rem' }}>
            <input
              type="text"
              value={page.title || ''}
              onChange={(e) => onCellChange(page.id, { title: e.target.value })}
              placeholder="Enter page title"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #b9c7da', borderRadius: '6px' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#555' }}>
              Title banner color:
              <input
                type="color"
                value={page.titleColor || '#0052a3'}
                onChange={(e) => onCellChange(page.id, { titleColor: e.target.value })}
                style={{ width: '36px', height: '28px', padding: '2px', border: '1px solid #b9c7da', borderRadius: '4px', cursor: 'pointer' }}
              />
            </label>
          </div>
          <ContentSection
            content={page.content}
            isEditing={true}
            onChange={(newContent) => onCellChange(page.id, { content: newContent })}
          />
        </div>
      );
    }

    return (
      <div>
        {page.title && (
          <div style={{
            background: page.titleColor || 'linear-gradient(135deg, #0052a3 0%, #0066cc 100%)',
            color: 'white',
            padding: '14px 24px',
            fontSize: '1.2rem',
            fontWeight: 600,
            textAlign: 'center',
            letterSpacing: '0.5px',
            marginBottom: '1.2rem',
          }}>
            {page.title}
          </div>
        )}
        <ContentSection
          content={page.content}
          isEditing={false}
          onChange={(newContent) => onHeadingChange(page.id, newContent)}
        />
      </div>
    );
  }

  // Render content page (generic text/list)
  return (
    <div>
      {page.title && (
        <div style={{
          background: page.titleColor || 'linear-gradient(135deg, #0052a3 0%, #0066cc 100%)',
          color: 'white',
          padding: '14px 24px',
          fontSize: '1.2rem',
          fontWeight: 600,
          textAlign: 'center',
          letterSpacing: '0.5px',
          marginBottom: '1.2rem',
        }}>
          {page.title}
        </div>
      )}
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
