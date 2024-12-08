// client/src/characters/MyPlayer.ts

import Phaser from 'phaser';
import PlayerSelector from './PlayerSelector';
import { PlayerBehavior } from '../../../types/PlayerBehavior';
import { sittingShiftData } from './Player';
import Player from './Player';
import Network from '../services/Network';
import Chair from '../items/Chair';
import Computer from '../items/Computer';
import Whiteboard from '../items/Whiteboard';
import VendingMachine from '../items/VendingMachine';

import { phaserEvents, Event } from '../events/EventCenter'
import store from '../stores'
import { pushPlayerJoinedMessage } from '../stores/ChatStore'
import { ItemType } from '../../../types/Items'
import { NavKeys } from '../../../types/KeyboardState'
import { JoystickMovement } from '../components/Joystick'
import { openURL } from '../utils/helpers'

export default class MyPlayer extends Player {
  private playContainerBody: Phaser.Physics.Arcade.Body;
  private chairOnSit?: Chair | VendingMachine;
  private isAnswerCorrect?: boolean;
  public joystickMovement?: JoystickMovement;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, id, frame)
    this.playContainerBody = this.playerContainer.body as Phaser.Physics.Arcade.Body
  }

  protected onProgressZero() {
    this.getAnswer()
  }

  public getAnswer() {
    let answer: true | false | undefined;
    const playerX = this.x;
    const playerY = this.y;

    if (playerX < 640 && playerY >= 700) {
      answer = true;
    } else if (playerX > 640 && playerY >= 700) {
      answer = false;
    } else {
      // 플레이어가 답변 영역에 있지 않을 때 처리
      answer = undefined;
    }
    this.isAnswerCorrect = answer;
    return this.isAnswerCorrect
  }

  setPlayerName(name: string) {
    this.playerName.setText(name);
    phaserEvents.emit(Event.MY_PLAYER_NAME_CHANGE, name);
    store.dispatch(pushPlayerJoinedMessage(name));
  }

  setPlayerTexture(texture: string) {
    this.playerTexture = texture;
    this.anims.play(`${this.playerTexture}_idle_down`, true);
    phaserEvents.emit(Event.MY_PLAYER_TEXTURE_CHANGE, this.x, this.y, this.anims.currentAnim.key);
  }

  handleJoystickMovement(movement: JoystickMovement) {
    this.joystickMovement = movement;
  }

  update(
    playerSelector: PlayerSelector,
    cursors: NavKeys,
    keyE: Phaser.Input.Keyboard.Key,
    keyR: Phaser.Input.Keyboard.Key,
    keyQ: Phaser.Input.Keyboard.Key,
    network: Network
  ) {
    if (!cursors) return;

    const state = store.getState()
    const isPlayerInQuiz = state.quiz.participants.includes(this.playerName.text)
    // y 좌표가 700보다 작아질 경우 서버에 퀴즈 나가기 요청을 보냄
    if (this.y < 700 && isPlayerInQuiz) {
      network.leaveQuiz();

      const parts = this.anims.currentAnim.key.split('_');
      parts[1] = 'idle';
      this.play(parts.join('_'), true);
      this.playerBehavior = PlayerBehavior.IDLE;

      playerSelector.setPosition(this.x, this.y);
      playerSelector.update(this, cursors);
      network.updatePlayer(this.x, this.y, this.anims.currentAnim.key);
    };

    const item = playerSelector.selectedItem

    if (Phaser.Input.Keyboard.JustDown(keyR)) {
      switch (item?.itemType) {
        case ItemType.COMPUTER:
          const computer = item as Computer
          computer.openDialog(this.playerId, network)
          break
        case ItemType.WHITEBOARD:
          const whiteboard = item as Whiteboard
          whiteboard.openDialog(network)
          break
        case ItemType.VENDINGMACHINE:
          // hacky and hard-coded, but leaving it as is for now
          const vendingmachine = item as VendingMachine
          break
      }
    }

    switch (this.playerBehavior) {
      case PlayerBehavior.IDLE:
        // If press E in front of a chair
        if (Phaser.Input.Keyboard.JustDown(keyE) && item?.itemType === ItemType.CHAIR) {
          const chairItem = item as Chair;
          this.scene.time.addEvent({
            delay: 10,
            callback: () => {
              // Update character velocity and position
              this.setVelocity(0, 0);
              if (chairItem.itemDirection) {
                this.setPosition(
                  chairItem.x + sittingShiftData[chairItem.itemDirection][0],
                  chairItem.y + sittingShiftData[chairItem.itemDirection][1]
                ).setDepth(chairItem.depth + sittingShiftData[chairItem.itemDirection][2]);
                // Also update playerNameContainer velocity and position
                this.playContainerBody.setVelocity(0, 0);
                this.playerContainer.setPosition(
                  chairItem.x + sittingShiftData[chairItem.itemDirection][0],
                  chairItem.y + sittingShiftData[chairItem.itemDirection][1] - 30
                );
              }

              this.play(`${this.playerTexture}_sit_${chairItem.itemDirection}`, true);
              playerSelector.selectedItem = undefined;
              if (chairItem.itemDirection === 'up') {
                playerSelector.setPosition(this.x, this.y - this.height);
              } else {
                playerSelector.setPosition(0, 0);
              }
              // Send new location and anim to server
              network.updatePlayer(this.x, this.y, this.anims.currentAnim.key);
            },
            loop: false,
          });
          // Set up new dialog as player sits down
          chairItem.clearDialogBox();
          chairItem.setDialogBox('Press E to leave');
          this.chairOnSit = chairItem;
          this.playerBehavior = PlayerBehavior.SITTING;
          return;
        }

        // If press Q in front of a vending machine (or any other item triggering the quiz)
        if (Phaser.Input.Keyboard.JustDown(keyQ) && item?.itemType === ItemType.VENDINGMACHINE) {
          const vendingMachineItem = item as VendingMachine;

          network.requestQuizData();

          // 플레이어 행동 상태를 WORKING으로 설정
          this.playerBehavior = PlayerBehavior.WORKING;
          this.scene.time.addEvent({
            delay: 10,
            callback: () => {
              // 플레이어의 속도 초기화
              this.setVelocity(0, 0);
              vendingMachineItem.itemDirection = 'down'; // 방향 설정
              this.play(`${this.playerTexture}_work_${vendingMachineItem.itemDirection}`, true);
              playerSelector.selectedItem = undefined;

              // 플레이어 위치 및 애니메이션 업데이트를 서버에 전송
              network.updatePlayer(this.x, this.y, this.anims.currentAnim.key);
            },
            loop: false,
          });
          vendingMachineItem.clearDialogBox();
          return;
          // Set up new dialog as player starts working
        }

        // Handle player movement
        const speed = 200;
        let vx = 0;
        let vy = 0;

        let joystickLeft = false;
        let joystickRight = false;
        let joystickUp = false;
        let joystickDown = false;

        if (this.joystickMovement?.isMoving) {
          joystickLeft = this.joystickMovement.direction.left;
          joystickRight = this.joystickMovement.direction.right;
          joystickUp = this.joystickMovement.direction.up;
          joystickDown = this.joystickMovement.direction.down;
        }

        if (cursors.left?.isDown || cursors.A?.isDown || joystickLeft) vx -= speed;
        if (cursors.right?.isDown || cursors.D?.isDown || joystickRight) vx += speed;
        if (cursors.up?.isDown || cursors.W?.isDown || joystickUp) {
          vy -= speed;
          this.setDepth(this.y); // Change player depth if y changes
        }
        if (cursors.down?.isDown || cursors.S?.isDown || joystickDown) {
          vy += speed;
          this.setDepth(this.y); // Change player depth if y changes
        }

        // Update character velocity
        this.setVelocity(vx, vy);
        this.body.velocity.setLength(speed);
        // Also update playerNameContainer velocity
        this.playContainerBody.setVelocity(vx, vy);
        this.playContainerBody.velocity.setLength(speed);

        // Update animation according to velocity and send new location and anim to server
        if (vx !== 0 || vy !== 0) network.updatePlayer(this.x, this.y, this.anims.currentAnim.key);
        if (vx > 0) {
          this.play(`${this.playerTexture}_run_right`, true);
        } else if (vx < 0) {
          this.play(`${this.playerTexture}_run_left`, true);
        } else if (vy > 0) {
          this.play(`${this.playerTexture}_run_down`, true);
        } else if (vy < 0) {
          this.play(`${this.playerTexture}_run_up`, true);
        } else {
          const parts = this.anims.currentAnim.key.split('_');
          parts[1] = 'idle';
          const newAnim = parts.join('_');
          // Prevent idle animation from being called repeatedly
          if (this.anims.currentAnim.key !== newAnim) {
            this.play(parts.join('_'), true);
            // Send new location and anim to server
            network.updatePlayer(this.x, this.y, this.anims.currentAnim.key);
          }
        }
        break;

      case PlayerBehavior.SITTING:
        // Return to idle if player presses E while sitting
        if (Phaser.Input.Keyboard.JustDown(keyE)) {
          const parts = this.anims.currentAnim.key.split('_');
          parts[1] = 'idle';
          this.play(parts.join('_'), true);
          this.playerBehavior = PlayerBehavior.IDLE;
          this.chairOnSit?.clearDialogBox();
          playerSelector.setPosition(this.x, this.y);
          playerSelector.update(this, cursors);
          network.updatePlayer(this.x, this.y, this.anims.currentAnim.key);
        }
        break;

      case PlayerBehavior.WORKING:
        const speed2 = 400;
        let vx2 = 0;
        let vy2 = 0;
      
        if (this.joystickMovement?.isMoving) {
          joystickLeft = this.joystickMovement.direction.left;
          joystickRight = this.joystickMovement.direction.right;
          joystickUp = this.joystickMovement.direction.up;
          joystickDown = this.joystickMovement.direction.down;
        }
      
        if (cursors.left?.isDown || cursors.A?.isDown) vx2 -= speed2;
        if (cursors.right?.isDown || cursors.D?.isDown) vx2 += speed2;
        if (cursors.up?.isDown || cursors.W?.isDown) {
          vy2 -= speed2;
          this.setDepth(this.y); // y 좌표 변경 시 깊이 변경
        }
        if (cursors.down?.isDown || cursors.S?.isDown) {
          vy2 += speed2;
          this.setDepth(this.y); // y 좌표 변경 시 깊이 변경
        }
      
        // 캐릭터 속도 업데이트
        this.setVelocity(vx2, vy2);
        this.body.velocity.setLength(speed2);
        // playerNameContainer 속도 업데이트
        this.playContainerBody.setVelocity(vx2, vy2);
        this.playContainerBody.velocity.setLength(speed2);
      
        // 애니메이션 업데이트 및 서버에 전송
        if (vx2 !== 0 || vy2 !== 0) network.updatePlayer(this.x, this.y, this.anims.currentAnim.key);
      
        // Return to idle if player presses Q while working
        if (Phaser.Input.Keyboard.JustDown(keyQ)) {
          // this.scene.events.emit('stopQuiz');
          network.leaveQuiz();
          const parts = this.anims.currentAnim.key.split('_');
          parts[1] = 'idle';
          this.play(parts.join('_'), true);
          this.playerBehavior = PlayerBehavior.IDLE;

          playerSelector.setPosition(this.x, this.y);
          playerSelector.update(this, cursors);
          network.updatePlayer(this.x, this.y, this.anims.currentAnim.key);
        }
        break;
    }
  }
}

declare global {
  namespace Phaser.GameObjects {
    interface GameObjectFactory {
      myPlayer(x: number, y: number, texture: string, id: string, frame?: string | number): MyPlayer
    }
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'myPlayer',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    const sprite = new MyPlayer(this.scene, x, y, texture, id, frame)

    this.displayList.add(sprite);
    this.updateList.add(sprite);

    this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY);

    const collisionScale = [0.5, 0.2];
    sprite.body
      .setSize(sprite.width * collisionScale[0], sprite.height * collisionScale[1])
      .setOffset(
        sprite.width * (1 - collisionScale[0]) * 0.5,
        sprite.height * (1 - collisionScale[1])
      );

    return sprite;
  }
);
