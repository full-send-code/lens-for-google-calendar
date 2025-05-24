import React, { useMemo, useCallback } from 'react';
import { 
  MenuItem,
  IconButton,
  ListItemText,
  TextField,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { DropdownItem } from "../../types/DropdownItem";
import { startPerformanceTracking, endPerformanceTracking } from '../../utils/logger';

interface MenuContentProps {
  items: DropdownItem[];
  searchValue: string;
  onItemSelect: (item: DropdownItem) => void;
  onItemDelete: (item: DropdownItem) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Menu content component for the presets menu
 * Displays searchable list of preset items
 */
const MenuContent: React.FC<MenuContentProps> = ({
  items,
  searchValue,
  onItemSelect,
  onItemDelete,
  onSearchChange,
  onKeyDown
}) => {
  // Memoize filtered items to prevent unnecessary recalculations
  const filteredItems = useMemo(() => {
    startPerformanceTracking('menuContent.filterItems');
    const result = items.filter(item =>
      item.text.toLowerCase().includes(searchValue.toLowerCase())
    );
    endPerformanceTracking('menuContent.filterItems');
    return result;
  }, [items, searchValue]);

  // Memoize the click handler for each item
  const handleItemClick = useCallback((item: DropdownItem) => {
    startPerformanceTracking('menuContent.itemClick');
    onItemSelect(item);
    endPerformanceTracking('menuContent.itemClick');
  }, [onItemSelect]);

  // Memoize the delete handler for each item
  const handleDeleteClick = useCallback((event: React.MouseEvent, item: DropdownItem) => {
    startPerformanceTracking('menuContent.deleteClick');
    event.stopPropagation();
    onItemDelete(item);
    endPerformanceTracking('menuContent.deleteClick');
  }, [onItemDelete]);

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
            onClick={() => handleItemClick(item)}
            sx={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <ListItemText primary={item.text} />
            <Box>
              <IconButton 
                edge="end" 
                size="small"
                onClick={(e) => handleDeleteClick(e, item)}
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

export default React.memo(MenuContent);
