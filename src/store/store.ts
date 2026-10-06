// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import {
  persistStore,
  persistReducer,
  createTransform,
  PersistConfig,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { watchLogin } from './sagas/auth/authSaga';
import watchDevice from './sagas/device/deviceSaga';
import watchUserDevices from './sagas/userDevices/userDevicesSaga';
import watchUsers from './sagas/user/userSaga';
import { rootReducer } from './rootReducers';
import { watchTestsFormSaga } from './sagas/tests/testsSaga';
import { watchDashboard } from './sagas';
import watchAlerts from './sagas/alerts/alertsSaga';
import watchTabs from './sagas/testExecution/testExecutionsSaga';
import watchReportIssue from './sagas/issues/reportIssueSaga';
import watchBuilds from './sagas/builds/buildsSaga';
import watchConfiguration from './sagas/configuration/configurationSaga';
import watchUserDashboard from './sagas/dashboard/userDashboardSaga';
import watchTreeTopologyData from './sagas/treeTopology/treeTopologyDataSaga';
import { TestsInitialState, TestsState } from './slices';

const sagaMiddleware = createSagaMiddleware();

const testsTransform = createTransform(
  (inboundState: TestsState) => {
    return {
      testCasesBySuiteId: inboundState.testCasesBySuiteId,
      testPlans: inboundState.testPlans,
    };
  },
  (outboundState: Partial<TestsState>): TestsState => {
    return {
      ...TestsInitialState,
      testCasesBySuiteId: outboundState.testCasesBySuiteId ?? {},
      testPlans: outboundState.testPlans ?? {},
    };
  },
  { whitelist: ['tests'] },
);

const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: 'root',
  storage,
  whitelist: ['auth', 'tests', 'testExecutions'],
  transforms: [testsTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(watchLogin);
sagaMiddleware.run(watchDevice);
sagaMiddleware.run(watchUserDevices);
sagaMiddleware.run(watchUsers);
sagaMiddleware.run(watchTestsFormSaga);
sagaMiddleware.run(watchDashboard);
sagaMiddleware.run(watchAlerts);
sagaMiddleware.run(watchTabs);
sagaMiddleware.run(watchReportIssue);
sagaMiddleware.run(watchBuilds);
sagaMiddleware.run(watchConfiguration);
sagaMiddleware.run(watchUserDashboard);
sagaMiddleware.run(watchTreeTopologyData);

const persistor = persistStore(store);

export const clearPersistedState = () => {
  persistor.purge();
  console.log('Redux Persist storage cleared.');
};

export default store;
export { persistor };
export type RootState = ReturnType<typeof store.getState>;
export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
