/**
 * PresetsMenu Component
 * A button that opens a menu with searchable preset items.
 */
import React, { useMemo } from 'react';
import { Menu } from '@mui/material';
import MenuContent from './MenuContent';
import { usePresetsMenu } from './hooks/usePresetsMenu';
import { PresetsMenuProps } from './types';
import { startPerformanceTracking, endPerformanceTracking } from '../../utils/logger';

/**
 * PresetsMenu displays a dropdown menu with searchable preset items
 */
const PresetsMenu: React.FC<PresetsMenuProps> = ({ 
  items, 
  onItemSelect, 
  onItemDelete,
  anchorEl,
  onClose
}) => {
  const {
    searchValue,
    handleClose,
    handleItemSelect,
    handleSearchChange,
    handleKeyDown
  } = usePresetsMenu(onItemSelect, onClose);

  // Track when the menu is opened or closed
  React.useEffect(() => {
    if (anchorEl) {
      startPerformanceTracking('presetsMenu.open');
    } else {
      endPerformanceTracking('presetsMenu.open');
    }
  }, [anchorEl]);

  // Memoize menu props to avoid unnecessary rerenders
  const menuProps = useMemo(() => ({
    anchorOrigin: {
      vertical: 'bottom' as const,
      horizontal: 'center' as const,
    },
    transformOrigin: {
      vertical: 'top' as const,
      horizontal: 'center' as const,
    },
    transitionDuration: 200,
    elevation: 3,
    slotProps: {
      paper: {
        style: {
          maxHeight: 300,
          width: 250,
          overflow: 'visible',
        },
      },
    },
    MenuListProps: {
      style: { padding: 0 }
    }
  }), []);

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleClose}
      {...menuProps}
    >
      <MenuContent
        items={items}
        searchValue={searchValue}
        onItemSelect={handleItemSelect}
        onItemDelete={onItemDelete}
        onSearchChange={handleSearchChange}
        onKeyDown={handleKeyDown}
      />
    </Menu>
  );
};

export default React.memo(PresetsMenu);
