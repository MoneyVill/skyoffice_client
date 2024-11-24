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
  z-index: 1000;
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
  const [players, setPlayers] = useState<Array<{ name: string; creditRating: number; amount: number }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // 로딩 상태
  const [error, setError] = useState<string | null>(null); // 오류 상태
  const moneyvill_url = import.meta.env.VITE_MONEYVILL_URL
  console.log(moneyvill_url)
  useEffect(() => {
    const nationId = 1; // 전달할 nationId
    const socket = new WebSocket(moneyvill_url + `/ws/db-data?nationId=${nationId}`);

    socket.onopen = () => {
      console.log('WebSocket 연결 성공');
    };

    socket.onmessage = (event) => {
      console.log('받은 데이터:', event.data);
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
      if (!error) {
        setError('WebSocket 연결이 닫혔습니다.');
      }
    };

    // return () => {
    //   socket.close(); // 컴포넌트 언마운트 시 WebSocket 연결 해제
    // };
  }, []);

  if (isLoading) {
    return <ScoreboardWrapper>Loading...</ScoreboardWrapper>; // 로딩 상태 표시
  }

  if (error) {
    return <ScoreboardWrapper>{error}</ScoreboardWrapper>; // 오류 메시지 표시
  }

  return (
    <ScoreboardWrapper>
      <h3>Scoreboard</h3>
      {players.map((player, index) => (
        <PlayerRow key={index}>
          <PlayerName>{player.name}</PlayerName>
          <PlayerStats>
            {player.creditRating} pts | {player.amount} gold
          </PlayerStats>
        </PlayerRow>
      ))}
    </ScoreboardWrapper>
  );
};

export default Scoreboard;
