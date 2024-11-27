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
      const player = state.players.find((player) => player.name === name);
      if (player) {
        Object.assign(player, data);
      }
    },
    removePlayer: (state, action: PayloadAction<IPlayer>) => {
      const playerToRemove = action.payload;
      state.players = state.players.filter((player) => player.name !== playerToRemove.name);
    },
  },
});

export const { addPlayer, updatePlayer, removePlayer } = playerSlice.actions;

export default playerSlice.reducer;
