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
  Space
} from 'antd';
import { 
  CalendarOutlined,
  ClearOutlined, 
  PlusOutlined, 
  ImportOutlined, 
  ExportOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { MenuProps } from 'antd';
import { EnableCalendarModal } from './EnableCalendarModal.component';
import type { 
  ClearCalendarsUseCase,
  EnableCalendarUseCase,
  ApplyPresetUseCase,
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
  importPresetsUseCase: ImportPresetsUseCase;
  exportPresetsUseCase: ExportPresetsUseCase;
  
  // Data
  presets: CalendarPreset[];
  currentCalendars: Calendar[];
  loading: boolean;
  
  // Callbacks
  onPresetsChange: () => void;
}

/**
 * Lens Floating Action Button Component
 * 
 * Provides a floating action button with dropdown menu for calendar operations:
 * - Floating button positioned in bottom right
 * - Dropdown overlay with preset pills for quick access  
 * - Calendar management actions (clear, enable)
 * - Import/Export functionality
 * - Current calendar state indicator
 */
export const LensHeaderButton: React.FC<LensHeaderButtonProps> = ({
  clearCalendarsUseCase,
  enableCalendarUseCase,
  applyPresetUseCase,
  importPresetsUseCase,
  exportPresetsUseCase,
  presets,
  currentCalendars,
  loading,
  onPresetsChange
}) => {
  const [enableModalVisible, setEnableModalVisible] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isOperating, setIsOperating] = useState(false);

  // Calculate current state
  const visibleCalendars = currentCalendars.filter(cal => cal.isVisible);
  const stateIndicator = `${visibleCalendars.length}/${currentCalendars.length}`;

  /**
   * Handle preset application
   */
  const handlePresetClick = async (presetName: string) => {
    try {
      setIsOperating(true);
      await applyPresetUseCase.execute(presetName);
      setActivePreset(presetName);
      
      notification.success({
        message: `Applied "${presetName}"`,
        description: `Calendar preset applied successfully`,
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
    } finally {
      setIsOperating(false);
    }
  };

  /**
   * Handle clear all calendars operation
   */
  const handleClear = async () => {
    try {
      setIsOperating(true);
      setActivePreset(null);
      await clearCalendarsUseCase.execute();
      notification.success({
        message: 'All Calendars Cleared',
        description: 'All calendars have been hidden successfully.',
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
      onPresetsChange();
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
   * Get current state summary for display
   */
  const getCurrentStateSummary = () => {
    if (visibleCalendars.length === 0) {
      return 'No calendars visible';
    }
    
    if (visibleCalendars.length <= 2) {
      return visibleCalendars.map(cal => cal.name).join(', ');
    }
    
    return `${visibleCalendars.slice(0, 2).map(cal => cal.name).join(', ')} +${visibleCalendars.length - 2} more`;
  };

  /**
   * Create menu items for dropdown
   */
  const getMenuItems = (): MenuProps['items'] => {
    const items: MenuProps['items'] = [];

    // Add preset items (limit to 4 for clean design)
    presets.slice(0, 4).forEach(preset => {
      items.push({
        key: `preset-${preset.name}`,
        icon: <Badge count={preset.calendarEmails.length} size="small" style={{ backgroundColor: '#722ed1' }}>
          <CalendarOutlined />
        </Badge>,
        label: `Apply ${preset.name}`,
        onClick: () => handlePresetClick(preset.name),
        disabled: isOperating
      });
    });

    // Add separator if presets exist
    if (presets.length > 0) {
      items.push({ type: 'divider' });
    }

    // Add action items
    items.push(
      {
        key: 'clear',
        icon: <ClearOutlined />,
        label: 'Clear All Calendars',
        onClick: handleClear,
        disabled: isOperating
      },
      {
        key: 'enable',
        icon: <PlusOutlined />,
        label: 'Enable Calendar',
        onClick: () => setEnableModalVisible(true),
        disabled: isOperating
      },
      { type: 'divider' },
      {
        key: 'export',
        icon: <ExportOutlined />,
        label: 'Export Presets',
        onClick: handleExport,
        disabled: isOperating || presets.length === 0
      },
      {
        key: 'import',
        icon: <ImportOutlined />,
        label: 'Import Presets',
        onClick: () => {
          // Create a hidden file input and trigger it
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
        },
        disabled: isOperating
      }
    );

    return items;
  };

  return (
    <>
      {/* Floating Action Button with Dropdown Menu */}
      <Dropdown
        menu={{ items: getMenuItems() }}
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
            backgroundColor: '#595959', // Dark gray background to contrast with blue icon
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
    </>
  );
};

// Export the main component with the old name for backward compatibility
export { LensHeaderButton as CalendarToolbar };