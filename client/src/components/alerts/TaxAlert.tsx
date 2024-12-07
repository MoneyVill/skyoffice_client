import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import useWebSocket from '../../hooks/useWebSocket';

const TaxAlertWrapper = styled.div`
  position: fixed;
  bottom: 120px;
  right: 16px; /* 위치를 조정 가능 */
  background: #ff6b6b;
  color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  animation: fadeInOut 5s ease-in-out; /* 알림이 5초 후 사라지도록 설정 */

  @keyframes fadeInOut {
    0%, 100% {
      opacity: 0;
      transform: translateY(50px);
    }
    10%, 90% {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const TaxAlertHeader = styled.h4`
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: bold;
`;

const TaxAlertItem = styled.p`
  margin: 0;
  font-size: 14px;
`;

const TaxAlert: React.FC = () => {
  const { taxAlerts } = useWebSocket(); // useWebSocket 훅에서 상태 가져오기
  const [visibleAlert, setVisibleAlert] = useState<{ nickname: string; taxAmount: number } | null>(null);

  useEffect(() => {
    if (taxAlerts.length > 0) {
      const latestAlert = taxAlerts[taxAlerts.length - 1]; // 가장 최근 알림 가져오기
      setVisibleAlert(latestAlert);

      // 콘솔에 세금 알림 로그 추가
      console.log('New tax alert received:', latestAlert);

      // 5초 후 알림 닫기
      const timer = setTimeout(() => {
        setVisibleAlert(null);
      }, 5000);

      return () => clearTimeout(timer); // 컴포넌트 언마운트 시 타이머 정리
    }
  }, [taxAlerts]);

  if (!visibleAlert) {
    return null; // 알림이 없으면 아무것도 렌더링하지 않음
  }

  return (
    <TaxAlertWrapper>
      <TaxAlertHeader>자산세 알림</TaxAlertHeader>
      <TaxAlertItem>
        {`${visibleAlert.nickname}님의 세금은 ${visibleAlert.taxAmount.toLocaleString()}원입니다.`}
      </TaxAlertItem>
    </TaxAlertWrapper>
  );
};

export default TaxAlert;
