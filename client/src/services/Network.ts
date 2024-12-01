//client/src/services/Network.ts

import { Client, Room } from 'colyseus.js'
import { IComputer, IOfficeState, IPlayer, IWhiteboard } from '../../../types/IOfficeState'
import { Message } from '../../../types/Messages'
import { IRoomData, RoomType } from '../../../types/Rooms'
import { ItemType } from '../../../types/Items'
// import WebRTC from '../web/WebRTC'
import { phaserEvents, Event } from '../events/EventCenter'
import store from '../stores'
import { setSessionId, setPlayerNameMap, removePlayerNameMap } from '../stores/UserStore'
import {
  setLobbyJoined,
  setJoinedRoomData,
  setAvailableRooms,
  addAvailableRooms,
  removeAvailableRooms,
} from '../stores/RoomStore'
import {
  pushChatMessage,
  pushPlayerJoinedMessage,
  pushPlayerLeftMessage,
} from '../stores/ChatStore'
import { setWhiteboardUrls } from '../stores/WhiteboardStore'
import { setComputerUrls } from '../stores/ComputerStore'

export default class Network {
  private client: Client
  private room?: Room<IOfficeState>
  private lobby!: Room
  // webRTC?: WebRTC
  private predefinedUrls: Map<string, string>; // 맵 선언
  private predefinedComputerUrls: Map<string, string>;
  mySessionId!: string

  constructor() {
    const protocol = window.location.protocol.replace('http', 'ws');
    const endpoint = import.meta.env.VITE_SERVER_URL

    this.predefinedUrls = new Map<string, string>([
      ['0', import.meta.env.VITE_WHITE_URL_0 || ''],
      ['1', import.meta.env.VITE_WHITE_URL_1 || ''],
      ['2', import.meta.env.VITE_WHITE_URL_2 || ''],
      ['3', import.meta.env.VITE_WHITE_URL_3 || ''],
    ]);

    // Computer URLs 초기화
    this.predefinedComputerUrls = new Map<string, string>([
      ['0', import.meta.env.VITE_COMPUTER_URL_0 || ''],
      ['1', import.meta.env.VITE_COMPUTER_URL_1 || ''],
      ['2', import.meta.env.VITE_COMPUTER_URL_2 || ''],
      ['3', import.meta.env.VITE_COMPUTER_URL_3 || ''],
      ['4', import.meta.env.VITE_COMPUTER_URL_4 || ''],
    ]);

    this.client = new Client(endpoint)
    this.joinLobbyRoom().then(() => {
      store.dispatch(setLobbyJoined(true))
    })

    phaserEvents.on(Event.MY_PLAYER_NAME_CHANGE, this.updatePlayerName, this)
    phaserEvents.on(Event.MY_PLAYER_TEXTURE_CHANGE, this.updatePlayer, this)
    // phaserEvents.on(Event.PLAYER_DISCONNECTED, this.playerStreamDisconnect, this)
  }

  /**
   * method to join Colyseus' built-in LobbyRoom, which automatically notifies
   * connected clients whenever rooms with "realtime listing" have updates
   */
  async joinLobbyRoom() {
    this.lobby = await this.client.joinOrCreate(RoomType.LOBBY)

    this.lobby.onMessage('rooms', (rooms) => {
      store.dispatch(setAvailableRooms(rooms))
    })

    this.lobby.onMessage('+', ([roomId, room]) => {
      store.dispatch(addAvailableRooms({ roomId, room }))
    })

    this.lobby.onMessage('-', (roomId) => {
      store.dispatch(removeAvailableRooms(roomId))
    })
  }

  // method to join the public lobby
  async joinOrCreatePublic() {
    this.room = await this.client.joinOrCreate(RoomType.PUBLIC)
    this.initialize()
  }

  // method to join a custom room
  async joinCustomById(roomId: string, password: string | null) {
    this.room = await this.client.joinById(roomId, { password })
    this.initialize()
  }

  // method to create a custom room
  async createCustom(roomData: IRoomData) {
    const { name, description, password, autoDispose } = roomData
    this.room = await this.client.create(RoomType.CUSTOM, {
      name,
      description,
      password,
      autoDispose,
    })
    this.initialize()
  }

  // 퀴즈 요청을 서버로 보내는 메서드 추가
  requestQuizData() {
    this.room?.send(Message.REQUEST_QUIZ)
  }
  
  // 퀴즈 나가기 요청을 서버로 보내는 메서드 추가
  leaveQuiz() {
    this.room?.send(Message.LEAVE_QUIZ)
  }

  // set up all network listeners before the game starts
  initialize() {
    if (!this.room) return

    this.lobby.leave()
    this.mySessionId = this.room.sessionId
    store.dispatch(setSessionId(this.room.sessionId))
    // this.webRTC = new WebRTC(this.mySessionId, this)

    // new instance added to the players MapSchema
    this.room.state.players.onAdd = (player: IPlayer, key: string) => {
      if (key === this.mySessionId) return
      // track changes on every child object inside the players MapSchema
      player.onChange = (changes) => {
        changes.forEach((change) => {
          const { field, value } = change
          phaserEvents.emit(Event.PLAYER_UPDATED, field, value, key)
          // when a new player finished setting up player name
          if (field === 'name' && value !== '') {
            phaserEvents.emit(Event.PLAYER_JOINED, player, key)
            store.dispatch(setPlayerNameMap({ id: key, name: value }))
            store.dispatch(pushPlayerJoinedMessage(value))
          }
        })
      }
    }

    // an instance removed from the players MapSchema
    this.room.state.players.onRemove = (player: IPlayer, key: string) => {
      phaserEvents.emit(Event.PLAYER_LEFT, key)
      // this.webRTC?.deleteVideoStream(key)
      // this.webRTC?.deleteOnCalledVideoStream(key)
      store.dispatch(pushPlayerLeftMessage(player.name))
      store.dispatch(removePlayerNameMap(key))
    }
    //컴퓨터 추가
    // // new instance added to the computers MapSchema
    // this.room.state.computers.onAdd = (computer: IComputer, key: string) => {
    //   // track changes on every child object's connectedUser
    //   computer.connectedUser.onAdd = (item, index) => {
    //     phaserEvents.emit(Event.ITEM_USER_ADDED, item, key, ItemType.COMPUTER)
    //   }
    //   computer.connectedUser.onRemove = (item, index) => {
    //     phaserEvents.emit(Event.ITEM_USER_REMOVED, item, key, ItemType.COMPUTER)
    //   }
    // }
    this.room.state.computers.onAdd = (computer: IComputer, key: string) => {
      const url = this.predefinedComputerUrls.get(key);
      if (url) {
        store.dispatch(
          setComputerUrls({
            computerId: key,
            url: url,
          })
        );
      } else {
        console.warn(`No predefined URL found for computer ID: ${key}`);
      }

      // Track changes on connected users (if necessary)
      computer.connectedUser.onAdd = (item, index) => {
        phaserEvents.emit(Event.ITEM_USER_ADDED, item, key, ItemType.COMPUTER);
      };
      computer.connectedUser.onRemove = (item, index) => {
        phaserEvents.emit(Event.ITEM_USER_REMOVED, item, key, ItemType.COMPUTER);
      };
    };

    //컴퓨터 추가
    //화이트보드 추가
    // // new instance added to the whiteboards MapSchema
    // this.room.state.whiteboards.onAdd = (whiteboard: IWhiteboard, key: string) => {
    //   store.dispatch(
    //     setWhiteboardUrls({
    //       whiteboardId: key,
    //       roomId: whiteboard.roomId,
    //     })
    //   )
    //   // track changes on every child object's connectedUser
    //   whiteboard.connectedUser.onAdd = (item, index) => {
    //     phaserEvents.emit(Event.ITEM_USER_ADDED, item, key, ItemType.WHITEBOARD)
    //   }
    //   whiteboard.connectedUser.onRemove = (item, index) => {
    //     phaserEvents.emit(Event.ITEM_USER_REMOVED, item, key, ItemType.WHITEBOARD)
    //   }
    // }
    this.room.state.whiteboards.onAdd = (whiteboard: IWhiteboard, key: string) => {
      const url = this.predefinedUrls.get(key);
      if (url) {
        store.dispatch(
          setWhiteboardUrls({
            whiteboardId: key,
            url: url, // Use the predefined URL for the specific key
          })
        );
      } else {
        console.warn(`No predefined URL found for whiteboard ID: ${key}`);
      }

      // Track changes on connected users
      whiteboard.connectedUser.onAdd = (item, index) => {
        phaserEvents.emit(Event.ITEM_USER_ADDED, item, key, ItemType.WHITEBOARD);
      };
      whiteboard.connectedUser.onRemove = (item, index) => {
        phaserEvents.emit(Event.ITEM_USER_REMOVED, item, key, ItemType.WHITEBOARD);
      };
    };

    //화이트보드 추가

    // new instance added to the chatMessages ArraySchema
    this.room.state.chatMessages.onAdd = (item, index) => {
      store.dispatch(pushChatMessage(item))
    }

    // when the server sends room data
    this.room.onMessage(Message.SEND_ROOM_DATA, (content) => {
      store.dispatch(setJoinedRoomData(content))
    })

    // when a user sends a message
    this.room.onMessage(Message.ADD_CHAT_MESSAGE, ({ clientId, content }) => {
      phaserEvents.emit(Event.UPDATE_DIALOG_BUBBLE, clientId, content)
    })

    // // when a peer disconnects with myPeer
    // this.room.onMessage(Message.DISCONNECT_STREAM, (clientId: string) => {
    //   this.webRTC?.deleteOnCalledVideoStream(clientId)
    // })

    // // when a computer user stops sharing screen
    // this.room.onMessage(Message.STOP_SCREEN_SHARE, (clientId: string) => {
    //   const computerState = store.getState().computer
    //   computerState.shareScreenManager?.onUserLeft(clientId)
    // })

    // 퀴즈 핸들러 초기화
    // 서버로부터 현재 퀴즈에 참여할 수 있다는 응답을 받았을 때
    this.room.onMessage(Message.PLAYER_JOIN_QUIZ, (data: { questionNumber: number; remainingTime: number }) => {
      phaserEvents.emit(Event.PLAYER_JOIN_QUIZ, data)
    })

    // 서버로부터 다음 퀴즈를 기다리라는 응답을 받았을 때
    this.room.onMessage(Message.WAIT_FOR_NEXT_QUIZ, (data: { timeUntilNextQuiz: number }) => {
      phaserEvents.emit(Event.WAIT_FOR_NEXT_QUIZ, data)
    })

    // 서버로부터 퀴즈 시작 브로드캐스트를 받았을 때
    this.room.onMessage(Message.START_QUIZ, (data: { quizTime: number} ) => {
      phaserEvents.emit(Event.START_QUIZ, data)
    })

    // 서버로부터 퀴즈 종료 브로드캐스트를 받았을 때
    this.room.onMessage(Message.END_QUIZ, () => {
      phaserEvents.emit(Event.END_QUIZ)
    })

    // 서버로부터 퀴즈 나가기 확인 메시지를 받았을 때
    this.room.onMessage(Message.LEFT_QUIZ, () => {
      phaserEvents.emit(Event.LEFT_QUIZ)
    })

    // 다른 사용자가 퀴즈에서 나갔을 때
    this.room.onMessage(Message.PLAYER_LEFT_QUIZ, (data: { clientId: string }) => {
      phaserEvents.emit(Event.PLAYER_LEFT_QUIZ, data.clientId);
    });
  }

  // method to register event listener and call back function when a item user added
  onChatMessageAdded(callback: (playerId: string, content: string) => void, context?: any) {
    phaserEvents.on(Event.UPDATE_DIALOG_BUBBLE, callback, context)
  }

  // method to register event listener and call back function when a item user added
  onItemUserAdded(
    callback: (playerId: string, key: string, itemType: ItemType) => void,
    context?: any
  ) {
    phaserEvents.on(Event.ITEM_USER_ADDED, callback, context)
  }

  // method to register event listener and call back function when a item user removed
  onItemUserRemoved(
    callback: (playerId: string, key: string, itemType: ItemType) => void,
    context?: any
  ) {
    phaserEvents.on(Event.ITEM_USER_REMOVED, callback, context)
  }

  // method to register event listener and call back function when a player joined
  onPlayerJoined(callback: (Player: IPlayer, key: string) => void, context?: any) {
    phaserEvents.on(Event.PLAYER_JOINED, callback, context)
  }

  // method to register event listener and call back function when a player left
  onPlayerLeft(callback: (key: string) => void, context?: any) {
    phaserEvents.on(Event.PLAYER_LEFT, callback, context)
  }

  // method to register event listener and call back function when myPlayer is ready to connect
  onMyPlayerReady(callback: (key: string) => void, context?: any) {
    phaserEvents.on(Event.MY_PLAYER_READY, callback, context)
  }

  // method to register event listener and call back function when my video is connected
  onMyPlayerVideoConnected(callback: (key: string) => void, context?: any) {
    phaserEvents.on(Event.MY_PLAYER_VIDEO_CONNECTED, callback, context)
  }

  // method to register event listener and call back function when a player updated
  onPlayerUpdated(
    callback: (field: string, value: number | string, key: string) => void,
    context?: any
  ) {
    phaserEvents.on(Event.PLAYER_UPDATED, callback, context)
  }

  // 퀴즈 관련 이벤트 리스너 등록 메서드 추가
  onPlayerJoinQuiz(callback: (data: { remainingTime: number }) => void, context?: any) {
    phaserEvents.on(Event.PLAYER_JOIN_QUIZ, callback, context)
  }
  
  onWaitForNextQuiz(callback: (data: { timeUntilNextQuiz: number }) => void, context?: any) {
    phaserEvents.on(Event.WAIT_FOR_NEXT_QUIZ, callback, context)
  }

  onQuizStarted(callback: (data: { curQuiz: number; quizTime: number }) => void, context?: any) {
    phaserEvents.on(Event.START_QUIZ, callback, context)
  }

  onQuizEnded(callback: () => void, context?: any) {
    phaserEvents.on(Event.END_QUIZ, callback, context)
  }

  onLeftQuiz(callback: () => void, context?: any) {
    phaserEvents.on(Event.LEFT_QUIZ, callback, context)
  }

  onPlayerLeftQuiz(callback: (clientId: string) => void, context?: any) {
    phaserEvents.on(Event.PLAYER_LEFT_QUIZ, callback, context)
  }

  // method to send player updates to Colyseus server
  updatePlayer(currentX: number, currentY: number, currentAnim: string) {
    this.room?.send(Message.UPDATE_PLAYER, { x: currentX, y: currentY, anim: currentAnim })
  }

  // method to send player name to Colyseus server
  updatePlayerName(currentName: string) {
    this.room?.send(Message.UPDATE_PLAYER_NAME, { name: currentName })
  }

  // method to send ready-to-connect signal to Colyseus server
  readyToConnect() {
    this.room?.send(Message.READY_TO_CONNECT)
    phaserEvents.emit(Event.MY_PLAYER_READY)
  }

  // // method to send ready-to-connect signal to Colyseus server
  // videoConnected() {
  //   this.room?.send(Message.VIDEO_CONNECTED)
  //   phaserEvents.emit(Event.MY_PLAYER_VIDEO_CONNECTED)
  // }

  // // method to send stream-disconnection signal to Colyseus server
  // playerStreamDisconnect(id: string) {
  //   this.room?.send(Message.DISCONNECT_STREAM, { clientId: id })
  //   this.webRTC?.deleteVideoStream(id)
  // }

  connectToComputer(id: string) {
    this.room?.send(Message.CONNECT_TO_COMPUTER, { computerId: id })
  }

  disconnectFromComputer(id: string) {
    this.room?.send(Message.DISCONNECT_FROM_COMPUTER, { computerId: id })
  }

  connectToWhiteboard(id: string) {
    this.room?.send(Message.CONNECT_TO_WHITEBOARD, { whiteboardId: id })
  }

  disconnectFromWhiteboard(id: string) {
    this.room?.send(Message.DISCONNECT_FROM_WHITEBOARD, { whiteboardId: id })
  }

  // onStopScreenShare(id: string) {
  //   this.room?.send(Message.STOP_SCREEN_SHARE, { computerId: id })
  // }

  addChatMessage(content: string) {
    this.room?.send(Message.ADD_CHAT_MESSAGE, { content: content })
  }
}
