import React from 'react';

export function ThemePicker({metal, onMetalChange}) {
  return <div className="kj-metal-picker" role="group" aria-label="Jewellery theme">
    {['Gold', 'Silver'].map(option => <button
      key={option}
      type="button"
      aria-pressed={metal === option}
      onClick={() => onMetalChange(option)}
    >{option}</button>)}
  </div>;
}
