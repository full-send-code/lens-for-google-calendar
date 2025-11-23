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
import { SavePresetModal } from './SavePresetModal.component';
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
   * Handle dropdown open/close
   */
  const handleDropdownOpenChange = (open: boolean) => {
    if (open) {
      // Refresh calendar data when dropdown opens to ensure current state
      onCalendarsChange();
    }
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
        onOpenChange={handleDropdownOpenChange}
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
        onSuccess={onCalendarsChange}
      />

      {/* Save Preset Modal */}
      <SavePresetModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        savePresetUseCase={savePresetUseCase}
        visibleCalendars={visibleCalendars}
        onSuccess={onPresetsChange}
      />
    </>
  );
};

// Export the main component with the old name for backward compatibility
export { LensHeaderButton as CalendarToolbar };