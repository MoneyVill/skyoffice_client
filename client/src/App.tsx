//client/src/App.tsx

import React from 'react'
import styled from 'styled-components'

import { useAppSelector } from './hooks'

import RoomSelectionDialog from './components/RoomSelectionDialog'
import LoginDialog from './components/LoginDialog'
import ComputerDialog from './components/ComputerDialog'
import WhiteboardDialog from './components/WhiteboardDialog'
import Chat from './components/Chat'
import Scoreboard from './components/Scoreboard'
import MobileVirtualJoystick from './components/MobileVirtualJoystick'
import {BrowserRouter} from 'react-router-dom'
import Navbar from './components/Navbar'

const Backdrop = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  padding-top: 10vh;
`

function App() {
  const loggedIn = useAppSelector((state) => state.user.loggedIn)
  const computerDialogOpen = useAppSelector((state) => state.computer.computerDialogOpen)
  const whiteboardDialogOpen = useAppSelector((state) => state.whiteboard.whiteboardDialogOpen)
  // const videoConnected = useAppSelector((state) => state.user.videoConnected)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)

  let ui: JSX.Element
  if (loggedIn) {
    if (computerDialogOpen) {
      /* Render ComputerDialog if user is using a computer. */
      ui = (
        <>
          <Navbar />
          <Chat />
          <ComputerDialog />
        </>
      )
    } else if (whiteboardDialogOpen) {
      /* Render WhiteboardDialog if user is using a whiteboard. */
      ui = (
        <>
          <Navbar />
          <Chat />
          <WhiteboardDialog />
        </>
      )
    } else {
      ui = (
        /* Render Chat or VideoConnectionDialog if no dialogs are opened. */
        <>
          <Chat />
          <Navbar />
          {/* Render VideoConnectionDialog if user is not connected to a webcam. */}
          {/* {!videoConnected && <VideoConnectionDialog />} */}
          <MobileVirtualJoystick />
        </>
      )
    }
  } else if (roomJoined) {
    /* Render LoginDialog if not logged in but selected a room. */
    ui = <LoginDialog />
  } else {
    /* Render RoomSelectionDialog if yet selected a room. */
    //UI 편집
    ui = <RoomSelectionDialog />
  }

  return (
    <BrowserRouter basename='/client'>
      <Backdrop>
        <Scoreboard />
        {ui}
      </Backdrop>
    </BrowserRouter>
  )
}

export default App
