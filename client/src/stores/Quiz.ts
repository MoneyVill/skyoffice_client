import { submitQuizAnswer } from './api'; // api.ts에서 함수 가져오기

export default class Quiz {
  private scene: Phaser.Scene;
  private quizContainer?: Phaser.GameObjects.Container;
  private isActive: boolean = false;
  private questionText: string = 'Sun is bigger than Earth';
  private correctAnswer: 'O' | 'X' = 'O'; // 문제별 정답 저장

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public showQuiz(quizType: string) {
    if (this.isActive) {
      return;
    }
    this.isActive = true;

    // Define quiz questions and correct answers based on the quiz type
    switch (quizType) {
      case 'quiz_0':
        this.questionText = 'What is 2 + 2?';
        this.correctAnswer = 'O'; // 정답은 O
        break;
      case 'quiz_1':
        this.questionText = 'Is the Earth round?';
        this.correctAnswer = 'O'; // 정답은 O
        break;
      case 'quiz_2':
        this.questionText = 'Which is the largest planet?';
        this.correctAnswer = 'O'; // 정답은 O
        break;
      case 'quiz_3':
        this.questionText = 'Does the Sun revolve around the Earth?';
        this.correctAnswer = 'X'; // 정답은 X
        break;
      default:
        this.questionText = 'Default question';
        this.correctAnswer = 'O'; // 기본 정답은 O
    }

    // Position the quiz in the center of the game window
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;

    // Create a semi-transparent background
    const background = this.scene.add.rectangle(centerX, centerY, 400, 200, 0x000000, 0.7);
    background.setOrigin(0.5);

    // Display the quiz question
    const quizQuestionText = this.scene.add
      .text(centerX, centerY - 40, this.questionText, {
        fontSize: '24px',
        color: '#ffffff',
        wordWrap: { width: 380, useAdvancedWrap: true },
      })
      .setOrigin(0.5);

    // Display the options
    const optionsText = this.scene.add
      .text(centerX, centerY + 20, '맞다면 O | 틀리면 X', {
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Group all quiz elements
    this.quizContainer = this.scene.add.container(0, 0, [
      background,
      quizQuestionText,
      optionsText,
    ]);
    this.quizContainer.setDepth(1000); // Ensure the quiz is above other elements
  }

  public update(keyO: Phaser.Input.Keyboard.Key, keyX: Phaser.Input.Keyboard.Key) {
    if (!this.isActive) {
      return;
    }

    // Check for 'O' or 'X' key presses
    if (Phaser.Input.Keyboard.JustDown(keyO)) {
      this.checkAnswer('O');
    } else if (Phaser.Input.Keyboard.JustDown(keyX)) {
      this.checkAnswer('X');
    }
  }

  private async checkAnswer(answer: 'O' | 'X') {
    const isCorrect = answer === this.correctAnswer; // 문제별 정답과 비교
    const prizeMoney = isCorrect ? 100 : 0; // 정답 시 상금 지급

    // LocalStorage에서 토큰 가져오기
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('토큰이 없습니다. 로그인 상태를 확인하세요.');
      this.displayQuizResult('로그인이 필요합니다.');
      this.cleanupQuizUI();
      return;
    }

    try {
      // 서버에 정답 제출 요청
      const serverResponse = await submitQuizAnswer(isCorrect, prizeMoney, token);
      console.log('서버 응답:', serverResponse);

      const { isCorrect: responseCorrect, prizeMoney: responseMoney } = serverResponse.data;

      // 서버의 응답에 따라 결과 표시
      const resultMessage = responseCorrect
        ? `정답입니다! 상금: ${responseMoney}원`
        : '틀렸습니다!';
      this.displayQuizResult(resultMessage);
    } catch (error) {
      // 에러 처리
      this.displayQuizResult('서버 오류가 발생했습니다.');
    }

    // UI 정리
    this.cleanupQuizUI();

    // 퀴즈 종료 이벤트 발생
    this.scene.events.emit('quizEnded');
  }

  private displayQuizResult(resultText: string) {
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;

    // Display result to the player
    const result = this.scene.add
      .text(centerX, centerY, resultText, {
        fontSize: '28px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5);
    result.setDepth(1000);

    // Hide result after 2 seconds
    this.scene.time.delayedCall(700, () => {
      result.destroy();
    });
  }

  private cleanupQuizUI() {
    if (this.quizContainer) {
      this.quizContainer.destroy(true);
      this.quizContainer = undefined;
    }
    this.isActive = false;
  }

  public isQuizActive(): boolean {
    return this.isActive;
  }

  public hideQuiz() {
    if (!this.isActive) {
      return;
    }
    this.cleanupQuizUI();
    console.log('Quiz UI hidden');
  }
}
