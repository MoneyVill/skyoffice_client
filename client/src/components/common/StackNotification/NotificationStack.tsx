import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../stores';
import { removeNotification } from '../../../stores/NotificationStore';
import NotiTemplate from './NotiTemplate';
import { css, keyframes } from '@emotion/react';

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideOut = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
`;

const NotificationStack: React.FC = () => {
  const notifications = useSelector((state: RootState) => state.notification.notifications);
  const dispatch = useDispatch<AppDispatch>();
  const [removingIds, setRemovingIds] = useState<number[]>([]);

  useEffect(() => {
    notifications.forEach((notif) => {
      const timer = setTimeout(() => {
        setRemovingIds((prev) => [...prev, notif.id]); // 슬라이드 아웃 시작
        setTimeout(() => dispatch(removeNotification(notif.id)), 300); // 슬라이드 아웃 후 삭제
      }, notif.duration);

      return () => clearTimeout(timer);
    });
  }, [notifications, dispatch]);

  return (
    <div
      css={css`
        position: fixed;
        top: 16px; /* 화면 상단 중앙 */
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 320px; /* 전체 스택의 최대 너비 */
        width: 100%; /* 필요 시 부모의 가로 제한 */
        align-items: center; /* 알림이 가운데 정렬되도록 설정 */
        all: unset;
      `}
    >
      {notifications.map((notif) => (
        <div
          key={notif.id}
          css={css`
            animation: ${removingIds.includes(notif.id) ? slideOut : slideIn} 0.3s ease-out;
          `}
        >
          <NotiTemplate type={notif.type} content={notif.content} />
        </div>
      ))}
    </div>
  );
};

export default NotificationStack;
