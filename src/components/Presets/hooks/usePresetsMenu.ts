import React, { useCallback, useState } from 'react';
import { DropdownItem } from "../../../types/DropdownItem";
import { startPerformanceTracking, endPerformanceTracking } from '../../../utils/logger';

/**
 * Custom hook for managing presets menu state and behavior
 * @param onItemSelect Callback when an item is selected
 * @param externalOnClose External callback when menu is closed
 */
export const usePresetsMenu = (
  onItemSelect: (item: DropdownItem) => void,
  externalOnClose?: () => void
) => {
  const [searchValue, setSearchValue] = useState('');
  
  /**
   * Handle menu close action
   */
  const handleClose = useCallback(() => {
    startPerformanceTracking('presetsMenu.handleClose');
    
    setSearchValue('');
    if (externalOnClose) {
      externalOnClose();
    }
    
    endPerformanceTracking('presetsMenu.handleClose');
  }, [externalOnClose]);

  /**
   * Handle item selection
   */
  const handleItemSelect = useCallback((item: DropdownItem) => {
    startPerformanceTracking('presetsMenu.handleItemSelect');
    
    onItemSelect(item);
    handleClose();
    
    endPerformanceTracking('presetsMenu.handleItemSelect');
  }, [onItemSelect, handleClose]);
  
  /**
   * Handle search input changes
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    startPerformanceTracking('presetsMenu.handleSearchChange');
    
    setSearchValue(e.target.value);
    
    endPerformanceTracking('presetsMenu.handleSearchChange');
  }, []);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  return {
    searchValue,
    handleClose,
    handleItemSelect,
    handleSearchChange,
    handleKeyDown
  };
};
