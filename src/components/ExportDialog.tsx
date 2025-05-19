// ExportDialog.tsx
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

interface ExportDialogProps {
  groups: CalendarGroup;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ groups }) => {
  const [open, setOpen] = React.useState(false);
  const contentRef = React.useRef<HTMLTextAreaElement>(null);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const getContent = () => {
    // Filter out internal groups
    const exportGroups: Record<string, any> = {};
    for (const key in groups) {
      if (!key.startsWith('saved_') && !key.startsWith('__')) {
        exportGroups[key] = groups[key];
      }
    }
    
    return JSON.stringify(exportGroups, null, 2);
  };

  React.useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.focus();
      contentRef.current.select();
    }
  }, [open]);

  return (
    <>
      <ActionButton 
        text="e&xport" 
        tooltip="Export presets" 
        onClick={handleClickOpen} 
      />
      
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Export Presets
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
            value={getContent()}
            inputRef={contentRef}
            InputProps={{
              readOnly: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExportDialog;
