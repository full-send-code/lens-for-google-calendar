/**
 * Import/Export Operations Hook
 * Handles file import/export operations with conflict resolution
 */

import { useCallback } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ImportPresetsUseCase, ExportPresetsUseCase } from '../../usecases';
import type { ImportResult } from '../../usecases/ImportPresets.usecase';
import logger from '../../infrastructure/logger';
import { showCustomNotification } from '../utils/customNotification';
import type { UseOperationStateReturn } from './useOperationState.hook';

export interface UseImportExportProps {
  importPresetsUseCase: ImportPresetsUseCase;
  exportPresetsUseCase: ExportPresetsUseCase;
  operationState: UseOperationStateReturn;
  onPresetsChange: () => void;
  presetsCount: number;
}

export interface UseImportExportReturn {
  handleExport: () => Promise<void>;
  handleImport: (file: UploadFile) => Promise<false>;
  handleImportClick: () => void;
}

/**
 * Custom hook for managing import/export operations
 * 
 * Provides centralized file operations including:
 * - Export presets to JSON file
 * - Import presets from JSON file with conflict resolution
 * - File selection handling
 * - Proper error handling and notifications
 * - Import result processing and user feedback
 */
export const useImportExport = ({
  importPresetsUseCase,
  exportPresetsUseCase,
  operationState,
  onPresetsChange,
  presetsCount
}: UseImportExportProps): UseImportExportReturn => {
  
  const { isOperating, markOperationStart, markOperationEnd } = operationState;

  /**
   * Handle preset export
   */
  const handleExport = useCallback(async () => {
    logger.info('📤 UI Event: Export button clicked');
    
    try {
      markOperationStart();
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
      markOperationEnd();
      logger.debug('📤 UI Event: Export operation completed');
    }
  }, [exportPresetsUseCase, markOperationStart, markOperationEnd]);

  /**
   * Handle preset import with conflict resolution
   */
  const handleImport = useCallback(async (file: UploadFile): Promise<false> => {
    try {
      markOperationStart();
      
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
      markOperationEnd();
    }
    
    return false; // Prevent default upload behavior
  }, [importPresetsUseCase, onPresetsChange, markOperationStart, markOperationEnd]);

  /**
   * Handle import button click - creates file input and handles selection
   */
  const handleImportClick = useCallback(() => {
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
  }, [handleImport]);

  return {
    handleExport,
    handleImport,
    handleImportClick
  };
};