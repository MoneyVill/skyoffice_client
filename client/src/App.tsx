// client/src/App.tsx

import React from 'react';
import styled from 'styled-components';
import { useAppSelector } from './hooks';
import RoomSelectionDialog from './components/RoomSelectionDialog';
import LoginDialog from './components/LoginDialog';
import ComputerDialog from './components/ComputerDialog';
import WhiteboardDialog from './components/WhiteboardDialog';
import Chat from './components/Chat';
import Scoreboard from './components/Scoreboard';
import MobileVirtualJoystick from './components/MobileVirtualJoystick';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Provider } from 'react-redux';
import store from './stores';
import NotificationStack from './components/common/StackNotification/NotificationStack';
import BgmPlayer from './components/bgmPlayer';
import useWebSocket from './hooks/useWebSocket';
import TaxAlert from './components/alerts/TaxAlert'; 

const Backdrop = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  padding-top: 10vh;
`;

function App() {
  useWebSocket();
  const loggedIn = useAppSelector((state) => state.user.loggedIn);
  const computerDialogOpen = useAppSelector(
    (state) => state.computer.computerDialogOpen
  );
  const whiteboardDialogOpen = useAppSelector(
    (state) => state.whiteboard.whiteboardDialogOpen
  );
  const roomJoined = useAppSelector((state) => state.room.roomJoined);

  let ui: JSX.Element;
  if (loggedIn) {
    if (computerDialogOpen) {
      ui = (
        <>
          <Navbar />
          <Chat />
          <ComputerDialog />
        </>
      );
    } else if (whiteboardDialogOpen) {
      ui = (
        <>
          <Navbar />
          <Chat />
          <WhiteboardDialog />
        </>
      );
    } else {
      ui = (
        <>
          <Chat />
          <Navbar />
          <MobileVirtualJoystick />
        </>
      );
    }
  } else if (roomJoined) {
    ui = <LoginDialog />;
  } else {
    ui = <RoomSelectionDialog />;
  }

  return (
    <Provider store={store}>
      <BrowserRouter basename="/client">
        <Backdrop>
          <NotificationStack />
          <Scoreboard />
          <TaxAlert />
          {ui}
        </Backdrop>
        <BgmPlayer /> 
      </BrowserRouter>
    </Provider>
  );
}

export default App;
