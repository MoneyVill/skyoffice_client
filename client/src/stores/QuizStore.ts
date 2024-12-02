import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export enum QuizStatus {
  QUIZ_STARTED,
  PLAYER_JOINED_QUIZ,
  QUIZ_ENDED,
  PLAYER_LEFT_QUIZ,
}

export const quizSlice = createSlice({
  name: 'quiz',
  initialState: {
    quizInProgress: false,
    isPlayerWaitingForQuiz: false,
    participants: new Array<string>(),
    quizMessages: new Array<{ status: QuizStatus; playerName?: string }>(),
  },
  reducers: {
    pushQuizStartedMessage: (state) => {
      state.quizInProgress = true;
      state.quizMessages.push({ status: QuizStatus.QUIZ_STARTED });
    },
    pushQuizEndedMessage: (state) => {
      state.quizInProgress = false;
      state.quizMessages.push({ status: QuizStatus.QUIZ_ENDED });
    },
    playerJoinedQuiz: (state, action: PayloadAction<string>) => {
      if (!state.participants.includes(action.payload)) {
        state.participants.push(action.payload);
        state.quizMessages.push({ status: QuizStatus.PLAYER_JOINED_QUIZ, playerName: action.payload });
      }
    },
    addExistingParticipants: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach((participant) => {
        if (!state.participants.includes(participant)) {
          state.participants.push(participant);
        }
      });
    },
    playerWaitingForQuiz: (state, action: PayloadAction<boolean>) => {
      state.isPlayerWaitingForQuiz = action.payload;
    },
    playerLeftQuiz: (state, action: PayloadAction<string>) => {
      const index = state.participants.indexOf(action.payload);
      if (index > -1) {
        state.participants.splice(index, 1);
        state.quizMessages.push({ status: QuizStatus.PLAYER_LEFT_QUIZ, playerName: action.payload });
      }
    }
  },
})

export const {
  pushQuizStartedMessage,
  pushQuizEndedMessage,
  playerJoinedQuiz,
  addExistingParticipants,
  playerWaitingForQuiz,
  playerLeftQuiz,
} = quizSlice.actions

export default quizSlice.reducer
