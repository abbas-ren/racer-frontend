import { DataTable, Column } from 'components/common';
import useUsers from 'hooks/useUsers';
import { ButtonPreset, IUser } from 'typesCustom/types';
import styles from './UserStyles.module.scss';
import { formatDate, UserRequestAction } from 'utils/common';
import Button from 'components/common/Button';
import { useState, useEffect, useMemo } from 'react';
import AddUserDialog from 'components/Dialogs/AddUser';
import { DeleteConfirmDialog } from 'components/Dialogs/ConfirmDialog';
import { Box, Stack, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface TableUserData extends IUser {
  isRequest?: boolean;
}

function UserTable() {
  const {
    data,
    requests,
    handleUserRequest,
    handleRemoveUser,
    loading,
    actionLoading,
  } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [openAddUserDialog, setOpenAddUserDialog] = useState<boolean>(false);

  const enrichedData = useMemo(() => {
    const requestIds = new Set(requests?.map((r) => r.id) || []);
    return data.map((user) => ({
      ...user,
      isRequest: requestIds.has(user.id),
    }));
  }, [data, requests]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(0);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const filteredData = useMemo(() => {
    if (!enrichedData) return [];

    const searchLower = debouncedSearchTerm.toLowerCase();

    return debouncedSearchTerm
      ? enrichedData.filter((user) => {
          return (
            user.username?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.firstName?.toLowerCase().includes(searchLower) ||
            user.lastName?.toLowerCase().includes(searchLower) ||
            formatDate(new Date(user.createdTimestamp)).includes(searchLower)
          );
        })
      : enrichedData;
  }, [enrichedData, debouncedSearchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = currentPage * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalFilteredRows = useMemo(() => {
    return filteredData.length;
  }, [filteredData]);

  const handleOpenConfirmDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setIsDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (selectedUser?.userId) {
      handleRemoveUser(selectedUser.userId);
    }
    setIsDialogOpen(false);
  };

  const handleAddUserDialogOpen = () => setOpenAddUserDialog(true);
  const handleAddUserDialogClose = () => {
    setOpenAddUserDialog(false);
  };

  const userColumns: Column<TableUserData>[] = [
    {
      key: 'username',
      label: 'User Name',
      icon: 'user',
      minWidth: '150px',
      render: (row) => {
        if (!row.username)
          return <p className={styles.requested_user_row}>Not Available</p>;
        if (row.username && row.isRequest)
          return <p className={styles.requested_user_row}>{row.username}</p>;
        return <p>{row.username}</p>;
      },
    },
    {
      key: 'email',
      label: 'Email ID',
      icon: 'mail',
      minWidth: '200px',
      render: (row) => {
        if (!row.email)
          return <p className={styles.requested_user_row}>Not Available</p>;
        if (row.email && row.isRequest)
          return <p className={styles.requested_user_row}>{row.email}</p>;
        return <p>{row.email}</p>;
      },
    },
    {
      key: 'firstName',
      label: 'First Name',
      minWidth: '120px',
      render: (row) => {
        if (!row.firstName)
          return <p className={styles.requested_user_row}>Not Available</p>;
        if (row.firstName && row.isRequest)
          return <p className={styles.requested_user_row}>{row.firstName}</p>;
        return <p>{row.firstName}</p>;
      },
    },
    {
      key: 'lastName',
      label: 'Last Name',
      minWidth: '120px',
      render: (row) => {
        if (!row.lastName)
          return <p className={styles.requested_user_row}>Not Available</p>;
        if (row.lastName && row.isRequest)
          return <p className={styles.requested_user_row}>{row.lastName}</p>;
        return <p>{row.lastName}</p>;
      },
    },
    {
      key: 'createdTimestamp',
      label: 'Date',
      icon: 'calendar',
      minWidth: '120px',
      render: (row) => {
        if (!row.createdTimestamp)
          return <p className={styles.requested_user_row}>Not Available</p>;
        if (row.isRequest)
          return (
            <p className={styles.requested_user_row}>
              {formatDate(new Date(parseInt(row.createdTimestamp.toString())))}
            </p>
          );
        return formatDate(new Date(parseInt(row.createdTimestamp.toString())));
      },
    },
    {
      key: 'action',
      label: 'Action',
      minWidth: '100px',
      render: (row) => {
        if (row.isRequest) {
          return (
            <div className={styles.action_container}>
              <Button
                onClick={() => {
                  handleUserRequest(row.id, UserRequestAction.Accept);
                }}
                className={styles.success_btn}
                disabled={actionLoading}
              >
                <span>&#10004;</span>
              </Button>
              <Button
                onClick={() => {
                  handleUserRequest(row.id, UserRequestAction.Decline);
                }}
                className={styles.decline_btn}
                disabled={actionLoading}
              >
                <span>&#10005;</span>
              </Button>
            </div>
          );
        } else {
          return (
            <Button
              preset={ButtonPreset.Error}
              outlined
              className={styles.remove_user_btn}
              onClick={() => {
                handleOpenConfirmDialog();
                setSelectedUser({ userId: row.id, userName: row.username });
              }}
            >
              Remove
            </Button>
          );
        }
      },
    },
  ];

  return (
    <Stack className={styles.container}>
      <Stack direction="row" className={styles.headerContainer}>
        <Box className={styles.searchContainer}>
          <TextField
            fullWidth
            placeholder="Search users..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      className={styles.searchIcon}
                      fontSize="small"
                    />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <Button
          className={styles.add_user_btn}
          onClick={handleAddUserDialogOpen}
        >
          Add User
        </Button>
      </Stack>

      <Box className={styles.tableContainer}>
        <DataTable<TableUserData>
          title="users"
          columns={userColumns}
          data={paginatedData}
          totalCount={totalFilteredRows}
          page={currentPage}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
          loading={loading}
          getRowKey={(row) => row.id}
          emptyMessage="No users found"
        />
      </Box>

      <AddUserDialog
        open={openAddUserDialog}
        onClose={handleAddUserDialogClose}
        setOpenAddUserDialog={setOpenAddUserDialog}
      />

      <DeleteConfirmDialog
        isOpen={isDialogOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleConfirmDelete}
        resourceName={'User'}
        resourceId={selectedUser?.userName || ''}
      />
    </Stack>
  );
}

export default UserTable;
