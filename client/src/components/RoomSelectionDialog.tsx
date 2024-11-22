import {useEffect} from 'react'
import styled from 'styled-components'
import logo from '../images/logo.png'
import LinearProgress from '@mui/material/LinearProgress'
import { useAppSelector } from '../hooks'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

const Backdrop = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 60px;
  align-items: center;
`

const Wrapper = styled.div`
  background: #222639;
  border-radius: 16px;
  padding: 36px 60px;
  box-shadow: 0px 0px 5px #0000006f;
`

const Title = styled.h1`
  font-size: 24px;
  color: #eee;
  text-align: center;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
  align-items: center;
  justify-content: center;

  img {
    border-radius: 8px;
    height: 120px;
  }
`

const ProgressBarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  h3 {
    color: #33ac96;
  }
`

const ProgressBar = styled(LinearProgress)`
  width: 360px;
`

export default function RoomSelectionDialog() {
  const lobbyJoined = useAppSelector((state) => state.room.lobbyJoined)

  useEffect(() => {
    if (lobbyJoined) {
      const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
      bootstrap.network
        .joinOrCreatePublic()
        .then(() => bootstrap.launchGame())
        .catch((error) => console.error(error))
    }
  }, [lobbyJoined]) // lobbyJoined가 변경될 때만 실행

  return (
    <Backdrop>
      <Wrapper>
        <Content>
          <Title>Connecting to Jungle MoneyVille...</Title>
          <img src={logo} alt="logo" />
        </Content>
      </Wrapper>
      {!lobbyJoined && (
        <ProgressBarWrapper>
          <h3> Connecting to server...</h3>
          <ProgressBar color="secondary" />
        </ProgressBarWrapper>
      )}
    </Backdrop>
  )
}
