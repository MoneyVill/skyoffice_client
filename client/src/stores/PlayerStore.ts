import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IPlayer } from '../../../types/IOfficeState';

interface PlayerState {
  players: Array<IPlayer>;
}

const initialState: PlayerState = {
  players: [],
};

export const playerSlice = createSlice({
  name: 'players',
  initialState,
  reducers: {
    addPlayer: (state, action: PayloadAction<IPlayer>) => {
      state.players.push(action.payload);
    },
    updatePlayer: (state, action: PayloadAction<{ name: string; data: Partial<IPlayer> }>) => {
      const { name, data } = action.payload;
      state.players = state.players.map((player) =>
        player.name === name ? { ...player, ...data } : player
      );
    },
    updatePlayerName: (state, action: PayloadAction<{ oldName: string; newName: string }>) => {
      const { oldName, newName } = action.payload;
      const player = state.players.find((player) => player.name === oldName);
      if (player) {
        player.name = newName; // 기존 플레이어 이름을 새 이름으로 업데이트
      }
    },
    removePlayer: (state, action: PayloadAction<IPlayer>) => {
      const playerToRemove = action.payload;
      state.players = state.players.filter((player) => player.name !== playerToRemove.name);
    },
  },
});

export const { 
  addPlayer,
  updatePlayer, 
  updatePlayerName, 
  removePlayer 
} = playerSlice.actions;

export default playerSlice.reducer;
