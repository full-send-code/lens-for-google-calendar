import React from 'react';
import { 
  MenuItem,
  IconButton,
  ListItemText,
  TextField,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { DropdownItem } from "../../types/DropdownItem";

interface MenuContentProps {
  items: DropdownItem[];
  searchValue: string;
  onItemSelect: (item: DropdownItem) => void;
  onItemDelete: (item: DropdownItem) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const MenuContent: React.FC<MenuContentProps> = ({
  items,
  searchValue,
  onItemSelect,
  onItemDelete,
  onSearchChange,
  onKeyDown
}) => {
  const filteredItems = items.filter(item =>
    item.text.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <div style={{ padding: '8px 16px' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search presets..."
          value={searchValue}
          onChange={onSearchChange}
          onKeyDown={onKeyDown}
          autoFocus
          variant="outlined"
        />
      </div>
      
      {filteredItems.length === 0 ? (
        <MenuItem disabled>No matching presets</MenuItem>
      ) : (
        filteredItems.map((item) => (
          <MenuItem 
            key={item.value} 
            onClick={() => onItemSelect(item)}
            sx={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <ListItemText primary={item.text} />
            <Box>
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
            </Box>
          </MenuItem>
        ))
      )}
    </>
  );
};

export default MenuContent;
