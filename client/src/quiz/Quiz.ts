// /quiz/Quiz.ts

// Import the function to submit the quiz answer to the server
import Network from '../services/Network';
import { submitQuizAnswer } from '../stores/api';
import AnswerCorrect from '../items/AnswerCorrect';
import AnswerIncorrect from '../items/AnswerIncorrect';
import QuizUI from './QuizUI';

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
  private quizUI?: QuizUI;

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
    this.currentQuestion = this.getQuizQuestion(questionNumber)
  }

  public startQuiz(x: number, y: number) {
    if (this.isActive) {
      return;
    }
    this.isActive = true
    this.showQuiz(x, y)
  }
  
  public endQuiz(answer?: boolean) {
    if (answer === undefined) {
      this.cleanupQuizUI()
    } else {
      const result = answer ? 'O': 'X'
      this.update(result)
      this.isActive = false
    }
  }
  // Show the quiz based on the quiz type and remaining time
  public showQuiz(x: number, y: number) {
    // Create and display the quiz UI
    this.createQuizUI(x, y)
  }
  // Hide the quiz
  public hideQuiz() {
    // if (!this.isActive) {
    //   return;
    // }
    this.cleanupQuizUI();
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
      this.quizUI.displayResult('로그인이 필요합니다.');
      // this.cleanupQuizUI();
      return;
    }

    try {
      // 서버에 정답 제출 요청
      const serverResponse = await submitQuizAnswer(isCorrect, prizeMoney, token);

      const { isCorrect: responseCorrect, prizeMoney: responseMoney } = serverResponse.data;

      // 서버의 응답에 따라 결과 표시
      const resultMessage = responseCorrect
        ? `정답입니다! 상금: ${responseMoney}원`
        : '틀렸습니다!';
      this.quizUI.displayResult(resultMessage);
    } catch (error) {
      // 에러 처리
      this.quizUI.displayResult('서버 오류가 발생했습니다.');
    }

    // UI 정리
    this.cleanupQuizUI();
  }

  private cleanupQuizUI() {
    if (this.quizUI) {
      this.quizUI.destroy(true);
      this.quizUI = undefined;
    }
    this.isActive = false;
  }

  private createQuizUI(x: number, y: number) {
    this.quizUI = new QuizUI(this.scene, x, y, this.currentQuestion!.text);
    this.quizUI.setDepth(1000);
  }

  public isQuizActive(): boolean {
    return this.isActive;
  }

}
