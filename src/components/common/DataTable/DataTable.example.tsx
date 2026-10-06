/**
 * DataTable Usage Example
 *
 * This file demonstrates how to use the DataTable component with various configurations.
 */

import { useState } from 'react';
import { DataTable, Column } from 'components/common';
import { Chip, Typography, Stack } from '@mui/material';

// Example 1: Simple Device Table
interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  type: string;
  lastSeen: string;
}

export const DeviceTableExample = () => {
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sample data
  const devices: Device[] = [
    {
      id: '1',
      name: 'Device A',
      status: 'online',
      type: 'Sensor',
      lastSeen: '2025-12-22',
    },
    {
      id: '2',
      name: 'Device B',
      status: 'offline',
      type: 'Camera',
      lastSeen: '2025-12-21',
    },
  ];

  const totalCount = 50; // Total items from backend

  // Define columns
  const columns: Column<Device>[] = [
    {
      key: 'name',
      label: 'Device Name',
      sortable: true,
      width: '25%',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '20%',
      // Custom render for status with Chip component
      render: (row) => (
        <Chip
          label={row.status}
          color={row.status === 'online' ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      width: '20%',
    },
    {
      key: 'lastSeen',
      label: 'Last Seen',
      sortable: true,
      width: '20%',
      align: 'right',
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '15%',
      align: 'center',
      // Custom render for action buttons
      render: (_row) => (
        <Stack direction="row" spacing={1} justifyContent="center">
          <Typography
            variant="caption"
            sx={{ cursor: 'pointer', color: 'primary.main' }}
          >
            Edit
          </Typography>
          <Typography
            variant="caption"
            sx={{ cursor: 'pointer', color: 'error.main' }}
          >
            Delete
          </Typography>
        </Stack>
      ),
    },
  ];

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortOrder('asc');
    }
  };

  return (
    <DataTable
      columns={columns}
      data={devices}
      totalCount={totalCount}
      page={page}
      onPageChange={setPage}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={handleSort}
      emptyMessage="No devices found"
      title={''}
    />
  );
};

// Example 2: User Table with Complex Rendering
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export const UserTableExample = () => {
  const [page, setPage] = useState(0);

  const users: User[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'Admin',
      createdAt: '2025-12-01',
    },
  ];

  const columns: Column<User>[] = [
    {
      key: 'fullName',
      label: 'Full Name',
      sortable: true,
      render: (row) => (
        <Stack direction="column">
          <Typography variant="body2" fontWeight={600}>
            {row.firstName} {row.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.email}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (row) => (
        <Chip
          label={row.role}
          color="primary"
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Created At',
      sortable: true,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      totalCount={100}
      page={page}
      onPageChange={setPage}
      title={''}
    />
  );
};

// Example 3: Simple Text-Only Table
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export const ProductTableExample = () => {
  const [page, setPage] = useState(0);

  const products: Product[] = [
    { id: '1', name: 'Product A', price: 29.99, stock: 100 },
  ];

  const columns: Column<Product>[] = [
    { key: 'name', label: 'Product Name', sortable: true },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (row) => `$${row.price.toFixed(2)}`,
    },
    { key: 'stock', label: 'Stock', sortable: true, align: 'right' },
  ];

  return (
    <DataTable
      columns={columns}
      data={products}
      totalCount={50}
      page={page}
      onPageChange={setPage}
      title={''}
    />
  );
};
