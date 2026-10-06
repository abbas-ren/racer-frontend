// store/rootReducer.ts
import { combineReducers, type UnknownAction } from '@reduxjs/toolkit';
import {
  authReducer,
  dashboardReducer,
  deviceHeartbeatReducer,
  deviceReducer,
  logout,
  resetAuth,
  testsReducer,
  userDashboardReducer,
  userReducer,
  alertsReducers,
  buildsReducer,
  treeTopologyReducer,
  treeTopologyDataReducer,
} from './slices';
import userDevicesReducer from './slices/userDevices/userDevicesSlice';
import tabsReducer from './slices/testExecution/testExecutionsSlice';
import reportIssueReducer from './slices/issues/reportIssueSlice';
import uploadReducer from './slices/upload/uploadSlice';
import configurationReducer from './slices/configuration/configurationSlice';

// Combine without persisting yet
const appReducer = combineReducers({
  auth: authReducer,
  device: deviceReducer,
  users: userReducer,
  dashboard: dashboardReducer,
  tests: testsReducer,
  userDashboard: userDashboardReducer,
  heartbeat: deviceHeartbeatReducer,
  alerts: alertsReducers,
  userDevices: userDevicesReducer,
  testExecutions: tabsReducer,
  reportIssue: reportIssueReducer,
  builds: buildsReducer,
  upload: uploadReducer,
  configuration: configurationReducer,
  treeTopology: treeTopologyReducer,
  treeTopologyData: treeTopologyDataReducer,
});

// Inferred RootState from the combined reducers
export type RootState = ReturnType<typeof appReducer>;

// Reset logic
export const rootReducer = (
  state: RootState | undefined,
  action: UnknownAction,
) => {
  if (action.type === logout.type || action.type === resetAuth.type) {
    state = undefined; // Reset entire state
  }

  return appReducer(state, action);
};
