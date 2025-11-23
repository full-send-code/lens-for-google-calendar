/**
 * Preset Operations Hook
 * Handles all preset CRUD operations with proper error handling
 */

import { useState, useCallback } from 'react';
import type { CalendarPreset } from '../../core';
import type { 
  ApplyPresetUseCase,
  SavePresetUseCase,
  DeletePresetUseCase
} from '../../usecases';
import logger from '../../infrastructure/logger';
import { showCustomNotification } from '../utils/customNotification';
import type { UseOperationStateReturn } from './useOperationState.hook';

export interface UsePresetOperationsProps {
  applyPresetUseCase: ApplyPresetUseCase;
  savePresetUseCase: SavePresetUseCase;
  deletePresetUseCase: DeletePresetUseCase;
  presets: CalendarPreset[];
  operationState: UseOperationStateReturn;
  onPresetsChange: () => void;
}

export interface UsePresetOperationsReturn {
  selectedPreset: string | undefined;
  setSelectedPreset: (preset: string | undefined) => void;
  handlePresetSelect: (presetName: string) => Promise<void>;
  handleUpdatePreset: () => Promise<void>;
  handleDeletePreset: () => Promise<void>;
  handleSavePreset: (name: string, overwrite: boolean) => Promise<void>;
}

/**
 * Custom hook for managing preset operations
 * 
 * Provides centralized preset management including:
 * - Preset selection and application
 * - Preset saving with overwrite confirmation
 * - Preset updating with current calendar state
 * - Preset deletion with confirmation
 * - Proper error handling and notifications
 */
export const usePresetOperations = ({
  applyPresetUseCase,
  savePresetUseCase,
  deletePresetUseCase,
  presets,
  operationState,
  onPresetsChange
}: UsePresetOperationsProps): UsePresetOperationsReturn => {
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(undefined);
  
  const { isOperating, canPerformOperation, markOperationStart, markOperationEnd } = operationState;

  /**
   * Handle preset selection and automatic application (with debouncing)
   */
  const handlePresetSelect = useCallback(async (presetName: string) => {
    logger.info(`🎯 UI Event: Preset selection initiated - "${presetName || 'undefined'}"`);
    
    if (!presetName) {
      logger.info('🎯 UI Event: Empty preset name - clearing selection');
      setSelectedPreset(undefined);
      return;
    }

    // Debounce rapid selections
    if (!canPerformOperation()) {
      logger.debug(`🚫 UI Event: Debouncing rapid preset selection for "${presetName}"`);
      return;
    }
    
    logger.info(`🎯 UI Event: Processing preset selection - "${presetName}"`);

    try {
      markOperationStart();
      setSelectedPreset(presetName);
      logger.debug(`🎯 UI Event: State updated - selectedPreset: "${presetName}", isOperating: true`);
      
      logger.info(`🎯 UI Event: Starting preset application - "${presetName}"`);
      const startTime = performance.now();
      
      // Automatically apply the preset when selected
      logger.debug(`🎯 UI Event: Calling applyPresetUseCase.execute("${presetName}")`);
      await applyPresetUseCase.execute(presetName);
      
      const applyTime = performance.now() - startTime;
      logger.info(`⚡ UI Performance: Preset "${presetName}" applied in ${applyTime.toFixed(2)}ms`);
      
      showCustomNotification(`Applied "${presetName}"`, `Calendar preset applied successfully (${applyTime.toFixed(0)}ms)`, 'success');
      logger.info(`🎯 UI Event: Success notification shown for preset "${presetName}"`);
    } catch (error: any) {
      logger.error(`🎯 UI Event: Failed to apply preset "${presetName}":`, error);
      showCustomNotification('Preset Failed', `Failed to apply preset "${presetName}". Please try again.`, 'error');
      // Reset selection on error
      setSelectedPreset(undefined);
      logger.info(`🎯 UI Event: Selection reset due to error for preset "${presetName}"`);
    } finally {
      markOperationEnd();
      logger.debug(`🎯 UI Event: Preset selection completed - "${presetName}"`);
    }
  }, [applyPresetUseCase, canPerformOperation, markOperationStart, markOperationEnd]);

  /**
   * Handle updating the selected preset with current state
   */
  const handleUpdatePreset = useCallback(async () => {
    logger.info(`💾 UI Event: handleUpdatePreset called for preset: "${selectedPreset}"`);
    
    if (!selectedPreset) {
      logger.warn('💾 UI Event: Update called but no preset selected');
      showCustomNotification('No Preset Selected', 'Please select a preset to update.', 'error');
      return;
    }

    logger.info(`💾 UI Event: Showing confirmation dialog for updating preset: "${selectedPreset}"`);
    
    // Use browser native confirm dialog (more reliable in Chrome extension context)
    const confirmed = confirm(`Do you want to update preset "${selectedPreset}" with the current calendar state?`);
    
    if (confirmed) {
      logger.info(`💾 UI Event: User confirmed update of preset: "${selectedPreset}"`);
      await performUpdatePreset(selectedPreset);
    } else {
      logger.info(`💾 UI Event: User cancelled update of preset: "${selectedPreset}"`);
    }
  }, [selectedPreset]);

  /**
   * Perform the actual preset update
   */
  const performUpdatePreset = useCallback(async (presetName: string) => {
    logger.info(`💾 UI Event: Starting actual update process for preset: "${presetName}"`);
    
    try {
      markOperationStart();
      logger.debug('💾 UI Event: Set isOperating to true');
      
      logger.info(`💾 UI Event: Calling savePresetUseCase.execute with overwrite=true for: "${presetName}"`);
      await savePresetUseCase.execute({ name: presetName, overwrite: true });
      logger.info(`💾 UI Event: savePresetUseCase completed successfully`);
      
      logger.info('💾 UI Event: Refreshing presets list...');
      await onPresetsChange();
      logger.info('💾 UI Event: Presets refreshed');
      
      showCustomNotification('Preset Updated', `Preset "${presetName}" has been updated successfully.`, 'success');
      logger.info(`💾 UI Event: Success notification shown for updated preset: "${presetName}"`);
    } catch (error: any) {
      logger.error(`💾 UI Event: Failed to update preset "${presetName}":`, error);
      showCustomNotification('Update Failed', error.message || 'Failed to update preset. Please try again.', 'error');
      logger.info(`💾 UI Event: Error notification shown for failed update`);
    } finally {
      markOperationEnd();
      logger.debug('💾 UI Event: Update process completed');
    }
  }, [savePresetUseCase, onPresetsChange, markOperationStart, markOperationEnd]);

  /**
   * Handle deleting the selected preset
   */
  const handleDeletePreset = useCallback(async () => {
    logger.info(`🗑️ UI Event: handleDeletePreset called for preset: "${selectedPreset}"`);
    
    if (!selectedPreset) {
      logger.warn('🗑️ UI Event: Delete called but no preset selected');
      showCustomNotification('No Preset Selected', 'Please select a preset to delete.', 'error');
      return;
    }

    logger.info(`🗑️ UI Event: Showing confirmation dialog for preset: "${selectedPreset}"`);
    
    // Use browser native confirm dialog (more reliable in Chrome extension context)
    const confirmed = confirm(`Are you sure you want to delete preset "${selectedPreset}"?\n\nThis action cannot be undone.`);
    
    if (confirmed) {
      logger.info(`🗑️ UI Event: User confirmed deletion of preset: "${selectedPreset}"`);
      await performDeletePreset(selectedPreset);
    } else {
      logger.info(`🗑️ UI Event: User cancelled deletion of preset: "${selectedPreset}"`);
    }
  }, [selectedPreset]);

  /**
   * Perform the actual preset deletion
   */
  const performDeletePreset = useCallback(async (presetName: string) => {
    logger.info(`🗑️ UI Event: Starting actual deletion process for preset: "${presetName}"`);
    
    try {
      markOperationStart();
      logger.debug('🗑️ UI Event: Set isOperating to true');
      
      logger.info(`🗑️ UI Event: Calling deletePresetUseCase.execute("${presetName}")`);
      await deletePresetUseCase.execute(presetName);
      logger.info(`🗑️ UI Event: deletePresetUseCase completed successfully`);
      
      logger.info('🗑️ UI Event: Refreshing presets list...');
      await onPresetsChange();
      logger.info('🗑️ UI Event: Presets refreshed');
      
      setSelectedPreset(undefined);
      logger.info('🗑️ UI Event: Cleared selected preset');
      
      showCustomNotification('Preset Deleted', `Preset "${presetName}" has been deleted successfully.`, 'success');
      logger.info(`🗑️ UI Event: Success notification shown for deleted preset: "${presetName}"`);
    } catch (error: any) {
      logger.error(`🗑️ UI Event: Failed to delete preset "${presetName}":`, error);
      showCustomNotification('Delete Failed', error.message || 'Failed to delete preset. Please try again.', 'error');
      logger.info(`🗑️ UI Event: Error notification shown for failed deletion`);
    } finally {
      markOperationEnd();
      logger.debug('🗑️ UI Event: Deletion process completed');
    }
  }, [deletePresetUseCase, onPresetsChange, markOperationStart, markOperationEnd]);

  /**
   * Handle saving a new preset or updating an existing one
   */
  const handleSavePreset = useCallback(async (name: string, overwrite: boolean) => {
    if (!name.trim()) {
      showCustomNotification('Invalid Name', 'Please enter a preset name.', 'error');
      return;
    }

    try {
      markOperationStart();
      const existingPreset = presets.find(p => p.name === name.trim());

      if (existingPreset && !overwrite) {
        // Show confirmation dialog for overwrite using browser native confirm
        const confirmed = confirm(`A preset named "${name}" already exists.\n\nDo you want to update it with the current calendar state?`);
        
        if (!confirmed) {
          markOperationEnd();
          return;
        }
      }

      await savePresetUseCase.execute({ name: name.trim(), overwrite: true });
      await onPresetsChange();
      setSelectedPreset(name.trim());
      
      const action = existingPreset ? 'Updated' : 'Saved';
      showCustomNotification(`Preset ${action}`, `Preset "${name}" has been ${action.toLowerCase()} successfully.`, 'success');
    } catch (error: any) {
      logger.error('Failed to save preset:', error);
      showCustomNotification('Save Failed', error.message || 'Failed to save preset. Please try again.', 'error');
    } finally {
      markOperationEnd();
    }
  }, [presets, savePresetUseCase, onPresetsChange, markOperationStart, markOperationEnd]);

  return {
    selectedPreset,
    setSelectedPreset,
    handlePresetSelect,
    handleUpdatePreset,
    handleDeletePreset,
    handleSavePreset
  };
};