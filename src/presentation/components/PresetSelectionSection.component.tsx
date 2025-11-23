/**
 * Preset Selection Section Component
 * Handles preset dropdown and management buttons (update/delete)
 */

import React from 'react';
import { Space, Select, Button, Badge } from 'antd';
import { CalendarOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import type { CalendarPreset, Calendar } from '../../core';
import { showCustomNotification } from '../utils/customNotification';
import logger from '../../infrastructure/logger';

export interface PresetSelectionSectionProps {
  presets: CalendarPreset[];
  selectedPreset: string | undefined;
  visibleCalendars: Calendar[];
  isOperating: boolean;
  onPresetSelect: (presetName: string) => void;
  onUpdatePreset: () => void;
  onDeletePreset: () => void;
}

/**
 * Preset Selection Section Component
 * 
 * Provides preset selection and management functionality:
 * - Searchable preset dropdown with calendar count badges
 * - Update preset button with validation
 * - Delete preset button with confirmation
 * - Proper disabled states and tooltips
 * - Auto-apply behavior on selection
 */
export const PresetSelectionSection: React.FC<PresetSelectionSectionProps> = ({
  presets,
  selectedPreset,
  visibleCalendars,
  isOperating,
  onPresetSelect,
  onUpdatePreset,
  onDeletePreset
}) => {
  
  const handleUpdateClick = () => {
    logger.info('💾 UI Event: Update preset button clicked', { selectedPreset, isOperating, visibleCalendars: visibleCalendars.length });
    if (!selectedPreset) {
      showCustomNotification('No Preset Selected', 'Please select a preset from the dropdown first.', 'warning');
      return;
    }
    if (visibleCalendars.length === 0) {
      showCustomNotification('No Calendars Visible', 'You need at least one visible calendar to update a preset.', 'warning');
      return;
    }
    onUpdatePreset();
  };

  const handleDeleteClick = () => {
    logger.info('🗑️ UI Event: Delete preset button clicked', { selectedPreset, isOperating });
    if (!selectedPreset) {
      showCustomNotification('No Preset Selected', 'Please select a preset from the dropdown first.', 'warning');
      return;
    }
    onDeletePreset();
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500 }}>
        Select Preset {presets.length > 0 && `(${presets.length} available)`}
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <Select
          placeholder="Type to search presets..."
          style={{ flex: 1 }}
          value={selectedPreset}
          onChange={onPresetSelect}
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
          onClick={handleUpdateClick}
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
          onClick={handleDeleteClick}
          title={!selectedPreset ? 'Select a preset first to delete it' :
                 isOperating ? 'Operation in progress...' :
                 `Delete "${selectedPreset}" permanently`}
          style={{
            opacity: (!selectedPreset || isOperating) ? 0.5 : 1,
            cursor: (!selectedPreset || isOperating) ? 'not-allowed' : 'pointer'
          }}
        />
      </div>

      {/* Preset Action Information */}
      <div style={{ marginTop: '8px' }}>
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
    </div>
  );
};