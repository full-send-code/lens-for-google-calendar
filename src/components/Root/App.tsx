import React from 'react';
import { Container } from '@mui/material';
import PresetMenu from '../Presets';
import { CalendarProvider, useCalendarContext } from './context/CalendarContext';
import { useMessage } from './hooks/useMessage';
import { useCalendarActions } from './hooks/useCalendarActions';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useChromeStorage } from './hooks/useChromeStorage';
import { Notifications } from '../Notifications';
import { CalendarControls } from '../../components/CalendarControls';
import { ButtonItem } from "../../types/ButtonItem";

// Import Mousetrap type
import '../../types/mousetrap';

function RootApp() {
  const { dropdownItems } = useCalendarContext();
  const { message, showMessage, handleCloseSnackbar, showSnackbar } = useMessage();
  const actions = useCalendarActions(showMessage);
  
  // Use keyboard shortcuts
  useKeyboardShortcuts(actions);
  
  // Use Chrome storage
  useChromeStorage();
  
  // Define buttons
  const buttons: ButtonItem[] = [
    { text: '&Enable', tooltip: 'Enable a calendar by name', click: actions.enableCalendar },
    { text: '&Toggle', tooltip: 'Toggle a calendar by name', click: actions.toggleCalendar },
    { text: '&Save as', tooltip: 'Save current selection as a preset', click: actions.saveAs },
    { text: '&Restore', tooltip: 'Restore last saved preset', click: actions.restore },
    { text: '&Clear All', tooltip: 'Disable all calendars', click: actions.clear },
  ];
  
  return (
    <Container maxWidth={false}>
      <div>
        <CalendarControls buttons={buttons} />
        
        <div style={{ display: 'inline-block', marginLeft: '8px' }}>
          <PresetMenu
            items={dropdownItems}
            onItemSelect={actions.handleItemSelect}
            onItemDelete={actions.handleItemDelete}
          />
        </div>
      </div>
      
      <Notifications 
        message={message}
        open={showSnackbar}
        onClose={handleCloseSnackbar}
      />
    </Container>
  );
}

const App: React.FC = () => {
  return (
    <CalendarProvider>
      <RootApp />
    </CalendarProvider>
  );
};

export default App;
