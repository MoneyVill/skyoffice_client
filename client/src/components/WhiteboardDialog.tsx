//client/src/components/WhiteboardDialog.tsx
import React from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

import { useAppSelector, useAppDispatch } from '../hooks'
import { closeWhiteboardDialog } from '../stores/WhiteboardStore'

const Backdrop = styled.div`
  position: fixed;
  top: 10%;
  left: 0;
  width: 100%;
  height: 90%;
  overflow: hidden;
  padding: 16px 350px 16px 16px;
  z-index: 100;
`
const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  background: #222639;
  border-radius: 16px;
  padding: 16px;
  color: #eee;
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: max-content;
  .close {
    position: absolute;
    top: 0px;
    right: 0px;
  }
`

const WhiteboardWrapper = styled.div`
  flex: 1;
  border-radius: 25px;
  overflow: hidden;
  margin-right: 25px;

  iframe {
    width: 100%;
    height: 100%;
    background: #fff;
  }
`

export default function WhiteboardDialog() {
  const whiteboardUrl = useAppSelector((state) => state.whiteboard.whiteboardUrl)
  const dispatch = useAppDispatch()

  return (
    <Backdrop>
      <Wrapper>
        <IconButton
          aria-label="close dialog"
          className="close"
          onClick={() => dispatch(closeWhiteboardDialog())}
        >
          <CloseIcon />
        </IconButton>
        {whiteboardUrl && (
          <WhiteboardWrapper>
            <iframe title="white board" src={whiteboardUrl} />
          </WhiteboardWrapper>
        )}
      </Wrapper>
    </Backdrop>
  )
}



//화이트보드 추가 버튼 UI

/*
import React, { useState } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

import { useAppSelector, useAppDispatch } from '../hooks'
import { closeWhiteboardDialog } from '../stores/WhiteboardStore'

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  padding: 16px 180px 16px 16px;
  width: 100%;
  height: 100%;
`
const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  background: #222639;
  border-radius: 16px;
  padding: 16px;
  color: #eee;
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: max-content;

  .close {
    position: absolute;
    top: 0px;
    right: 0px;
  }
`

const WhiteboardWrapper = styled.div`
  flex: 1;
  border-radius: 25px;
  overflow: hidden;
  margin-right: 25px;

  iframe {
    width: 100%;
    height: 100%;
    background: #fff;
  }
`

const ButtonWrapper = styled.div`
  margin-bottom: 16px;

  button {
    margin-right: 8px;
    padding: 8px 16px;
    border: none;
    background: #333;
    color: #fff;
    cursor: pointer;
    border-radius: 8px;

    &:hover {
      background: #555;
    }
  }
`

export default function WhiteboardDialog() {
  const initialUrl = useAppSelector((state) => state.whiteboard.whiteboardUrl)
  const [currentUrl, setCurrentUrl] = useState(initialUrl)
  const dispatch = useAppDispatch()

  const urls = [
    { id: '1', url: 'https://wbo.ophir.dev/boards/sky-office-1' },
    { id: '2', url: 'https://wbo.ophir.dev/boards/sky-office-2' },
    { id: '3', url: 'https://wbo.ophir.dev/boards/sky-office-3' },
  ]

  const handleUrlChange = (url) => {
    setCurrentUrl(url)
  }

  return (
    <Backdrop>
      <Wrapper>
        <IconButton
          aria-label="close dialog"
          className="close"
          onClick={() => dispatch(closeWhiteboardDialog())}
        >
          <CloseIcon />
        </IconButton>
        <ButtonWrapper>
          {urls.map(({ id, url }) => (
            <button key={id} onClick={() => handleUrlChange(url)}>
              Open Whiteboard {id}
            </button>
          ))}
        </ButtonWrapper>
        {currentUrl && (
          <WhiteboardWrapper>
            <iframe title="white board" src={currentUrl} />
          </WhiteboardWrapper>
        )}
      </Wrapper>
    </Backdrop>
  )
}
*/