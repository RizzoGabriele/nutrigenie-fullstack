import { useState, useRef, useEffect } from "react";

const CustomSelect = ({ options, value, onChange, placeholder, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-select-wrapper" ref={dropdownRef} style={style}>
      <div className="custom-select-header" onClick={() => setIsOpen(!isOpen)}>
        <span>{value || placeholder}</span>
        <i className={`bi bi-chevron-${isOpen ? "up" : "down"}`}></i>
      </div>
      
      {isOpen && (
        <div className="custom-select-options">
          {options.map((opt) => (
            <div
              key={opt.value || opt}
              className="custom-option"
              onClick={() => {
                onChange(opt.value || opt);
                setIsOpen(false);
              }}
            >
              {opt.label || opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;