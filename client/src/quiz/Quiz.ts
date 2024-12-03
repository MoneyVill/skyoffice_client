import store from '../stores';
import { pushQuizStartedMessage, pushQuizEndedMessage } from '../stores/QuizStore';
import { addNotification } from '../stores/NotificationStore';
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

  private showNotification(message: string, duration: number = 2000, type: 'alert' | 'ok' = 'alert') {
    store.dispatch(
      addNotification({
        content: message,
        duration,
        type,
      })
    );
  }

  public setQuiz(questionNumber: number) {
    this.currentQuestion = this.getQuizQuestion(questionNumber)
  }

  public playerJoinQuiz(playerName: string, quizPlayers: number) {
    const state = store.getState();
    if (!state.quiz.quizInProgress) {
      this.showNotification(`${playerName}님이 퀴즈에 입장했습니다!`, 2000, 'alert');
    } else {
      this.showNotification(`현재 ${quizPlayers}명 OX 퀴즈에 도전 중!`, 2000, 'ok');
    }
  }

  public playerJoinedQuiz(waitingTime: number) {
    this.showNotification(`${waitingTime}초 뒤에 퀴즈가 시작됩니다!\n준비하세요!`, 2000, 'alert');
  }

  public playerWaitQuiz(waitingTime: number) {
    this.showNotification(`퀴즈가 이미 시작됐습니다!\n${waitingTime}초 후에 새로운 라운드에 자동으로 합류됩니다!`, 2000, 'alert');
  }

  public playerLeftQuiz(playerName: string, quizPlayers: number) {
    const state = store.getState();
    if (state.quiz.quizInProgress) {
      this.showNotification(`${playerName}님이 퀴즈에 퇴장했습니다!`, 2000, 'alert');
    } else {
      this.showNotification(`현재 ${quizPlayers}명 OX 퀴즈에 도전 중!`, 2000, 'ok');
    }
  }

  public playerLeftQuiz2(playerName: string) {
    this.showNotification(`${playerName}님이 퀴즈에서 나갔습니다!`, 2000, 'alert');
  }

  public startQuiz(x: number, y: number) {
    const quizInProgress = store.getState().quiz.quizInProgress;
    if (!quizInProgress) {
      return;
    }

    store.dispatch(pushQuizStartedMessage());
    this.showNotification('퀴즈가 시작되었습니다!', 2000, 'alert');
    this.showQuiz(x, y);
  }
  
  public endQuiz(answer?: boolean) {
    if (answer === undefined) {
      this.cleanupQuizUI();
    } else {
      const result = answer ? 'O' : 'X';
      this.update(result);
    }
  }

  public showQuiz(x: number, y: number) {
    // Create and display the quiz UI
    this.createQuizUI(x, y);
  }

  public hideQuiz() {
    this.cleanupQuizUI();
  }

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

  public update(answer: string) {
    if (this.currentQuestion.correctAnswer == 'O') {
      this.answerCorrectGroup.getChildren().forEach((child) => {
        const item = child as AnswerCorrect;
        item.setVisible(true);
        item.setDepth(10001);

        this.scene.time.delayedCall(2000, () => {
          item.setVisible(false);
        });
      });
    } else {
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

  private async handleAnswer(answer: string) {
    const isCorrect = answer === this.currentQuestion!.correctAnswer;
    const prizeMoney = isCorrect ? 100 : 0;

    // Get the token from localStorage
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.quizUI?.displayResult('로그인이 필요합니다.');
      return;
    }

    try {
      const serverResponse = await submitQuizAnswer(isCorrect, prizeMoney, token);
      const { isCorrect: responseCorrect, prizeMoney: responseMoney } = serverResponse.data;

      const resultMessage = responseCorrect
        ? `정답입니다! 상금: ${responseMoney}원`
        : '틀렸습니다!';
      this.quizUI?.displayResult(resultMessage);
    } catch (error) {
      this.quizUI?.displayResult('서버 오류가 발생했습니다.');
    }

    this.cleanupQuizUI();
  }

  private cleanupQuizUI() {
    if (this.quizUI) {
      this.quizUI.destroy(true);
      this.quizUI = undefined;
    }
    store.dispatch(pushQuizEndedMessage());
  }

  private createQuizUI(x: number, y: number) {
    this.quizUI = new QuizUI(this.scene, x, y, this.currentQuestion!.text);
    this.quizUI.setDepth(1000);
  }
}
