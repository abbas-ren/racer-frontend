import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
} from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import { isGen5Generation } from 'constants/configuration';
import type {
  ControllerRow,
  RelayRow,
  StatusStyles,
} from 'types/configuration';
import styles from './ConfigurationTable.module.scss';

interface ConfigurationTableProps {
  isLoading: boolean;
  isLoadingMore: boolean;
  fetchError: string;
  rows: ControllerRow[];
  expandedRows: Record<string, boolean>;
  onToggleRowExpansion: (controllerId: string) => void;
  onOpenEditDialog: (row: ControllerRow) => void;
  onOpenDeleteDialog: (row: ControllerRow) => void;
  onOpenConfigureRelayDialog: (controllerId: string, relay: RelayRow) => void;
  onOpenConfigureUartDialog: (controller: ControllerRow) => void;
  getStatusStyles: (status: 'Online' | 'Offline') => StatusStyles;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
}

const ConfigurationTable = ({
  isLoading,
  isLoadingMore,
  fetchError,
  rows,
  expandedRows,
  onToggleRowExpansion,
  onOpenEditDialog,
  onOpenDeleteDialog,
  onOpenConfigureRelayDialog,
  onOpenConfigureUartDialog,
  getStatusStyles,
  hasActiveFilters,
  onClearFilters,
  hasMore,
  onLoadMore,
}: ConfigurationTableProps) => {
  const theme = useTheme();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRowDivider = alpha(theme.palette.text.primary, 0.08);
  const relayRowBackground = alpha(theme.palette.text.primary, 0.02);
  const hasExpandedVisibleRow = rows.some(
    (row) => expandedRows[row.controllerId],
  );

  const handleScroll = useCallback(() => {
    const container = tableContainerRef.current;
    if (!container || isLoading || isLoadingMore || !hasMore) {
      return;
    }

    const scrollThreshold = 100;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      scrollThreshold;

    if (isNearBottom) {
      onLoadMore();
    }
  }, [isLoading, isLoadingMore, hasMore, onLoadMore]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const tableCellBorderSx = {
    '& .MuiTableCell-root': {
      borderBottom: '1px solid var(--table-divider)',
      pt: '8px',
      pb: '8px',
      height: '60px',
      boxSizing: 'border-box',
    },
  };

  const subRowCellBorderSx = {
    '& .MuiTableCell-root': {
      borderBottom: '1px solid var(--table-divider)',
      pt: '7px',
      pb: '7px',
      height: '52px',
      boxSizing: 'border-box',
    },
  };

  const hasRows = rows.length > 0;

  return (
    <TableContainer
      ref={tableContainerRef}
      className={`${styles.tableContainer} ${
        hasExpandedVisibleRow ? styles.tableExpanded : styles.tableCollapsed
      }`}
      style={
        {
          '--table-divider': tableRowDivider,
          '--relay-row-bg': relayRowBackground,
        } as CSSProperties
      }
    >
      <Table stickyHeader className={styles.table}>
        <TableHead>
          <TableRow>
            <TableCell
              className={`${styles.headerCell} ${styles.expandCell}`}
            />
            <TableCell className={styles.headerCell}>Controller ID</TableCell>
            <TableCell className={styles.headerCell}>Controller Name</TableCell>
            <TableCell className={styles.headerCell}>IP Address</TableCell>
            <TableCell className={styles.headerCell}>Relays</TableCell>
            <TableCell className={styles.headerCell}>Status</TableCell>
            <TableCell align="center" className={styles.headerCell}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {!isLoading && fetchError && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body2" color="error.main">
                  {fetchError}
                </Typography>
              </TableCell>
            </TableRow>
          )}

          {hasRows &&
            rows.map((row) => (
              <Fragment key={row.controllerId}>
                <TableRow hover sx={tableCellBorderSx}>
                  <TableCell
                    className={`${styles.rowCell} ${styles.expandCell}`}
                  >
                    <IconButton
                      size="small"
                      onClick={() => onToggleRowExpansion(row.controllerId)}
                      aria-label={`toggle-${row.controllerId}`}
                      className={styles.expandIconButton}
                    >
                      {expandedRows[row.controllerId] ? (
                        <KeyboardArrowUpIcon
                          fontSize="small"
                          color="disabled"
                        />
                      ) : (
                        <KeyboardArrowDownIcon
                          fontSize="small"
                          color="disabled"
                        />
                      )}
                    </IconButton>
                  </TableCell>

                  <TableCell className={styles.rowCell}>
                    <div className={styles.idRow}>
                      <CustomIcon
                        name="server"
                        size={16}
                        color={theme.palette.icon?.primary}
                      />
                      <Typography variant="body2" className={styles.mainText}>
                        {row.controllerId}
                      </Typography>
                    </div>
                  </TableCell>

                  <TableCell className={styles.rowCell}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        variant="body2"
                        className={styles.controllerNameText}
                      >
                        {row.controllerName}
                      </Typography>
                      <Chip
                        label={row.generation}
                        size="small"
                        className={styles.generationChip}
                        sx={{
                          border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                          backgroundColor: alpha(
                            theme.palette.secondary.main,
                            0.08,
                          ),
                          '& .MuiChip-label': {
                            px: '8px',
                            fontSize: 11,
                            fontWeight: 500,
                            color: theme.palette.secondary.main,
                          },
                        }}
                      />
                    </Stack>
                  </TableCell>

                  <TableCell className={styles.rowCell}>
                    <Typography variant="body2" className={styles.ipText}>
                      {row.ipAddress}
                    </Typography>
                  </TableCell>

                  <TableCell className={styles.rowCell}>
                    {row.relaysTotal > 0 && (
                      <Chip
                        size="small"
                        label={`${row.relaysOnline}/${row.relaysTotal}`}
                        variant="outlined"
                        className={styles.relayCountChip}
                        sx={{
                          border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                          backgroundColor: alpha(
                            theme.palette.secondary.main,
                            0.08,
                          ),
                          '& .MuiChip-label': {
                            px: '9px',
                            fontSize: 11,
                            fontWeight: 600,
                            color: theme.palette.secondary.main,
                          },
                        }}
                      />
                    )}
                  </TableCell>

                  <TableCell className={styles.rowCell}>
                    <Box
                      className={styles.statusPill}
                      sx={{
                        border: `1px solid ${getStatusStyles(row.status).border}`,
                        color: getStatusStyles(row.status).color,
                        backgroundColor: getStatusStyles(row.status).bg,
                      }}
                    >
                      <Box
                        className={styles.statusDot}
                        sx={{
                          backgroundColor: getStatusStyles(row.status).color,
                        }}
                      />
                      {row.status}
                    </Box>
                  </TableCell>

                  <TableCell align="center" className={styles.actionsCell}>
                    <div className={styles.actionsRow}>
                      <Tooltip title="Edit" arrow>
                        <Box
                          className={styles.editButton}
                          onClick={() => onOpenEditDialog(row)}
                        >
                          <CustomIcon
                            name="square-pen"
                            size={16}
                            color={theme.palette.text.secondary}
                          />
                        </Box>
                      </Tooltip>
                      <Tooltip title="Delete" arrow>
                        <Box
                          className={styles.deleteButton}
                          onClick={() => onOpenDeleteDialog(row)}
                        >
                          <CustomIcon
                            name="trash-2"
                            size={16}
                            color={theme.palette.error.main}
                          />
                        </Box>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>

                {expandedRows[row.controllerId] &&
                  (isGen5Generation(row.generation) ? (
                    <TableRow
                      key={`${row.controllerId}-gen5-note`}
                      className={styles.gen5InfoRow}
                      sx={subRowCellBorderSx}
                    >
                      <TableCell />
                      <TableCell colSpan={6}>
                        <div className={styles.gen5Info}>
                          <InfoOutlinedIcon className={styles.gen5Icon} />
                          <Typography className={styles.gen5Text}>
                            Gen 5 uses CPLD power control and does not require
                            relay or GPIO configuration.
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onOpenConfigureUartDialog(row)}
                          >
                            Configure UART
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    row.relays.map((relay) => (
                      <TableRow
                        key={`${row.controllerId}-${relay.relayId}`}
                        className={styles.relayRow}
                        sx={subRowCellBorderSx}
                      >
                        <TableCell />

                        <TableCell sx={{ pl: 4 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Box className={styles.relayBranch} />
                            <CustomIcon
                              name="zap"
                              size={12}
                              color={theme.palette.secondary.main}
                            />
                            <Typography
                              variant="body2"
                              className={styles.subText}
                            >
                              {relay.serialNo}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          {/* <Typography
                          variant="body2"
                          color="text.secondary"
                          className={styles.serialText}
                        ></Typography> */}
                        </TableCell>

                        <TableCell />

                        <TableCell>
                          <Chip
                            size="small"
                            label={`${relay.channels} Ch`}
                            variant="outlined"
                            sx={{
                              height: 24,
                              borderRadius: '999px',
                              border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                              backgroundColor: alpha(
                                theme.palette.secondary.main,
                                0.08,
                              ),
                              '& .MuiChip-label': {
                                px: 1,
                                fontSize: 10,
                                fontWeight: 500,
                                color: theme.palette.secondary.main,
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Box
                            className={styles.relayStatusPill}
                            sx={{
                              border: `1px solid ${getStatusStyles(relay.status).border}`,
                              color: getStatusStyles(relay.status).color,
                              backgroundColor: getStatusStyles(relay.status).bg,
                            }}
                          >
                            <Box
                              className={styles.relayStatusDot}
                              sx={{
                                backgroundColor: getStatusStyles(relay.status)
                                  .color,
                              }}
                            />
                            {relay.status}
                          </Box>
                        </TableCell>

                        <TableCell
                          align="center"
                          className={styles.actionsCell}
                        >
                          <Tooltip title="Configure relay / GPIO" arrow>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                <CustomIcon
                                  name="settings"
                                  size={18}
                                  color={theme.palette.icon?.primary}
                                />
                              }
                              onClick={() =>
                                onOpenConfigureRelayDialog(
                                  row.controllerId,
                                  relay,
                                )
                              }
                            >
                              Configure
                            </Button>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
              </Fragment>
            ))}

          {!fetchError && !hasRows && (
            <TableRow>
              <TableCell
                colSpan={7}
                align="center"
                className={styles.emptyCenterCell}
              >
                <Box className={styles.emptyState}>
                  <Box className={styles.emptyIconCircle}>
                    <SearchIcon fontSize="medium" color="disabled" />
                  </Box>

                  <Typography
                    variant="subtitle2"
                    color="text.primary"
                    className={styles.emptyTitle}
                  >
                    No Controllers Found
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    className={styles.emptySubTitle}
                  >
                    Try adjusting your filters
                  </Typography>

                  {hasActiveFilters && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={onClearFilters}
                      className={styles.clearAllButton}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          )}

          {isLoadingMore && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Loading more controllers...
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default memo(ConfigurationTable);
