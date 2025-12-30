import { ITokenResponse, IWebToken } from "../interfaces";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface TokensState {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

const initialState: TokensState = {
  access_token: "",
  refresh_token: "",
  token_type: "",
};

export const tokensSlice = createSlice({
  name: "tokens",
  initialState,
  reducers: {
    setMagicToken: (state: TokensState, action: PayloadAction<IWebToken>) => {
      state.access_token = action.payload.claim;
    },
    setTokens: (state: TokensState, action: PayloadAction<ITokenResponse>) => {
      state.access_token = action.payload.access_token;
      state.refresh_token = action.payload.refresh_token;
      state.token_type = action.payload.token_type;
    },
    deleteTokens: () => {
      return initialState;
    },
  },
});

export const { setMagicToken, setTokens, deleteTokens } = tokensSlice.actions;

export const token = (state: RootState) => state.tokens.access_token;
export const refresh = (state: RootState) => state.tokens.refresh_token;

export default tokensSlice.reducer;
