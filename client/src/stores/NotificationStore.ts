// client/src/stores/NotificationStore.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: number;
  content: React.ReactNode;
  duration: number;
  type: 'alert' | 'ok';
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

let nextNotificationId = 0;

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<{ content: React.ReactNode; duration?: number; type?: 'alert' | 'ok' }>
    ) => {
      const { content, duration = 2000, type = 'alert' } = action.payload;
      state.notifications.push({
        id: nextNotificationId++,
        content,
        duration,
        type,
      });
    },
    removeNotification: (state, action: PayloadAction<number>) => {
      state.notifications = state.notifications.filter((notif) => notif.id !== action.payload);
    },
  },
});

export const { addNotification, removeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
