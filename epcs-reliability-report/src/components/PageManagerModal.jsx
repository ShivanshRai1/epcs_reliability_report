import React, { useState, useRef } from 'react';
import './PageManagerModal.css';

const PageManagerModal = ({ 
  isOpen, 
  onClose, 
  pages, 
  onReorder, 
  onDelete, 
  onNavigate,
  isReordering = false,
  isDeletingId = null
}) => {
  const [pagesList, setPagesList] = useState(pages || []);
  const [draggedItem, setDraggedItem] = useState(null);
  const containerRef = useRef(null);

  React.useEffect(() => {
    const sortedPages = [...(pages || [])].sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
    setPagesList(sortedPages);
  }, [pages, isOpen]);

  const resetFromProps = () => {
    const sortedPages = [...(pages || [])].sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
    setPagesList(sortedPages);
  };

  const handleDragStart = (e, index) => {
    if (isReordering) return;
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newList = [...pagesList];
    const draggedPage = newList[draggedItem];
    newList.splice(draggedItem, 1);
    newList.splice(index, 0, draggedPage);
    setPagesList(newList);
    setDraggedItem(index);
  };

  const handleDragEnd = async () => {
    if (draggedItem !== null) {
      const pageOrder = pagesList.map(p => p.id).filter(Boolean);
      if (pageOrder.length === pagesList.length && pageOrder.length > 0) {
        const ok = await onReorder(pageOrder);
        if (!ok) {
          resetFromProps();
          window.alert('Reorder failed. List has been reset to server order.');
        }
      } else {
        resetFromProps();
        window.alert('Reorder failed: invalid page IDs detected.');
      }
    }
    setDraggedItem(null);
  };

  const handleMoveUp = async (index) => {
    if (index > 0) {
      const newList = [...pagesList];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      setPagesList(newList);
      const pageOrder = newList.map(p => p.id).filter(Boolean);
      if (pageOrder.length !== newList.length) {
        resetFromProps();
        window.alert('Reorder failed: invalid page IDs detected.');
        return;
      }
      const ok = await onReorder(pageOrder);
      if (!ok) {
        resetFromProps();
        window.alert('Reorder failed. List has been reset to server order.');
      }
    }
  };

  const handleMoveDown = async (index) => {
    if (index < pagesList.length - 1) {
      const newList = [...pagesList];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      setPagesList(newList);
      const pageOrder = newList.map(p => p.id).filter(Boolean);
      if (pageOrder.length !== newList.length) {
        resetFromProps();
        window.alert('Reorder failed: invalid page IDs detected.');
        return;
      }
      const ok = await onReorder(pageOrder);
      if (!ok) {
        resetFromProps();
        window.alert('Reorder failed. List has been reset to server order.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="page-manager-overlay" onClick={onClose}>
      <div className="page-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📄 Manage Pages</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" ref={containerRef}>
          <div className="pages-list">
            {pagesList.map((page, index) => (
              <div
                key={page.id}
                className={`page-item ${draggedItem === index ? 'dragging' : ''}`}
                draggable={!isReordering}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className="drag-handle">⋮⋮</div>
                
                <div className="page-details">
                  <div className="page-number">Page {index + 1}</div>
                  <div className="page-title">{page.title}</div>
                  <div className="page-type">{page.pageType}</div>
                </div>

                <div className="page-actions">
                  <button
                    className="action-btn up-btn"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || isReordering}
                    title="Move up"
                  >
                    ⬆️
                  </button>
                  
                  <button
                    className="action-btn down-btn"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === pagesList.length - 1 || isReordering}
                    title="Move down"
                  >
                    ⬇️
                  </button>

                  <button
                    className="action-btn nav-btn"
                    onClick={() => {
                      onNavigate(index + 1);
                      onClose();
                    }}
                    title="Navigate to page"
                  >
                    👁️
                  </button>

                  <button
                    className="action-btn delete-btn"
                    onClick={() => onDelete(page)}
                    disabled={isDeletingId === page.id || isReordering}
                    title="Delete page"
                  >
                    {isDeletingId === page.id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <p className="info-text">Drag to reorder or use arrow buttons</p>
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default PageManagerModal;
