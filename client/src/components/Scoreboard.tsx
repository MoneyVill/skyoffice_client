import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ScoreboardWrapper = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  width: 300px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 8px;
  z-index: 10;
`;

const PlayerRow = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 5px 0;

  &:last-child {
    border-bottom: none;
  }
`;

const PlayerName = styled.span`
  font-weight: bold;
`;

const PlayerStats = styled.span`
  color: lightgreen;
`;

const Scoreboard = () => {
  const [players, setPlayers] = useState<Array<{ nickname: string; totalMoney: number }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // const moneyvill_url = ;

  const connectWebSocket = () => {
    // console.log(moneyvill_url)
    const socket = new WebSocket(import.meta.env.VITE_MODOO_API_URL + `/api/ws/db-data`);

    socket.onopen = () => {
      console.log('WebSocket 연결 성공');
      setError(null); // 이전 오류 초기화
    };

    socket.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setPlayers(parsedData); // 플레이어 데이터 업데이트
        setIsLoading(false); // 로딩 완료
      } catch (error) {
        console.error('JSON 파싱 오류:', error);
        setError('데이터를 처리하는 중 오류가 발생했습니다.');
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket 오류:', error);
      setError('WebSocket 연결 중 오류가 발생했습니다.');
    };

    socket.onclose = (event) => {
      console.log('WebSocket 닫힘:', event.code, event.reason);
      // setError('WebSocket 연결이 닫혔습니다. 다시 연결 시도 중...');
      setTimeout(() => connectWebSocket(), 3000); // 3초 후 다시 연결 시도
    };

    return socket;
  };

  useEffect(() => {
    const socket = connectWebSocket();

    // 컴포넌트가 언마운트될 때 WebSocket 닫기
    return () => {
      socket.close();
    };
  }, []);

  if (isLoading) {
    return <ScoreboardWrapper>Loading...</ScoreboardWrapper>;
  }

  return (
    <ScoreboardWrapper>
      <h3>Scoreboard</h3>
      {players.map((player, index) => (
        <PlayerRow key={index}>
          <PlayerName>{player.nickname}</PlayerName>
          <PlayerStats>
            {player.totalMoney} gold
          </PlayerStats>
        </PlayerRow>
      ))}
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
    </ScoreboardWrapper>
  );
};

export default Scoreboard;