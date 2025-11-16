/**
 * Lens Floating Action Button Component
 * Floating action button positioned in bottom right with overlay menu
 */

import React, { useState } from 'react';
import { 
  FloatButton, 
  Badge, 
  notification,
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
import type { CalendarPreset, Calendar } from '../../core';

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
            console.warn('Extension icon failed to load, using fallback');
            setHasError(true);
          };
          testImg.src = iconUrl;
        } else {
          // Development fallback
          setHasError(true);
        }
      } catch (error) {
        console.warn('Error loading extension icon:', error);
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
    if (!presetName) {
      setSelectedPreset(undefined);
      return;
    }

    // Debounce rapid selections
    const now = Date.now();
    if (now - lastOperationTime < OPERATION_DEBOUNCE_MS) {
      console.log('🚫 Debouncing rapid preset selection');
      return;
    }
    setLastOperationTime(now);

    try {
      setIsOperating(true);
      setSelectedPreset(presetName);
      
      console.log(`🎯 Applying preset: ${presetName}`);
      const startTime = performance.now();
      
      // Automatically apply the preset when selected
      await applyPresetUseCase.execute(presetName);
      
      const applyTime = performance.now() - startTime;
      console.log(`⚡ Preset applied in ${applyTime.toFixed(2)}ms`);
      
      // Refresh calendar state after applying preset (this may be cached)
      const refreshStartTime = performance.now();
      await onCalendarsChange();
      const refreshTime = performance.now() - refreshStartTime;
      console.log(`🔄 Calendar refresh took ${refreshTime.toFixed(2)}ms`);
      
      notification.success({
        message: `Applied "${presetName}"`,
        description: `Calendar preset applied successfully (${applyTime.toFixed(0)}ms)`,
        placement: 'topRight',
        duration: 3
      });
    } catch (error: any) {
      console.error('Failed to apply preset:', error);
      notification.error({
        message: 'Preset Failed',
        description: `Failed to apply preset "${presetName}". Please try again.`,
        placement: 'topRight'
      });
      // Reset selection on error
      setSelectedPreset(undefined);
    } finally {
      setIsOperating(false);
    }
  };

  /**
   * Handle saving/updating current state as a preset
   */
  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      notification.error({
        message: 'Invalid Name',
        description: 'Please enter a preset name.',
        placement: 'topRight'
      });
      return;
    }

    try {
      setIsOperating(true);
      const existingPreset = presets.find(p => p.name === newPresetName.trim());
      const overwrite = !!existingPreset;

      if (existingPreset) {
        // Show confirmation dialog for overwrite
        Modal.confirm({
          title: 'Preset Already Exists',
          content: `A preset named "${newPresetName}" already exists. Do you want to update it with the current calendar state?`,
          okText: 'Update',
          cancelText: 'Cancel',
          onOk: async () => {
            await savePresetUseCase.execute({ name: newPresetName.trim(), overwrite: true });
            await onPresetsChange();
            setSaveModalVisible(false);
            setNewPresetName('');
            setSelectedPreset(newPresetName.trim());
            
            notification.success({
              message: 'Preset Updated',
              description: `Preset "${newPresetName}" has been updated successfully.`,
              placement: 'topRight'
            });
          }
        });
      } else {
        await savePresetUseCase.execute({ name: newPresetName.trim(), overwrite: false });
        await onPresetsChange();
        setSaveModalVisible(false);
        setNewPresetName('');
        setSelectedPreset(newPresetName.trim());
        
        notification.success({
          message: 'Preset Saved',
          description: `Preset "${newPresetName}" has been saved successfully.`,
          placement: 'topRight'
        });
      }
    } catch (error: any) {
      console.error('Failed to save preset:', error);
      notification.error({
        message: 'Save Failed',
        description: error.message || 'Failed to save preset. Please try again.',
        placement: 'topRight'
      });
    } finally {
      setIsOperating(false);
    }
  };

  /**
   * Handle updating the selected preset with current state
   */
  const handleUpdatePreset = async () => {
    if (!selectedPreset) {
      notification.error({
        message: 'No Preset Selected',
        description: 'Please select a preset to update.',
        placement: 'topRight'
      });
      return;
    }

    Modal.confirm({
      title: 'Update Preset',
      content: `Do you want to update preset "${selectedPreset}" with the current calendar state?`,
      okText: 'Update',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setIsOperating(true);
          await savePresetUseCase.execute({ name: selectedPreset, overwrite: true });
          await onPresetsChange();
          
          notification.success({
            message: 'Preset Updated',
            description: `Preset "${selectedPreset}" has been updated successfully.`,
            placement: 'topRight'
          });
        } catch (error: any) {
          console.error('Failed to update preset:', error);
          notification.error({
            message: 'Update Failed',
            description: error.message || 'Failed to update preset. Please try again.',
            placement: 'topRight'
          });
        } finally {
          setIsOperating(false);
        }
      }
    });
  };

  /**
   * Handle deleting the selected preset
   */
  const handleDeletePreset = async () => {
    if (!selectedPreset) {
      notification.error({
        message: 'No Preset Selected',
        description: 'Please select a preset to delete.',
        placement: 'topRight'
      });
      return;
    }

    Modal.confirm({
      title: 'Delete Preset',
      content: `Are you sure you want to delete preset "${selectedPreset}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setIsOperating(true);
          await deletePresetUseCase.execute(selectedPreset);
          await onPresetsChange();
          setSelectedPreset(undefined);
          
          notification.success({
            message: 'Preset Deleted',
            description: `Preset "${selectedPreset}" has been deleted successfully.`,
            placement: 'topRight'
          });
        } catch (error: any) {
          console.error('Failed to delete preset:', error);
          notification.error({
            message: 'Delete Failed',
            description: error.message || 'Failed to delete preset. Please try again.',
            placement: 'topRight'
          });
        } finally {
          setIsOperating(false);
        }
      }
    });
  };

  /**
   * Handle clear all calendars operation (with debouncing and performance logging)
   */
  const handleClear = async () => {
    // Debounce rapid clear operations
    const now = Date.now();
    if (now - lastOperationTime < OPERATION_DEBOUNCE_MS) {
      console.log('🚫 Debouncing rapid clear operation');
      return;
    }
    setLastOperationTime(now);

    try {
      setIsOperating(true);
      setSelectedPreset(undefined);
      
      console.log('🧹 Clearing all calendars...');
      const startTime = performance.now();
      
      await clearCalendarsUseCase.execute();
      
      const clearTime = performance.now() - startTime;
      console.log(`⚡ Calendars cleared in ${clearTime.toFixed(2)}ms`);
      
      // Refresh calendar state
      const refreshStartTime = performance.now();
      await onCalendarsChange();
      const refreshTime = performance.now() - refreshStartTime;
      console.log(`🔄 Calendar refresh took ${refreshTime.toFixed(2)}ms`);
      
      notification.success({
        message: 'All Calendars Cleared',
        description: `All calendars have been hidden successfully (${clearTime.toFixed(0)}ms)`,
        placement: 'topRight'
      });
    } catch (error: any) {
      console.error('Failed to clear calendars:', error);
      notification.error({
        message: 'Clear Failed',
        description: 'Failed to clear calendars. Please try again.',
        placement: 'topRight'
      });
    } finally {
      setIsOperating(false);
    }
  };

  /**
   * Handle preset export
   */
  const handleExport = async () => {
    try {
      setIsOperating(true);
      const exportData = await exportPresetsUseCase.execute();
      
      // Create and download file
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lens-calendar-presets-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notification.success({
        message: 'Export Successful',
        description: 'Calendar presets have been exported successfully.',
        placement: 'topRight'
      });
    } catch (error: any) {
      console.error('Failed to export presets:', error);
      notification.error({
        message: 'Export Failed',
        description: 'Failed to export presets. Please try again.',
        placement: 'topRight'
      });
    } finally {
      setIsOperating(false);
    }
  };

  /**
   * Handle preset import
   */
  const handleImport = async (file: UploadFile) => {
    try {
      setIsOperating(true);
      
      if (!file.originFileObj) {
        throw new Error('No file selected');
      }

      const text = await file.originFileObj.text();
      const importedPresets = await importPresetsUseCase.execute(text);
      
      notification.success({
        message: 'Import Successful',
        description: `Successfully imported ${importedPresets.length} calendar presets.`,
        placement: 'topRight'
      });
      
      // Refresh presets list
      await onPresetsChange();
    } catch (error: any) {
      console.error('Failed to import presets:', error);
      notification.error({
        message: 'Import Failed',
        description: 'Failed to import presets. Please check the file format.',
        placement: 'topRight'
      });
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
            onClick={handleUpdatePreset}
            title="Update preset with current calendar state"
          />
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            disabled={!selectedPreset || isOperating}
            onClick={handleDeletePreset}
            title="Delete selected preset"
          />
        </div>
      </div>

      {/* Preset Action Buttons - Remove Apply button since selection auto-applies */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
          💡 Selecting a preset automatically applies it
        </div>
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
            onClick={() => setEnableModalVisible(true)}
            disabled={isOperating}
            style={{ width: '100%' }}
          >
            Enable Calendar
          </Button>
          <Button
            size="small"
            icon={<SaveOutlined />}
            onClick={() => setSaveModalVisible(true)}
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
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  await handleImport({ originFileObj: file } as UploadFile);
                }
              };
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