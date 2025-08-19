import React from 'react';
import Select from 'react-select';

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Search and select...",
  isMulti = false,
  isDisabled = false,
  isLoading = false,
  isClearable = true,
  className = "",
  name = "",
  required = false,
  ...props
}) => {
  // Custom styles for react-select - Fully responsive for all screen sizes
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: window.innerWidth >= 1920 ? '56px' :
                 window.innerWidth >= 1440 ? '52px' :
                 window.innerWidth >= 768 ? '48px' : '44px',
      border: state.isFocused
        ? '2px solid #10b981'
        : '1px solid #d1d5db',
      borderRadius: '8px',
      boxShadow: state.isFocused
        ? '0 0 0 3px rgba(16, 185, 129, 0.1)'
        : 'none',
      '&:hover': {
        borderColor: '#10b981',
      },
      backgroundColor: '#ffffff',
      fontSize: window.innerWidth >= 1920 ? '16px' :
                 window.innerWidth >= 1440 ? '15px' :
                 window.innerWidth >= 768 ? '14px' : '13px',
      padding: window.innerWidth < 768 ? '2px' : '4px',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '14px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#374151',
      fontSize: '14px',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#dbeafe',
      borderRadius: '6px',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#1e40af',
      fontSize: '12px',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#1e40af',
      '&:hover': {
        backgroundColor: '#bfdbfe',
        color: '#1e40af',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#10b981'
        : state.isFocused
        ? '#f0fdf4'
        : '#ffffff',
      color: state.isSelected
        ? '#ffffff'
        : '#374151',
      fontSize: window.innerWidth >= 1920 ? '16px' :
                 window.innerWidth >= 1440 ? '15px' :
                 window.innerWidth >= 768 ? '14px' : '13px',
      padding: window.innerWidth >= 1440 ? '14px 18px' :
               window.innerWidth >= 768 ? '12px 16px' : '10px 14px',
      '&:hover': {
        backgroundColor: state.isSelected ? '#10b981' : '#f0fdf4',
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      zIndex: 9999,
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: window.innerWidth >= 1440 ? '250px' :
                 window.innerWidth >= 768 ? '200px' : '180px',
      padding: '4px',
    }),
    loadingIndicator: (provided) => ({
      ...provided,
      color: '#10b981',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#6b7280',
      '&:hover': {
        color: '#10b981',
      },
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: '#6b7280',
      '&:hover': {
        color: '#ef4444',
      },
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: '#6b7280',
      fontSize: '14px',
      padding: '12px 16px',
    }),
  };

  // Format options to ensure they have value and label
  const formattedOptions = options.map(option => {
    if (typeof option === 'string') {
      return { value: option, label: option };
    }
    return option;
  });

  // Handle value formatting
  const formattedValue = () => {
    if (!value) return null;
    
    if (isMulti) {
      if (Array.isArray(value)) {
        return value.map(v => {
          if (typeof v === 'string') {
            return formattedOptions.find(opt => opt.value === v) || { value: v, label: v };
          }
          return v;
        });
      }
      return [];
    } else {
      if (typeof value === 'string') {
        return formattedOptions.find(opt => opt.value === value) || { value, label: value };
      }
      return value;
    }
  };

  // Handle change events
  const handleChange = (selectedOption) => {
    if (isMulti) {
      const values = selectedOption ? selectedOption.map(opt => opt.value) : [];
      onChange(values);
    } else {
      const selectedValue = selectedOption ? selectedOption.value : '';
      onChange(selectedValue);
    }
  };

  return (
    <div className={className}>
      <Select
        name={name}
        options={formattedOptions}
        value={formattedValue()}
        onChange={handleChange}
        placeholder={placeholder}
        isMulti={isMulti}
        isDisabled={isDisabled}
        isLoading={isLoading}
        isClearable={isClearable}
        isSearchable={true}
        styles={customStyles}
        noOptionsMessage={() => "No options found"}
        loadingMessage={() => "Loading..."}
        {...props}
      />
      {required && !value && (
        <p className="mt-1 text-sm text-red-600">This field is required</p>
      )}
    </div>
  );
};

export default SearchableSelect;
