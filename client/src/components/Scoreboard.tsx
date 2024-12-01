import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ScoreboardWrapper = styled.div`
  position: fixed;
  top: 19px;
  right: 10px;
  width: 300px;
  background: #FEF3F3;
  color: #7a7a7a;
  padding: 16px;
  border-radius: 0.5rem;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 153, 153, 0.5);
  z-index: 10;
`;

const PlayerRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 153, 153, 0.2);
  padding: 12px 0;
  &:last-child {
    border-bottom: none;
  }
`;

const PlayerName = styled.span`
  font-weight: bold;
  font-size: 1rem;
  color: #F99F9F;
`;

const PlayerStats = styled.span`
  font-weight: bold;
  font-size: 0.9rem;
  color: #4CAF50;
`;

const HeaderSection = styled.div`
  display: flex;
  background: #FCCACA;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
  margin: -16px -16px 16px -16px;
`;

const Title = styled.div`
  width: fit-content;
  background: #F99F9F;
  border-top-left-radius: 0.5rem;
  padding: 0.25rem 2.5rem;
  color: #ffffff;
  font-weight: bold;
  font-size: 1rem;

  @media (min-width: 1024px) {
    padding: 0.5rem 4rem;
    font-size: 1.6rem;
  }
`;
const PlayerNameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RankIcon = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
`;

const RankNumber = styled.span`
  color: #F99F9F;
  font-weight: bold;
  font-size: 1rem;
  margin-right: 8px;
`;

const Scoreboard = () => {
  const [players, setPlayers] = useState<Array<{ nickname: string; totalMoney: number }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const connectWebSocket = () => {
    const socket = new WebSocket(import.meta.env.VITE_MODOO_API_URL + `/api/ws/db-data`);

    socket.onopen = () => {
      console.log('WebSocket 연결 성공');
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setPlayers(parsedData);
        setIsLoading(false);
      } catch (error) {
        console.error('JSON 파싱 오류:', error);
        setError('데이터를 처리하는 중 오류가 발생했습니다.');
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket 오류:', error);
      setError('WebSocket 연결 중 오류가 발생했습니다.');
    };

    socket.onclose = () => {
      setTimeout(() => connectWebSocket(), 3000);
    };

    return socket;
  };

  useEffect(() => {
    const socket = connectWebSocket();
    return () => socket.close();
  }, []);

  if (isLoading) {
    return <ScoreboardWrapper>Loading...</ScoreboardWrapper>;
  }

  return (
    <ScoreboardWrapper>
      <HeaderSection>
        <Title>랭킹</Title>
      </HeaderSection>
      <div>
        {players.map((player, index) => (
          <PlayerRow key={index}>
            <PlayerNameWrapper>
              {index < 3 ? (
                <RankIcon src={`/client/assets/items/rank${index + 1}.png`} alt={`${index + 1}등`} />
              ) : (
                <RankNumber>{index + 1}</RankNumber>
              )}
              <PlayerName>{player.nickname}</PlayerName>
            </PlayerNameWrapper>
            <PlayerStats>{player.totalMoney.toLocaleString()} gold</PlayerStats>
          </PlayerRow>
        ))}
        {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
      </div>
    </ScoreboardWrapper>
  );
};

export default Scoreboard;