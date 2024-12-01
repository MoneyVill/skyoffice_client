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
import { setFocused, setShowChat } from '../stores/ChatStore'
import { NavKeys, Keyboard } from '../../../types/KeyboardState'

// Import the Quiz class with the correct path
import Quiz from '../stores/Quiz'
import { QuestionAnswer } from '@mui/icons-material'

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
  private isPlayerWaitingForQuiz: boolean = false;

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
    const mark = this.map.addTilesetImage('mark', 'tiles_wall2')

    // Create map layers
    const groundLayer = this.map.createLayer('Ground', FloorAndGround)
    const groundLayer2 = this.map.createLayer('Ground2', mark)
    groundLayer.setCollisionByProperty({ collides: true })
    groundLayer2.setCollisionByProperty({ collides: true })

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
    this.addGroupFromTiled('Objects', 'office', 'Modern_Office_Black_Shadow', false)
    this.addGroupFromTiled('Newobject', 'school', 'Classroom_and_library', true)
    this.addGroupFromTiled('ObjectsOnCollide', 'office', 'Modern_Office_Black_Shadow', true)
    this.addGroupFromTiled('GenericObjects', 'generic', 'Generic', false)
    this.addGroupFromTiled('GenericObjectsOnCollide', 'generic', 'Generic', true)
    this.addGroupFromTiled('AnswerObject', 'cross', 'answerincorrect', false)
    this.addGroupFromTiled('AnswerObject', 'circle', 'answercorrect', false)

    // Group for other players
    this.otherPlayers = this.physics.add.group({ classType: OtherPlayer })

    // Set up camera
    this.cameras.main.zoom = 1.5
    this.cameras.main.startFollow(this.myPlayer, true)

    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], groundLayer)
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
    this.network.onPlayerJoinQuiz(this.handlePlayerJoinQuiz, this)
    this.network.onWaitForNextQuiz(this.handlePlayerWaitQuiz, this)
    this.network.onQuizStarted(this.handleStartQuiz, this)
    this.network.onWaitForNextQuiz(this.handleWaitForNextQuiz, this)
    this.network.onQuizEnded(this.handleEndQuiz, this)
    this.network.onLeftQuiz(this.handleLeftQuiz, this)
    this.network.onPlayerLeftQuiz(this.handlePlayerLeftQuiz, this)
  }

  private handlePlayerJoinQuiz(data: { remainingTime: number }) {
    // console.log("PlayerJoined")
    // console.log("remainingTime: ", data.remainingTime)
    this.myPlayer.joinQuiz();
  }

  private handlePlayerWaitQuiz(data: { timeUntilNextQuiz: number }) {
    // console.log("PlayerJoined")
    // console.log("remainingTime: ", data.timeUntilNextQuiz)
    this.isPlayerWaitingForQuiz = true;
    setTimeout(() => {
      if (this.isPlayerWaitingForQuiz) {
        this.network.requestQuizData()
      }
    }, data.timeUntilNextQuiz * 1000 + 500);
  }

  private handleStartQuiz(data: { curQuiz:number, quizTime: number }) {    
    // 퀴즈 시작
    if (this.myPlayer.isParticipatingInQuiz) {
      this.quiz.setQuiz(data.curQuiz)
      this.quiz.showQuiz()
      this.myPlayer.showProgressBar(data.quizTime);
    }
    // 플레이어 진행 바 표시 및 감소 시작
  }

  private handleWaitForNextQuiz(data: { timeUntilNextQuiz: number }) {
    this.showWaitingMessage(data.timeUntilNextQuiz)
  }

  private handleEndQuiz() {
    this.quiz.hideQuiz(this.myPlayer.getAnswer())
    this.myPlayer.hideProgressBar();
  }

  private handleLeftQuiz() {
    this.isPlayerWaitingForQuiz = false; 
    this.myPlayer.leaveQuiz();
    // this.quiz.hideQuiz()
    this.myPlayer.hideProgressBar();
  }

  private handlePlayerLeftQuiz(clientId: string) {
    // 해당 사용자가 퀴즈에서 나갔음을 UI 등에 반영
  }

  private showWaitingMessage(timeUntilNextQuiz: number) {
    // 사용자에게 다음 퀴즈까지 남은 시간을 알려주는 UI 로직 구현
    const message = `다음 퀴즈까지 ${timeUntilNextQuiz}초 남았습니다.`
    // 예를 들어, Phaser의 텍스트 객체를 사용하여 화면에 표시
    console.log(message) // 실제 구현에서는 화면에 표시하도록 수정하세요.
  }

  private handleItemSelectorOverlap(playerSelector, selectionItem) {
    const currentItem = playerSelector.selectedItem as Item
    // Handle item selection logic
    if (currentItem) {
      if (currentItem === selectionItem || currentItem.depth >= selectionItem.depth) {
        return
      }
      if (this.myPlayer.playerBehavior !== PlayerBehavior.SITTING) {
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
    // Update the quiz if it's active
    if (this.quiz.isQuizActive()) {
      // Note: Player can still move during the quiz
    }

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
