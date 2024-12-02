// client/src/scenes/Game.ts

import Phaser from 'phaser'

// Import necessary animations and items
import { createCharacterAnims } from '../anims/CharacterAnims'
import Item from '../items/Item'
import Chair from '../items/Chair'
import Computer from '../items/Computer'
import Whiteboard from '../items/Whiteboard'
import VendingMachine from '../items/VendingMachine'
import AnswerCorrect from '../items/AnswerCorrect';
import AnswerIncorrect from '../items/AnswerIncorrect';

// Import custom player classes
import '../characters/MyPlayer'
import '../characters/OtherPlayer'
import MyPlayer from '../characters/MyPlayer'
import OtherPlayer from '../characters/OtherPlayer'
import PlayerSelector from '../characters/PlayerSelector'

// Import network and events
import Network from '../services/Network'
import { IPlayer } from '../../../types/IOfficeState'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import { ItemType } from '../../../types/Items'

// Import store and events
import store from '../stores'
import { pushPlayerLeftMessage, setFocused, setShowChat } from '../stores/ChatStore'
import { NavKeys, Keyboard } from '../../../types/KeyboardState'
import { 
  pushQuizStartedMessage,
  pushQuizEndedMessage,
  playerJoinedQuiz,
  addExistingParticipants,
  playerWaitingForQuiz,
  playerLeftQuiz, 
} from '../stores/QuizStore';

// Import the Quiz class with the correct path
import Quiz from '../quiz/Quiz'

export default class Game extends Phaser.Scene {
  network!: Network
  private cursors!: NavKeys
  private keyE!: Phaser.Input.Keyboard.Key
  private keyR!: Phaser.Input.Keyboard.Key
  private keyQ!: Phaser.Input.Keyboard.Key
  private map!: Phaser.Tilemaps.Tilemap
  myPlayer!: MyPlayer
  private playerSelector!: Phaser.GameObjects.Zone
  private otherPlayers!: Phaser.Physics.Arcade.Group
  private otherPlayerMap = new Map<string, OtherPlayer>()
  computerMap = new Map<string, Computer>()
  private whiteboardMap = new Map<string, Whiteboard>()
  public answerCorrectGroup!: Phaser.Physics.Arcade.StaticGroup;
  public answerIncorrectGroup!: Phaser.Physics.Arcade.StaticGroup;
  
  // Quiz instance
  private quiz!: Quiz

  constructor() {
    super('game')
  }

  registerKeys() {
    // Register navigation keys
    this.cursors = {
      ...this.input.keyboard.createCursorKeys(),
      ...(this.input.keyboard.addKeys('W,S,A,D') as Keyboard),
    }

    // Register action keys
    this.keyE = this.input.keyboard.addKey('E')
    this.keyR = this.input.keyboard.addKey('R')
    this.keyQ = this.input.keyboard.addKey('Q')

    // Disable global key capture for chat input
    this.input.keyboard.disableGlobalCapture()
    this.input.keyboard.on('keydown-ENTER', (event) => {
      store.dispatch(setShowChat(true))
      store.dispatch(setFocused(true))
    })
    this.input.keyboard.on('keydown-ESC', (event) => {
      store.dispatch(setShowChat(false))
    })
  }

  disableKeys() {
    this.input.keyboard.enabled = false
  }

  enableKeys() {
    this.input.keyboard.enabled = true
  }

  create(data: { network: Network }) {
    if (!data.network) {
      throw new Error('server instance missing')
    } else {
      this.network = data.network
    }

    // Create character animations
    createCharacterAnims(this.anims)
    
    // Load the tilemap
    this.map = this.make.tilemap({ key: 'tilemap' })

    // Add tilesets
    const FloorAndGround = this.map.addTilesetImage('FloorAndGround', 'tiles_wall')
    const ground2 = this.map.addTilesetImage('Basement', 'building')

    // Create map layers
    const groundLayer = this.map.createLayer('Ground', FloorAndGround)
    const groundLayer2 = this.map.createLayer('Ground2', ground2)
    groundLayer.setCollisionByProperty({ collides: true })
    groundLayer2.setCollisionByProperty({ collides: true })
    groundLayer2.setCollisionByExclusion([-1]);

    this.answerCorrectGroup = this.physics.add.staticGroup({ classType: AnswerCorrect });
    const answerCorrectLayer = this.map.getObjectLayer('AnswerCorrect');
    answerCorrectLayer.objects.forEach((obj) => {
      const item = this.addObjectFromTiled(
        this.answerCorrectGroup,
        obj,
        'answercircle',
        'glowanswercorrect'
      ) as AnswerCorrect;
      item.setVisible(false);
    });
    this.answerIncorrectGroup = this.physics.add.staticGroup({ classType: AnswerIncorrect });
    const answerIncorrectLayer = this.map.getObjectLayer('AnswerIncorrect');
    answerIncorrectLayer.objects.forEach((obj) => {
      const item = this.addObjectFromTiled(
       this.answerIncorrectGroup,
        obj,
        'answercross',
        'glowanswerincorrect'
      ) as AnswerIncorrect;
      item.setVisible(false);
    });

    this.myPlayer = this.add.myPlayer(705, 500, 'adam', this.network.mySessionId);
    this.playerSelector = new PlayerSelector(this, 0, 0, 16, 16)

    // Register keys
    this.registerKeys()

    // Initialize the quiz instance
    this.quiz = new Quiz(this, this.network, this.answerCorrectGroup, this.answerIncorrectGroup)
    // Import chairs from the tilemap
    const chairs = this.physics.add.staticGroup({ classType: Chair })
    const chairLayer = this.map.getObjectLayer('Chair')
    chairLayer.objects.forEach((chairObj) => {
      const item = this.addObjectFromTiled(chairs, chairObj, 'chairs', 'chair') as Chair
      item.itemDirection = chairObj.properties[0].value
    })

    // Import computers from the tilemap
    const computers = this.physics.add.staticGroup({ classType: Computer })
    const computerLayer = this.map.getObjectLayer('Computer')
    computerLayer.objects.forEach((obj, i) => {
      const item = this.addObjectFromTiled(computers, obj, 'computers', 'computer') as Computer
      item.setDepth(item.y + item.height * 0.27)
      const id = `${i}`
      item.id = id
      this.computerMap.set(id, item)
    })

    // Import whiteboards from the tilemap
    const whiteboards = this.physics.add.staticGroup({ classType: Whiteboard })
    const whiteboardLayer = this.map.getObjectLayer('Whiteboard')
    whiteboardLayer.objects.forEach((obj, i) => {
      const item = this.addObjectFromTiled(
        whiteboards,
        obj,
        'whiteboards',
        'whiteboard'
      ) as Whiteboard

      item.setVisible(false)
      const id = `${i}`
      item.id = id
      this.whiteboardMap.set(id, item)
    })

    // Import vending machines from the tilemap
    const vendingMachines = this.physics.add.staticGroup({ classType: VendingMachine });
    const vendingMachineLayer = this.map.getObjectLayer('VendingMachine');
    vendingMachineLayer.objects.forEach((obj, i) => {
      const vendingMachine = this.addObjectFromTiled(
        vendingMachines,
        obj,
        'vendingmachines',
        'vendingmachine'
      ) as VendingMachine;
      vendingMachine.setData('id', `vending_machine_${i}`); // Assign unique IDs
    });

    // Import other objects from the tilemap
    this.addGroupFromTiled('Wall', 'tiles_wall', 'FloorAndGround', false)
    this.addGroupFromTiled('Objects', 'newdesign', 'Newdesign', false)
    this.addGroupFromTiled('ObjectsOnCollide', 'newdesign', 'Newdesign', true)
    this.addGroupFromTiled('GenericObjects', 'generic', 'Generic', false)
    this.addGroupFromTiled('GenericObjectsOnCollide', 'generic', 'Generic', true)
    this.addGroupFromTiled('AnswerObject', 'cross', 'answerincorrect', false)
    this.addGroupFromTiled('AnswerObject', 'circle', 'answercorrect', false)

    // Group for other players
    this.otherPlayers = this.physics.add.group({ classType: OtherPlayer })

    // Set up camera
    this.cameras.main.zoom = 1.4
    this.cameras.main.startFollow(this.myPlayer, true)

    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], groundLayer)
    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], groundLayer2)
    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], vendingMachines)

    // Set up overlap with items
    this.physics.add.overlap(
      this.playerSelector,
      [chairs, computers, whiteboards, vendingMachines],
      this.handleItemSelectorOverlap,
      undefined,
      this
    )

    // Register network event listeners
    this.network.onPlayerJoined(this.handlePlayerJoined, this)
    this.network.onPlayerLeft(this.handlePlayerLeft, this)
    this.network.onMyPlayerReady(this.handleMyPlayerReady, this)
    // this.network.onMyPlayerVideoConnected(this.handleMyVideoConnected, this)
    this.network.onPlayerUpdated(this.handlePlayerUpdated, this)
    this.network.onItemUserAdded(this.handleItemUserAdded, this)
    this.network.onItemUserRemoved(this.handleItemUserRemoved, this)
    this.network.onChatMessageAdded(this.handleChatMessageAdded, this)
    // 퀴즈 관련 이벤트 리스너 등록
    this.network.onWaitForNextQuiz(this.handlePlayerWaitQuiz, this)
    this.network.onPlayerJoinQuiz(this.handlePlayerJoinQuiz, this)
    this.network.onJoinQuiz(this.handleJoinQuiz, this)
    this.network.onQuizStarted(this.handleStartQuiz, this)
    this.network.onQuizEnded(this.handleEndQuiz, this)
    this.network.onLeftQuiz(this.handleLeftQuiz, this)
    this.network.onPlayerLeftQuiz(this.handlePlayerLeftQuiz, this)
  }

  private handlePlayerJoinQuiz(data: { playerName: string; participantsCount: number; existingParticipants: string[] }) {
    store.dispatch(addExistingParticipants(data.existingParticipants));
    store.dispatch(playerJoinedQuiz(data.playerName));
    this.quiz.playerJoinQuiz(data.playerName, data.participantsCount);
  }

  private handleJoinQuiz(data: { remainingTime: number }) {
    this.quiz.playerJoinedQuiz(data.remainingTime)
  }

  private handlePlayerWaitQuiz(data: { timeUntilNextQuiz: number }) {
    this.quiz.playerWaitQuiz(data.timeUntilNextQuiz);
    store.dispatch(playerWaitingForQuiz(true));
  }

  private handleStartQuiz(data: { curQuiz: number, quizTime: number }) {
    store.dispatch(playerWaitingForQuiz(false));
    store.dispatch(pushQuizStartedMessage());

    const state = store.getState();
    const isPlayerInQuiz = state.quiz.participants.includes(this.myPlayer.playerName.text);
    if (isPlayerInQuiz) {
      this.quiz.setQuiz(data.curQuiz)
      this.quiz.startQuiz(688, 1040);
      this.myPlayer.showProgressBar(data.quizTime);
    }
  }

  private handleEndQuiz() {
    store.dispatch(pushQuizEndedMessage());
    const state = store.getState();
    const isPlayerJoinQuiz = state.quiz.participants.includes(this.myPlayer.playerName.text);
    if (isPlayerJoinQuiz) {
      this.quiz.endQuiz(this.myPlayer.getAnswer())
      this.myPlayer.hideProgressBar();
    }
  }

  private handlePlayerLeftQuiz(data: { playerName: string }) {
    this.quiz.playerLeftQuiz2(data.playerName)
  }

  private handleLeftQuiz() {
    store.dispatch(playerLeftQuiz(this.myPlayer.playerName.text))
    store.dispatch(playerWaitingForQuiz(false));

    const state = store.getState();
    const participantsCount = state.quiz.participants.length

    this.quiz.playerLeftQuiz(this.myPlayer.playerName.text, participantsCount)
    this.quiz.endQuiz(undefined)
    this.myPlayer.hideProgressBar();
  }

  private handleItemSelectorOverlap(playerSelector, selectionItem) {
    const currentItem = playerSelector.selectedItem as Item
    // Handle item selection logic
    if (currentItem) {
      if (currentItem === selectionItem || currentItem.depth >= selectionItem.depth) {
        return
      }
      if (this.myPlayer.playerBehavior !== (PlayerBehavior.SITTING)) {
        currentItem.clearDialogBox()
      }
    }
    playerSelector.selectedItem = selectionItem;
    selectionItem.onOverlapDialog();

}

  private addObjectFromTiled(
    group: Phaser.Physics.Arcade.StaticGroup,
    object: Phaser.Types.Tilemaps.TiledObject,
    key: string,
    tilesetName: string
  ) {
    const actualX = object.x! + object.width! * 0.5
    const actualY = object.y! - object.height! * 0.5
    const obj = group
      .get(actualX, actualY, key, object.gid! - this.map.getTileset(tilesetName).firstgid)
      .setDepth(actualY)
    return obj
  }

  private addGroupFromTiled(
    objectLayerName: string,
    key: string,
    tilesetName: string,
    collidable: boolean
  ) {
    const group = this.physics.add.staticGroup()
    const objectLayer = this.map.getObjectLayer(objectLayerName)
    objectLayer.objects.forEach((object) => {
      const actualX = object.x! + object.width! * 0.5
      const actualY = object.y! - object.height! * 0.5
      group
        .get(actualX, actualY, key, object.gid! - this.map.getTileset(tilesetName).firstgid)
        .setDepth(actualY)
    })
    if (this.myPlayer && collidable)
      this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], group)
  }

  // Function to add new player to the otherPlayers group
  private handlePlayerJoined(newPlayer: IPlayer, id: string) {
    const otherPlayer = this.add.otherPlayer(newPlayer.x, newPlayer.y, 'adam', id, newPlayer.name)
    this.otherPlayers.add(otherPlayer)
    this.otherPlayerMap.set(id, otherPlayer)
  }

  // Function to remove a player who left
  private handlePlayerLeft(id: string) {
    if (this.otherPlayerMap.has(id)) {
      const otherPlayer = this.otherPlayerMap.get(id)
      if (!otherPlayer) return
      this.otherPlayers.remove(otherPlayer, true, true)
      this.otherPlayerMap.delete(id)
    }
  }

  private handleMyPlayerReady() {
    this.myPlayer.readyToConnect = true
  }

  // private handleMyVideoConnected() {
  //   this.myPlayer.videoConnected = true
  // }

  // function to update target position upon receiving player updates
  private handlePlayerUpdated(field: string, value: number | string, id: string) {
    const otherPlayer = this.otherPlayerMap.get(id)
    otherPlayer?.updateOtherPlayer(field, value)
  }

  // private handlePlayersOverlap(myPlayer, otherPlayer) {
  //   otherPlayer.makeCall(myPlayer, this.network?.webRTC)
  // }

  private handleItemUserAdded(playerId: string, itemId: string, itemType: ItemType) {
    if (itemType === ItemType.COMPUTER) {
      const computer = this.computerMap.get(itemId)
      computer?.addCurrentUser(playerId)
    } else if (itemType === ItemType.WHITEBOARD) {
      const whiteboard = this.whiteboardMap.get(itemId)
      whiteboard?.addCurrentUser(playerId)
    }
  }

  private handleItemUserRemoved(playerId: string, itemId: string, itemType: ItemType) {
    if (itemType === ItemType.COMPUTER) {
      const computer = this.computerMap.get(itemId)
      computer?.removeCurrentUser(playerId)
    } else if (itemType === ItemType.WHITEBOARD) {
      const whiteboard = this.whiteboardMap.get(itemId)
      whiteboard?.removeCurrentUser(playerId)
    }
  }

  private handleChatMessageAdded(playerId: string, content: string) {
    const otherPlayer = this.otherPlayerMap.get(playerId)
    otherPlayer?.updateDialogBubble(content)
  }

  update(t: number, dt: number) {
    const state = store.getState();
    const quizInProgress = state.quiz.quizInProgress;

    // Update the quiz if it's active
    // if (!quizInProgress && this.myPlayer && this.network) {
    if (this.myPlayer && this.network) {
      this.playerSelector.update(this.myPlayer, this.cursors)
      this.myPlayer.update(
        this.playerSelector,
        this.cursors,
        this.keyE,
        this.keyR,
        this.keyQ,
        this.network
      )
    }
  }
}
