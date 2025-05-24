
/**
 * Enhanced dropdown item interface with optional metadata
 * Provides better type safety and extensibility
 */
export interface DropdownItem {
  /** Display text for the item */
  text: string;
  
  /** Unique value identifier for the item */
  value: string;
  
  /** Optional disabled state */
  disabled?: boolean;
  
  /** Optional item description or tooltip */
  description?: string;
  
  /** Optional icon name or component */
  icon?: string;
  
  /** Optional metadata for the item */
  metadata?: Record<string, any>;
  
  /** Optional category for grouping */
  category?: string;
}
