import React from 'react';
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

const Scoreboard = ({ players }: { players: Array<{ name: string; score: number; gold: number }> }) => {
  return (
    <ScoreboardWrapper>
      <h3>Scoreboard</h3>
      {players.map((player, index) => (
        <PlayerRow key={index}>
          <PlayerName>{player.name}</PlayerName>
          <PlayerStats>
            {player.score} pts | {player.gold} gold
          </PlayerStats>
        </PlayerRow>
      ))}
    </ScoreboardWrapper>
  );
};

export default Scoreboard;

// export default function Scoreboard() {

// }
