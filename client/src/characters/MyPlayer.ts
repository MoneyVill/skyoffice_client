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

import { phaserEvents, Event } from '../events/EventCenter';
import store from '../stores';
import { pushPlayerJoinedMessage } from '../stores/ChatStore';
import { ItemType } from '../../../types/Items';
import { NavKeys } from '../../../types/KeyboardState';
import { JoystickMovement } from '../components/Joystick';
import { updatePlayer } from '../stores/PlayerStore';

export default class MyPlayer extends Player {
  private playContainerBody: Phaser.Physics.Arcade.Body;
  private chairOnSit?: Chair | VendingMachine;
  public joystickMovement?: JoystickMovement;

  constructor(
    scene: Phaser.Scene,
    money: number,
    score: number,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    super(scene, money, score, x, y, texture, id, frame);
    this.playerMoney = money;
    this.playerScore = score;
    this.playContainerBody = this.playerContainer.body as Phaser.Physics.Arcade.Body;

    // Listen for the 'quizEnded' event
    this.scene.events.on('quizEnded', () => {
      this.hideProgressBar();
      if (this.playerBehavior === PlayerBehavior.WORKING) {
        this.playerBehavior = PlayerBehavior.IDLE;
        const parts = this.anims.currentAnim.key.split('_');
        parts[1] = 'idle';
        this.play(parts.join('_'), true);
      }
    });
  }

  protected onProgressZero() {
    this.setPlayerInfo(100, 20); // Called when progress bar reaches zero
  }

  setPlayerName(name: string) {
    this.playerName.setText(name);
    phaserEvents.emit(Event.MY_PLAYER_NAME_CHANGE, name);
    store.dispatch(pushPlayerJoinedMessage(name));
  }

  // Method to set player money and score
  setPlayerInfo(money: number, score: number) {
    this.playerMoney += money;
    this.playerScore += score;
    store.dispatch(
      updatePlayer({
        name: this.playerId,
        data: {
          money: this.playerMoney,
          score: this.playerScore,
        },
      })
    );
    phaserEvents.emit(Event.MY_PLAYER_INFO_CHANGE, this.playerMoney, this.playerScore);
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

          const vendingMachineId = vendingMachineItem.getData('id'); // Get the vending machine ID

          // Emit the startQuiz event with the appropriate quiz type
          switch (vendingMachineId) {
            case 'vending_machine_0':
              this.scene.events.emit('startQuiz', 'quiz_0'); // Trigger quiz 0
              break;
            case 'vending_machine_1':
              this.scene.events.emit('startQuiz', 'quiz_1'); // Trigger quiz 1
              break;
            case 'vending_machine_2':
              this.scene.events.emit('startQuiz', 'quiz_2'); // Trigger quiz 2
              break;
            default:
              console.error('Unknown vending machine ID:', vendingMachineId);
          }
          // Set up player behavior as 'WORKING' during the quiz (optional, if needed)
          this.playerBehavior = PlayerBehavior.WORKING;

          this.scene.time.addEvent({
            delay: 10,
            callback: () => {
              // Update character velocity and position
              this.setVelocity(0, 0);
              if (vendingMachineItem.itemDirection) {
                this.setPosition(
                  vendingMachineItem.x + sittingShiftData[vendingMachineItem.itemDirection][0],
                  vendingMachineItem.y + sittingShiftData[vendingMachineItem.itemDirection][1]
                ).setDepth(
                  vendingMachineItem.depth + sittingShiftData[vendingMachineItem.itemDirection][2]
                );
                // Also update playerNameContainer velocity and position
                this.playContainerBody.setVelocity(0, 0);
                this.playerContainer.setPosition(
                  vendingMachineItem.x + sittingShiftData[vendingMachineItem.itemDirection][0],
                  vendingMachineItem.y + sittingShiftData[vendingMachineItem.itemDirection][1] - 30
                );
              }
              vendingMachineItem.itemDirection = 'down'; // Set direction to 'down'
              this.play(`${this.playerTexture}_work_${vendingMachineItem.itemDirection}`, true);
              playerSelector.selectedItem = undefined;
              if (vendingMachineItem.itemDirection === 'up') {
                playerSelector.setPosition(this.x, this.y - this.height);
              } else {
                playerSelector.setPosition(0, 0);
              }
              // Send new location and anim to server
              network.updatePlayer(this.x, this.y, this.anims.currentAnim.key);
            },
            loop: false,
          });
          // Set up new dialog as player starts working
          vendingMachineItem.clearDialogBox();
          // vendingMachineItem.setDialogBox('Press Q to leave');


          this.chairOnSit = vendingMachineItem;
          this.playerBehavior = PlayerBehavior.WORKING;

          // Show progress bar or any other UI elements if necessary
          this.showProgressBar();
          this.decreaseProgressOverTime(5000);
          return;
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
        // Return to idle if player presses Q while working
        if (Phaser.Input.Keyboard.JustDown(keyQ)) {
          this.scene.events.emit('stopQuiz');
          const parts = this.anims.currentAnim.key.split('_');
          parts[1] = 'idle';
          this.play(parts.join('_'), true);
          this.playerBehavior = PlayerBehavior.IDLE;
          this.chairOnSit?.clearDialogBox();

          this.hideProgressBar();
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
      myPlayer(
        money: number,
        score: number,
        x: number,
        y: number,
        texture: string,
        id: string,
        frame?: string | number
      ): MyPlayer;
    }
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'myPlayer',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    money: number,
    score: number,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    const sprite = new MyPlayer(this.scene, money, score, x, y, texture, id, frame);

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
