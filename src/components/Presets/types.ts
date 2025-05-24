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

  /**
   * Element that anchors the menu
   */
  anchorEl?: HTMLElement | null;

  /**
   * Callback when the menu is closed
   */
  onClose?: () => void;
}
