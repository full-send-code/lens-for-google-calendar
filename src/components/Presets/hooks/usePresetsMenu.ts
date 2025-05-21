import React from 'react';
import { DropdownItem } from "../../../types/DropdownItem";

export const usePresetsMenu = (onItemSelect: (item: DropdownItem) => void) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = React.useState('');
  
  const handleClick = () => {
    // Since ActionButton's onClick doesn't provide an event, use document.activeElement as fallback
    const target = document.activeElement as HTMLElement | null;
    setAnchorEl(target);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchValue('');
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
    anchorEl,
    searchValue,
    isOpen: Boolean(anchorEl),
    handleClick,
    handleClose,
    handleItemSelect,
    handleSearchChange,
    handleKeyDown
  };
};
