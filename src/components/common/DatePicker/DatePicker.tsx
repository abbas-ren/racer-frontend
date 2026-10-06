import { useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import dayjs, { Dayjs } from 'dayjs';
import styles from './DatePicker.module.scss';

interface CustomDatePickerProps {
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
}

export default function CustomDatePicker({
  value,
  onChange,
}: CustomDatePickerProps) {
  // const [value, setValue] = useState<Dayjs | null>(null);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DesktopDatePicker
        value={value}
        onChange={(newValue) => onChange(newValue)}
        open={open}
        maxDate={dayjs()}
        onClose={() => setOpen(false)}
        onAccept={() => setOpen(false)}
        slotProps={{
          textField: {
            style: { display: 'none' },
          },
          popper: {
            anchorEl: anchorRef.current,
            placement: 'bottom-end',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 8],
                },
              },
            ],
          },
        }}
      />
      <Box
        ref={anchorRef}
        className={styles.customDatePicker}
        onClick={() => setOpen(true)}
      >
        <Typography variant="system1" color="text.caption">
          {value ? value.format('DD/MM/YYYY') : 'Date'}
        </Typography>
        <CalendarMonth className={styles.calendarIcon} />
      </Box>
    </LocalizationProvider>
  );
}
