import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { styled } from '@mui/material/styles';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import manifestJson from '../../../public/manifest.json';
import packageJson from '../../../package.json';

// Extract constants outside of component to avoid recalculation
const version = manifestJson.version;
const repositoryUrl = packageJson.repository.url.replace(/\.git$/, '');
const extensionName = manifestJson.name.replace(/^@.*\//, '');
const currentYear = new Date().getFullYear();

// Create a theme instance outside component to avoid recreation
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a73e8',
      dark: '#174ea6',
    },
    text: {
      primary: '#202124',
      secondary: '#5f6368',
    },
  },
  typography: {
    fontFamily: '\'Google Sans\', Roboto, Arial, sans-serif',
  },
});

// Define styled components using the styled API instead of makeStyles
const PopupContainer = styled('div')(({ theme }) => ({
  minWidth: 350,
  padding: 20,
  fontFamily: '\'Google Sans\', Roboto, Arial, sans-serif',
  color: '#202124',
}));

const Header = styled('div')({
  display: 'flex',
  alignItems: 'center',
  padding: '16px 20px',
  marginBottom: 10,
  marginLeft: -20,
  marginRight: -20,
  marginTop: -20,
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
});

const Icon = styled('img')({
  width: 32,
  height: 32,
  marginRight: 12,
});

const Title = styled('h1')({
  fontSize: 18,
  fontWeight: 500,
  color: '#1a73e8',
});

const SectionTitle = styled('h2')({
  fontSize: 16,
  fontWeight: 500,
  margin: '20px 0 10px 0',
  color: '#202124',
});

const ShortcutList = styled('ul')({
  listStyle: 'none',
  padding: 0,
  margin: 0,
});

const ShortcutItem = styled('li')({
  marginBottom: 10,
  display: 'flex',
  alignItems: 'center',
});

const KeyCombo = styled('span')({
  background: '#f1f3f4',
  border: '1px solid #dadce0',
  borderRadius: 4,
  padding: '2px 8px',
  fontFamily: 'monospace',
  fontSize: 14,
  marginRight: 10,
  color: '#174ea6',
  minWidth: 60,
  textAlign: 'center',
  display: 'inline-block',
});

const HelperText = styled('div')({
  fontSize: 14,
  color: '#5f6368',
  margin: '15px 0',
  lineHeight: 1.4,
});

const Copyright = styled('div')({
  fontSize: 12,
  color: '#80868b',
  marginTop: 25,
  borderTop: '1px solid #dadce0',
  paddingTop: 10,
  textAlign: 'center',
  lineHeight: 1.5,
});

const Link = styled('a')({
  color: '#1a73e8',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
  marginLeft: 4,  marginRight: 4,
});

// Memoize shortcuts data to avoid recreation
const shortcuts = [
  { keys: 'Ctrl + Shift + S', description: 'Select current calendar event' },
  { keys: 'Ctrl + Shift + C', description: 'Clear selected event' },
  { keys: 'Ctrl + Shift + O', description: 'Open Google Calendar' }
];

/**
 * Popup component for the extension popup window
 * Optimized with memoization and performance considerations
 */
const Popup: React.FC = () => {
  // Memoize support URL to avoid recalculation
  const supportUrl = useMemo(() => `${repositoryUrl}/issues`, []);

  return (
    <ThemeProvider theme={theme}>
      <PopupContainer>
        <Header>
          <Icon
            src="icons/icon128.png"
            alt="Extension Icon"
          />
          <Title>{extensionName}</Title>
        </Header>        <SectionTitle>Shortcuts &amp; Hotkeys</SectionTitle>
        <ShortcutList>
          {shortcuts.map((shortcut, index) => (
            <ShortcutItem key={index}>
              <KeyCombo>{shortcut.keys}</KeyCombo>
              <span>{shortcut.description}</span>
            </ShortcutItem>
          ))}
        </ShortcutList>

        <HelperText>
          Use these shortcuts while viewing Google Calendar to quickly select or clear events.
          <br />
          You can customize hotkeys in your browser's extension settings.
        </HelperText>

        <SectionTitle>Support</SectionTitle>        <HelperText>
          Need help or want to report an issue?
          <br />
          <Link
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Support
          </Link>
        </HelperText>

        <Copyright>
          &copy; {currentYear} {extensionName} {version}
          <br />
          Not affiliated with Google LLC.
          <br />
          <Link
            href={repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Source
          </Link>
        </Copyright>
      </PopupContainer>
    </ThemeProvider>
  );
};

export default React.memo(Popup);

// Create root element and render
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
