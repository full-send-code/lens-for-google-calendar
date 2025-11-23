/**
 * Save Preset Modal Component
 * Modal dialog for saving current calendar state as a new preset
 */

import React, { useState, useRef } from 'react';
import { Modal, Input, Form, Typography, Alert, Space } from 'antd';
import type { InputRef } from 'antd';
import { SaveOutlined, CalendarOutlined } from '@ant-design/icons';
import type { SavePresetUseCase } from '../../usecases';
import type { Calendar } from '../../core';
import logger from '../../infrastructure/logger';
import { showCustomNotification } from '../utils/customNotification';

const { Text } = Typography;

/**
 * Props for the SavePresetModal component
 */
export interface SavePresetModalProps {
  visible: boolean;
  onClose: () => void;
  savePresetUseCase: SavePresetUseCase;
  visibleCalendars: Calendar[];
  onSuccess?: () => void;
}

/**
 * Save Preset Modal Component
 *
 * Provides a modal interface for saving current calendar state as a preset:
 * - Preset name input field with validation
 * - Shows current visible calendars count
 * - Overwrite confirmation for existing presets
 * - Error handling and success feedback
 */
export const SavePresetModal: React.FC<SavePresetModalProps> = ({
  visible,
  onClose,
  savePresetUseCase,
  visibleCalendars,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<InputRef>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    logger.info('💾 UI Modal: Save preset form submission initiated');

    try {
      logger.debug('💾 UI Modal: Validating form fields...');
      const values = await form.validateFields();
      const { presetName } = values;

      logger.info(`💾 UI Modal: Form validation passed - name: "${presetName}"`);

      setLoading(true);
      logger.debug('💾 UI Modal: State updated - loading: true');

      logger.debug(`💾 UI Modal: Calling savePresetUseCase.execute("${presetName.trim()}", overwrite: true)`);
      await savePresetUseCase.execute({
        name: presetName.trim(),
        overwrite: true
      });
      logger.info(`💾 UI Modal: savePresetUseCase completed successfully for: "${presetName}"`);

      showCustomNotification('Preset Saved', `Preset "${presetName}" has been saved successfully.`, 'success');
      logger.info(`💾 UI Modal: Success notification shown for: "${presetName}"`);

      form.resetFields();
      onSuccess?.();
      onClose();
      logger.debug('💾 UI Modal: Modal closed and form reset after successful save');
    } catch (error: any) {
      logger.error('💾 UI Modal: Failed to save preset:', error);

      let errorMessage = 'Failed to save preset. Please try again.';

      showCustomNotification('Save Failed', errorMessage, 'error');

      logger.info(`💾 UI Modal: Error notification shown with message: ${errorMessage}`);
    } finally {
      setLoading(false);
      logger.debug('💾 UI Modal: Save preset operation completed - loading: false');
    }
  };

  /**
   * Handle modal open/close
   */
  const handleAfterOpenChange = (open: boolean) => {
    if (open && inputRef.current) {
      // Focus the input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  /**
   * Handle modal cancel
   */
  const handleCancel = () => {
    logger.info('💾 UI Modal: Save preset modal cancelled by user');
    form.resetFields();
    onClose();
    logger.debug('💾 UI Modal: Form reset and modal closed after cancel');
  };

  /**
   * Validate preset name
   */
  const validatePresetName = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('Please enter a preset name'));
    }

    if (value.trim().length === 0) {
      return Promise.reject(new Error('Preset name cannot be empty'));
    }

    if (value.length > 50) {
      return Promise.reject(new Error('Preset name must be 50 characters or less'));
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(value)) {
      return Promise.reject(new Error('Preset name contains invalid characters'));
    }

    return Promise.resolve();
  };

  return (
    <Modal
      title={
        <Space>
          <SaveOutlined />
          Save Current State as Preset
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="Save Preset"
      cancelText="Cancel"
      confirmLoading={loading}
      width={500}
      destroyOnClose
      zIndex={2000}
      afterOpenChange={handleAfterOpenChange}
    >
      <div style={{ marginBottom: '16px' }}>
        <Alert
          message="Save your current calendar visibility as a reusable preset"
          description={
            <div>
              <div>This will save the {visibleCalendars.length} currently visible calendar{visibleCalendars.length !== 1 ? 's' : ''} as a preset you can quickly apply later.</div>
              {visibleCalendars.length === 0 && (
                <div style={{ marginTop: '8px', color: '#ff4d4f', fontWeight: 'bold' }}>
                  ⚠️ No calendars are currently visible. You need at least one visible calendar to create a preset.
                </div>
              )}
            </div>
          }
          type={visibleCalendars.length === 0 ? "warning" : "info"}
          showIcon
          style={{ marginBottom: '16px' }}
        />
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="presetName"
          label="Preset Name"
          rules={[
            { validator: validatePresetName }
          ]}
          extra="Choose a descriptive name for your preset (max 50 characters)"
        >
          <Input
            placeholder="e.g., Work Meetings, Personal, Family Events"
            onPressEnter={handleSubmit}
            disabled={visibleCalendars.length === 0}
            ref={inputRef}
          />
        </Form.Item>

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <CalendarOutlined style={{ color: '#52c41a' }} />
            <Text strong style={{ color: '#52c41a' }}>Current State Summary</Text>
          </div>
          <Text style={{ color: '#666', fontSize: '13px' }}>
            {visibleCalendars.length} calendar{visibleCalendars.length !== 1 ? 's' : ''} will be saved in this preset
          </Text>
        </div>
      </Form>
    </Modal>
  );
};