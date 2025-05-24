import React from "react";
import { Container } from "@mui/material";
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

// Import Mousetrap type
import "../../types/mousetrap";

function RootApp() {
  const { dropdownItems } = useCalendarContext();
  const { message, showMessage, handleCloseSnackbar, showSnackbar } =
    useMessage();
  const actions = useCalendarActions(showMessage);

  // Use keyboard shortcuts
  useKeyboardShortcuts(actions);

  // Use Chrome storage
  useChromeStorage();

  // Define buttons
  const buttons: ButtonItem[] = [
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
      icon: <SettingsIcon /> ,
    }
    
  ];

  return (
    <Container maxWidth={false}>
      <div>
        <CalendarControls buttons={buttons} />
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

const App: React.FC = () => {
  return (
    <CalendarProvider>
      <RootApp />
    </CalendarProvider>
  );
};

export default App;
