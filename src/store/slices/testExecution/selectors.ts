import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store/store';
import type { SingleTabState, TabFilters, TabData } from './types';

// Base selectors
export const selectTabsState = (state: RootState) => state.testExecutions;

export const selectActiveTabId = (state: RootState) =>
  state.testExecutions.activeTabId;

export const selectTabsById = (state: RootState) =>
  state.testExecutions.tabsById;

export const selectTabOrder = (state: RootState) =>
  state.testExecutions.tabOrder;

export const selectIsCreatingTab = (state: RootState) =>
  state.testExecutions.isCreatingDefaultTab;

export const selectTabsError = (state: RootState) => state.testExecutions.error;

// Memoized selectors
export const selectActiveTab = createSelector(
  [selectActiveTabId, selectTabsById],
  (activeTabId, tabsById): SingleTabState | undefined => {
    return activeTabId ? tabsById[activeTabId] : undefined;
  },
);

export const selectActiveTabFilters = createSelector(
  [selectActiveTab],
  (activeTab): TabFilters | undefined => activeTab?.values.filters,
);

export const selectActiveTabData = createSelector(
  [selectActiveTab],
  (activeTab): TabData | undefined => activeTab?.values.data,
);

// Specific tab selectors (factory pattern)
export const selectTabById = (tabId: string) =>
  createSelector(
    [selectTabsById],
    (tabsById): SingleTabState | undefined => tabsById[tabId],
  );

export const selectTabFilters = (tabId: string) =>
  createSelector(
    [selectTabById(tabId)],
    (tab): TabFilters | undefined => tab?.values.filters,
  );

export const selectTabData = (tabId: string) =>
  createSelector(
    [selectTabById(tabId)],
    (tab): TabData | undefined => tab?.values.data,
  );

// Resource-specific selectors for active tab
export const selectActiveTabDeviceFamilies = createSelector(
  [selectActiveTabData],
  (data) => data?.deviceFamilies,
);

export const selectActiveTabDeviceTypes = createSelector(
  [selectActiveTabData],
  (data) => data?.deviceTypes,
);

export const selectActiveTabBuilds = createSelector(
  [selectActiveTabData],
  (data) => data?.builds,
);

export const selectActiveTabTestPlans = createSelector(
  [selectActiveTabData],
  (data) => data?.testPlans,
);

export const selectActiveTabTestSuites = createSelector(
  [selectActiveTabData],
  (data) => data?.testSuites,
);

export const selectActiveTabSelectionRules = createSelector(
  [selectActiveTabData],
  (data) => data?.testPlanSelectionRules,
);

// All tabs as array
export const selectAllTabs = createSelector(
  [selectTabOrder, selectTabsById],
  (tabOrder, tabsById): SingleTabState[] =>
    tabOrder.map((id) => tabsById[id]).filter(Boolean),
);

// Check if any tab is loading
export const selectIsAnyTabLoading = createSelector(
  [selectAllTabs],
  (tabs): boolean => tabs.some((tab) => tab.status === 'loading'),
);

export const selectIsAnyExecutionSubmitting = createSelector(
  [selectAllTabs],
  (tabs): boolean => tabs.some((tab) => Boolean(tab.isSubmittingExecution)),
);
