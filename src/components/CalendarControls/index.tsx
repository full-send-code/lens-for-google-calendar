import React from 'react';
import ActionButton from '../ActionButton';
import { ButtonItem } from "../../types/ButtonItem";

interface CalendarControlsProps {
  buttons: ButtonItem[];
}

export function CalendarControls({ buttons }: CalendarControlsProps) {
  return (
    <div>
      {buttons.map((button) => (
        <ActionButton
          key={button.text}
          text={button.text}
          tooltip={button.tooltip}
          onClick={(e) => button.click(e)}
          icon={button.icon}
        />
      ))}
    </div>
  );
}
