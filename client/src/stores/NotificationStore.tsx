/** @jsxImportSource @emotion/react */
import React from 'react';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { css } from '@emotion/react';

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
      action: PayloadAction<{ content: React.ReactNode | string; duration?: number; type?: 'alert' | 'ok' }>
    ) => {
      const { content, duration = 2000, type = 'alert' } = action.payload;
    
      // Emotion의 스타일을 적용한 JSX
      const wrappedContent =
        typeof content === 'string' ? (
          <div
            css={css`
              padding: 16px;
              background-color: ${type === 'alert' ? '#f8d7da' : '#d4edda'};
              border-radius: 8px;
              color: ${type === 'alert' ? '#721c24' : '#155724'};
              max-width: 400px;
              width: fit-content;
              text-align: center;
              display: flex;
              white-space: pre-line;
              margin: 0 auto;
              word-wrap: break-word;
              overflow-wrap: break-word;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            `}
          >
            {content}
          </div>
        ) : (
          content
        );
    
      state.notifications.push({
        id: nextNotificationId++,
        content: wrappedContent,
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
