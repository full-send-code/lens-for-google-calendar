/**
 * Lens Floating Action Button Component
 * Floating action button positioned in bottom right with overlay menu
 * 
 * Refactored to use decomposed components and hooks for better maintainability
 */

import React, { useState } from 'react';
import { FloatButton, Dropdown, Modal, Input, Divider } from 'antd';
import { EnableCalendarModal } from './EnableCalendarModal.component';
import { LensIcon } from './LensIcon.component';
import { PresetSelectionSection } from './PresetSelectionSection.component';
import { CalendarActionsSection } from './CalendarActionsSection.component';
import { ImportExportSection } from './ImportExportSection.component';
import { CurrentStateDisplay } from './CurrentStateDisplay.component';
import {
  useOperationState,
  usePresetOperations,
  useCalendarOperations,
  useImportExport
} from '../hooks';
import { dropdownContainerStyle } from '../utils';
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
import { showCustomNotification } from '../utils/customNotification';

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
 * Lens Floating Action Button Component (Refactored)
 * 
 * Provides a floating action button with dropdown menu for calendar operations:
 * - Floating button positioned in bottom right
 * - Dropdown with preset selection and management
 * - Calendar management actions (clear, enable)
 * - Import/Export functionality
 * - Current calendar state indicator
 * 
 * Now uses decomposed hooks and components for better maintainability
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
  // Modal visibility state
  const [enableModalVisible, setEnableModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  
  // Calculate current state
  const visibleCalendars = currentCalendars.filter(cal => cal.isVisible);
  const stateIndicator = `${visibleCalendars.length}/${currentCalendars.length}`;

  // Initialize hooks
  const operationState = useOperationState();
  
  const presetOperations = usePresetOperations({
    applyPresetUseCase,
    savePresetUseCase,
    deletePresetUseCase,
    presets,
    operationState,
    onPresetsChange
  });
  
  const calendarOperations = useCalendarOperations({
    clearCalendarsUseCase,
    operationState,
    onSelectedPresetChange: presetOperations.setSelectedPreset
  });
  
  const importExportOperations = useImportExport({
    importPresetsUseCase,
    exportPresetsUseCase,
    operationState,
    onPresetsChange,
    presetsCount: presets.length
  });

  /**
   * Handle saving preset from modal
   */
  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      showCustomNotification('Invalid Name', 'Please enter a preset name.', 'error');
      return;
    }

    await presetOperations.handleSavePreset(newPresetName.trim(), true);
    setSaveModalVisible(false);
    setNewPresetName('');
  };

  /**
   * Create the dropdown overlay content with decomposed sections
   */
  const getDropdownOverlay = () => (
    <div style={dropdownContainerStyle}>
      {/* Preset Selection Section */}
      <PresetSelectionSection
        presets={presets}
        selectedPreset={presetOperations.selectedPreset}
        visibleCalendars={visibleCalendars}
        isOperating={operationState.isOperating}
        onPresetSelect={presetOperations.handlePresetSelect}
        onUpdatePreset={presetOperations.handleUpdatePreset}
        onDeletePreset={presetOperations.handleDeletePreset}
      />

      <Divider style={{ margin: '8px 0' }} />

      {/* Calendar Actions Section */}
      <CalendarActionsSection
        visibleCalendars={visibleCalendars}
        isOperating={operationState.isOperating}
        onClear={calendarOperations.handleClear}
        onEnableCalendar={() => setEnableModalVisible(true)}
        onSaveCurrentState={() => setSaveModalVisible(true)}
      />

      <Divider style={{ margin: '8px 0' }} />

      {/* Import/Export Section */}
      <ImportExportSection
        presetsCount={presets.length}
        isOperating={operationState.isOperating}
        onImport={importExportOperations.handleImportClick}
        onExport={importExportOperations.handleExport}
      />

      {/* Current State Display */}
      <CurrentStateDisplay
        visibleCalendars={visibleCalendars}
        totalCalendars={currentCalendars.length}
      />
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
          data-testid="lens-floating-button"
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
        confirmLoading={operationState.isOperating}
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