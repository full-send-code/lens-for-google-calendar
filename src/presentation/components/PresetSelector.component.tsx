/**
 * Preset Selector Component
 * Dropdown component for selecting and applying calendar presets
 */

import React from 'react';
import { Select, Typography } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import type { CalendarPreset } from '../../core';

const { Text } = Typography;

/**
 * Props for the PresetSelector component
 */
export interface PresetSelectorProps {
  presets: CalendarPreset[];
  loading: boolean;
  onSelect: (presetName: string) => void;
}

/**
 * Preset Selector Component
 * 
 * Provides a dropdown interface for selecting calendar presets:
 * - Lists all available presets
 * - Shows preset metadata (creation date, last used)
 * - Handles preset selection and application
 */
export const PresetSelector: React.FC<PresetSelectorProps> = ({
  presets,
  loading,
  onSelect
}) => {
  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    }).format(date);
  };

  /**
   * Get preset option label with metadata
   */
  const getPresetLabel = (preset: CalendarPreset) => {
    const calendarCount = preset.calendarEmails.length;
    const lastUsed = preset.lastUsedAt ? ` • Last used ${formatDate(preset.lastUsedAt)}` : '';
    
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Text strong>{preset.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {calendarCount} calendar{calendarCount !== 1 ? 's' : ''}{lastUsed}
          </Text>
        </div>
      </div>
    );
  };

  /**
   * Handle preset selection
   */
  const handleSelect = (presetName: string) => {
    onSelect(presetName);
  };

  return (
    <Select<string>
      placeholder="Select Preset"
      style={{ minWidth: 160 }}
      loading={loading}
      onSelect={handleSelect}
      value={undefined} // Always show placeholder
      optionLabelProp="label"
      suffixIcon={<CalendarOutlined />}
      disabled={loading || presets.length === 0}
      notFoundContent={loading ? 'Loading...' : 'No presets available'}
    >
      {presets.map(preset => (
        <Select.Option 
          key={preset.name} 
          value={preset.name}
          label={preset.name}
        >
          {getPresetLabel(preset)}
        </Select.Option>
      ))}
    </Select>
  );
};