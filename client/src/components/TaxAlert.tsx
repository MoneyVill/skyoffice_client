import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// 스타일 정의
const TaxAlertWrapper = styled.div`
  position: fixed;
  bottom: 10px;
  left: 10px;
  width: 300px;
  background: rgba(255, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 8px;
  z-index: 100;
  animation: fadeInOut 5s ease-in-out;

  @keyframes fadeInOut {
    0%, 100% { opacity: 0; }
    10%, 90% { opacity: 1; }
  }
`;

const TaxDetails = styled.div`
  margin-bottom: 5px;
`;

const TaxAlert: React.FC = () => {
  const [taxDetails, setTaxDetails] = useState<
    Array<{ nickname: string; taxAmount: number; rankPosition: number }>
  >([]);

  useEffect(() => {
    const socket = new WebSocket(import.meta.env.VITE_MODOO_API_URL + `/api/ws/tax-data`);
    console.log(import.meta.env.VITE_MODOO_API_URL + "/api/ws/tax-data");

    socket.onmessage = (event) => {
      try {
        const receivedData = JSON.parse(event.data);
        setTaxDetails(receivedData);

        // 알림은 5초 후 사라지도록 설정
        setTimeout(() => setTaxDetails([]), 5000);
      } catch (error) {
        console.error('WebSocket 데이터 처리 오류:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket 오류:', error);
    };

    socket.onclose = (event) => {
      console.log('WebSocket 닫힘:', event.code, event.reason);
    };

    return () => {
      socket.close();
    };
  }, []);

  if (taxDetails.length === 0) {
    return null; // 데이터가 없으면 렌더링하지 않음
  }

  return (
    <TaxAlertWrapper>
      <h4>세금 알림</h4>
      {taxDetails.map((detail, index) => (
        <TaxDetails key={index}>
          {`${detail.nickname}: ${detail.taxAmount.toLocaleString()}원`}
        </TaxDetails>
      ))}
    </TaxAlertWrapper>
  );
};

export default TaxAlert;
