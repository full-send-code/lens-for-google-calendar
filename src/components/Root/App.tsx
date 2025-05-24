import React, { useMemo } from "react";
import { Container, CircularProgress } from "@mui/material";
import PresetMenu from "../Presets";
import {
  CalendarProvider,
  useCalendarContext,
} from "./context/CalendarContext";
import { useMessage } from "./hooks/useMessage";
import { useCalendarActions } from "./hooks/useCalendarActions";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useChromeStorage } from "./hooks/useChromeStorage";
import { Notifications } from "../Notifications";
import { CalendarControls } from "../../components/CalendarControls";
import { ButtonItem } from "../../types/ButtonItem";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import ReplayIcon from "@mui/icons-material/Replay";
import SettingsIcon from '@mui/icons-material/Settings';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import * as Logger from '../../utils/logger';

// Import Mousetrap type
import "../../types/mousetrap";

// Styles for the container and loading indicator
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    position: 'relative' as const,
  },
  loadingContainer: {
    position: 'absolute' as const,
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
  }
};

/**
 * Main application component
 */
function RootApp() {
  // Start performance tracking for component render
  Logger.startPerformanceTracking('render:RootApp');
  
  // Get context and set up hooks
  const { dropdownItems, isLoading } = useCalendarContext();
  const { message, showMessage, handleCloseSnackbar, showSnackbar } = useMessage();
  const actions = useCalendarActions(showMessage);

  // Use keyboard shortcuts
  useKeyboardShortcuts(actions);

  // Use Chrome storage
  useChromeStorage();

  // Memoize buttons definition to prevent unnecessary re-renders
  const buttons: ButtonItem[] = useMemo(() => [
    {
      text: "&Enable",
      tooltip: "Enable a calendar by name",
      click: actions.enableCalendar,
      icon: <EditCalendarIcon />,
    },
    {
      text: "&Save as",
      tooltip: "Save current selection as a preset",
      click: actions.saveAs,
      icon: <SaveIcon />,
    },
    {
      text: "&Restore",
      tooltip: "Restore last saved preset",
      click: actions.restore,
      icon: <ReplayIcon />,
    },
    {
      text: "&Clear All",
      tooltip: "Disable all calendars",
      click: actions.clear,
      icon: <ClearAllIcon />,
    },
    {
      text: "&Presets",
      tooltip: "Manage preset groups",
      click: actions.openPresetsMenu,
      icon: <SettingsIcon />,
    }
  ], [actions]);

  // End performance tracking for component render
  Logger.endPerformanceTracking('render:RootApp');

  return (
    <Container maxWidth={false}>
      <div style={styles.container}>
        <CalendarControls 
          buttons={buttons} 
          isLoading={isLoading || actions.isLoading} 
        />
        
        {/* Loading indicator */}
        {(isLoading || actions.isLoading) && (
          <div style={styles.loadingContainer}>
            <CircularProgress size={24} />
          </div>
        )}
        
        <PresetMenu
          items={dropdownItems}
          onItemSelect={actions.handleItemSelect}
          onItemDelete={actions.handleItemDelete}
          anchorEl={actions.anchorEl}
          onClose={actions.closePresetsMenu}
        />
      </div>

      <Notifications
        message={message}
        open={showSnackbar}
        onClose={handleCloseSnackbar}
      />
    </Container>
  );
}

/**
 * Provider wrapper component
 */
const App: React.FC = () => {
  return (
    <CalendarProvider>
      <RootApp />
    </CalendarProvider>
  );
};

export default App;
