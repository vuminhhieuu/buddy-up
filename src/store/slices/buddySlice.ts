import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type {
  BuddyFilters,
  BuddyProfile,
  BuddySearchResult,
  ConnectionRequest,
  IncomingRequest,
} from '../../types/buddy';
import { DEFAULT_BUDDY_FILTERS } from '../../types/buddy';
import * as buddyService from '../../services/buddy';
import type { RootState } from '../index';
import { signOutState } from './authSlice';
import type { RespondToBuddyRequestResponse } from '../../services/buddy';

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
  incomingRequests: IncomingRequest[];
  unreadRequestsCount: number;
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
  incomingRequests: [],
  unreadRequestsCount: 0,
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

/**
 * Async thunk to fetch incoming connection requests
 */
export const fetchIncomingRequestsAsync = createAsyncThunk<
  IncomingRequest[],
  void,
  { state: RootState }
>('buddy/fetchIncomingRequests', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const currentUserId = state.auth.userId;

    if (!currentUserId) {
      return rejectWithValue('User not authenticated');
    }

    const requests = await buddyService.fetchIncomingRequests(currentUserId);
    return requests;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch incoming requests';
    return rejectWithValue(errorMessage);
  }
});

type RespondToBuddyRequestPayload = {
  connectionId: string;
  connection: ConnectionRequest;
  action: 'accept' | 'reject';
};

type RespondToBuddyRequestError = {
  connectionId: string;
  error: string;
  errorCode?: string;
};

/**
 * Async thunk to respond to a buddy request (accept or reject)
 */
export const respondToBuddyRequestAsync = createAsyncThunk<
  RespondToBuddyRequestPayload,
  { connectionId: string; action: 'accept' | 'reject' },
  { state: RootState }
>(
  'buddy/respondToBuddyRequest',
  async ({ connectionId, action }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const currentUserId = state.auth.userId;

      if (!currentUserId) {
        return rejectWithValue({
          connectionId,
          error: 'User not authenticated',
          errorCode: 'UNAUTHORIZED',
        } as RespondToBuddyRequestError);
      }

      const response = await buddyService.respondToBuddyRequest(
        connectionId,
        currentUserId,
        action,
      );

      if (!response.success || !response.connection) {
        return rejectWithValue({
          connectionId,
          error: response.error || 'Failed to respond to request',
          errorCode: response.errorCode,
        } as RespondToBuddyRequestError);
      }

      return {
        connectionId,
        connection: response.connection,
        action,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to respond to request';
      return rejectWithValue({
        connectionId,
        error: message,
        errorCode: 'NETWORK_ERROR',
      } as RespondToBuddyRequestError);
    }
  },
);

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
    addIncomingRequest(state, action: PayloadAction<Omit<IncomingRequest, 'read'>>) {
      // Check if request already exists (idempotency)
      const existingIndex = state.incomingRequests.findIndex((req) => req.id === action.payload.id);
      if (existingIndex === -1) {
        state.incomingRequests.push({
          ...action.payload,
          read: false,
        });
        state.unreadRequestsCount += 1;
        console.log(
          '[buddySlice] Added new incoming request, unread count:',
          state.unreadRequestsCount,
        );
      } else {
        console.log('[buddySlice] Request already exists, skipping:', action.payload.id);
      }
    },
    markRequestAsRead(state, action: PayloadAction<string>) {
      const index = state.incomingRequests.findIndex((req) => req.id === action.payload);
      if (index !== -1 && !state.incomingRequests[index].read) {
        state.incomingRequests[index].read = true;
        state.unreadRequestsCount = Math.max(0, state.unreadRequestsCount - 1);
      }
    },
    clearIncomingRequests(state) {
      state.incomingRequests = [];
      state.unreadRequestsCount = 0;
    },
    removeIncomingRequest(state, action: PayloadAction<string>) {
      const index = state.incomingRequests.findIndex((req) => req.id === action.payload);
      if (index !== -1) {
        const request = state.incomingRequests[index];
        // Decrease unread count if request was unread
        if (!request.read) {
          state.unreadRequestsCount = Math.max(0, state.unreadRequestsCount - 1);
        }
        state.incomingRequests.splice(index, 1);
      }
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

    // fetchIncomingRequestsAsync
    builder
      .addCase(fetchIncomingRequestsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncomingRequestsAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Merge with existing requests (avoid duplicates and preserve read status)
        const existingMap = new Map(state.incomingRequests.map((req) => [req.id, req]));
        const mergedRequests: IncomingRequest[] = [];
        let newUnreadCount = 0;

        action.payload.forEach((req) => {
          const existing = existingMap.get(req.id);
          if (existing) {
            // Preserve existing read status
            mergedRequests.push(existing);
          } else {
            // New request - add it and count if unread
            mergedRequests.push(req);
            if (!req.read) {
              newUnreadCount += 1;
            }
          }
        });

        state.incomingRequests = mergedRequests;
        // Recalculate unread count from all merged requests to ensure accuracy
        const calculatedUnreadCount = mergedRequests.filter((req) => !req.read).length;
        state.unreadRequestsCount = calculatedUnreadCount;
        console.log('[buddySlice] Fetched incoming requests:', {
          totalRequests: mergedRequests.length,
          unreadCount: calculatedUnreadCount,
          newRequests: newUnreadCount,
        });
        state.error = null;
      })
      .addCase(fetchIncomingRequestsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // respondToBuddyRequestAsync
    builder
      .addCase(respondToBuddyRequestAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(respondToBuddyRequestAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the request from incoming requests
        const index = state.incomingRequests.findIndex(
          (req) => req.id === action.payload.connectionId,
        );
        if (index !== -1) {
          const request = state.incomingRequests[index];
          // Decrease unread count if request was unread
          if (!request.read) {
            state.unreadRequestsCount = Math.max(0, state.unreadRequestsCount - 1);
          }
          state.incomingRequests.splice(index, 1);
        }
        state.error = null;
      })
      .addCase(respondToBuddyRequestAsync.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as RespondToBuddyRequestError | undefined;
        state.error = payload?.error || 'Failed to respond to request';
      });

    // Clear buddy state when user signs out
    builder.addCase(signOutState, (state) => {
      state.incomingRequests = [];
      state.unreadRequestsCount = 0;
      state.results = [];
      state.requestStatuses = {};
      state.currentStackIndex = 0;
      state.currentPage = 1;
      state.hasMore = false;
      state.totalCount = 0;
      state.error = null;
    });
  },
});

export const {
  setFilters,
  resetFilters,
  setCurrentStackIndex,
  clearResults,
  addIncomingRequest,
  markRequestAsRead,
  clearIncomingRequests,
  removeIncomingRequest,
} = buddySlice.actions;

// Selectors
export const selectUnreadRequestsCount = (state: RootState) => state.buddy.unreadRequestsCount;
export const selectIncomingRequests = (state: RootState) => state.buddy.incomingRequests;
export const selectUnreadRequests = (state: RootState) =>
  state.buddy.incomingRequests.filter((req) => !req.read);

export default buddySlice.reducer;
