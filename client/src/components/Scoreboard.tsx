import React, { useState } from 'react';
import { useAppSelector } from '../hooks';
import styled from 'styled-components';

const ScoreboardWrapper = styled.div`
    position: fixed;
    top: 60px;
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

const LabelWrapper = styled.div`
    position: fixed;
    top: 28px;
    right: 10px;
    width: 300px;
    display: flex;
    align-items: center;
    cursor: pointer;
    z-index: 1001;
    background: rgba(0, 0, 0, 0.6);
    padding: 5px 10px;
    border-radius: 5px;
`;

const LabelText = styled.span`
    color: white;
    margin-right: auto;
`;

const RainbowText = styled.span`
  background-image: linear-gradient(to right, 
    rgb(255, 0, 0),   /* Red */
    rgb(255, 165, 0), /* Orange */
    rgb(255, 255, 0), /* Yellow */
    rgb(0, 128, 0),   /* Green */
    rgb(0, 0, 255),   /* Blue */
    rgb(75, 0, 130),  /* Indigo */
    rgb(238, 130, 238)/* Violet */
  );
  -webkit-background-clip: text;
  color: transparent;
`;

const ArrowIcon = styled.span`
    font-size: 16px;
    color: white;
`;

const CollapsibleScoreboard = () => {
    const players = useAppSelector((state) => state.players.players);
    return (
        <ScoreboardWrapper>
            <h3>Scoreboard</h3>
            {players.map((player, index) => (
                <PlayerRow key={index}>
                <PlayerName>{player.name}</PlayerName>
                <PlayerStats>
                    {player.score} pts | {player.money} gold
                </PlayerStats>
                </PlayerRow>
            ))}
        </ScoreboardWrapper>
    );
};

const Scoreboard = () => {
    const [showScoreboard, setShowScoreboard] = useState(true);
  
    const toggleScoreboard = () => {
        setShowScoreboard((prevShow) => !prevShow);
    };
  
    return (
        <>
            <LabelWrapper onClick={toggleScoreboard}>
                <LabelText>{showScoreboard ? <RainbowText>머니빌 점수판</RainbowText> : '돈을 많이 벌면 승리!'}</LabelText>
                <ArrowIcon>{showScoreboard ? '▲' : '▼'}</ArrowIcon>
            </LabelWrapper>
            {showScoreboard && <CollapsibleScoreboard />}
        </>
    );
  };
  
  export default Scoreboard;
  