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

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const StatBox = styled.div<{ bgColor: string}>`
  background: ${props => props.bgColor};
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  color: white;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

      const response = await axios.get(`${import.meta.env.VITE_MODOO_API_URL}/api/users`, {        headers: {
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
    
    // 4분마다 정보 업데이트
    const interval = setInterval(fetchUserInfo, 4 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Early return if no user information is available
  if (!userInfo.nickname) return null;

  return (
    <NavbarWrapper>
      <ProfileSection>
        <StatBox bgColor="#FB6B9F">
          {userInfo.nickname}
        </StatBox>
      </ProfileSection>
      
      <StatsSection>
        <StatBox bgColor="#FFBF4D">
          <img src="assets/items/money.png" alt="Money" style={{ width: '24px', height: '24px' }} />
          {userInfo.currentMoney.toLocaleString()}원
        </StatBox>
        
        <StatBox bgColor={userInfo.totalStockReturn >= 0 ? '#ff4a4a' : '#4a89ff'}>
          <img 
            src={userInfo.totalStockReturn >= 0 ? 'assets/items/upgold.png' : 'assets/items/downgold.png'} 
            alt="Return" 
            style={{ width: '24px', height: '24px' }} 
          />
          {userInfo.totalStockReturn.toFixed(2)}%
        </StatBox>
      </StatsSection>
    </NavbarWrapper>
  );
};

export default Navbar;