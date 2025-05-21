import { DropdownItem } from "../../types/DropdownItem";

export interface PresetsMenuProps {
  /**
   * Array of preset items to display in the menu
   */
  items: DropdownItem[];
  
  /**
   * Callback when a preset item is selected
   */
  onItemSelect: (item: DropdownItem) => void;
  
  /**
   * Callback when a preset item is deleted
   */
  onItemDelete: (item: DropdownItem) => void;
}
