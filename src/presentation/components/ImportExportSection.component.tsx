/**
 * Import/Export Section Component
 * Handles import/export buttons and hotkeys info icon
 */

import React from 'react';
import { Space, Button } from 'antd';
import { ImportOutlined, ExportOutlined, InfoCircleOutlined } from '@ant-design/icons';

export interface ImportExportSectionProps {
  presetsCount: number;
  isOperating: boolean;
  onImport: () => void;
  onExport: () => void;
}

/**
 * Import/Export Section Component
 * 
 * Provides import/export functionality:
 * - Import presets from JSON file
 * - Export presets to JSON file
 * - Keyboard shortcuts info icon with tooltip
 * - Proper disabled states based on presets count and operation state
 */
export const ImportExportSection: React.FC<ImportExportSectionProps> = ({
  presetsCount,
  isOperating,
  onImport,
  onExport
}) => {
  return (
    <div>
      <div style={{ 
        fontSize: '12px', 
        color: '#666', 
        marginBottom: '6px', 
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        Import/Export
        <InfoCircleOutlined 
          style={{ 
            fontSize: '14px', 
            color: '#999', 
            cursor: 'help'
          }}
          title={
            "Keyboard Shortcuts:\n\n" +
            "⌨️  Ctrl+Alt - Open this menu\n" +
            "📋 Ctrl+Alt+P - Focus preset dropdown\n" +
            "✅ Ctrl+Alt+E - Enable calendar\n" +
            "💾 Ctrl+Alt+S - Save preset\n" +
            "🚫 Ctrl+Alt+C - Clear all calendars"
          }
        />
      </div>
      <Space style={{ width: '100%' }}>
        <Button
          size="small"
          icon={<ImportOutlined />}
          onClick={onImport}
          disabled={isOperating}
          style={{ flex: 1 }}
        >
          Import
        </Button>
        <Button
          size="small"
          icon={<ExportOutlined />}
          onClick={onExport}
          disabled={isOperating || presetsCount === 0}
          style={{ flex: 1 }}
        >
          Export
        </Button>
      </Space>
    </div>
  );
};