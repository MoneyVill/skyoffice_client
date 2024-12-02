// /quiz/NotificationUI.ts

import Phaser from 'phaser';

export default class NotificationUI extends Phaser.GameObjects.Container {
    private messageText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, message: string) {
        super(scene, x, y);

        // 반투명 배경
        const background = scene.add
            .rectangle(0, 0, 400, 100, 0x000000, 0.7)
            .setOrigin(0.5);
        // 알림 메시지 텍스트
        this.messageText = scene.add
            .text(0, 0, message, {
                fontSize: '24px',
                color: '#ffffff',
                wordWrap: { width: 380, useAdvancedWrap: true },
                align: 'center',
            })
            .setOrigin(0.5);

        // 요소 추가
        this.add([background, this.messageText]);
        // 씬에 추가
        scene.add.existing(this);
    }
    // 퀴즈 텍스트 업데이트
    public updateMessage(message: string) {
        this.messageText.setText(message);
    }
    // 일정 시간 후 알림창을 자동으로 제거하는 메서드
    public autoHide(delay: number) {
        this.scene.time.delayedCall(delay, () => {
            this.destroy();
        });
    }

}