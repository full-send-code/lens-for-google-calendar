import React from 'react';

export interface ButtonItem {
  text: string;
  tooltip: string;
  icon: React.ReactElement;
  click: (event?: React.MouseEvent<HTMLElement>) => Promise<void>;
}
