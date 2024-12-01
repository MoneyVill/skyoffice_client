// Import the function to submit the quiz answer to the server
import Network from '../services/Network';
import { submitQuizAnswer } from './api';
import AnswerCorrect from '../items/AnswerCorrect';
import AnswerIncorrect from '../items/AnswerIncorrect';

// Define the structure for a quiz question
interface QuizQuestion {
  text: string;
  correctAnswer: string;
}

export default class Quiz {
  private scene: Phaser.Scene;
  private network: Network;
  private quizContainer?: Phaser.GameObjects.Container;
  private isActive: boolean = false;
  private currentQuestion?: QuizQuestion;
  private answerCorrectGroup: Phaser.Physics.Arcade.StaticGroup;
  private answerIncorrectGroup: Phaser.Physics.Arcade.StaticGroup;

  constructor(
    scene: Phaser.Scene, 
    network: Network, 
    answerCorrectGroup: Phaser.Physics.Arcade.StaticGroup,
    answerIncorrectGroup: Phaser.Physics.Arcade.StaticGroup,
  ) {
    this.scene = scene;
    this.network = network;
    this.answerCorrectGroup = answerCorrectGroup;
    this.answerIncorrectGroup = answerIncorrectGroup;
  }

  public setQuiz(questionNumber: number) {
    console.log(questionNumber)
    this.currentQuestion = this.getQuizQuestion(questionNumber)
  }

  // Show the quiz based on the quiz type and remaining time
  public showQuiz() {
    if (this.isActive) {
      return;
    }
    this.isActive = true
    // Create and display the quiz UI
    this.createQuizUI()
    this.startQuiz()
  }

  public startQuiz() {

  }

  public endQuiz(answer: boolean) {
    const result = answer? 'O': 'X'
    this.update(result)
  }

  // Get the quiz question based on the quiz type
  private getQuizQuestion(quizType: number): QuizQuestion {
    const quizQuestions: { [key: number]: QuizQuestion } = {
      1: { text: '태양은 지구보다 크다.', correctAnswer: 'O' },
      2: { text: '지구는 평평하다.', correctAnswer: 'X' },
      3: { text: '수성은 태양계에서 가장 큰 행성이다.', correctAnswer: 'X' },
      4: { text: '물은 H2O이다.', correctAnswer: 'O' },
    };

    return quizQuestions[quizType] || {
      text: '기본 문제입니다.',
      correctAnswer: 'O',
    };
  }

  // Update method to check for key inputs
  public update(answer: string) {
    if (!this.isActive) {
      return;
    }

    if (this.currentQuestion.correctAnswer == 'O') {
      // AnswerCorrect와 AnswerIncorrect의 가시성 조정
      this.answerCorrectGroup.getChildren().forEach((child) => {
        const item = child as AnswerCorrect;
        item.setVisible(true);
        item.setDepth(10001);

        this.scene.time.delayedCall(2000, () => {
          item.setVisible(false);
        });
      });
    }
    else {
      this.answerIncorrectGroup.getChildren().forEach((child) => {
        const item = child as AnswerIncorrect;
        item.setVisible(true);
        item.setDepth(10001);
          // 2초 후에 아이템을 보이지 않게 설정
        this.scene.time.delayedCall(2000, () => {
          item.setVisible(false);
        });
      });
    }

    this.handleAnswer(answer);
  }

  // Handle the answer submission
  private async handleAnswer(answer: string) {
    const isCorrect = answer === this.currentQuestion!.correctAnswer;
    const prizeMoney = isCorrect ? 100 : 0;

    // Get the token from localStorage
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.displayQuizResult('로그인이 필요합니다.');
      this.cleanupQuizUI();
      return;
    }

    try {
      // 서버에 정답 제출 요청
      const serverResponse = await submitQuizAnswer(isCorrect, prizeMoney, token);
      // console.log('서버 응답:', serverResponse);

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

  // Display the quiz result to the player
  private displayQuizResult(resultText: string) {
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;

    const result = this.scene.add
      .text(centerX, centerY, resultText, {
        fontSize: '32px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(1000);

    // Hide the result after 1.5 seconds
    this.scene.time.delayedCall(1500, () => {
      result.destroy();
    });
  }

  // Clean up the quiz UI elements
  private cleanupQuizUI() {
    if (this.quizContainer) {
      this.quizContainer.destroy(true);
      this.quizContainer = undefined;
    }
    this.isActive = false;
  }

  // Hide the quiz
  public hideQuiz(answer: boolean) {
    if (!this.isActive) {
      return;
    }
    this.endQuiz(answer)
  }

  // Check if the quiz is active
  public isQuizActive(): boolean {
    return this.isActive;
  }

  // Create the quiz UI elements
  private createQuizUI() {
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;

    console.log("centerX:", centerX)
    console.log("centerY:", centerY)
    
    this.quizContainer = this.scene.add.container(centerX, centerY);
    // Semi-transparent background
    const background = this.scene.add
      .rectangle(centerX, centerY, 500, 300, 0x000000, 0.7)
      .setOrigin(0.5);

    // Quiz question text
    const quizQuestionText = this.scene.add
      // .text(centerX, centerY - 60, this.currentQuestion!.text, {
      .text(centerX, centerY - 60, this.currentQuestion!.text, {
        fontSize: '28px',
        color: '#ffffff',
        wordWrap: { width: 480, useAdvancedWrap: true },
        align: 'center',
      })
      .setOrigin(0.5);

    // Options text
    const optionsText = this.scene.add
      .text(centerX, centerY + 20, '맞으면 O, 틀리면 X', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Add all elements to the container
    this.quizContainer.add([background, quizQuestionText, optionsText]);
    this.quizContainer.setDepth(1000); // Bring to front
  }

}
