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
  reward: number;
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
      this.showNotification(`${playerName}님이 퀴즈에 나갔습니다!`, 2000, 'alert');
    } else {
      this.showNotification(`현재 ${quizPlayers}명 OX 퀴즈에 도전 중!`, 2000, 'ok');
    }
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
      1: { text: '개인 회생을 신청하면 빚을 갚지 않아도 된다?', correctAnswer: 'X', reward: 50000 },
      2: { text: '전세 계약을 갱신할 때는 보증금을 올릴 수 없다?', correctAnswer: 'X', reward: 50000 },
      3: { text: '1인당 예금자보호한도는 모든 금융사를 합쳐 5,000만원이다?', correctAnswer: 'X', reward: 50000 },
      4: { text: '중도상환수수료는 대출을 미리 갚으면 무조건 부과된다?', correctAnswer: 'X', reward: 50000 },
      5: { text: '주식회사의 이사는 주주에 충실해야 하는 의무가 있다?', correctAnswer: 'X', reward: 50000 },
      6: { text: '직원 할인도 근로소득세 과세 대상이다?', correctAnswer: 'O', reward: 50000 },
      7: { text: '은행에서 전세보증금 대출을 받으려면 보증 기관의 보증이 필요하다?', correctAnswer: 'O', reward: 50000 },
      8: { text: '상조 결합 상품 가입하면 주는 가전제품은 공짜다?', correctAnswer: 'X', reward: 50000 },
      9: { text: '해외에서 원화로 카드 결제하면 수수료를 더 낸다?', correctAnswer: 'O', reward: 50000 },
      10: { text: '사망 후에 재산을 이전하는 것을 증여라 한다?', correctAnswer: 'X', reward: 50000 },
      11: { text: '신용카드 혜택은 꼭 전월 실적을 채워야 받을 수 있다?', correctAnswer: 'X', reward: 50000 },
      12: { text: '자연재해가 일어나지 않으면 돈을 버는 금융 상품이 있다?', correctAnswer: 'O', reward: 50000 },
      13: { text: '​연말정산 결과를 미리 확인해볼 수 있다?', correctAnswer: 'O', reward: 50000 },
      14: { text: '근로장려금은 소득이 있어야 받을 수 있다?', correctAnswer: 'O', reward: 50000 },
      15: { text: '중고차는 환불받을 수 없다?', correctAnswer: 'X', reward: 50000 },
      16: { text: '혼인 신고를 하면 세액 공제를 받을 수 있다?', correctAnswer: 'O', reward: 50000 },
      17: { text: '지폐가 반으로 찢어지면 가치가 사라진다?', correctAnswer: 'X', reward: 50000 },
      18: { text: '기존 전세 보증금보다 전세 시세가 높은 걸 역전세라고 한다?', correctAnswer: 'X', reward: 50000 },
      19: { text: '협동조합형 임대주택은 땅이 없어도 조합을 설립할 수 있다?', correctAnswer: 'O', reward: 50000 },
      20: { text: '월세 낸 것도 현금영수증 발급받을 수 있다?', correctAnswer: 'X', reward: 50000 },
      21: { text: '​저축성 보험은 보험 기능을 하지 않는다?', correctAnswer: 'X', reward: 50000 },
      22: { text: '​한의원에서 다이어트 침 맞는 것도 건강보험이 적용된다?', correctAnswer: 'X', reward: 50000 },
      23: { text: '간편심사보험은 가입 심사가 비교적 간소하다?', correctAnswer: 'O', reward: 50000 },
      24: { text: '일용근로소득에도 건강보험료가 부과된다?', correctAnswer: 'X', reward: 50000 },
      25: { text: '미국 국채 금리가 오르면 달러 가치가 오른다?', correctAnswer: 'O', reward: 50000 },
      26: { text: '한국에서는 기관이 비트코인에 직접 투자할 수 없다?', correctAnswer: 'O', reward: 50000 },
      27: { text: '원화 가치가 너무 떨어지지 않도록 정부가 원화를 사들이기도 한다?', correctAnswer: 'O', reward: 50000 },
      28: { text: '퇴직연금 적립금을 전부 펀드에 투자할 수 있다?', correctAnswer: 'X', reward: 50000 },
      29: { text: '금 통장으로는 금을 0.01g 단위로 사고팔 수 있다?', correctAnswer: 'O', reward: 50000 },
      30: { text: '공무원은 국민연금 가입 대상이 아니다?', correctAnswer: 'O', reward: 50000 },
      31: { text: '​해외에서 원화로 카드 결제하면 수수료를 더 낸다?', correctAnswer: 'O', reward: 50000 },
      32: { text: '은행에서 운용 중인 IRP계좌를 증권사로 옮기려면 전부 팔아야 한다?', correctAnswer: 'X', reward: 50000 },
      33: { text: '​자연재해가 일어나지 않으면 돈을 버는 금융 상품이 있다?', correctAnswer: 'O', reward: 50000 },
      34: { text: '직원 할인도 근로소득세 과세 대상이다?', correctAnswer: 'O', reward: 50000 },
      35: { text: '은행에 이미 받은 대출 이자를 낮춰달라고 요구할 수 있다?', correctAnswer: 'O', reward: 50000 },
      36: { text: '비만치료제는 100% 비급여다?', correctAnswer: 'O', reward: 50000 },
      37: { text: '장례 비용은 상속세 계산 시 공제된다?', correctAnswer: 'O', reward: 50000 },
      38: { text: '전세대출은 계약서 작성 전에 미리 신청하는 게 좋다?', correctAnswer: 'X', reward: 50000 },
      39: { text: '청약 당첨 후 부적격 통보를 받으면 바로 당첨이 취소된다?', correctAnswer: 'X', reward: 50000 }
    };

    return quizQuestions[quizType];
  }

  public update(answer: string) {
    if (this.currentQuestion.correctAnswer == 'O') {
      this.answerCorrectGroup.getChildren().forEach((child) => {
        const item = child as AnswerCorrect;
        item.setVisible(true);
        item.setDepth(500);

        this.scene.time.delayedCall(2000, () => {
          item.setVisible(false);
        });
      });
    } else {
      this.answerIncorrectGroup.getChildren().forEach((child) => {
        const item = child as AnswerIncorrect;
        item.setVisible(true);
        item.setDepth(500);

        this.scene.time.delayedCall(2000, () => {
          item.setVisible(false);
        });
      });
    }

    this.handleAnswer(answer);
  }

  private async handleAnswer(answer: string) {
    const isCorrect = answer === this.currentQuestion!.correctAnswer;
    const prizeMoney = isCorrect ? 50000 : 0;

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
