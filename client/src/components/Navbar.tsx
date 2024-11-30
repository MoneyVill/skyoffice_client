import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const NavbarWrapper = styled.div`
  position: fixed;
  top: 2px;
  left: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 10vh;
  min-height: 3rem;
  max-height: 5rem;
  z-index: 40;
  padding: 0 2rem;
`;

const StatsSection = styled.div`
  display: flex;
  justify-content: evenly;
  align-items: center;
  width: 65vw;
  height: 100%;
  max-width: 70vw;
  gap: 1rem;
`;

interface StatBoxProps {
  bgColor: string;
  color?: string;
  $isMoney?: boolean;
}

const StatBox = styled.div<StatBoxProps>`
  background: ${props => props.bgColor};
  height: 57%;
  padding: 0 0.5rem;
  border-radius: 1rem;
  color: ${props => props.color || 'white'};
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  white-space: nowrap; 함
  min-width: fit-content;
  flex: 0 1 auto;


  @media (min-width: 1024px) {
    height: 50%;
    font-size: 1.5rem;
  }

  .icon {
    min-width: ${props => props.$isMoney ? '3vh' : '2.5vh'};
    width: ${props => props.$isMoney ? '2vw' : '1.8vw'};
    height: 100%;
    display: flex;
    align-items: center;
  }

  img {
    width: 100%;
    height: auto;
    object-fit: contain;
  }
`;

const Navbar = () => {
  const [userInfo, setUserInfo] = useState({
    nickname: localStorage.getItem('nickname') || '',
    currentMoney: 0,
    totalStockReturn: 0
  });

  const fetchUserInfo = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const response = await axios.get(`${import.meta.env.VITE_MODOO_API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (response.data?.data) {
        setUserInfo(prevState => ({
          ...prevState,
          currentMoney: response.data.data.currentMoney,
          totalStockReturn: response.data.data.totalStockReturn
        }));
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    const interval = setInterval(fetchUserInfo, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!userInfo.nickname) return null;

  return (
    <NavbarWrapper>
      <StatsSection>
        <StatBox bgColor="#FB6B9F"> 
          {userInfo.nickname}
        </StatBox>
        
        <StatBox bgColor="#FFBF4D" $isMoney>
          <div className="icon">
            <img src="/client/assets/items/money.png" alt="money" />
          </div>
          {userInfo.currentMoney.toLocaleString()}원
        </StatBox>
        
        <StatBox 
          bgColor="#e9fcff"
          color={userInfo.totalStockReturn >= 0 ? '#ff4a4a' : '#4a89ff'}
        >
          <div className="icon">
            <img
              src={`/client/assets/items/${userInfo.totalStockReturn >= 0 ? 'upgold.png' : 'downgold.png'}`}
              alt="Return"
            />
          </div>
          {userInfo.totalStockReturn.toFixed(2)}%
        </StatBox>
      </StatsSection>
    </NavbarWrapper>
  );
};

export default Navbar;