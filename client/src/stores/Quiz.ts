// client/src/quiz/Quiz.ts

import Phaser from 'phaser';

export default class Quiz {
  private scene: Phaser.Scene;
  private quizContainer?: Phaser.GameObjects.Container;
  private isActive: boolean = false;
  private questionText: string = 'Sun is bigger than Earth';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public showQuiz(quizType: string) {
    if (this.isActive) {
      return;
    }
    this.isActive = true;

    // Define quiz questions based on the quiz type
    switch (quizType) {
    case 'quiz_0':
      this.questionText = 'What is 2 + 2?';
      break;
    case 'quiz_1':
      this.questionText = 'Is the Earth round?';
      break;
    case 'quiz_2':
      this.questionText = 'Which is the largest planet?';
      break;
    default:
      this.questionText = 'Default question';
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

  private checkAnswer(answer: 'O' | 'X') {
    // Correct answer is 'O'
    const isCorrect = answer === 'O';
    this.displayQuizResult(isCorrect ? '정답입니다!' : '틀렸습니다!');
    this.cleanupQuizUI();

    // Emit an event to indicate the quiz has ended
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
