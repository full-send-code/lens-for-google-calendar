// ImportDialog.tsx
import React from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  TextField 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ActionButton from './ActionButton';
import { CalendarGroup } from '../types';

interface ImportDialogProps {
  onImport: (groups: CalendarGroup) => void;
}

const ImportDialog: React.FC<ImportDialogProps> = ({ onImport }) => {
  const [open, setOpen] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [isValid, setIsValid] = React.useState(false);
  const contentRef = React.useRef<HTMLTextAreaElement>(null);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setContent('');
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    try {
      // Check if it's a valid JSON
      JSON.parse(newContent);
      setIsValid(true);
    } catch (e) {
      setIsValid(false);
    }
  };

  const handleSave = () => {
    try {
      const groups = JSON.parse(content);
      onImport(groups);
      handleClose();
    } catch (e) {
      console.error('Failed to import presets:', e);
    }
  };

  React.useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.focus();
    }
  }, [open]);

  return (
    <>
      <ActionButton 
        text="&import" 
        tooltip="Import presets" 
        onClick={handleClickOpen} 
      />
      
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Import Presets
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            value={content}
            onChange={handleContentChange}
            inputRef={contentRef}
            error={!!content && !isValid}
            helperText={content && !isValid ? "Please enter valid JSON" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSave} color="primary" disabled={!isValid}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImportDialog;
