import React, { useRef, useEffect } from "react";

// Auto-resizing input for heading
function AutoResizeInput({ value, onChange, className, placeholder }) {
  const inputRef = useRef();
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.width = Math.max(180, value.length * 18) + 'px';
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
      style={{ minWidth: 180, textAlign: 'center' }}
    />
  );
}

const HeadingSection = ({ heading, isEditMode, onChange }) => {
  if (isEditMode) {
    return (
      <div className="heading-section">
        <AutoResizeInput
          value={heading}
          onChange={e => onChange && onChange(e.target.value)}
          className="heading-edit-input"
          placeholder="Enter heading text..."
        />
      </div>
    );
  }
  return (
    <div className="heading-section">
      <h2>{heading}</h2>
    </div>
  );
};

export default HeadingSection;
