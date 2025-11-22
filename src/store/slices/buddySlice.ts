import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type {
  BuddyFilters,
  BuddyProfile,
  BuddySearchResult,
  ConnectionRequest,
} from '../../types/buddy';
import { DEFAULT_BUDDY_FILTERS } from '../../types/buddy';
import * as buddyService from '../../services/buddy';
import type { RootState } from '../index';

export interface BuddyState {
  filters: BuddyFilters;
  results: BuddyProfile[];
  currentStackIndex: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  requestStatuses: Record<string, 'idle' | 'pending' | 'sent' | 'error'>;
}

const initialState: BuddyState = {
  filters: DEFAULT_BUDDY_FILTERS,
  results: [],
  currentStackIndex: 0,
  loading: false,
  error: null,
  hasMore: false,
  totalCount: 0,
  currentPage: 1,
  requestStatuses: {},
};

/**
 * Async thunk to search buddies
 */
export const searchBuddiesAsync = createAsyncThunk<
  BuddySearchResult,
  { filters: BuddyFilters; currentUserId: string; page?: number },
  { state: RootState }
>('buddy/searchBuddies', async ({ filters, currentUserId, page = 1 }, { rejectWithValue }) => {
  try {
    const result = await buddyService.searchBuddies(filters, currentUserId, {
      page,
      limit: 20,
    });
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to search buddies';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Async thunk to load more buddies (pagination)
 */
export const loadMoreBuddiesAsync = createAsyncThunk<BuddySearchResult, void, { state: RootState }>(
  'buddy/loadMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { buddy, auth } = state;
      const { filters, currentPage } = buddy;
      const currentUserId = auth.userId;

      if (!currentUserId) {
        return rejectWithValue('User not authenticated');
      }

      const nextPage = currentPage + 1;
      const result = await buddyService.searchBuddies(filters, currentUserId, {
        page: nextPage,
        limit: 20,
      });
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load more buddies';
      return rejectWithValue(errorMessage);
    }
  },
);

type SendBuddyRequestPayload = {
  targetUserId: string;
  connection: ConnectionRequest;
};

type SendBuddyRequestError = {
  targetUserId: string;
  error: string;
  errorCode?: string;
};

export const sendBuddyRequestAsync = createAsyncThunk<
  SendBuddyRequestPayload,
  { targetUserId: string },
  { state: RootState }
>('buddy/sendBuddyRequest', async ({ targetUserId }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const currentUserId = state.auth.userId;

    if (!currentUserId) {
      return rejectWithValue({
        targetUserId,
        error: 'User not authenticated',
        errorCode: 'INVALID_USER',
      } as SendBuddyRequestError);
    }

    const response = await buddyService.sendBuddyRequest(currentUserId, targetUserId);

    if (!response.success || !response.connection) {
      return rejectWithValue({
        targetUserId,
        error: response.error || 'Failed to send request',
        errorCode: response.errorCode,
      } as SendBuddyRequestError);
    }

    return {
      targetUserId,
      connection: response.connection,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send request';
    return rejectWithValue({
      targetUserId,
      error: message,
      errorCode: 'NETWORK_ERROR',
    } as SendBuddyRequestError);
  }
});

const buddySlice = createSlice({
  name: 'buddy',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<BuddyFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters(state) {
      state.filters = DEFAULT_BUDDY_FILTERS;
      state.results = [];
      state.currentStackIndex = 0;
      state.currentPage = 1;
      state.hasMore = false;
      state.totalCount = 0;
      state.error = null;
      state.requestStatuses = {};
    },
    setCurrentStackIndex(state, action: PayloadAction<number>) {
      state.currentStackIndex = action.payload;
    },
    clearResults(state) {
      state.results = [];
      state.currentStackIndex = 0;
      state.currentPage = 1;
      state.hasMore = false;
      state.totalCount = 0;
      state.error = null;
      state.requestStatuses = {};
    },
  },
  extraReducers: (builder) => {
    // searchBuddiesAsync
    builder
      .addCase(searchBuddiesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchBuddiesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.profiles;
        state.totalCount = action.payload.totalCount;
        state.hasMore = action.payload.hasMore;
        state.currentPage = action.payload.currentPage;
        state.currentStackIndex = 0;
        state.error = null;
      })
      .addCase(searchBuddiesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // loadMoreBuddiesAsync
    builder
      .addCase(loadMoreBuddiesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadMoreBuddiesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.results = [...state.results, ...action.payload.profiles];
        state.totalCount = action.payload.totalCount;
        state.hasMore = action.payload.hasMore;
        state.currentPage = action.payload.currentPage;
        state.error = null;
      })
      .addCase(loadMoreBuddiesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(sendBuddyRequestAsync.pending, (state, action) => {
        state.requestStatuses[action.meta.arg.targetUserId] = 'pending';
      })
      .addCase(sendBuddyRequestAsync.fulfilled, (state, action) => {
        state.requestStatuses[action.payload.targetUserId] = 'sent';
      })
      .addCase(sendBuddyRequestAsync.rejected, (state, action) => {
        const payload = action.payload as SendBuddyRequestError | undefined;
        const targetUserId = payload?.targetUserId ?? action.meta.arg.targetUserId;
        state.requestStatuses[targetUserId] = 'error';
      });
  },
});

export const { setFilters, resetFilters, setCurrentStackIndex, clearResults } = buddySlice.actions;
export default buddySlice.reducer;
