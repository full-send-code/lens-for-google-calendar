import React from 'react';
import { Button, Space, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import logger from '../../logger';

const { Text } = Typography;

interface MinimalExtensionProps {}

export const MinimalExtension: React.FC<MinimalExtensionProps> = () => {
  React.useEffect(() => {
    logger.info('Lens Extension React component mounted with Ant Design');
  }, []);

  return (
    <Space 
      style={{
        padding: '8px 16px',
        backgroundColor: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <CheckCircleOutlined style={{ color: '#52c41a' }} />
      <Text type="secondary">Lens Extension (React + Ant Design)</Text>
      <Button size="small" type="link">
        Ready
      </Button>
    </Space>
  );
};