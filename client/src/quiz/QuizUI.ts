// /quiz/QuizUI.ts

export default class QuizUI extends Phaser.GameObjects.Container {
    private questionText: Phaser.GameObjects.Text;
    private optionsText: Phaser.GameObjects.Text;
  
    constructor(scene: Phaser.Scene, x: number, y: number, question: string) {
      super(scene, x, y);
  
      // 반투명 배경
      const background = scene.add
        .rectangle(0, 0, 500, 200, 0x000000, 0.7)
        .setOrigin(0.5);
  
      // 퀴즈 질문 텍스트
      this.questionText = scene.add
        .text(0, -60, question, {
          fontSize: '28px',
          color: '#ffffff',
          wordWrap: { width: 480, useAdvancedWrap: true },
          align: 'center',
        })
        .setOrigin(0.5);
  
      // 정답/오답 옵션 텍스트
      this.optionsText = scene.add
        .text(0, 20, '맞으면 O, 틀리면 X', {
          fontSize: '24px',
          color: '#ffffff',
        })
        .setOrigin(0.5);
  
      // 요소 추가
      this.add([background, this.questionText, this.optionsText]);
  
      // 씬에 추가
      scene.add.existing(this);
    }
    // 결과를 표시하는 메서드 추가
    public displayResult(resultText: string) {
        const centerX = this.x;
        const centerY = this.y - 50;

        const result = this.scene.add
        .text(centerX, centerY, resultText, {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 },
        })
        .setOrigin(0.5)
        .setDepth(1000);

        // 1.5초 후 결과 텍스트를 제거합니다.
        this.scene.time.delayedCall(1500, () => {
        result.destroy();
        });
    }

    // 퀴즈 텍스트 업데이트
    public updateQuestion(question: string) {
      this.questionText.setText(question);
    }
  
    // UI 숨기기
    public hide() {
      this.setVisible(false);
    }
  
    // UI 표시하기
    public show() {
      this.setVisible(true);
    }
  }