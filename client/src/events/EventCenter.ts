import Phaser from 'phaser'

export const phaserEvents = new Phaser.Events.EventEmitter()

export enum Event {
  PLAYER_JOINED = 'player-joined',
  PLAYER_UPDATED = 'player-updated',
  PLAYER_LEFT = 'player-left',
  PLAYER_DISCONNECTED = 'player-disconnected',
  MY_PLAYER_READY = 'my-player-ready',
  MY_PLAYER_NAME_CHANGE = 'my-player-name-change',
  MY_PLAYER_TEXTURE_CHANGE = 'my-player-texture-change',
  MY_PLAYER_VIDEO_CONNECTED = 'my-player-video-connected',
  ITEM_USER_ADDED = 'item-user-added',
  ITEM_USER_REMOVED = 'item-user-removed',
  UPDATE_DIALOG_BUBBLE = 'update-dialog-bubble',
  WAIT_FOR_NEXT_QUIZ = 'waitForNextQuiz',
  PLAYER_JOIN_QUIZ = 'playerjoinQuiz',
  JOIN_QUIZ = 'joinQuiz',
  START_QUIZ = 'startQuiz',
  END_QUIZ = 'endQuiz',
  LEFT_QUIZ = 'leftQuiz',
  PLAYER_LEFT_QUIZ = 'playerleftQuiz',
}
