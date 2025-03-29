import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

const SearchableDropdown = ({
  label,
  options,
  value,
  onChange,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const dropdownRef = useRef(null);

  // Filter options as user types
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchText.toLowerCase())
  );

  // Close dropdown when clicking outside.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchText("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchText("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        type="text"
        readOnly={!isOpen && value} // When closed, show selected value.
        value={isOpen ? searchText : value}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setSearchText(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
      />
      {isOpen && (
        <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 max-h-60 overflow-auto border border-gray-300 rounded-md mt-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li
                key={option}
                onClick={() => handleSelect(option)}
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-gray-100"
              >
                {option}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-gray-500 dark:text-gray-400">
              No options found
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

SearchableDropdown.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export default SearchableDropdown;
