/**
 * PresetsMenu Component
 * A button that opens a menu with searchable preset items.
 */
import React from 'react';
import { Menu } from '@mui/material';
import MenuContent from './MenuContent';
import { usePresetsMenu } from './hooks/usePresetsMenu';
import { PresetsMenuProps } from './types';

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
    isOpen,
    handleClose,
    handleItemSelect,
    handleSearchChange,
    handleKeyDown
  } = usePresetsMenu(onItemSelect, onClose);

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transitionDuration={200}
      elevation={3}
      slotProps={{
        paper: {
          style: {
            maxHeight: 300,
            width: 250,
            overflow: 'visible',
          },
        },
      }}
      MenuListProps={{
        style: { padding: 0 }
      }}
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

export default PresetsMenu;
