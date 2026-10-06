import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { GraphEdge, GraphNode, GraphTransform } from 'typesCustom/treeTopology';
import { RootState } from 'store';

export interface TreeTopologyState {
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  graphTransform: GraphTransform;
  graphIsPanning: boolean;
  graphSidebarNodeId: string | null;
  graphSearchQuery: string;
  graphHighlightedPath: string[];
  graphSelectedNodeId: string | null;
  graphHoveredNodeId: string | null;
  graphCollapsedControllers: string[];
  graphActiveDropdown: string | null;
}

const initialState: TreeTopologyState = {
  graphNodes: [],
  graphEdges: [],
  graphTransform: {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    y: 100,
    k: 1,
  },
  graphIsPanning: false,
  graphSidebarNodeId: null,
  graphSearchQuery: '',
  graphHighlightedPath: [],
  graphSelectedNodeId: null,
  graphHoveredNodeId: null,
  graphCollapsedControllers: [],
  graphActiveDropdown: null,
};

const treeTopologySlice = createSlice({
  name: 'treeTopology',
  initialState,
  reducers: {
    setGraphData: (
      state,
      action: PayloadAction<{ nodes: GraphNode[]; edges: GraphEdge[] }>,
    ) => {
      state.graphNodes = action.payload.nodes;
      state.graphEdges = action.payload.edges;
    },
    setGraphTransform: (state, action: PayloadAction<GraphTransform>) => {
      state.graphTransform = action.payload;
    },
    updateGraphTransform: (
      state,
      action: PayloadAction<Partial<GraphTransform>>,
    ) => {
      state.graphTransform = { ...state.graphTransform, ...action.payload };
    },
    setGraphIsPanning: (state, action: PayloadAction<boolean>) => {
      state.graphIsPanning = action.payload;
    },
    setGraphSidebarNodeId: (state, action: PayloadAction<string | null>) => {
      state.graphSidebarNodeId = action.payload;
    },
    setGraphSearchQuery: (state, action: PayloadAction<string>) => {
      state.graphSearchQuery = action.payload;
    },
    setGraphHighlightedPath: (state, action: PayloadAction<string[]>) => {
      state.graphHighlightedPath = action.payload;
    },
    setGraphSelectedNodeId: (state, action: PayloadAction<string | null>) => {
      state.graphSelectedNodeId = action.payload;
    },
    setGraphHoveredNodeId: (state, action: PayloadAction<string | null>) => {
      state.graphHoveredNodeId = action.payload;
    },
    setGraphCollapsedControllers: (state, action: PayloadAction<string[]>) => {
      state.graphCollapsedControllers = action.payload;
    },
    setGraphActiveDropdown: (state, action: PayloadAction<string | null>) => {
      state.graphActiveDropdown = action.payload;
    },
    clearGraphSelection: (state) => {
      state.graphHighlightedPath = [];
      state.graphSelectedNodeId = null;
      state.graphSidebarNodeId = null;
      state.graphSearchQuery = '';
    },
  },
});

export const {
  setGraphData,
  setGraphTransform,
  updateGraphTransform,
  setGraphIsPanning,
  setGraphSidebarNodeId,
  setGraphSearchQuery,
  setGraphHighlightedPath,
  setGraphSelectedNodeId,
  setGraphHoveredNodeId,
  setGraphCollapsedControllers,
  setGraphActiveDropdown,
  clearGraphSelection,
} = treeTopologySlice.actions;

export const selectTreeTopologyState = (state: RootState): TreeTopologyState =>
  state.treeTopology;

export default treeTopologySlice.reducer;
