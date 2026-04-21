import React, { useEffect, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import './ManagedContentEditor.css';
import { getTemplateBadge } from '../utils/templateInfo.jsx';

// Custom universal delete plugin
class UniversalDelete extends Plugin {
  static get pluginName() {
    return 'UniversalDelete';
  }

  init() {
    const editor = this.editor;
    const command = editor.commands.get('delete');
    
    // Register UI button
    editor.ui.componentFactory.add('universalDelete', (locale) => {
      const view = new ButtonView(locale);
      
      view.set({
        label: 'Delete',
        icon: '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M6 2a1 1 0 00-1 1v1H3a1 1 0 000 2h1v10a2 2 0 002 2h6a2 2 0 002-2V6h1a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm0 2h8v10H6V4z"/></svg>',
        tooltip: true
      });

      view.bind('isEnabled').to(command, 'isEnabled');
      
      this.listenTo(view, 'execute', () => {
        editor.execute('delete');
        editor.editing.view.focus();
      });

      return view;
    });
  }
}

// Add plugin to ClassicEditor
ClassicEditor.builtinPlugins.push(UniversalDelete);

const ManagedContentEditor = ({ page, onChange }) => {
  const [editorReady, setEditorReady] = useState(false);
  const [title, setTitle] = useState(page.title || '');
  const [titleColor, setTitleColor] = useState(page.titleColor || '#0052a3');
  const [htmlContent, setHtmlContent] = useState(page.htmlContent || '');

  useEffect(() => {
    setTitle(page.title || '');
    setTitleColor(page.titleColor || '#0052a3');
    setHtmlContent(page.htmlContent || '');
  }, [page.id]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    emitChange({ title: newTitle });
  };

  const handleTitleColorChange = (e) => {
    const newColor = e.target.value;
    setTitleColor(newColor);
    emitChange({ titleColor: newColor });
  };

  const handleEditorChange = (event, editor) => {
    const newContent = editor.getData();
    setHtmlContent(newContent);
    emitChange({ htmlContent: newContent });
  };

  const emitChange = (updates = {}) => {
    onChange({
      ...page,
      title: updates.title ?? title,
      titleColor: updates.titleColor ?? titleColor,
      htmlContent: updates.htmlContent ?? htmlContent,
      ...updates
    });
  };

  return (
    <div className="managed-content-editor">
      <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
        {getTemplateBadge(page, true)}
      </div>

      <div className="editor-header" style={{ marginBottom: '16px' }}>
        <h3 style={{ marginBottom: '8px' }}>Page Title</h3>
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
            marginBottom: '12px'
          }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#555' }}>
          Title banner color:
          <input
            type="color"
            value={titleColor}
            onChange={handleTitleColorChange}
            style={{
              width: '36px',
              height: '28px',
              padding: '2px',
              border: '1px solid #b9c7da',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          />
        </label>
      </div>

      <div className="ckeditor-wrapper">
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: '#333' }}>
          Content
        </label>
        <CKEditor
          editor={ClassicEditor}
          data={htmlContent}
          onChange={handleEditorChange}
          onReady={() => setEditorReady(true)}
          config={{
            toolbar: [
              'heading',
              '|',
              'bold',
              'italic',
              'underline',
              'strikethrough',
              'subscript',
              'superscript',
              '|',
              'blockQuote',
              'codeBlock',
              '|',
              'bulletedList',
              'numberedList',
              'todoList',
              'outdent',
              'indent',
              '|',
              'link',
              'imageUpload',
              'imageInsert',
              '|',
              'insertTable',
              'tableColumn',
              'tableRow',
              'mergeTableCells',
              'deleteTable',
              '|',
              'universalDelete',
              '|',
              'alignment',
              'fontFamily',
              'fontSize',
              'fontColor',
              'fontBackgroundColor',
              'highlight',
              '|',
              'undo',
              'redo',
              'findAndReplace'
            ],
            image: {
              toolbar: ['imageTextAlternative', 'imageStyle:full', 'imageStyle:side']
            },
            table: {
              contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'deleteTable']
            },
            link: {
              defaultProtocol: 'https://',
              decorators: {
                openInNewTab: {
                  mode: 'manual',
                  label: 'Open in new tab',
                  attributes: {
                    target: '_blank',
                    rel: 'noopener noreferrer'
                  }
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default ManagedContentEditor;
