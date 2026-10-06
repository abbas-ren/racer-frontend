import { call, put, select, takeLatest } from 'redux-saga/effects';
import type { SagaIterator } from 'redux-saga';
import type { PayloadAction } from '@reduxjs/toolkit';
import {
  deleteController,
  fetchControllers,
  fetchRelayDeviceOptions,
  saveRelayConfiguration,
  updateController,
} from 'services/configurationApiService';
import { fetchRelayChannelsByRelayId } from 'services/deviceControllerAPIService';
import {
  deleteConfigurationControllerFailure,
  deleteConfigurationControllerRequest,
  deleteConfigurationControllerSuccess,
  fetchConfigurationControllersFailure,
  fetchConfigurationControllersRequest,
  fetchConfigurationControllersSuccess,
  loadMoreConfigurationControllersFailure,
  loadMoreConfigurationControllersRequest,
  loadMoreConfigurationControllersSuccess,
  loadMoreRelayDeviceOptionsFailure,
  loadMoreRelayDeviceOptionsRequest,
  loadMoreRelayDeviceOptionsSuccess,
  openConfigurationRelayDialogRequest,
  openConfigurationRelayDialogSuccess,
  openConfigurationRelayDialogFailure,
  saveConfigurationRelayFailure,
  saveConfigurationRelayRequest,
  saveConfigurationRelaySuccess,
  updateConfigurationControllerFailure,
  updateConfigurationControllerRequest,
  updateConfigurationControllerSuccess,
} from 'store/slices/configuration/configurationSlice';
import type { RootState } from 'store';
import type {
  ConfigurationSummary,
  ChannelHardwareAssignment,
  ControllerRow,
  RelayDeviceOption,
  RelayRow,
} from 'types/configuration';
import type { RelayChannelItem } from 'types/deviceController';
import toastService from 'services/ToastService';

const CONTROLLERS_PAGE_SIZE = 20;
const RELAY_DEVICES_PAGE_SIZE = 10;

const selectConfigurationState = (state: RootState) => state.configuration;

function* handleFetchConfigurationControllers(): SagaIterator {
  const configuration: ReturnType<typeof selectConfigurationState> =
    yield select(selectConfigurationState);

  try {
    const result: {
      rows: ControllerRow[];
      hasMore: boolean;
      summary: ConfigurationSummary;
    } = yield call(fetchControllers, {
      search: configuration.searchTerm,
      status: configuration.statusFilter,
      page: 1,
      limit: CONTROLLERS_PAGE_SIZE,
    });

    yield put(
      fetchConfigurationControllersSuccess({
        rows: result.rows,
        hasMore: result.hasMore,
        summary: result.summary,
      }),
    );
  } catch {
    yield put(
      fetchConfigurationControllersFailure(
        'Unable to load device controller data.',
      ),
    );
  }
}

function* handleLoadMoreConfigurationControllers(): SagaIterator {
  const configuration: ReturnType<typeof selectConfigurationState> =
    yield select(selectConfigurationState);

  const nextPage = configuration.currentPage + 1;

  try {
    const result: {
      rows: ControllerRow[];
      hasMore: boolean;
      summary: ConfigurationSummary;
    } = yield call(fetchControllers, {
      search: configuration.searchTerm,
      status: configuration.statusFilter,
      page: nextPage,
      limit: CONTROLLERS_PAGE_SIZE,
    });

    yield put(
      loadMoreConfigurationControllersSuccess({
        rows: result.rows,
        hasMore: result.hasMore,
      }),
    );
  } catch {
    yield put(loadMoreConfigurationControllersFailure());
  }
}

function* handleUpdateController(): SagaIterator {
  const configuration: ReturnType<typeof selectConfigurationState> =
    yield select(selectConfigurationState);

  const selectedController = configuration.controllerRows.find(
    (controller) =>
      controller.controllerId === configuration.selectedControllerId,
  );

  if (!selectedController) {
    return;
  }

  try {
    const updatedController: ControllerRow | null = yield call(
      updateController,
      {
        ...configuration.editForm,
        controllerId: selectedController.controllerId,
      },
    );

    if (!updatedController) {
      yield put(updateConfigurationControllerFailure());
      toastService.error(
        `Unable to update Device Controller ${selectedController.controllerId}.`,
      );
      return;
    }

    yield put(updateConfigurationControllerSuccess(updatedController));
    toastService.success(
      `Device Controller ${updatedController.controllerId} successfully updated.`,
    );

    // Reload controllers to refresh table and stats cards (especially after Gen3/4 -> Gen5 conversion)
    yield put(fetchConfigurationControllersRequest());
  } catch {
    yield put(updateConfigurationControllerFailure());
    toastService.error(
      `Unable to update Device Controller ${selectedController.controllerId}.`,
    );
  }
}

function* handleDeleteController(): SagaIterator {
  const configuration: ReturnType<typeof selectConfigurationState> =
    yield select(selectConfigurationState);

  const controllerId = configuration.selectedControllerId;

  if (!controllerId) {
    return;
  }

  try {
    const isDeleted: boolean = yield call(deleteController, controllerId);

    if (!isDeleted) {
      yield put(deleteConfigurationControllerFailure());
      toastService.error(`Unable to delete Device Controller ${controllerId}.`);
      return;
    }

    yield put(deleteConfigurationControllerSuccess(controllerId));
    toastService.success(`Device Controller ${controllerId} has been removed.`);
  } catch {
    yield put(deleteConfigurationControllerFailure());
    toastService.error(`Unable to delete Device Controller ${controllerId}.`);
  }
}

function* handleSaveRelayConfiguration(): SagaIterator {
  const configuration: ReturnType<typeof selectConfigurationState> =
    yield select(selectConfigurationState);

  const selectedRelayContext = configuration.selectedRelayContext;

  if (!selectedRelayContext) {
    return;
  }

  const currentController = configuration.controllerRows.find(
    (controller) =>
      controller.controllerId === selectedRelayContext.controllerId,
  );

  const changedChannels = Object.keys(configuration.channelAssignments).filter(
    (channelKey) =>
      configuration.channelAssignments[Number(channelKey)] !==
      configuration.originalChannelAssignments[Number(channelKey)],
  );

  const hasAnyDeviceAssignments = changedChannels.some(
    (channelKey) =>
      (configuration.channelAssignments[Number(channelKey)] ?? '').trim() !==
      '',
  );

  const waitForHardwareSync = hasAnyDeviceAssignments;

  try {
    const updatedController: ControllerRow | null = yield call(
      saveRelayConfiguration,
      {
        controllerId: selectedRelayContext.controllerId,
        relayId: selectedRelayContext.relay.relayId,
        assignments: configuration.channelAssignments,
        hardwareAssignments: configuration.channelHardwareAssignments,
        currentController,
      },
    );

    if (!updatedController) {
      yield put(saveConfigurationRelayFailure());
      toastService.error('Unable to save configuration.');
      return;
    }

    yield put(
      saveConfigurationRelaySuccess({
        controller: updatedController,
        waitForHardwareSync,
      }),
    );
    const relaySerial = selectedRelayContext.relay.serialNo?.trim();
    if (waitForHardwareSync) {
      toastService.success(
        relaySerial
          ? `Configuration saved for relay ${relaySerial}. Hardware sync in progress.`
          : 'Configuration saved. Hardware sync in progress.',
      );
    } else {
      toastService.success(
        relaySerial
          ? `Configuration saved for relay ${relaySerial}.`
          : 'Configuration saved.',
      );
    }
  } catch (error: unknown) {
    yield put(saveConfigurationRelayFailure());
    const axiosError = error as { response?: { data?: { message?: string } } };
    const backendMessage = axiosError?.response?.data?.message;
    toastService.error(backendMessage ?? 'Unable to save configuration.');
  }
}

function* handleOpenRelayDialog(
  action: PayloadAction<{ controllerId: string; relay: RelayRow }>,
): SagaIterator {
  const { relay, controllerId } = action.payload;

  try {
    const [channels, deviceOptionsResult]: [
      RelayChannelItem[],
      { devices: RelayDeviceOption[]; hasMore: boolean },
    ] = yield call(function* () {
      const channelsData: RelayChannelItem[] = yield call(
        fetchRelayChannelsByRelayId,
        relay.relayId,
      );
      const devicesData: { devices: RelayDeviceOption[]; hasMore: boolean } =
        yield call(
          fetchRelayDeviceOptions,
          1,
          RELAY_DEVICES_PAGE_SIZE,
          relay.relayId,
        );
      return [channelsData, devicesData];
    });

    const configuration: ReturnType<typeof selectConfigurationState> =
      yield select(selectConfigurationState);

    const currentController = configuration.controllerRows.find(
      (controller) => controller.controllerId === controllerId,
    );

    const mappings = currentController?.mappings ?? {};
    const channelAssignments: Record<number, string> = {};
    const channelHardwareAssignments: Record<
      number,
      ChannelHardwareAssignment
    > = {};
    const assignedDevices: Record<number, RelayDeviceOption | null> = {};

    channels.forEach((channel) => {
      channelAssignments[channel.channelNumber] = channel.deviceId ?? '';

      const mappedDeviceMac = channel.device?.macAddress ?? '';
      const normalizedDeviceMac = mappedDeviceMac
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
      const mappingKey = Object.keys(mappings).find(
        (key) =>
          key.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() ===
          normalizedDeviceMac,
      );
      const mappingEntry = mappingKey ? mappings[mappingKey] : undefined;

      channelHardwareAssignments[channel.channelNumber] = {
        gpio: mappingEntry?.gpio ?? '',
        gpioDefaultLevel: mappingEntry?.gpioDefaultLevel ?? 'LOW',
        relayDefaultLevel: mappingEntry?.relayDefaultLevel ?? 'LOW',
      };

      // Extract assigned device info from channel
      if (channel.device) {
        assignedDevices[channel.channelNumber] = {
          deviceId: channel.device.deviceId,
          deviceType: channel.device.deviceType ?? channel.device.deviceName,
          macAddress: channel.device.macAddress,
        };
      } else {
        assignedDevices[channel.channelNumber] = null;
      }
    });

    yield put(
      openConfigurationRelayDialogSuccess({
        channelAssignments,
        channelHardwareAssignments,
        assignedDevices,
        deviceOptions: deviceOptionsResult.devices,
        hasMoreDevices: deviceOptionsResult.hasMore,
      }),
    );
  } catch {
    yield put(openConfigurationRelayDialogFailure());
    toastService.error('Unable to load relay channel data.');
  }
}

function* handleLoadMoreRelayDeviceOptions(): SagaIterator {
  const configuration: ReturnType<typeof selectConfigurationState> =
    yield select(selectConfigurationState);

  const nextPage = configuration.relayDevicesPage + 1;
  const relayId = configuration.selectedRelayContext?.relay.relayId;

  try {
    const result: { devices: RelayDeviceOption[]; hasMore: boolean } =
      yield call(
        fetchRelayDeviceOptions,
        nextPage,
        RELAY_DEVICES_PAGE_SIZE,
        relayId,
      );

    yield put(
      loadMoreRelayDeviceOptionsSuccess({
        deviceOptions: result.devices,
        hasMoreDevices: result.hasMore,
      }),
    );
  } catch {
    yield put(loadMoreRelayDeviceOptionsFailure());
  }
}

export default function* watchConfiguration(): SagaIterator {
  yield takeLatest(
    fetchConfigurationControllersRequest.type,
    handleFetchConfigurationControllers,
  );
  yield takeLatest(
    loadMoreConfigurationControllersRequest.type,
    handleLoadMoreConfigurationControllers,
  );
  yield takeLatest(
    updateConfigurationControllerRequest.type,
    handleUpdateController,
  );
  yield takeLatest(
    deleteConfigurationControllerRequest.type,
    handleDeleteController,
  );
  yield takeLatest(
    saveConfigurationRelayRequest.type,
    handleSaveRelayConfiguration,
  );
  yield takeLatest(
    openConfigurationRelayDialogRequest.type,
    handleOpenRelayDialog,
  );
  yield takeLatest(
    loadMoreRelayDeviceOptionsRequest.type,
    handleLoadMoreRelayDeviceOptions,
  );
}
