import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Box, Button, Popover, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import styles from './DateRangePickerPopover.module.scss';

interface DateRangePickerPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  fromDate: Date;
  toDate: Date;
  maxDate: Date;
  onClose: () => void;
  onApply: (nextFromDate: Date, nextToDate: Date) => void;
  formatDisplayDate: (isoDate: string) => string;
}

function DateRangePickerPopover({
  open,
  anchorEl,
  fromDate,
  toDate,
  maxDate,
  onClose,
  onApply,
  formatDisplayDate,
}: DateRangePickerPopoverProps) {
  const buildInitialRange = (): DateRange => ({
    from: fromDate,
    to: toDate,
  });

  const [draftRange, setDraftRange] = useState<DateRange>({
    from: fromDate,
    to: toDate,
  });

  const toStartOfDay = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const handlePopoverEnter = () => {
    const next = buildInitialRange();
    setDraftRange({
      from: next.from ? toStartOfDay(next.from) : undefined,
      to: next.to ? toStartOfDay(next.to) : undefined,
    });
  };

  const clampDate = (date: Date) => {
    const normalizedDate = toStartOfDay(date);
    const normalizedMaxDate = toStartOfDay(maxDate);

    if (normalizedDate.getTime() > normalizedMaxDate.getTime()) {
      return normalizedMaxDate;
    }

    return normalizedDate;
  };

  const handleRangeChange = (nextRange: DateRange | undefined) => {
    if (!nextRange?.from && !nextRange?.to) {
      return;
    }

    setDraftRange({
      from: nextRange.from ? clampDate(nextRange.from) : undefined,
      to: nextRange.to ? clampDate(nextRange.to) : undefined,
    });
  };

  const handleApply = () => {
    const nextFrom = draftRange.from
      ? clampDate(draftRange.from)
      : clampDate(fromDate);
    const nextTo = draftRange.to ? clampDate(draftRange.to) : nextFrom;

    if (nextFrom.getTime() > nextTo.getTime()) {
      onApply(nextTo, nextFrom);
      return;
    }

    onApply(nextFrom, nextTo);
  };

  const displayFrom = formatDisplayDate(
    (draftRange.from ?? fromDate).toISOString().split('T')[0],
  );
  const displayTo = formatDisplayDate(
    (draftRange.to ?? draftRange.from ?? toDate).toISOString().split('T')[0],
  );

  const defaultVisibleMonth = (() => {
    const baseMonthDate = draftRange.to ?? draftRange.from ?? toDate;
    const previousMonth = new Date(baseMonthDate);
    previousMonth.setDate(1);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    return previousMonth;
  })();

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      keepMounted
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      transitionDuration={{ enter: 120, exit: 90 }}
      PaperProps={{ className: styles.paper }}
      TransitionProps={{ onEnter: handlePopoverEnter }}
    >
      <Stack className={styles.content}>
        <Stack direction="row" className={styles.summaryRow}>
          <Stack className={styles.summaryBlock}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '10.5px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#7c8192',
              }}
            >
              FROM DATE
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: '14px', fontWeight: 700, color: '#1f2430' }}
            >
              {displayFrom}
            </Typography>
          </Stack>
          <CustomIcon name="move-right" size={16} className={styles.arrow} />
          <Stack className={`${styles.summaryBlock} ${styles.summaryTo}`}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '10.5px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#7c8192',
              }}
            >
              TO DATE
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: '14px', fontWeight: 700, color: '#1f2430' }}
            >
              {displayTo}
            </Typography>
          </Stack>
        </Stack>

        <Box className={styles.calendarWrap}>
          <DayPicker
            mode="range"
            selected={draftRange}
            onSelect={handleRangeChange}
            disabled={{ after: toStartOfDay(maxDate) }}
            numberOfMonths={2}
            navLayout="around"
            pagedNavigation
            showOutsideDays
            endMonth={toStartOfDay(maxDate)}
            defaultMonth={defaultVisibleMonth}
            components={{
              Chevron: ({ orientation, ...props }) =>
                orientation === 'left' ? (
                  <ChevronLeft {...props} size={14} />
                ) : (
                  <ChevronRight {...props} size={14} />
                ),
            }}
          />
        </Box>

        <Stack direction="row" className={styles.actions}>
          <Button
            variant="text"
            color="inherit"
            onClick={onClose}
            sx={{ borderRadius: '10px', px: 1.6, py: 0.8, minWidth: 'auto' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApply}
            sx={{ borderRadius: '10px', px: 1.8, py: 0.8, minWidth: 'auto' }}
          >
            Apply
          </Button>
        </Stack>
      </Stack>
    </Popover>
  );
}

export default DateRangePickerPopover;
