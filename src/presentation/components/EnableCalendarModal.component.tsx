/**
 * Enable Calendar Modal Component
 * Modal dialog for enabling specific calendars by email input
 */

import React, { useState } from 'react';
import { Modal, Input, Form, notification, Typography, Alert } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import type { EnableCalendarUseCase } from '../../usecases';

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
    try {
      const values = await form.validateFields();
      const { calendarEmail } = values;
      
      setLoading(true);
      await enableCalendarUseCase.execute(calendarEmail.trim());
      
      notification.success({
        message: 'Calendar Enabled',
        description: `Calendar "${calendarEmail}" has been enabled successfully.`,
        placement: 'topRight'
      });
      
      form.resetFields();
      onClose();
    } catch (error: any) {
      console.error('Failed to enable calendar:', error);
      
      let errorMessage = 'Failed to enable calendar. Please try again.';
      if (error.name === 'CalendarNotFoundError') {
        errorMessage = 'Calendar not found. Please check the email address and ensure the calendar is visible in your sidebar.';
      }
      
      notification.error({
        message: 'Enable Failed',
        description: errorMessage,
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle modal cancel
   */
  const handleCancel = () => {
    form.resetFields();
    onClose();
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