/**
 * Enable Calendar Modal Component
 * Modal dialog for enabling specific calendars by email input
 */

import React, { useState } from 'react';
import { Modal, Input, Form, Typography, Alert } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import type { EnableCalendarUseCase } from '../../usecases';
import logger from '../../infrastructure/logger';
import { showCustomNotification } from '../utils/customNotification';

const { Text } = Typography;

/**
 * Props for the EnableCalendarModal component
 */
export interface EnableCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  enableCalendarUseCase: EnableCalendarUseCase;
}

/**
 * Enable Calendar Modal Component
 * 
 * Provides a modal interface for enabling specific calendars:
 * - Email input field with validation
 * - Clear instructions for users
 * - Error handling and success feedback
 */
export const EnableCalendarModal: React.FC<EnableCalendarModalProps> = ({
  visible,
  onClose,
  enableCalendarUseCase
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    logger.info('✅ UI Modal: Enable calendar form submission initiated');
    
    try {
      logger.debug('✅ UI Modal: Validating form fields...');
      const values = await form.validateFields();
      const { calendarEmail } = values;
      
      logger.info(`✅ UI Modal: Form validation passed - email: "${calendarEmail}"`);
      
      setLoading(true);
      logger.debug('✅ UI Modal: State updated - loading: true');
      
      logger.debug(`✅ UI Modal: Calling enableCalendarUseCase.execute("${calendarEmail.trim()}")`);
      await enableCalendarUseCase.execute(calendarEmail.trim());
      logger.info(`✅ UI Modal: enableCalendarUseCase completed successfully for: "${calendarEmail}"`);
      
      showCustomNotification('Calendar Enabled', `Calendar "${calendarEmail}" has been enabled successfully.`, 'success');
      logger.info(`✅ UI Modal: Success notification shown for: "${calendarEmail}"`);
      
      form.resetFields();
      onClose();
      logger.debug('✅ UI Modal: Modal closed and form reset after successful enable');
    } catch (error: any) {
      logger.error('✅ UI Modal: Failed to enable calendar:', error);
      
      let errorMessage = 'Failed to enable calendar. Please try again.';
      if (error.name === 'CalendarNotFoundError') {
        errorMessage = 'Calendar not found. Please check the email address and ensure the calendar is visible in your sidebar.';
        logger.info(`✅ UI Modal: Calendar not found error for: "${error.message}"`);
      }
      
      showCustomNotification('Enable Failed', errorMessage, 'error');
      logger.info(`✅ UI Modal: Error notification shown with message: ${errorMessage}`);
    } finally {
      setLoading(false);
      logger.debug('✅ UI Modal: Enable calendar operation completed - loading: false');
    }
  };

  /**
   * Handle modal cancel
   */
  const handleCancel = () => {
    logger.info('✅ UI Modal: Enable calendar modal cancelled by user');
    form.resetFields();
    onClose();
    logger.debug('✅ UI Modal: Form reset and modal closed after cancel');
  };

  /**
   * Validate email format
   */
  const validateEmail = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('Please enter a calendar email address'));
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return Promise.reject(new Error('Please enter a valid email address'));
    }
    
    return Promise.resolve();
  };

  return (
    <Modal
      title="Enable Calendar"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="Enable"
      cancelText="Cancel"
      confirmLoading={loading}
      width={480}
      destroyOnClose
    >
      <div style={{ marginBottom: '16px' }}>
        <Alert
          message="Enable a specific calendar by entering its email address"
          description="The calendar must be visible in your Google Calendar sidebar. This will make the calendar visible while leaving all others unchanged."
          type="info"
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
          name="calendarEmail"
          label="Calendar Email Address"
          rules={[
            { validator: validateEmail }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="example@gmail.com"
            autoFocus
            onPressEnter={handleSubmit}
          />
        </Form.Item>
        
        <div style={{ marginTop: '8px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 Tip: You can find calendar email addresses in Google Calendar settings
          </Text>
        </div>
      </Form>
    </Modal>
  );
};