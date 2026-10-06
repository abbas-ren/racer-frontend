# Frontend Architecture Guide

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── common/       # Shared components across features
│   │   ├── Builds/       # Build management feature
│   │   ├── Tests/        # Test execution feature
│   │   ├── Dashboard/    # Dashboard widgets
│   │   └── ...
│   ├── pages/            # Page-level components (routes)
│   │   ├── Admin/        # Admin-specific pages
│   │   ├── User/         # User-specific pages
│   │   └── Login/        # Authentication pages
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services
│   ├── store/            # Redux state management
│   │   ├── slices/       # Redux Toolkit slices
│   │   ├── sagas/        # Redux-Saga side effects
│   │   └── selectors/    # Memoized selectors
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   ├── styles/           # Global styles and theme
│   └── constants/        # App-wide constants
```

---

## 🧩 Component Organization

### Component vs Page vs Common

#### **Components** (`src/components/`)

Feature-specific components organized by domain:

```
components/
├── Builds/
│   ├── BuildsContainer.tsx      # Main coordinator
│   ├── BuildHeader.tsx          # Feature header
│   ├── UploadBuild/            # Sub-feature folder
│   └── index.ts                 # Barrel export
├── Tests/
│   ├── TestFilters/
│   ├── TestSuiteList/
│   └── index.ts
└── Dashboard/
    ├── DeviceStats.tsx
    └── RecentActivity.tsx
```

**When to create a component:**

- ✅ Reusable within a feature domain
- ✅ Has specific business logic for that feature
- ✅ More than 50-100 lines of code
- ✅ Used in multiple places within the feature

#### **Pages** (`src/pages/`)

Route-level components that compose features:

```
pages/
├── Admin/
│   ├── AdminDashboard.tsx       # /admin/dashboard
│   ├── BuildsPage.tsx           # /admin/builds
│   └── TestsPage.tsx            # /admin/tests
├── User/
│   ├── UserDashboard.tsx        # /user/dashboard
│   └── UserDevices.tsx          # /user/devices
└── Login/
    └── LoginPage.tsx             # /login
```

**When to create a page:**

- ✅ Corresponds to a route/URL
- ✅ Composes multiple components
- ✅ Handles page-level data fetching
- ✅ Minimal business logic (delegates to components)

#### **Common** (`src/components/common/`)

Truly shared, generic components with no business logic:

```
components/common/
├── CustomButton/
│   ├── CustomButton.tsx         # Generic button
│   ├── CustomButton.module.scss
│   └── index.ts
├── CustomCheckbox/
├── DataTable/                   # Generic table component
├── Modal/
├── Loader/
└── EmptyState/
```

**When to put in common:**

- ✅ Used across multiple features
- ✅ No business logic (pure presentational)
- ✅ Highly reusable and configurable
- ✅ Could be extracted to a component library

**Example Decision Tree:**

```
Need a button?
├─ Generic, no business logic? → components/common/CustomButton
├─ Build-specific (Upload, Delete)? → components/Builds/BuildActions
└─ Used only once? → Inline in parent component
```

---

## 🎨 Styling Architecture

### MUI Theme System

#### Theme Configuration (`src/styles/theme.ts`)

```typescript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      // ...
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none', // Disable uppercase
      fontWeight: 600,
    },
  },
  spacing: 8, // Base spacing unit (1 = 8px)
});
```

#### Using Theme Variables

MUI theme values are automatically converted to CSS custom properties:

```scss
// ✅ RECOMMENDED: Use CSS custom properties
.container {
  background-color: var(--mui-palette-background-paper);
  color: var(--mui-palette-text-primary);
  border: 1px solid var(--mui-palette-divider);
  padding: var(--mui-spacing-2); // 16px (2 * 8px)
}

.primaryButton {
  background-color: var(--mui-palette-primary-main);
  color: var(--mui-palette-primary-contrastText);

  &:hover {
    background-color: var(--mui-palette-primary-dark);
  }
}

.successBadge {
  color: var(--mui-palette-success-main);
  background-color: var(--mui-palette-success-light);
}
```

**Available CSS Variables:**

```scss
// Colors
--mui-palette-primary-main
--mui-palette-primary-light
--mui-palette-primary-dark
--mui-palette-secondary-main
--mui-palette-error-main
--mui-palette-warning-main
--mui-palette-info-main
--mui-palette-success-main

// Greys
--mui-palette-grey-50 through --mui-palette-grey-900

// Text
--mui-palette-text-primary
--mui-palette-text-secondary
--mui-palette-text-disabled

// Background
--mui-palette-background-default
--mui-palette-background-paper

// Other
--mui-palette-divider
--mui-palette-action-hover
--mui-palette-action-selected
--mui-palette-action-disabled

// Spacing
--mui-spacing-1  // 8px
--mui-spacing-2  // 16px
--mui-spacing-3  // 24px
// ... etc
```

### Typography System

#### Predefined Typography Variants

```typescript
// src/styles/theme.ts
typography: {
  h1: { fontSize: '2.5rem', fontWeight: 700 },
  h2: { fontSize: '2rem', fontWeight: 600 },
  h3: { fontSize: '1.75rem', fontWeight: 600 },
  h4: { fontSize: '1.5rem', fontWeight: 500 },
  h5: { fontSize: '1.25rem', fontWeight: 500 },
  h6: { fontSize: '1rem', fontWeight: 500 },

  subtitle1: { fontSize: '1rem', fontWeight: 500 },
  subtitle2: { fontSize: '0.875rem', fontWeight: 500 },

  body1: { fontSize: '1rem' },
  body2: { fontSize: '0.875rem' },

  button: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none' },
  caption: { fontSize: '0.75rem' },
  overline: { fontSize: '0.75rem', textTransform: 'uppercase' },
}
```

#### Using Typography

```tsx
import { Typography } from '@mui/material';

// ✅ Use predefined variants
<Typography variant="h1">Main Title</Typography>
<Typography variant="body1">Regular text</Typography>
<Typography variant="caption">Small text</Typography>
```

### When to Use `sx` vs SCSS

#### **Use SCSS Modules** (Recommended Default)

✅ **When you have 3+ style properties**
✅ **For component-specific styles**
✅ **For complex nested styles**
✅ **For hover, focus, active states**
✅ **For media queries**
✅ **Better readability and maintainability**

```tsx
// ComponentName.module.scss
.container {
  display: flex;
  flex-direction: column;
  background-color: var(--mui-palette-background-paper);
  border-radius: 8px;
  padding: 16px;
  gap: 12px;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.headerText {
  font-size: 14px;
  font-weight: 600;
  color: var(--mui-palette-text-primary);
}

// ComponentName.tsx
import styles from './ComponentName.module.scss';

function ComponentName() {
  return (
    <Box className={styles.container}>
      <Typography className={styles.headerText}>Title</Typography>
    </Box>
  );
}
```

#### **Use `sx` Prop** (Sparingly)

✅ **1-2 simple style overrides**
✅ **Dynamic styles based on props/state**
✅ **Overriding MUI component internals**
✅ **Rapid prototyping**

```tsx
// ✅ Good: 1-2 properties
<Box sx={{ padding: 2, marginBottom: 1 }}>

// ✅ Good: Dynamic styling
<Button sx={{
  backgroundColor: isActive ? 'primary.main' : 'grey.300'
}}>

// ✅ Good: MUI component customization
<TextField
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
    },
  }}
/>

// ❌ Bad: Too many styles (use SCSS instead)
<Box sx={{
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'background.paper',
  borderRadius: '8px',
  padding: 2,
  gap: 1.5,
  border: '1px solid',
  borderColor: 'divider',
  '&:hover': {
    boxShadow: 1,
  },
}}>
```

#### **Use Inline Styles** (Rarely)

✅ **Only for truly dynamic values**
✅ **Values from API/props that can't be in CSS**

```tsx
// ✅ Good: Dynamic value from state/props
<Box style={{ width: `${progress}%` }}>

// ✅ Good: Calculated position
<Box style={{ transform: `translateX(${offset}px)` }}>

// ❌ Bad: Static values (use SCSS)
<Box style={{ padding: '16px', backgroundColor: '#fff' }}>
```

### Style Organization Pattern

```tsx
// ComponentName.tsx
import { Box, Typography } from '@mui/material';
import styles from './ComponentName.module.scss';

function ComponentName({ isActive, width }: Props) {
  return (
    <Box
      className={styles.container} // ✅ SCSS for base styles
      sx={{ opacity: isActive ? 1 : 0.5 }} // ✅ sx for dynamic
      style={{ width }} // ✅ inline for truly dynamic
    >
      <Typography className={styles.title}>Title</Typography>
    </Box>
  );
}
```

---

## 🔌 API Services Architecture

### Service Layer (`src/services/`)

Services encapsulate all API communication:

```typescript
// src/services/buildAPIService.ts
import axios from 'axios';
import { BuildRelease, BuildFilters } from 'types/builds';

const API_BASE = '/api';

export const buildAPIService = {
  /**
   * Fetch paginated builds list with filters
   */
  async getBuilds(params: {
    page?: number;
    limit?: number;
    search?: string;
    deviceFamily?: string;
    deviceType?: string;
    flagged?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ builds: BuildRelease[]; total: number }> {
    const response = await axios.get(`${API_BASE}/builds`, { params });
    return response.data;
  },

  /**
   * Upload new build files
   */
  async uploadBuild(formData: FormData): Promise<BuildRelease> {
    const response = await axios.post(`${API_BASE}/builds/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Update build flag status
   */
  async updateBuildFlag(id: string, isFaulty: boolean): Promise<BuildRelease> {
    const response = await axios.patch(`${API_BASE}/builds/${id}/flag`, {
      isFaulty,
    });
    return response.data;
  },

  /**
   * Delete a build
   */
  async deleteBuild(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/builds/${id}`);
  },
};
```

**Service Best Practices:**

- ✅ Group related API calls in one service file
- ✅ Use TypeScript for request/response types
- ✅ Add JSDoc comments for documentation
- ✅ Handle errors at the service level when appropriate
- ✅ Export a single object with all methods

---

## 🗄️ State Management (Redux + Saga)

### Store Structure

```
store/
├── store.ts              # Configure store
├── rootReducers.ts       # Combine all reducers
├── slices/               # Redux Toolkit slices (state + reducers)
│   ├── builds/
│   │   └── buildsSlice.ts
│   ├── tests/
│   │   └── testsSlice.ts
│   └── auth/
│       └── authSlice.ts
├── sagas/                # Redux-Saga for side effects
│   ├── index.ts          # Root saga
│   ├── buildsSaga.ts
│   └── testsSaga.ts
├── selectors/            # Memoized selectors
│   ├── buildsSelectors.ts
│   └── testsSelectors.ts
└── types/
    └── index.ts
```

### Slice Pattern (Redux Toolkit)

```typescript
// src/store/slices/builds/buildsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BuildRelease } from 'types/builds';

interface BuildsState {
  data: BuildRelease[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  loading: boolean;
  error: string | null;
  // Filters
  search: string;
  deviceFamily: string;
  deviceType: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const initialState: BuildsState = {
  data: [],
  totalCount: 0,
  page: 0,
  rowsPerPage: 10,
  loading: false,
  error: null,
  search: '',
  deviceFamily: '',
  deviceType: '',
};

const buildsSlice = createSlice({
  name: 'builds',
  initialState,
  reducers: {
    // Request actions (trigger sagas)
    fetchBuildsRequest: (
      state,
      action: PayloadAction<{
        page?: number;
        limit?: number;
        search?: string;
        // ... other params
      }>,
    ) => {
      state.loading = true;
      state.error = null;
    },

    // Success actions
    fetchBuildsSuccess: (
      state,
      action: PayloadAction<{
        builds: BuildRelease[];
        total: number;
      }>,
    ) => {
      state.data = action.payload.builds;
      state.totalCount = action.payload.total;
      state.loading = false;
    },

    // Failure actions
    fetchBuildsFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Synchronous actions
    setBuildsPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },

    setBuildsSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.page = 0; // Reset to first page on search
    },

    // Optimistic updates
    updateBuildFlagInState: (
      state,
      action: PayloadAction<{
        releaseId: string;
        isFaulty: boolean;
      }>,
    ) => {
      const build = state.data.find((b) => b.id === action.payload.releaseId);
      if (build) {
        build.isFaulty = action.payload.isFaulty;
      }
    },
  },
});

export const {
  fetchBuildsRequest,
  fetchBuildsSuccess,
  fetchBuildsFailure,
  setBuildsPage,
  setBuildsSearch,
  updateBuildFlagInState,
} = buildsSlice.actions;

export default buildsSlice.reducer;
```

### Saga Pattern (Side Effects)

```typescript
// src/store/sagas/buildsSaga.ts
import { call, put, takeLatest, select } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { buildAPIService } from 'services/buildAPIService';
import {
  fetchBuildsRequest,
  fetchBuildsSuccess,
  fetchBuildsFailure,
  updateBuildFlagRequest,
  updateBuildFlagSuccess,
} from 'store/slices/builds/buildsSlice';
import { toastService } from 'services/ToastService';

/**
 * Fetch builds list with filters
 */
function* fetchBuildsSaga(
  action: PayloadAction<{
    page?: number;
    limit?: number;
    search?: string;
    // ... other params
  }>,
) {
  try {
    const params = action.payload;

    // Call API service
    const response: { builds: BuildRelease[]; total: number } = yield call(
      buildAPIService.getBuilds,
      params,
    );

    // Dispatch success action
    yield put(
      fetchBuildsSuccess({
        builds: response.builds,
        total: response.total,
      }),
    );
  } catch (error: any) {
    // Handle error
    const message = error.response?.data?.message || 'Failed to fetch builds';
    yield put(fetchBuildsFailure(message));
    toastService.error(message);
  }
}

/**
 * Update build flag status
 */
function* updateBuildFlagSaga(
  action: PayloadAction<{
    id: string;
    isFaulty: boolean;
  }>,
) {
  try {
    const { id, isFaulty } = action.payload;

    // Optimistic update
    yield put(
      updateBuildFlagInState({
        releaseId: id,
        isFaulty,
      }),
    );

    // Call API
    yield call(buildAPIService.updateBuildFlag, id, isFaulty);

    // Show success message
    toastService.success(
      isFaulty ? 'Build flagged successfully' : 'Build unflagged successfully',
    );
  } catch (error: any) {
    // Revert optimistic update on error
    const message = error.response?.data?.message || 'Failed to update build';
    toastService.error(message);

    // Re-fetch to restore correct state
    yield put(fetchBuildsRequest({}));
  }
}

/**
 * Watch for actions
 */
export function* buildsSaga() {
  yield takeLatest(fetchBuildsRequest.type, fetchBuildsSaga);
  yield takeLatest(updateBuildFlagRequest.type, updateBuildFlagSaga);
}
```

### Selectors (Memoized)

```typescript
// src/store/selectors/buildsSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from 'store/store';

// Base selectors
export const selectBuildsState = (state: RootState) => state.builds;

// Memoized selectors
export const selectBuilds = createSelector(
  [selectBuildsState],
  (buildsState) => buildsState.data,
);

export const selectBuildsLoading = createSelector(
  [selectBuildsState],
  (buildsState) => buildsState.loading,
);

export const selectBuildsTotalCount = createSelector(
  [selectBuildsState],
  (buildsState) => buildsState.totalCount,
);

// Complex selectors with logic
export const selectFlaggedBuilds = createSelector([selectBuilds], (builds) =>
  builds.filter((build) => build.isFaulty === true),
);

export const selectBuildsByDeviceType = createSelector(
  [selectBuilds, (state: RootState, deviceType: string) => deviceType],
  (builds, deviceType) =>
    builds.filter((build) => build.deviceType === deviceType),
);
```

### Usage in Components

```tsx
// src/components/Builds/BuildsContainer.tsx
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import {
  fetchBuildsRequest,
  setBuildsPage,
  updateBuildFlagRequest,
} from 'store/slices/builds/buildsSlice';
import {
  selectBuilds,
  selectBuildsLoading,
  selectBuildsTotalCount,
} from 'store/selectors/buildsSelectors';

function BuildsContainer() {
  const dispatch = useDispatch();

  // Select data from store
  const builds = useSelector(selectBuilds);
  const loading = useSelector(selectBuildsLoading);
  const totalCount = useSelector(selectBuildsTotalCount);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchBuildsRequest({ page: 1, limit: 10 }));
  }, [dispatch]);

  // Event handlers
  const handlePageChange = (page: number) => {
    dispatch(setBuildsPage(page));
    dispatch(fetchBuildsRequest({ page: page + 1, limit: 10 }));
  };

  const handleFlagBuild = (id: string, isFaulty: boolean) => {
    dispatch(updateBuildFlagRequest({ id, isFaulty }));
  };

  return (
    <div>
      {loading ? (
        <Loader />
      ) : (
        <DataTable
          data={builds}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onFlagBuild={handleFlagBuild}
        />
      )}
    </div>
  );
}
```

---

## 📦 Index.ts Barrel Exports

### Purpose

Barrel exports simplify imports and create cleaner import statements.

### Pattern

```typescript
// ❌ Without barrel exports
import TestSuiteList from 'components/Tests/TestSuiteList/TestSuiteList';
import TestFilters from 'components/Tests/TestFilters/TestFilters';
import TestExecution from 'components/Tests/TestExecution/TestExecution';

// ✅ With barrel exports
import { TestSuiteList, TestFilters, TestExecution } from 'components/Tests';
```

### Implementation

#### Component-Level Barrel Export

```typescript
// src/components/Tests/TestSuiteList/index.ts
export { default } from './TestSuiteList';
export { default as TestSuiteHeader } from './TestSuiteHeader';
export { default as SelectAllSection } from './SelectAllSection';
export { default as TestSuiteItem } from './TestSuiteItem';
export { default as LoadingSuiteItem } from './LoadingSuiteItem';

// Export types if needed
export type { TestSuite, TestCase } from './helpers/selectionHelpers';
```

#### Feature-Level Barrel Export

```typescript
// src/components/Tests/index.ts
export { default as TestSuiteList } from './TestSuiteList';
export { default as TestFilters } from './TestFilters';
export { default as TestExecution } from './TestExecution';
export { default as ReportIssueDialog } from './ReportIssueDialog';

// Re-export types
export type { TestStatus, TestPlan, TestSuite } from './types';
```

#### Common Components Barrel Export

```typescript
// src/components/common/index.ts
export { default as CustomButton } from './CustomButton';
export { default as CustomCheckbox } from './CustomCheckbox';
export { default as DataTable } from './DataTable';
export { default as Modal } from './Modal';
export { default as Loader } from './Loader';
export { default as EmptyState } from './EmptyState';
```

#### Services Barrel Export

```typescript
// src/services/index.ts
export { buildAPIService } from './buildAPIService';
export { testsApiService } from './testsApiService';
export { deviceApiService } from './deviceApiService';
export { authApiService } from './authApiService';
export { toastService } from './ToastService';
```

#### Types Barrel Export

```typescript
// src/types/index.ts
export * from './builds';
export * from './tests';
export * from './components';
export * from './routes';
export * from './analytics';
```

### Usage Examples

```tsx
// ✅ Clean imports with barrel exports
import { TestSuiteList, TestFilters } from 'components/Tests';
import { CustomButton, DataTable, Loader } from 'components/common';
import { buildAPIService, toastService } from 'services';
import { BuildRelease, TestStatus } from 'types';

// Compare to without barrel exports:
// ❌ Verbose and redundant
import TestSuiteList from 'components/Tests/TestSuiteList/TestSuiteList';
import TestFilters from 'components/Tests/TestFilters/TestFilters';
import CustomButton from 'components/common/CustomButton/CustomButton';
import DataTable from 'components/common/DataTable/DataTable';
import Loader from 'components/common/Loader/Loader';
```

### Best Practices

✅ **Create index.ts for:**

- Component folders with multiple exports
- Feature folders (Tests, Builds, Dashboard)
- Common component collections
- Services directory
- Types directory
- Hooks directory

❌ **Don't create index.ts for:**

- Single-file modules (no need)
- Rarely imported modules
- When it adds no value

---

## 🔧 Creating New Files

### Component Creation Checklist

#### 1. Create Component File

```tsx
// src/components/Feature/ComponentName/ComponentName.tsx
import { Box, Typography } from '@mui/material';
import styles from './ComponentName.module.scss';

interface ComponentNameProps {
  title: string;
  onAction: () => void;
  isActive?: boolean;
}

/**
 * ComponentName - Brief description
 *
 * @param title - The title to display
 * @param onAction - Callback when action is triggered
 * @param isActive - Whether the component is in active state
 */
function ComponentName({
  title,
  onAction,
  isActive = false,
}: ComponentNameProps) {
  return (
    <Box className={styles.container}>
      <Typography className={styles.title}>{title}</Typography>
      <button onClick={onAction} disabled={!isActive}>
        Action
      </button>
    </Box>
  );
}

export default ComponentName;
```

#### 2. Create Styles File

```scss
// src/components/Feature/ComponentName/ComponentName.module.scss
.container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background-color: var(--mui-palette-background-paper);
  border-radius: 8px;
  border: 1px solid var(--mui-palette-divider);
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: var(--mui-palette-text-primary);
}
```

#### 3. Create Index File

```typescript
// src/components/Feature/ComponentName/index.ts
export { default } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

#### 4. Add to Feature Barrel Export

```typescript
// src/components/Feature/index.ts
export { default as ComponentName } from './ComponentName';
export { default as OtherComponent } from './OtherComponent';
```

### Helper Function Creation

```typescript
// src/utils/componentHelpers.ts

/**
 * Format a date string to display format
 *
 * @param dateString - ISO date string
 * @returns Formatted date (YYYY-MM-DD HH:mm)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

/**
 * Calculate percentage
 *
 * @param value - Current value
 * @param total - Total value
 * @returns Percentage (0-100)
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Debounce a function
 *
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
```

### Custom Hook Creation

```typescript
// src/hooks/useFeature.ts
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface UseFeatureOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

/**
 * Custom hook for feature logic
 *
 * @param options - Configuration options
 * @returns Feature state and actions
 */
export function useFeature(options: UseFeatureOptions = {}) {
  const { autoFetch = true, refreshInterval } = options;
  const dispatch = useDispatch();

  const [localState, setLocalState] = useState<string>('');
  const data = useSelector(selectFeatureData);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchFeatureRequest());
    }
  }, [autoFetch, dispatch]);

  // Refresh interval
  useEffect(() => {
    if (refreshInterval) {
      const intervalId = setInterval(() => {
        dispatch(fetchFeatureRequest());
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, dispatch]);

  // Memoized callbacks
  const handleUpdate = useCallback(
    (value: string) => {
      setLocalState(value);
      dispatch(updateFeatureRequest({ value }));
    },
    [dispatch],
  );

  return {
    data,
    localState,
    handleUpdate,
  };
}
```

### Type Definition Creation

```typescript
// src/types/feature.ts

/**
 * Feature item entity
 */
export interface FeatureItem {
  id: string;
  name: string;
  status: FeatureStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Feature status enum
 */
export enum FeatureStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

/**
 * Feature filters
 */
export interface FeatureFilters {
  search?: string;
  status?: FeatureStatus;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * API response for feature list
 */
export interface FeatureListResponse {
  items: FeatureItem[];
  total: number;
  page: number;
  limit: number;
}
```

---

## 📝 Best Practices Summary

### File Organization

✅ Group by feature/domain, not by type
✅ Use barrel exports (index.ts) for cleaner imports
✅ Keep files small (< 300 lines)
✅ One component per file

### Styling

✅ Use SCSS modules as default
✅ Use MUI theme CSS variables
✅ Use `sx` for 1-2 properties or dynamic styles
✅ Avoid inline styles unless truly dynamic

### State Management

✅ Use Redux Toolkit slices for state
✅ Use Redux-Saga for async operations
✅ Use memoized selectors (createSelector)
✅ Keep business logic in sagas, not components

### TypeScript

✅ Define interfaces for all props
✅ Export types from dedicated files
✅ Use type inference when possible
✅ Add JSDoc comments for complex types

### Components

✅ Keep components small and focused
✅ Extract logic to custom hooks
✅ Use helper functions for calculations
✅ Follow single responsibility principle

---

**Last Updated**: March 5, 2026
