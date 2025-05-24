import React from 'react';
import { DropdownItem } from "../../../types/DropdownItem";

export const usePresetsMenu = (
  onItemSelect: (item: DropdownItem) => void,
  externalOnClose?: () => void
) => {
  const [searchValue, setSearchValue] = React.useState('');
  
  const handleClose = () => {
    setSearchValue('');
    if (externalOnClose) {
      externalOnClose();
    }
  };

  const handleItemSelect = (item: DropdownItem) => {
    onItemSelect(item);
    handleClose();
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return {
    searchValue,
    isOpen: true, // Now controlled by the parent component
    handleClose,
    handleItemSelect,
    handleSearchChange,
    handleKeyDown
  };
};
