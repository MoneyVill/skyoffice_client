import Item from './Item';

export default class AnswerCorrect extends Item {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame);

    // 필요한 초기화 작업 수행
    this.setVisible(false); // 처음에는 보이지 않도록 설정
  }

}