// PresetMenu.tsx
import React from 'react';
import { 
  Menu, 
  MenuItem,
  IconButton,
  ListItemText,
  ListItemSecondaryAction,
  TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ActionButton from './ActionButton';
import { DropdownItem } from '../types';

interface PresetMenuProps {
  items: DropdownItem[];
  onItemSelect: (item: DropdownItem) => void;
  onItemDelete: (item: DropdownItem) => void;
}

const PresetMenu: React.FC<PresetMenuProps> = ({ items, onItemSelect, onItemDelete }) => {
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
  
  const filteredItems = items.filter(item =>
    item.text.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <>
      <ActionButton 
        text="&Presets" 
        tooltip="Manage preset groups" 
        onClick={handleClick} 
      />
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: 250,
          },
        }}
      >
        <div style={{ padding: '8px 16px' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search presets..."
            value={searchValue}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            autoFocus
            variant="outlined"
          />
        </div>
        
        {filteredItems.length === 0 ? (
          <MenuItem disabled>No matching presets</MenuItem>
        ) : (
          filteredItems.map((item) => (
            <MenuItem key={item.value} onClick={() => handleItemSelect(item)}>
              <ListItemText primary={item.text} />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemDelete(item);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default PresetMenu;
