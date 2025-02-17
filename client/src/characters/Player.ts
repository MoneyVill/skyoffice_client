//client/src/characters/Player.ts

import Phaser from 'phaser'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
/**
 * shifting distance for sitting animation
 * format: direction: [xShift, yShift, depthShift]
 */
export const sittingShiftData = {
  up: [0, 3, -10],
  down: [0, 3, 1],
  left: [0, -8, 10],
  right: [0, -8, 10],
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  playerId: string
  playerTexture: string
  playerBehavior = PlayerBehavior.IDLE
  readyToConnect = false
  videoConnected = false
  playerName: Phaser.GameObjects.Text
  playerContainer: Phaser.GameObjects.Container
  private playerDialogBubble: Phaser.GameObjects.Container
  private timeoutID?: number
  private progressEvent?: Phaser.Time.TimerEvent; // progress 이벤트를 저장
  private progressBar: Phaser.GameObjects.Graphics; // Progress bar 추가
  private alarmIcon: Phaser.GameObjects.Graphics; // Progress bar 추가
  private progressValue: number = 100; // Progress bar의 초기 값
  private progressBarVisible: boolean = false; // 프로그레스 바 초기 숨김 상태

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, frame)

    this.playerId = id
    this.playerTexture = texture
    this.setDepth(this.y)

    this.anims.play(`${this.playerTexture}_idle_down`, true)

    this.progressBar = scene.add.graphics();
    this.alarmIcon = scene.add.graphics();
    this.progressBar.setVisible(false);
    this.alarmIcon.setVisible(false);
    this.updateProgressBar();

    this.playerContainer = this.scene.add.container(this.x, this.y - 30).setDepth(5000)

    // add dialogBubble to playerContainer
    this.playerDialogBubble = this.scene.add.container(0, 0).setDepth(5000)
    this.playerContainer.add(this.playerDialogBubble)

    // add playerName to playerContainer
    this.playerName = this.scene.add
      .text(0, 0, '')
      .setFontFamily('Arial')
      .setFontSize(12)
      .setColor('#000000')
      .setOrigin(0.5)
    this.playerContainer.add(this.playerName)

    this.scene.physics.world.enable(this.playerContainer)
    const playContainerBody = this.playerContainer.body as Phaser.Physics.Arcade.Body
    const collisionScale = [0.5, 0.2]
    playContainerBody
      .setSize(this.width * collisionScale[0], this.height * collisionScale[1])
      .setOffset(-8, this.height * (1 - collisionScale[1]) + 6)
  }

  private updateProgressBar() {
    if (!this.progressBarVisible) {
      return;
    }
    const barWidth = 50;
    const barHeight = 8;
    const xOffset = -barWidth / 2;
    const yOffset = -this.height / 2 - 25;
  
    const alarmIconOffsetX = xOffset; // 알람시계는 progressbar 왼쪽에 위치
    const alarmIconOffsetY = yOffset + 4;
  
    let shakeX = 0;
    let shakeY = 0;
    if (this.progressValue <= 30) {
      shakeX = Phaser.Math.Between(-4, 4);
      shakeY = Phaser.Math.Between(-2, 2);
    }
  
    // Progress bar 업데이트
    this.progressBar.clear();
    this.progressBar.setDepth(10001);
  
    this.progressBar.fillStyle(0x000000, 0.5);
    this.progressBar.fillRect(this.x + xOffset, this.y + yOffset, barWidth, barHeight);
  
    if (this.progressValue <= 50 && this.progressValue > 30) {
      this.progressBar.fillStyle(0xffa500, 1);
    } else if (this.progressValue <= 30) {
      this.progressBar.fillStyle(0xff0000, 1);
    } else {
      this.progressBar.fillStyle(0x00ff00, 1);
    }
    this.progressBar.fillRect(this.x + xOffset, this.y + yOffset, (this.progressValue / 100) * barWidth, barHeight);

    this.alarmIcon.clear();
    this.alarmIcon.setDepth(10002);
    this.alarmIcon.fillStyle(0x87ceeb, 1);

    const alarmIconRadius = 5;
    const alarmCenterX = this.x + alarmIconOffsetX + shakeX;
    const alarmCenterY = this.y + alarmIconOffsetY + shakeY;
    this.alarmIcon.fillCircle(alarmCenterX, alarmCenterY, alarmIconRadius);

    this.alarmIcon.fillStyle(0xffffff, 1)
    this.alarmIcon.fillCircle(alarmCenterX, alarmCenterY, alarmIconRadius * 0.6);

    this.alarmIcon.fillStyle(0x87ceeb, 1);
    const bellWidth = 3.5;
    const bellHeight = 2;
    this.alarmIcon.fillRect(alarmCenterX - bellWidth, alarmCenterY - alarmIconRadius - bellHeight, bellWidth * 2, bellHeight);

    const handLength = alarmIconRadius * 0.8;
    const handAngle = Phaser.Math.DegToRad((this.progressValue / 100) * 360);
    const handEndX = alarmCenterX + handLength * Math.cos(handAngle - Math.PI / 2);
    const handEndY = alarmCenterY + handLength * Math.sin(handAngle - Math.PI / 2);

    this.alarmIcon.lineStyle(1, 0x000000, 1);
    this.alarmIcon.beginPath();
    this.alarmIcon.moveTo(alarmCenterX, alarmCenterY);
    this.alarmIcon.lineTo(handEndX, handEndY);
    this.alarmIcon.strokePath();
  }

  setProgress(value: number) {
    this.progressValue = Phaser.Math.Clamp(value, 0, 100);
    this.updateProgressBar();
    if (this.progressValue <= 0) {
      this.onProgressZero()
      this.hideProgressBar()
    }
  }

  showProgressBar(duration: number) {
    this.progressBarVisible = true
    this.progressBar.setVisible(true)
    this.alarmIcon.setVisible(true)
    this.progressValue = 100
    this.decreaseProgressOverTime(duration)
    this.updateProgressBar()
  }

  hideProgressBar() {
    this.progressBarVisible = false
    this.progressBar.setVisible(false)
    this.alarmIcon.setVisible(false)
    if (this.progressEvent) {
      this.progressEvent.remove();
      this.progressEvent = undefined;
    }
  }

  protected onProgressZero() {
    // this.hideProgressBar();
    // phaserEvents.emit('quizProgressZero');
  }

  decreaseProgressOverTime(duration: number) {
    if (this.progressEvent) {
      this.progressEvent.remove();
    }
    this.progressEvent = this.scene.time.addEvent({
      delay: duration / 100,
      repeat: 100,
      callback: () => {
        this.setProgress(this.progressValue - 1);
      },
      callbackScope: this,
    });
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.updateProgressBar();
  }

  updateDialogBubble(content: string) {
    this.clearDialogBubble()

    // preprocessing for dialog bubble text (maximum 70 characters)
    const dialogBubbleText = content.length <= 70 ? content : content.substring(0, 70).concat('...')

    const innerText = this.scene.add
      .text(0, 0, dialogBubbleText, { wordWrap: { width: 165, useAdvancedWrap: true } })
      .setFontFamily('Arial')
      .setFontSize(12)
      .setColor('#000000')
      .setOrigin(0.5)

    // set dialogBox slightly larger than the text in it
    const innerTextHeight = innerText.height
    const innerTextWidth = innerText.width

    innerText.setY(-innerTextHeight / 2 - this.playerName.height / 2)
    const dialogBoxWidth = innerTextWidth + 10
    const dialogBoxHeight = innerTextHeight + 3
    const dialogBoxX = innerText.x - innerTextWidth / 2 - 5
    const dialogBoxY = innerText.y - innerTextHeight / 2 - 2

    this.playerDialogBubble.add(
      this.scene.add
        .graphics()
        .fillStyle(0xffffff, 1)
        .fillRoundedRect(dialogBoxX, dialogBoxY, dialogBoxWidth, dialogBoxHeight, 3)
        .lineStyle(1, 0x000000, 1)
        .strokeRoundedRect(dialogBoxX, dialogBoxY, dialogBoxWidth, dialogBoxHeight, 3)
    )
    this.playerDialogBubble.add(innerText)

    // After 6 seconds, clear the dialog bubble
    this.timeoutID = window.setTimeout(() => {
      this.clearDialogBubble()
    }, 6000)
  }

  private clearDialogBubble() {
    clearTimeout(this.timeoutID)
    this.playerDialogBubble.removeAll(true)
  }
}
