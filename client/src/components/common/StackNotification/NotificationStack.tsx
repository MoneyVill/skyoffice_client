// client/src/components/common/StackNotification/NotificationStack.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../stores';
import { removeNotification } from '../../../stores/NotificationStore';
import NotiTemplate from './NotiTemplate';
import { css, keyframes } from '@emotion/react';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const NotificationStack: React.FC = () => {
  const notifications = useSelector((state: RootState) => state.notification.notifications);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    notifications.forEach((notif) => {
      const timer = setTimeout(() => {
        dispatch(removeNotification(notif.id));
      }, notif.duration);

      return () => clearTimeout(timer);
    });
  }, [notifications, dispatch]);
  
  return (
    <div
      css={css`
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 8px;
      `}
    >
      {notifications.map((notif) => (
        <div
          key={notif.id}
          css={css`
            animation: ${fadeIn} 0.3s ease-out;
          `}
        >
          <NotiTemplate type={notif.type} content={notif.content} />
        </div>
      ))}
    </div>
  );
};

export default NotificationStack;
