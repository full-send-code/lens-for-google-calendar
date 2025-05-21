/**
 * PresetsMenu Component
 * A button that opens a menu with searchable preset items.
 */
import React from 'react';
import { Menu } from '@mui/material';
import ActionButton from '../ActionButton';
import MenuContent from './MenuContent';
import { usePresetsMenu } from './hooks/usePresetsMenu';
import { PresetsMenuProps } from './types';

/**
 * PresetsMenu displays a button that opens a dropdown menu with searchable preset items
 */
const PresetsMenu: React.FC<PresetsMenuProps> = ({ 
  items, 
  onItemSelect, 
  onItemDelete 
}) => {
  const {
    anchorEl,
    searchValue,
    isOpen,
    handleClick,
    handleClose,
    handleItemSelect,
    handleSearchChange,
    handleKeyDown
  } = usePresetsMenu(onItemSelect);

  return (
    <>
      <ActionButton 
        text="&Presets" 
        tooltip="Manage preset groups" 
        onClick={handleClick}
      />
      
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        slotProps={{
          paper: {
            style: {
              maxHeight: 300,
              width: 250,
            },
          },
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
    </>
  );
};

export default PresetsMenu;
