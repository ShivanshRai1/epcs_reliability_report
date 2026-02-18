import React from 'react';


const SectionList = ({ sections, onSelect, currentSection }) => (
  <aside style={{ marginBottom: '2rem' }}>
    <h3>Sections</h3>
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {sections.map((section) => (
        <li key={section.id}>
          <button
            className={`section-list-btn${section.id === currentSection ? ' selected' : ''}`}
            onClick={() => onSelect(section.id)}
          >
            {section.title}
          </button>
        </li>
      ))}
    </ul>
  </aside>
);

export default SectionList;
