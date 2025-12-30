import {
  PayloadAction,
  createSlice,
} from "@reduxjs/toolkit";
import {
  IUserProfile,
} from "../interfaces";
import { RootState } from "../store";

interface AuthState {
  id: string;
  email: string;
  email_validated: boolean;
  is_active: boolean;
  is_superuser: boolean;
  fullName: string;
  password: boolean;
  totp: boolean;
}

const initialState: AuthState = {
  id: "",
  email: "",
  email_validated: false,
  is_active: false,
  is_superuser: false,
  fullName: "",
  password: false,
  totp: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserProfile: (state: AuthState, action: PayloadAction<IUserProfile>) => {
      state.id = action.payload.id;
      state.email = action.payload.email;
      state.email_validated = action.payload.email_validated;
      state.is_active = action.payload.is_active;
      state.is_superuser = action.payload.is_superuser;
      state.fullName = action.payload.fullName;
      state.password = action.payload.password;
      state.totp = action.payload.totp;
    },
    setTOTPAuthentication: (
      state: AuthState,
      action: PayloadAction<boolean>,
    ) => {
      state.totp = action.payload;
    },
    setEmailValidation: (state: AuthState, action: PayloadAction<boolean>) => {
      state.email_validated = action.payload;
    },
    deleteAuth: () => {
      return initialState;
    },
  },
});

export const {
  setUserProfile,
  setTOTPAuthentication,
  setEmailValidation,
  deleteAuth,
} = authSlice.actions;

export const profile = (state: RootState) => state.auth;
export const loggedIn = (state: RootState) => {
  const { auth, tokens: { refresh_token, token_type, access_token } = {} } =
    state;
  const loginInformation = [auth.id, refresh_token, token_type, access_token];
  return loginInformation.every((value) => value !== "");
};
export const isAdmin = (state: RootState) => {
  return loggedIn(state) && state.auth.is_superuser && state.auth.is_active;
};

export default authSlice.reducer;