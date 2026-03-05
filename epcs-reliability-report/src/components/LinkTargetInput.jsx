import React, { useRef } from 'react';

const LinkTargetInput = ({
  value,
  onValueChange,
  placeholder,
  inputClassName,
  inputId,
  buttonText = 'File',
  disabled = false,
  accept
}) => {
  const fileInputRef = useRef(null);

  const handleTextChange = (e) => {
    if (onValueChange) onValueChange(e.target.value);
  };

  const handlePickFile = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = typeof ev.target?.result === 'string' ? ev.target.result : '';
      if (onValueChange) onValueChange(dataUrl);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
      <input
        id={inputId}
        type="text"
        value={value || ''}
        onChange={handleTextChange}
        placeholder={placeholder}
        className={inputClassName}
        disabled={disabled}
        style={{ flex: 1 }}
      />
      <button
        type="button"
        onClick={handlePickFile}
        disabled={disabled}
        style={{
          whiteSpace: 'nowrap',
          border: '1px solid #3a4555',
          background: '#223047',
          color: '#e0e6f0',
          borderRadius: '6px',
          padding: '0.5rem 0.65rem',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
        title="Choose a local file"
      >
        {buttonText}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default LinkTargetInput;
