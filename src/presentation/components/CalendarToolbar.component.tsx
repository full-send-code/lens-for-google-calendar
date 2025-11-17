/**
 * Lens Floating Action Button Component
 * Floating action button positioned in bottom right with overlay menu
 */

import React, { useState } from 'react';
import { 
  FloatButton, 
  Badge, 
  Dropdown,
  Menu,
  Space,
  Select,
  Input,
  Button,
  Divider,
  Modal
} from 'antd';
import { 
  CalendarOutlined,
  ClearOutlined, 
  PlusOutlined, 
  ImportOutlined, 
  ExportOutlined,
  SaveOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { MenuProps } from 'antd';
import { EnableCalendarModal } from './EnableCalendarModal.component';
import type { 
  ClearCalendarsUseCase,
  EnableCalendarUseCase,
  ApplyPresetUseCase,
  SavePresetUseCase,
  DeletePresetUseCase,
  ImportPresetsUseCase,
  ExportPresetsUseCase
} from '../../usecases';
import type { ImportResult } from '../../usecases/ImportPresets.usecase';
import type { CalendarPreset, Calendar } from '../../core';
import logger from '../../infrastructure/logger';
import { showCustomNotification } from '../utils/customNotification';

/**
 * Lens Extension Icon Component
 * Uses the actual extension icon from the icons folder with proper centering
 */
const LensIcon: React.FC<{ style?: React.CSSProperties; size?: number }> = ({ style, size = 20 }) => {
  const [iconSrc, setIconSrc] = React.useState<string>('');
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    // Try to load the extension icon
    const loadIcon = async () => {
      try {
        if (chrome?.runtime?.getURL) {
          const iconUrl = chrome.runtime.getURL('icons/icon19.png');
          
          // Test if the icon URL actually works by creating a test image
          const testImg = new Image();
          testImg.onload = () => {
            setIconSrc(iconUrl);
          };
          testImg.onerror = () => {
            logger.warn('Extension icon failed to load, using fallback');
            setHasError(true);
          };
          testImg.src = iconUrl;
        } else {
          // Development fallback
          setHasError(true);
        }
      } catch (error) {
        logger.warn('Error loading extension icon:', error);
        setHasError(true);
      }
    };
    
    loadIcon();
  }, []);

  // If we have an error or no src, use the Ant Design fallback
  if (hasError || !iconSrc) {
    return <CalendarOutlined style={{ fontSize: size, ...style }} />;
  }

  return (
    <img
      src={iconSrc}
      alt="Lens Calendar Manager"
      width={size}
      height={size}
      style={{
        display: 'block',
        margin: 'auto',
        objectFit: 'contain',
        ...style
      }}
      onError={() => {
        setHasError(true);
      }}
    />
  );
};

/**
 * Props for the LensHeaderButton component
 */
export interface LensHeaderButtonProps {
  // Use Cases
  clearCalendarsUseCase: ClearCalendarsUseCase;
  enableCalendarUseCase: EnableCalendarUseCase;
  applyPresetUseCase: ApplyPresetUseCase;
  savePresetUseCase: SavePresetUseCase;
  deletePresetUseCase: DeletePresetUseCase;
  importPresetsUseCase: ImportPresetsUseCase;
  exportPresetsUseCase: ExportPresetsUseCase;
  
  // Data
  presets: CalendarPreset[];
  currentCalendars: Calendar[];
  loading: boolean;
  
  // Callbacks
  onPresetsChange: () => void;
  onCalendarsChange: () => void;
}

/**
 * Lens Floating Action Button Component
 * 
 * Provides a floating action button with dropdown menu for calendar operations:
 * - Floating button positioned in bottom right
 * - Dropdown with preset selection and management
 * - Calendar management actions (clear, enable)
 * - Import/Export functionality
 * - Current calendar state indicator
 */
export const LensHeaderButton: React.FC<LensHeaderButtonProps> = ({
  clearCalendarsUseCase,
  enableCalendarUseCase,
  applyPresetUseCase,
  savePresetUseCase,
  deletePresetUseCase,
  importPresetsUseCase,
  exportPresetsUseCase,
  presets,
  currentCalendars,
  loading,
  onPresetsChange,
  onCalendarsChange
}) => {
  const [enableModalVisible, setEnableModalVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(undefined);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isOperating, setIsOperating] = useState(false);
  const [lastOperationTime, setLastOperationTime] = useState(0);
  
  // Debouncing to prevent rapid operations
  const OPERATION_DEBOUNCE_MS = 500;

  // Calculate current state
  const visibleCalendars = currentCalendars.filter(cal => cal.isVisible);
  const stateIndicator = `${visibleCalendars.length}/${currentCalendars.length}`;

  /**
   * Handle preset selection and automatic application (with debouncing)
   */
  const handlePresetSelect = async (presetName: string) => {
    logger.info(`🎯 UI Event: Preset selection initiated - "${presetName || 'undefined'}"`);
    
    if (!presetName) {
      logger.info('🎯 UI Event: Empty preset name - clearing selection');
      setSelectedPreset(undefined);
      return;
    }

    // Debounce rapid selections
    const now = Date.now();
    if (now - lastOperationTime < OPERATION_DEBOUNCE_MS) {
      logger.debug(`🚫 UI Event: Debouncing rapid preset selection for "${presetName}"`);
      return;
    }
    setLastOperationTime(now);
    logger.info(`🎯 UI Event: Processing preset selection - "${presetName}"`);

    try {
      setIsOperating(true);
      setSelectedPreset(presetName);
      logger.debug(`🎯 UI Event: State updated - selectedPreset: "${presetName}", isOperating: true`);
      
      logger.info(`🎯 UI Event: Starting preset application - "${presetName}"`);
      const startTime = performance.now();
      
      // Automatically apply the preset when selected
      logger.debug(`🎯 UI Event: Calling applyPresetUseCase.execute("${presetName}")`);
      await applyPresetUseCase.execute(presetName);
      
      const applyTime = performance.now() - startTime;
      logger.info(`⚡ UI Performance: Preset "${presetName}" applied in ${applyTime.toFixed(2)}ms`);
      
      // Refresh calendar state after applying preset (this may be cached)
      logger.debug('🎯 UI Event: Refreshing calendar state after preset application...');
      const refreshStartTime = performance.now();
      await onCalendarsChange();
      const refreshTime = performance.now() - refreshStartTime;
      logger.info(`⚡ UI Performance: Calendar refresh took ${refreshTime.toFixed(2)}ms`);
      
      showCustomNotification(`Applied "${presetName}"`, `Calendar preset applied successfully (${applyTime.toFixed(0)}ms)`, 'success');
      logger.info(`🎯 UI Event: Success notification shown for preset "${presetName}"`);
    } catch (error: any) {
      logger.error(`🎯 UI Event: Failed to apply preset "${presetName}":`, error);
      showCustomNotification('Preset Failed', `Failed to apply preset "${presetName}". Please try again.`, 'error');
      // Reset selection on error
      setSelectedPreset(undefined);
      logger.info(`🎯 UI Event: Selection reset due to error for preset "${presetName}"`);
    } finally {
      setIsOperating(false);
      logger.debug(`🎯 UI Event: Preset selection completed - "${presetName}", isOperating: false`);
    }
  };

  /**
   * Handle saving/updating current state as a preset
   */
  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      showCustomNotification('Invalid Name', 'Please enter a preset name.', 'error');
      return;
    }

    try {
      setIsOperating(true);
      const existingPreset = presets.find(p => p.name === newPresetName.trim());
      const overwrite = !!existingPreset;

      if (existingPreset) {
        // Show confirmation dialog for overwrite using browser native confirm
        const confirmed = confirm(`A preset named "${newPresetName}" already exists.\n\nDo you want to update it with the current calendar state?`);
        
        if (confirmed) {
          await savePresetUseCase.execute({ name: newPresetName.trim(), overwrite: true });
          await onPresetsChange();
          setSaveModalVisible(false);
          setNewPresetName('');
          setSelectedPreset(newPresetName.trim());
          
          showCustomNotification('Preset Updated', `Preset "${newPresetName}" has been updated successfully.`, 'success');
        } else {
          // User cancelled, don't close the modal so they can try a different name
          setIsOperating(false);
          return;
        }
      } else {
        await savePresetUseCase.execute({ name: newPresetName.trim(), overwrite: false });
        await onPresetsChange();
        setSaveModalVisible(false);
        setNewPresetName('');
        setSelectedPreset(newPresetName.trim());
        
        showCustomNotification('Preset Saved', `Preset "${newPresetName}" has been saved successfully.`, 'success');
      }
    } catch (error: any) {
      logger.error('Failed to save preset:', error);
      showCustomNotification('Save Failed', error.message || 'Failed to save preset. Please try again.', 'error');
    } finally {
      setIsOperating(false);
    }
  };

  /**
   * Handle updating the selected preset with current state
   */
  const handleUpdatePreset = async () => {
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
  };

  /**
   * Perform the actual preset update
   */
  const performUpdatePreset = async (presetName: string) => {
    logger.info(`💾 UI Event: Starting actual update process for preset: "${presetName}"`);
    
    try {
      setIsOperating(true);
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
      setIsOperating(false);
      logger.debug('💾 UI Event: Set isOperating to false - update process completed');
    }
  };

  /**
   * Handle deleting the selected preset
   */
  const handleDeletePreset = async () => {
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
  };

  /**
   * Perform the actual preset deletion
   */
  const performDeletePreset = async (presetName: string) => {
    logger.info(`🗑️ UI Event: Starting actual deletion process for preset: "${presetName}"`);
    
    try {
      setIsOperating(true);
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
      setIsOperating(false);
      logger.debug('🗑️ UI Event: Set isOperating to false - deletion process completed');
    }
  };

  /**
   * Handle clear all calendars operation (with debouncing and performance logging)
   */
  const handleClear = async () => {
    logger.info('🧹 UI Event: Clear all calendars button clicked');
    
    // Debounce rapid clear operations
    const now = Date.now();
    if (now - lastOperationTime < OPERATION_DEBOUNCE_MS) {
      logger.debug('🚫 UI Event: Debouncing rapid clear operation');
      return;
    }
    setLastOperationTime(now);
    logger.info('🧹 UI Event: Processing clear all calendars operation');

    try {
      setIsOperating(true);
      setSelectedPreset(undefined);
      logger.debug('🧹 UI Event: State updated - isOperating: true, selectedPreset: undefined');
      
      logger.info('🧹 UI Event: Starting clear calendars operation...');
      const startTime = performance.now();
      
      logger.debug('🧹 UI Event: Calling clearCalendarsUseCase.execute()');
      await clearCalendarsUseCase.execute();
      
      const clearTime = performance.now() - startTime;
      logger.info(`⚡ UI Performance: Calendars cleared in ${clearTime.toFixed(2)}ms`);
      
      // Refresh calendar state
      logger.debug('🧹 UI Event: Refreshing calendar state after clear...');
      const refreshStartTime = performance.now();
      await onCalendarsChange();
      const refreshTime = performance.now() - refreshStartTime;
      logger.info(`⚡ UI Performance: Calendar refresh took ${refreshTime.toFixed(2)}ms`);
      
      showCustomNotification('All Calendars Cleared', `All calendars have been hidden successfully (${clearTime.toFixed(0)}ms)`, 'success');
      logger.info('🧹 UI Event: Success notification shown for clear operation');
    } catch (error: any) {
      logger.error('🧹 UI Event: Failed to clear calendars:', error);
      showCustomNotification('Clear Failed', 'Failed to clear calendars. Please try again.', 'error');
      logger.info('🧹 UI Event: Error notification shown for clear operation');
    } finally {
      setIsOperating(false);
      logger.debug('🧹 UI Event: Clear all calendars operation completed - isOperating: false');
    }
  };

  /**
   * Handle preset export
   */
  const handleExport = async () => {
    logger.info('📤 UI Event: Export button clicked');
    
    try {
      setIsOperating(true);
      logger.debug('📤 UI Event: State updated - isOperating: true');
      
      logger.debug('📤 UI Event: Calling exportPresetsUseCase.execute()');
      const exportData = await exportPresetsUseCase.execute();
      logger.info(`📤 UI Event: Export data received, length: ${exportData.length} characters`);
      
      // Create and download file
      logger.debug('📤 UI Event: Creating download file...');
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `lens-calendar-presets-${new Date().toISOString().split('T')[0]}.json`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      logger.info(`📤 UI Event: Triggering download for file: ${filename}`);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      logger.debug('📤 UI Event: Download initiated and DOM cleaned up');

      showCustomNotification('Export Successful', 'Calendar presets have been exported successfully.', 'success');
      logger.info('📤 UI Event: Success notification shown for export');
    } catch (error: any) {
      logger.error('📤 UI Event: Failed to export presets:', error);
      showCustomNotification('Export Failed', 'Failed to export presets. Please try again.', 'error');
      logger.info('📤 UI Event: Error notification shown for export');
    } finally {
      setIsOperating(false);
      logger.debug('📤 UI Event: Export operation completed - isOperating: false');
    }
  };

  /**
   * Handle preset import with conflict resolution
   */
  const handleImport = async (file: UploadFile) => {
    try {
      setIsOperating(true);
      
      if (!file.originFileObj) {
        throw new Error('No file selected');
      }

      const text = await file.originFileObj.text();
      logger.info('📥 UI Event: Starting import operation...');
      const result: ImportResult = await importPresetsUseCase.execute(text);
      logger.info('📥 UI Event: Import operation completed', result);
      
      // Show success message with details
      const importedCount = result.imported?.length || 0;
      const overwrittenCount = result.overwritten?.length || 0;
      const deletedCount = result.deleted?.length || 0;
      const errorCount = result.errors?.length || 0;
      
      let description = '';
      const parts = [];
      
      if (importedCount > 0) parts.push(`${importedCount} new preset${importedCount === 1 ? '' : 's'} imported`);
      if (overwrittenCount > 0) parts.push(`${overwrittenCount} existing preset${overwrittenCount === 1 ? '' : 's'} updated`);
      if (deletedCount > 0) parts.push(`${deletedCount} preset${deletedCount === 1 ? '' : 's'} removed`);
      if (errorCount > 0) parts.push(`${errorCount} error${errorCount === 1 ? '' : 's'}`);
      
      if (parts.length > 0) {
        description = parts.join(', ') + '.';
      } else {
        description = 'No changes made.';
      }
      
      // Show appropriate notification based on results
      if (errorCount > 0 && (importedCount + overwrittenCount + deletedCount) === 0) {
        showCustomNotification('Import Failed', description, 'error');
      } else if (errorCount > 0) {
        showCustomNotification('Import Completed with Errors', description, 'warning');
      } else {
        showCustomNotification('Import Successful', description, 'success');
      }
      
      // Refresh presets list
      await onPresetsChange();
    } catch (error: any) {
      logger.error('📥 UI Event: Failed to import presets:', error);
      showCustomNotification('Import Failed', 'Failed to import presets. Please check the file format.', 'error');
    } finally {
      setIsOperating(false);
    }
    
    return false; // Prevent default upload behavior
  };



  /**
   * Create the dropdown overlay content with preset selection and management
   */
  const getDropdownOverlay = () => (
    <div style={{ 
      background: '#fff', 
      borderRadius: '8px', 
      boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
      padding: '12px',
      minWidth: '280px'
    }}>
      {/* Preset Selection Section */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500 }}>
          Select Preset {presets.length > 0 && `(${presets.length} available)`}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Select
            placeholder="Type to search presets..."
            style={{ flex: 1 }}
            value={selectedPreset}
            onChange={handlePresetSelect}
            disabled={isOperating || presets.length === 0}
            dropdownMatchSelectWidth={false}
            showSearch
            allowClear
            filterOption={(input, option) => {
              // Filter by preset name
              const presetName = option?.value as string || '';
              return presetName.toLowerCase().includes(input.toLowerCase());
            }}
            optionFilterProp="value"
            notFoundContent={presets.length === 0 ? "No presets available" : "No matching presets"}
          >
            {presets.map(preset => (
              <Select.Option key={preset.name} value={preset.name}>
                <Space>
                  <Badge count={preset.calendarEmails.length} size="small" style={{ backgroundColor: '#722ed1' }}>
                    <CalendarOutlined />
                  </Badge>
                  {preset.name}
                </Space>
              </Select.Option>
            ))}
          </Select>
          
          {/* Save/Update and Delete buttons to the right of dropdown */}
          <Button
            size="small"
            icon={<SaveOutlined />}
            disabled={!selectedPreset || isOperating || visibleCalendars.length === 0}
            onClick={(e) => {
              logger.info('💾 UI Event: Update preset button clicked', { selectedPreset, isOperating, visibleCalendars: visibleCalendars.length });
              if (!selectedPreset) {
                showCustomNotification('No Preset Selected', 'Please select a preset from the dropdown first.', 'warning');
                return;
              }
              if (visibleCalendars.length === 0) {
                showCustomNotification('No Calendars Visible', 'You need at least one visible calendar to update a preset.', 'warning');
                return;
              }
              handleUpdatePreset();
            }}
            title={!selectedPreset ? 'Select a preset first to update it' : 
                   visibleCalendars.length === 0 ? 'Need visible calendars to update preset' :
                   isOperating ? 'Operation in progress...' :
                   `Update "${selectedPreset}" with current calendar state`}
            style={{
              opacity: (!selectedPreset || isOperating || visibleCalendars.length === 0) ? 0.5 : 1,
              cursor: (!selectedPreset || isOperating || visibleCalendars.length === 0) ? 'not-allowed' : 'pointer'
            }}
          />
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            disabled={!selectedPreset || isOperating}
            onClick={(e) => {
              logger.info('🗑️ UI Event: Delete preset button clicked', { selectedPreset, isOperating });
              if (!selectedPreset) {
                showCustomNotification('No Preset Selected', 'Please select a preset from the dropdown first.', 'warning');
                return;
              }
              handleDeletePreset();
            }}
            title={!selectedPreset ? 'Select a preset first to delete it' :
                   isOperating ? 'Operation in progress...' :
                   `Delete "${selectedPreset}" permanently`}
            style={{
              opacity: (!selectedPreset || isOperating) ? 0.5 : 1,
              cursor: (!selectedPreset || isOperating) ? 'not-allowed' : 'pointer'
            }}
          />
        </div>
      </div>

      {/* Preset Action Buttons - Remove Apply button since selection auto-applies */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic', marginBottom: '4px' }}>
          💡 Selecting a preset automatically applies it
        </div>
        {selectedPreset && (
          <div style={{ fontSize: '10px', color: '#666', backgroundColor: '#f0f0f0', padding: '4px 6px', borderRadius: '3px' }}>
            ⚙️ Use <SaveOutlined style={{fontSize: '10px'}}/> to update "{selectedPreset}" with current state, or <DeleteOutlined style={{fontSize: '10px', color: '#ff4d4f'}}/> to delete it
          </div>
        )}
        {!selectedPreset && (
          <div style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>
            Select a preset above to enable update/delete buttons
          </div>
        )}
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* Calendar Actions */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500 }}>
          Calendar Actions
        </div>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={handleClear}
            disabled={isOperating}
            style={{ width: '100%' }}
          >
            Clear All Calendars
          </Button>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              logger.info('✅ UI Event: Enable Calendar button clicked - opening modal');
              setEnableModalVisible(true);
            }}
            disabled={isOperating}
            style={{ width: '100%' }}
          >
            Enable Calendar
          </Button>
          <Button
            size="small"
            icon={<SaveOutlined />}
            onClick={() => {
              logger.info('💾 UI Event: Save Current State button clicked - opening modal');
              setSaveModalVisible(true);
            }}
            disabled={isOperating || visibleCalendars.length === 0}
            style={{ width: '100%' }}
          >
            Save Current State
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* Import/Export */}
      <div>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500 }}>
          Import/Export
        </div>
        <Space style={{ width: '100%' }}>
          <Button
            size="small"
            icon={<ImportOutlined />}
            onClick={() => {
              logger.info('📥 UI Event: Import button clicked - creating file input');
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  logger.info(`📥 UI Event: File selected for import - ${file.name} (${file.size} bytes)`);
                  await handleImport({ originFileObj: file } as UploadFile);
                } else {
                  logger.info('📥 UI Event: No file selected in import dialog');
                }
              };
              logger.debug('📥 UI Event: Opening file selection dialog');
              input.click();
            }}
            disabled={isOperating}
            style={{ flex: 1 }}
          >
            Import
          </Button>
          <Button
            size="small"
            icon={<ExportOutlined />}
            onClick={handleExport}
            disabled={isOperating || presets.length === 0}
            style={{ flex: 1 }}
          >
            Export
          </Button>
        </Space>
      </div>

      {/* Current State Display */}
      {visibleCalendars.length > 0 && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ fontSize: '11px', color: '#999' }}>
            Current: {stateIndicator} calendars visible
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Floating Action Button with Custom Dropdown */}
      <Dropdown
        overlay={getDropdownOverlay()}
        trigger={['click']}
        placement="topRight"
        arrow={{ pointAtCenter: true }}
      >
        <FloatButton 
          icon={<LensIcon size={20} />}
          type="primary"
          style={{
            bottom: 32,
            right: 60,
            width: 40,
            height: 40,
            backgroundColor: '#595959',
            borderColor: '#595959',
          }}
          tooltip="Lens Calendar Manager"
        />
      </Dropdown>

      {/* Enable Calendar Modal */}
      <EnableCalendarModal
        visible={enableModalVisible}
        onClose={() => setEnableModalVisible(false)}
        enableCalendarUseCase={enableCalendarUseCase}
      />

      {/* Save Preset Modal */}
      <Modal
        title="Save Current State as Preset"
        open={saveModalVisible}
        onOk={handleSavePreset}
        onCancel={() => {
          setSaveModalVisible(false);
          setNewPresetName('');
        }}
        confirmLoading={isOperating}
        okText="Save"
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px', color: '#666' }}>
            Current State: {stateIndicator} calendars visible
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {visibleCalendars.length <= 3 
              ? visibleCalendars.map(cal => cal.name).join(', ')
              : `${visibleCalendars.slice(0, 3).map(cal => cal.name).join(', ')} +${visibleCalendars.length - 3} more`
            }
          </div>
        </div>
        <Input
          placeholder="Enter preset name..."
          value={newPresetName}
          onChange={(e) => setNewPresetName(e.target.value)}
          onPressEnter={handleSavePreset}
          maxLength={50}
        />
      </Modal>
    </>
  );
};

// Export the main component with the old name for backward compatibility
export { LensHeaderButton as CalendarToolbar };