import React, { useState } from 'react'
import styled from 'styled-components'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
// import Alert from '@mui/material/Alert'
// import AlertTitle from '@mui/material/AlertTitle'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'

import Adam from '../images/login/Adam_login.png'
import Ash from '../images/login/Ash_login.png'
import Lucy from '../images/login/Lucy_login.png'
import Nancy from '../images/login/Nancy_login.png'
import { useAppSelector, useAppDispatch } from '../hooks'
import { setLoggedIn } from '../stores/UserStore'
import { getAvatarString, getColorByString } from '../util'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

import { usePostUsersLoginMutation } from '../stores/NonAuthApi';

const Wrapper = styled.form`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #222639;
  border-radius: 16px;
  padding: 36px 60px;
  box-shadow: 0px 0px 5px #0000006f;
`

// const Title = styled.p`
//   margin: 5px;
//   font-size: 20px;
//   color: #c2c2c2;
//   text-align: center;
// `

const RoomName = styled.div`
  max-width: 500px;
  max-height: 120px;
  overflow-wrap: anywhere;
  overflow-y: auto;
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;

  h3 {
    font-size: 24px;
    color: #eee;
  }
`

const RoomDescription = styled.div`
  max-width: 500px;
  max-height: 150px;
  overflow-wrap: anywhere;
  overflow-y: auto;
  font-size: 16px;
  color: #c2c2c2;
  display: flex;
  justify-content: center;
`

const SubTitle = styled.h3`
  width: 160px;
  font-size: 16px;
  color: #eee;
  text-align: center;
`

const Content = styled.div`
  display: flex;
  flex-direction: column; /* Change to column layout */
  align-items: center; /* Center align horizontally */
  gap: 0px; /* Add space between Right and Left sections */
  margin: 36px 0;
`

const Left = styled.div`
  margin-right: 0px;

  --swiper-navigation-size: 24px;

  .swiper {
    width: 160px;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
  }

  .swiper-slide {
    width: 160px;
    height: 220px;
    background: #dbdbe0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .swiper-slide img {
    display: block;
    width: 95px;
    height: 136px;
    object-fit: contain;
  }
`

const Right = styled.div`
  width: 300px;
`

const Bottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

// const Warning = styled.div`
//   margin-top: 30px;
//   position: relative;
//   display: flex;
//   flex-direction: column;
//   gap: 3px;
// `

const avatars = [
  { name: 'adam', img: Adam },
  { name: 'ash', img: Ash },
  { name: 'lucy', img: Lucy },
  { name: 'nancy', img: Nancy },
]

// shuffle the avatars array
for (let i = avatars.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1))
  ;[avatars[i], avatars[j]] = [avatars[j], avatars[i]]
}

export default function LoginDialog() {
  const [name, setName] = useState<string>('')
  const [avatarIndex, setAvatarIndex] = useState<number>(0)
  const [nameFieldEmpty, setNameFieldEmpty] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  // const videoConnected = useAppSelector((state) => state.user.videoConnected)
  // const roomJoined = useAppSelector((state) => state.room.roomJoined)
  // const roomName = useAppSelector((state) => state.room.roomName)
  // const roomDescription = useAppSelector((state) => state.room.roomDescription)

  const roomJoined = true // Set to true for default joining capability
  const roomName = 'Jungle MoneyVille' // Set a default room name
  const roomDescription = 'MoneyVille에 오신걸 환영합니다' // Set a default room description

  const game = phaserGame.scene.keys.game as Game

  interface LoginInterFace {
    account: string;
    password: string;
  }
  const [loginAccount, setLoginAccount] = useState<LoginInterFace>({
    account: '',
    password: ''
  });
  const [postUsersLogin, { isSuccess: isSuccess1, isError: isError1 }] = usePostUsersLoginMutation();
  const onChangeAccount = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoginAccount({
      ...loginAccount,
      [event.target.name]: event.target.value, // name 속성에 따라 상태를 동적으로 업데이트
    });
  };
  

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  
    // loginAccount.account가 비어 있으면 경고 표시
    if (loginAccount.account.trim() === '') {
      setNameFieldEmpty(true);
      return;
    }
  
    // 아이디가 입력되었으면 경고를 해제
    setNameFieldEmpty(false);
  
    if (roomJoined) {
      console.log('Join! Account:', loginAccount.account, 'Avatar:', avatars[avatarIndex].name);
      game.registerKeys();
      game.myPlayer.setPlayerName(loginAccount.account); // account를 player name으로 설정
      game.myPlayer.setPlayerTexture(avatars[avatarIndex].name);
      game.network.readyToConnect();
  
      try {
        const loginData: any = await postUsersLogin(loginAccount);
        if (loginData.data) {
          const { accessToken, refreshToken, nickname } = loginData.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('nickname', nickname);

          dispatch(setLoggedIn(true));
        } else {
          console.error('로그인 실패:', loginData?.error || 'Unknown Error');
        }
      } catch (error) {
        console.error('로그인 중 오류:', error);
      }
    }
  };
  

  return (
    <Wrapper onSubmit={handleSubmit}>
      <RoomName>
        <Avatar style={{ background: getColorByString(roomName) }}>
          {getAvatarString(roomName)}
        </Avatar>
        <h3>{roomName}</h3>
      </RoomName>
      <RoomDescription>
        <ArrowRightIcon /> {roomDescription}
      </RoomDescription>
      <Content>
        <Right>
          <TextField
            name="account"
            autoFocus
            fullWidth
            label="아이디"
            variant="outlined"
            color="secondary"
            error={nameFieldEmpty} // 상태에 따라 에러 여부 표시
            helperText={nameFieldEmpty ? '아이디를 입력해주세요.' : ''} // 경고 메시지 표시
            value={loginAccount.account} // loginAccount.account와 동기화
            onChange={onChangeAccount} // 상태 업데이트 핸들러 연결
          />
        </Right>
        <Left>
          <SubTitle>캐릭터 선택</SubTitle>
          <Swiper
            modules={[Navigation]}
            navigation
            spaceBetween={0}
            slidesPerView={1}
            onSlideChange={(swiper) => {
              setAvatarIndex(swiper.activeIndex)
            }}
          >
            {avatars.map((avatar) => (
              <SwiperSlide key={avatar.name}>
                <img src={avatar.img} alt={avatar.name} />
              </SwiperSlide>
            ))}
          </Swiper>
        </Left>
      </Content>
      <Bottom>
        <Button variant="contained" color="secondary" size="large" type="submit">
          교실 입장
        </Button>
      </Bottom>
    </Wrapper>
  )
}