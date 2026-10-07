import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ChannelHardwareAssignment,
  ConfigurationSummary,
  ControllerRow,
  ControllerStatus,
  EditControllerForm,
  RelayDeviceOption,
  RelayRow,
  SelectedRelayContext,
} from 'types/configuration';

interface ConfigurationState {
  controllerRows: ControllerRow[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isSaving: boolean;
  isSyncingHardware: boolean;
  relayHardwareConfirmed: boolean;
  isLoadingRelayChannels: boolean;
  isLoadingMoreDevices: boolean;
  hasMoreDevices: boolean;
  relayDevicesPage: number;
  hasMore: boolean;
  currentPage: number;
  fetchError: string;
  searchTerm: string;
  statusFilter: 'All' | ControllerStatus;
  expandedRows: Record<string, boolean>;
  isEditDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  isConfigureRelayDialogOpen: boolean;
  selectedControllerId: string | null;
  selectedRelayContext: SelectedRelayContext | null;
  channelAssignments: Record<number, string>;
  channelHardwareAssignments: Record<number, ChannelHardwareAssignment>;
  assignedDevices: Record<number, RelayDeviceOption | null>;
  relayDeviceOptions: RelayDeviceOption[];
  summary: ConfigurationSummary;
  editForm: EditControllerForm;
  originalEditForm: EditControllerForm;
  originalChannelAssignments: Record<number, string>;
  originalChannelHardwareAssignments: Record<number, ChannelHardwareAssignment>;
}

const initialState: ConfigurationState = {
  controllerRows: [],
  isLoading: false,
  isLoadingMore: false,
  isSaving: false,
  isSyncingHardware: false,
  relayHardwareConfirmed: false,
  isLoadingRelayChannels: false,
  isLoadingMoreDevices: false,
  hasMoreDevices: true,
  relayDevicesPage: 1,
  hasMore: true,
  currentPage: 1,
  fetchError: '',
  searchTerm: '',
  statusFilter: 'All',
  expandedRows: {},
  isEditDialogOpen: false,
  isDeleteDialogOpen: false,
  isConfigureRelayDialogOpen: false,
  selectedControllerId: null,
  selectedRelayContext: null,
  channelAssignments: {},
  channelHardwareAssignments: {},
  assignedDevices: {},
  relayDeviceOptions: [],
  summary: {
    controllers: {
      total: 0,
      online: 0,
      offline: 0,
    },
    relays: {
      total: 0,
      online: 0,
      offline: 0,
    },
  },
  editForm: {
    controllerId: '',
    controllerName: '',
    ipAddress: '',
    generation: 'Gen 4',
  },
  originalEditForm: {
    controllerId: '',
    controllerName: '',
    ipAddress: '',
    generation: 'Gen 4',
  },
  originalChannelAssignments: {},
  originalChannelHardwareAssignments: {},
};

const configurationSlice = createSlice({
  name: 'configuration',
  initialState,
  reducers: {
    fetchConfigurationControllersRequest(state) {
      state.isLoading = true;
      state.fetchError = '';
      state.currentPage = 1;
      state.hasMore = true;
    },
    fetchConfigurationControllersSuccess(
      state,
      action: PayloadAction<{
        rows: ControllerRow[];
        hasMore: boolean;
        summary: ConfigurationSummary;
      }>,
    ) {
      state.controllerRows = action.payload.rows;
      state.hasMore = action.payload.hasMore;
      state.summary = action.payload.summary;
      state.currentPage = 1;
      state.expandedRows = {};
      state.isLoading = false;
      state.fetchError = '';
    },
    fetchConfigurationControllersFailure(state, action: PayloadAction<string>) {
      state.controllerRows = [];
      state.isLoading = false;
      state.hasMore = false;
      state.fetchError = action.payload;
    },

    loadMoreConfigurationControllersRequest(state) {
      state.isLoadingMore = true;
    },
    loadMoreConfigurationControllersSuccess(
      state,
      action: PayloadAction<{ rows: ControllerRow[]; hasMore: boolean }>,
    ) {
      state.controllerRows = [...state.controllerRows, ...action.payload.rows];
      state.hasMore = action.payload.hasMore;
      state.currentPage += 1;
      state.isLoadingMore = false;
    },
    loadMoreConfigurationControllersFailure(state) {
      state.isLoadingMore = false;
    },

    setConfigurationSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },
    setConfigurationStatusFilter(
      state,
      action: PayloadAction<'All' | ControllerStatus>,
    ) {
      state.statusFilter = action.payload;
    },
    clearConfigurationFilters(state) {
      state.searchTerm = '';
      state.statusFilter = 'All';
    },
    toggleConfigurationRowExpansion(state, action: PayloadAction<string>) {
      const controllerId = action.payload;
      state.expandedRows[controllerId] = !state.expandedRows[controllerId];
    },

    openConfigurationEditDialog(state, action: PayloadAction<ControllerRow>) {
      const row = action.payload;
      state.selectedControllerId = row.controllerId;
      const formData = {
        controllerId: row.controllerId,
        controllerName: row.controllerName,
        ipAddress: row.ipAddress,
        generation: row.generation,
      };
      state.editForm = formData;
      state.originalEditForm = formData;
      state.isEditDialogOpen = true;
    },
    closeConfigurationEditDialog(state) {
      state.isEditDialogOpen = false;
    },
    setConfigurationEditFormField(
      state,
      action: PayloadAction<{ field: keyof EditControllerForm; value: string }>,
    ) {
      state.editForm = {
        ...state.editForm,
        [action.payload.field]: action.payload.value,
      };
    },

    openConfigurationDeleteDialog(state, action: PayloadAction<ControllerRow>) {
      state.selectedControllerId = action.payload.controllerId;
      state.isDeleteDialogOpen = true;
    },
    closeConfigurationDeleteDialog(state) {
      state.isDeleteDialogOpen = false;
    },

    openConfigurationRelayDialogRequest(
      state,
      action: PayloadAction<{ controllerId: string; relay: RelayRow }>,
    ) {
      const { controllerId, relay } = action.payload;
      state.selectedRelayContext = { controllerId, relay };
      state.channelAssignments = {};
      state.assignedDevices = {};
      state.relayDeviceOptions = [];
      state.relayDevicesPage = 1;
      state.hasMoreDevices = true;
      state.isLoadingRelayChannels = true;
      state.isSyncingHardware = false;
      state.relayHardwareConfirmed = false;
      state.isConfigureRelayDialogOpen = true;
    },
    openConfigurationRelayDialogSuccess(
      state,
      action: PayloadAction<{
        channelAssignments: Record<number, string>;
        channelHardwareAssignments: Record<number, ChannelHardwareAssignment>;
        assignedDevices: Record<number, RelayDeviceOption | null>;
        deviceOptions: RelayDeviceOption[];
        hasMoreDevices: boolean;
      }>,
    ) {
      state.channelAssignments = action.payload.channelAssignments;
      state.originalChannelAssignments = action.payload.channelAssignments;
      state.channelHardwareAssignments =
        action.payload.channelHardwareAssignments;
      state.originalChannelHardwareAssignments =
        action.payload.channelHardwareAssignments;
      state.assignedDevices = action.payload.assignedDevices;
      state.relayDeviceOptions = action.payload.deviceOptions;
      state.hasMoreDevices = action.payload.hasMoreDevices;
      state.isLoadingRelayChannels = false;
    },
    openConfigurationRelayDialogFailure(state) {
      state.isLoadingRelayChannels = false;
    },
    closeConfigurationRelayDialog(state) {
      state.isConfigureRelayDialogOpen = false;
      state.isLoadingRelayChannels = false;
      state.isSaving = false;
      state.isSyncingHardware = false;
      state.relayHardwareConfirmed = false;
    },
    setConfigurationChannelAssignment(
      state,
      action: PayloadAction<{ channel: number; value: string }>,
    ) {
      state.channelAssignments[action.payload.channel] = action.payload.value;

      if (!action.payload.value?.trim()) {
        state.channelHardwareAssignments[action.payload.channel] = {
          gpio: '',
          gpioDefaultLevel: 'LOW',
          relayDefaultLevel: 'LOW',
        };
      }
    },
    setConfigurationChannelHardwareAssignment(
      state,
      action: PayloadAction<{
        channel: number;
        field: keyof ChannelHardwareAssignment;
        value: string;
      }>,
    ) {
      const current = state.channelHardwareAssignments[
        action.payload.channel
      ] ?? {
        gpio: '',
        gpioDefaultLevel: 'LOW',
        relayDefaultLevel: 'LOW',
      };

      state.channelHardwareAssignments[action.payload.channel] = {
        ...current,
        [action.payload.field]: action.payload.value,
      };
    },
    resetConfigurationChannelAssignments(state) {
      const selectedRelay = state.selectedRelayContext?.relay;

      if (!selectedRelay) {
        return;
      }

      const currentController = state.controllerRows.find(
        (controller) =>
          controller.controllerId === state.selectedRelayContext?.controllerId,
      );

      const latestRelay = currentController?.relays.find(
        (relay) => relay.relayId === selectedRelay.relayId,
      );

      const sourceRelay = latestRelay ?? selectedRelay;
      const assignments: Record<number, string> = {};
      const hardwareAssignments: Record<number, ChannelHardwareAssignment> = {};

      sourceRelay.relayChannels.forEach((channel) => {
        assignments[channel.channelNumber] = channel.deviceId ?? '';
        hardwareAssignments[channel.channelNumber] = {
          gpio: channel.gpio ?? '',
          gpioDefaultLevel: channel.gpioDefaultLevel ?? 'LOW',
          relayDefaultLevel: channel.relayDefaultLevel ?? 'LOW',
        };
      });

      state.channelAssignments = assignments;
      state.channelHardwareAssignments = hardwareAssignments;
    },

    loadMoreRelayDeviceOptionsRequest(state) {
      state.isLoadingMoreDevices = true;
    },
    loadMoreRelayDeviceOptionsSuccess(
      state,
      action: PayloadAction<{
        deviceOptions: RelayDeviceOption[];
        hasMoreDevices: boolean;
      }>,
    ) {
      state.relayDeviceOptions = [
        ...state.relayDeviceOptions,
        ...action.payload.deviceOptions,
      ];
      state.hasMoreDevices = action.payload.hasMoreDevices;
      state.relayDevicesPage += 1;
      state.isLoadingMoreDevices = false;
    },
    loadMoreRelayDeviceOptionsFailure(state) {
      state.isLoadingMoreDevices = false;
    },

    updateConfigurationControllerRequest(state) {
      state.isSaving = true;
    },
    updateConfigurationControllerSuccess(
      state,
      action: PayloadAction<ControllerRow>,
    ) {
      state.controllerRows = state.controllerRows.map((controller) =>
        controller.controllerId === action.payload.controllerId
          ? action.payload
          : controller,
      );
      state.isEditDialogOpen = false;
      state.isSaving = false;
    },
    updateConfigurationControllerFailure(state) {
      state.isSaving = false;
    },

    deleteConfigurationControllerRequest(state) {
      state.isSaving = true;
    },
    deleteConfigurationControllerSuccess(state, action: PayloadAction<string>) {
      const controllerId = action.payload;
      const removedController = state.controllerRows.find(
        (controller) => controller.controllerId === controllerId,
      );

      state.controllerRows = state.controllerRows.filter(
        (controller) => controller.controllerId !== controllerId,
      );

      if (removedController) {
        const removedRelayTotal = removedController.relaysTotal;
        const removedRelayOnline = removedController.relaysOnline;

        state.summary.controllers.total = Math.max(
          0,
          state.summary.controllers.total - 1,
        );

        if (removedController.status === 'Online') {
          state.summary.controllers.online = Math.max(
            0,
            state.summary.controllers.online - 1,
          );
        } else {
          state.summary.controllers.offline = Math.max(
            0,
            state.summary.controllers.offline - 1,
          );
        }

        state.summary.relays.total = Math.max(
          0,
          state.summary.relays.total - removedRelayTotal,
        );
        state.summary.relays.online = Math.max(
          0,
          state.summary.relays.online - removedRelayOnline,
        );
        state.summary.relays.offline = Math.max(
          0,
          state.summary.relays.offline -
            (removedRelayTotal - removedRelayOnline),
        );
      }

      if (state.expandedRows[controllerId]) {
        const nextExpandedRows = { ...state.expandedRows };
        delete nextExpandedRows[controllerId];
        state.expandedRows = nextExpandedRows;
      }

      state.isDeleteDialogOpen = false;
      state.isSaving = false;
    },
    deleteConfigurationControllerFailure(state) {
      state.isSaving = false;
    },

    saveConfigurationRelayRequest(
      state,
      _action: PayloadAction<{ waitForHardwareSync: boolean }>,
    ) {
      state.isSaving = true;
    },
    saveConfigurationRelaySuccess(
      state,
      action: PayloadAction<{
        controller: ControllerRow;
        waitForHardwareSync: boolean;
      }>,
    ) {
      const controllerId = action.payload.controller.controllerId;

      state.controllerRows = state.controllerRows.map((controller) =>
        controller.controllerId === controllerId
          ? action.payload.controller
          : controller,
      );
      state.isSaving = false;
      state.isSyncingHardware = action.payload.waitForHardwareSync;

      if (!action.payload.waitForHardwareSync) {
        state.isConfigureRelayDialogOpen = false;
      }
    },
    saveConfigurationRelayFailure(state) {
      state.isSaving = false;
      state.isSyncingHardware = false;
    },
    hardwareSyncCompleted(state) {
      state.isSyncingHardware = false;
      state.relayHardwareConfirmed = true;
    },
    hardwareSyncFailed(state) {
      state.isSyncingHardware = false;
      state.relayHardwareConfirmed = false;
    },
  },
});

export const {
  fetchConfigurationControllersRequest,
  fetchConfigurationControllersSuccess,
  fetchConfigurationControllersFailure,
  loadMoreConfigurationControllersRequest,
  loadMoreConfigurationControllersSuccess,
  loadMoreConfigurationControllersFailure,
  setConfigurationSearchTerm,
  setConfigurationStatusFilter,
  clearConfigurationFilters,
  toggleConfigurationRowExpansion,
  openConfigurationEditDialog,
  closeConfigurationEditDialog,
  setConfigurationEditFormField,
  openConfigurationDeleteDialog,
  closeConfigurationDeleteDialog,
  openConfigurationRelayDialogRequest,
  openConfigurationRelayDialogSuccess,
  openConfigurationRelayDialogFailure,
  closeConfigurationRelayDialog,
  setConfigurationChannelAssignment,
  setConfigurationChannelHardwareAssignment,
  resetConfigurationChannelAssignments,
  loadMoreRelayDeviceOptionsRequest,
  loadMoreRelayDeviceOptionsSuccess,
  loadMoreRelayDeviceOptionsFailure,
  updateConfigurationControllerRequest,
  updateConfigurationControllerSuccess,
  updateConfigurationControllerFailure,
  deleteConfigurationControllerRequest,
  deleteConfigurationControllerSuccess,
  deleteConfigurationControllerFailure,
  saveConfigurationRelayRequest,
  saveConfigurationRelaySuccess,
  saveConfigurationRelayFailure,
  hardwareSyncCompleted,
  hardwareSyncFailed,
} = configurationSlice.actions;

export default configurationSlice.reducer;
