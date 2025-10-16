import { configureStore } from '@reduxjs/toolkit';
import profileReducer from './slices/profileSlice';
import eventReducer from './slices/eventSlice';

export const store = configureStore({
  reducer: {
    profiles: profileReducer,
    events: eventReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;