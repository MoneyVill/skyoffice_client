import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReactDOM from 'react-dom';

const BgmButton = styled.div`
  position: fixed;
  right: 4px;
  bottom: 4px;
  min-width: 9vh;
  width: 4vw;
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 10000; /* 높은 z-index로 다른 요소들 위에 표시 */

  &:hover {
    transform: scale(1.05);
  }

  @media (min-width: 1024px) {
    right: 1.5rem;
    bottom: 1.5rem;
  }

  img {
    width: 100%;
  }
`;

const BgmPlayer: React.FC = () => {
  const [bgmStatus, setBgmStatus] = useState<boolean>(() => {
    // 로컬 스토리지에서 이전 상태 불러오기
    const savedStatus = localStorage.getItem('bgmStatus');
    return savedStatus === 'true';
  });
  const [audio] = useState<HTMLAudioElement>(
    () => new Audio('/client/assets/audio/bgm.mp3')
  );

  useEffect(() => {
    audio.loop = true;
    if (bgmStatus) {
      audio
        .play()
        .then(() => {
          // 성공적으로 재생됨
        })
        .catch((error) => {
          console.error('Audio playback failed:', error);
        });
    } else {
      audio.pause();
    }
    // 로컬 스토리지에 상태 저장
    localStorage.setItem('bgmStatus', bgmStatus.toString());
  }, [bgmStatus, audio]);

  useEffect(() => {
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

  const handleClick = () => {
    setBgmStatus((prevStatus) => !prevStatus);
  };

  // 포탈 루트 동적 생성
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let existingPortalRoot = document.getElementById('bgm-root');
    if (!existingPortalRoot) {
      existingPortalRoot = document.createElement('div');
      existingPortalRoot.id = 'bgm-root';
      document.body.appendChild(existingPortalRoot);
    }
    setPortalRoot(existingPortalRoot);
  }, []);

  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <BgmButton onClick={handleClick} aria-label="브금">
      <img
        src={
          bgmStatus
            ? '/client/assets/items/bgm.png'
            : '/client/assets/items/bgmoff.png'
        }
        alt={bgmStatus ? 'BGM ON' : 'BGM OFF'}
      />
    </BgmButton>,
    portalRoot
  );
};

export default BgmPlayer;
