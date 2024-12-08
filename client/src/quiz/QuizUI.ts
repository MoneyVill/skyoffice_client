// client/src/quiz/QuizUI.ts

export default class QuizUI {
  private container: HTMLDivElement;
  private questionText: HTMLParagraphElement;
  private optionsText: HTMLParagraphElement;

  constructor(scene: Phaser.Scene, x: number, y: number, question: string) {
    this.injectStyles();

    this.container = document.createElement('div');
    this.container.classList.add('quiz-container');

    this.questionText = document.createElement('p');
    this.questionText.classList.add('quiz-question');
    this.questionText.textContent = question;

    this.optionsText = document.createElement('p');
    this.optionsText.classList.add('quiz-options-text');
    this.optionsText.textContent = '맞으면 O, 틀리면 X';

    this.container.appendChild(this.questionText);
    this.container.appendChild(this.optionsText);

    document.body.appendChild(this.container);
  }

  private injectStyles() {
    if (document.getElementById('quiz-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'quiz-ui-styles';
    style.textContent = `
      .quiz-container {
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 500px;
        background-color: #fccaca;
        color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        z-index: 9999;
        display: none;
      }

      .quiz-question {
        font-size: 28px;
        font-family: Arial, sans-serif;
        margin-bottom: 20px;
        word-wrap: break-word;
        color: #575757;
      }

      .quiz-options-text {
        font-size: 24px;
        font-family: Arial, sans-serif;
        color: #575757;
      }

      .quiz-result-overlay {
        position: fixed;
        top: 25%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #fccaca;
        color: #575757;
        font-size: 32px;
        padding: 20px;
        border-radius: 8px;
        z-index: 100000;
      }

      .quiz-correct-overlay, .quiz-incorrect-overlay {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 100px;
        font-family: Arial, sans-serif;
        font-weight: bold;
        z-index: 100001;
        padding: 20px 40px;
        border-radius: 50%;
        text-align: center;
        color: #575757;
      }

      .quiz-correct-overlay {
        background-color: rgba(0, 255, 0, 0.7);
        color: #575757;
      }

      .quiz-incorrect-overlay {
        background-color: rgba(255, 0, 0, 0.7);
        color: #575757;
      }
    `;
    document.head.appendChild(style);
  }

  public displayResult(resultText: string) {
    console.log('Displaying result:', resultText); // Debugging
    const result = document.createElement('div');
    result.classList.add('quiz-result-overlay');
    result.textContent = resultText;

    document.body.appendChild(result);

    setTimeout(() => {
      if (result.parentNode) {
        result.parentNode.removeChild(result);
      }
    }, 1500);
  }

  public displayCorrectOverlay() {
    console.log('Displaying Correct Overlay'); // Debugging
    const overlay = document.createElement('div');
    overlay.classList.add('quiz-correct-overlay');
    overlay.textContent = 'O';
    document.body.appendChild(overlay);

    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 2000);
  }

  public displayIncorrectOverlay() {
    console.log('Displaying Incorrect Overlay'); // Debugging
    const overlay = document.createElement('div');
    overlay.classList.add('quiz-incorrect-overlay');
    overlay.textContent = 'X';
    document.body.appendChild(overlay);

    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 2000);
  }

  public updateQuestion(question: string) {
    this.questionText.textContent = question;
  }

  public hide() {
    this.container.style.display = 'none';
  }

  public show() {
    this.container.style.display = 'block';
  }

  public destroy() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
