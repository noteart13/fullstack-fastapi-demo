import { Dispatch } from "@reduxjs/toolkit";
import { ThunkDispatch, Action } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { 
  IUserProfileUpdate, 
  IUserOpenProfileCreate, 
  IEnableTOTP,
  IWebToken
} from "../interfaces";
import { 
  setUserProfile, 
  setTOTPAuthentication, 
  setEmailValidation, 
  deleteAuth
} from "../slices/authSlice";
import { 
  setTokens, 
  deleteTokens, 
  setMagicToken
} from "../slices/tokensSlice"; 
// Wait, getTokens in tokensSlice was a thunk. I need to handle that.
// In slices, I will keep ONLY reducers.

import { addNotice, deleteNotices } from "../slices/toastsSlice";
import { apiAuth } from "../api";
import { PURGE } from "redux-persist";
import { tokenIsTOTP, tokenParser } from "../utilities";

// Helpers
const loggedIn = (state: RootState) => {
  const { auth, tokens: { refresh_token, token_type, access_token } = {} } = state;
  const loginInformation = [auth.id, refresh_token, token_type, access_token];
  return loginInformation.every((value) => value !== "");
};

// Re-implementing helper from authSlice
const handleGenericLogin =
  (
    loginAttempt: (payload: any) => any,
    payload: any,
    getProfile: boolean = true,
  ) =>
  async (
    dispatch: ThunkDispatch<any, void, Action>,
    getState: () => RootState,
  ) => {
    try {
      await dispatch(loginAttempt(payload));
      const token = getState().tokens.access_token;
      if (getProfile) {
        await dispatch(getUserProfile(token));
      }
    } catch (error) {
      dispatch(
        addNotice({
          title: "Login error",
          content:
            "Please check your details or internet connection and try again.",
          icon: "error",
        }),
      );
      dispatch(logout());
    }
  };

const isMagicAuthFirstPhase = (providedPassword?: string) =>
  providedPassword === undefined;

// We need to import the thunks from tokens.ts once created.
// For now I will assume they are available or define them here if they were in authSlice? 
// No, they were in tokensSlice.
// Circular dependency between thunks files?
// authThunks uses tokensThunks (getTokens, validateMagicTokens).
// This is fine, as long as they don't depend on each other cyclically at module level.
// They are functions.

import { getTokens, validateMagicTokens, validateTOTPClaim } from "./tokens";

export const login = (payload: { username: string; password?: string }) =>
  handleGenericLogin(
    getTokens,
    payload,
    !isMagicAuthFirstPhase(payload.password),
  );

export const magicLogin = (payload: { token: string }) =>
  handleGenericLogin(validateMagicTokens, payload.token);

export const totpLogin = (payload: { claim: string }) =>
  handleGenericLogin(validateTOTPClaim, payload.claim);

export const logout = () => async (dispatch: Dispatch, getState: () => RootState) => {
  const state = getState();
  const refreshToken = state.tokens.refresh_token;

  // Gọi revoke API trước khi logout (nếu có refresh token)
  if (refreshToken) {
    try {
      await apiAuth.revokeRefreshedToken(refreshToken);
    } catch (error) {
      // Ignore error - vẫn logout dù revoke fail
      console.warn("Failed to revoke token:", error);
    }
  }

  // Clear state
  dispatch(deleteAuth());
  dispatch(deleteTokens());
  dispatch(deleteNotices());
  
  // Purge persist store
  dispatch({
    type: PURGE,
    key: "root",
    result: () => null,
  });
};

export const getUserProfile =
  (token: string) => async (dispatch: ThunkDispatch<any, void, Action>) => {
    if (token && !tokenIsTOTP(token)) {
      try {
        const res = await apiAuth.getProfile(token);
        if (res.id) {
          dispatch(setUserProfile(res));
        } else throw "Error";
      } catch (error) {
        dispatch(
          addNotice({
            title: "Login error",
            content:
              "Please check your details, or internet connection, and try again.",
            icon: "error",
          }),
        );
        dispatch(logout());
      }
    }
  };

export const createUserProfile =
  (payload: IUserOpenProfileCreate) => async (dispatch: Dispatch) => {
    try {
      const res = await apiAuth.createProfile(payload);
      if (res.id) {
        dispatch(setUserProfile(res));
      } else throw "Error";
    } catch (error) {
      dispatch(
        addNotice({
          title: "Login creation error",
          content:
            "Please check your details, or internet connection, and try again.",
          icon: "error",
        }),
      );
    }
  };

export const updateUserProfile =
  (payload: IUserProfileUpdate) =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    const currentState = getState();
    if (loggedIn(currentState) && currentState.tokens.access_token) {
      try {
        const res = await apiAuth.updateProfile(
          currentState.tokens.access_token,
          payload,
        );
        if (res.id) {
          dispatch(setUserProfile(res));
          dispatch(
            addNotice({
              title: "Profile update",
              content: "Your settings have been updated.",
            }),
          );
        } else throw "Error";
      } catch (error) {
        dispatch(
          addNotice({
            title: "Profile update error",
            content:
              "Please check your submission, or internet connection, and try again.",
            icon: "error",
          }),
        );
      }
    }
  };

export const enableTOTPAuthentication =
  (payload: IEnableTOTP) =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    const currentState = getState();
    if (loggedIn(currentState) && currentState.tokens.access_token) {
      try {
        const res = await apiAuth.enableTOTPAuthentication(
          currentState.tokens.access_token,
          payload,
        );
        if (res.msg) {
          dispatch(setTOTPAuthentication(true));
          dispatch(
            addNotice({
              title: "Two-factor authentication",
              content: res.msg,
            }),
          );
        } else throw "Error";
      } catch (error) {
        dispatch(
          addNotice({
            title: "Error enabling two-factor authentication",
            content:
              "Please check your submission, or internet connection, and try again.",
            icon: "error",
          }),
        );
      }
    }
  };

export const disableTOTPAuthentication =
  (payload: IUserProfileUpdate) =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    const currentState = getState();
    if (loggedIn(currentState) && currentState.tokens.access_token) {
      try {
        const res = await apiAuth.disableTOTPAuthentication(
          currentState.tokens.access_token,
          payload,
        );
        if (res.msg) {
          dispatch(setTOTPAuthentication(false));
          dispatch(
            addNotice({
              title: "Two-factor authentication",
              content: res.msg,
            }),
          );
        } else throw "Error";
      } catch (error) {
        dispatch(
          addNotice({
            title: "Error disabling two-factor authentication",
            content:
              "Please check your submission, or internet connection, and try again.",
            icon: "error",
          }),
        );
      }
    }
  };

export const sendEmailValidation =
  () => async (dispatch: Dispatch, getState: () => RootState) => {
    const currentState = getState();
    if (
      currentState.tokens.access_token &&
      !currentState.auth.email_validated
    ) {
      try {
        const res = await apiAuth.requestValidationEmail(
          currentState.tokens.access_token,
        );
        if (res.msg) {
          dispatch(
            addNotice({
              title: "Validation sent",
              content: res.msg,
            }),
          );
        } else throw "Error";
      } catch (error) {
        dispatch(
          addNotice({
            title: "Validation error",
            content: "Please check your email and try again.",
            icon: "error",
          }),
        );
      }
    }
  };

export const validateEmail =
  (validationToken: string) =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    const currentState = getState();
    if (
      currentState.tokens.access_token &&
      !currentState.auth.email_validated
    ) {
      try {
        const res = await apiAuth.validateEmail(
          currentState.tokens.access_token,
          validationToken,
        );
        if (res.msg) {
          dispatch(setEmailValidation(true));
          dispatch(
            addNotice({
              title: "Success",
              content: res.msg,
            }),
          );
        } else throw "Error";
      } catch (error) {
        dispatch(
          addNotice({
            title: "Validation error",
            content: "Invalid token. Check your email and resend validation.",
            icon: "error",
          }),
        );
      }
    }
  };

export const recoverPassword =
  (email: string) => async (dispatch: Dispatch, getState: () => RootState) => {
    const currentState = getState();
    // Helper to check login status, we can use the one defined above
    if (!loggedIn(currentState)) {
      try {
        const res = await apiAuth.recoverPassword(email);
        //@ts-ignore
        if (res?.msg || res?.claim) {
          if (res.hasOwnProperty("claim"))
            dispatch(setMagicToken(res as unknown as IWebToken));
          dispatch(
            addNotice({
              title: "Success",
              content:
                "If that login exists, we'll send you an email to reset your password.",
            }),
          );
        } else throw "Error";
      } catch (error) {
        dispatch(
          addNotice({
            title: "Login error",
            content:
              "Please check your details, or internet connection, and try again.",
            icon: "error",
          }),
        );
        dispatch(deleteTokens());
      }
    }
  };

export const resetPassword =
  (password: string, token: string) =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    const currentState = getState();
    if (!loggedIn(currentState)) {
      try {
        const claim: string = currentState.tokens.access_token;
        // Check the two magic tokens meet basic criteria
        const localClaim = tokenParser(claim);
        const magicClaim = tokenParser(token);
        if (
          localClaim.hasOwnProperty("fingerprint") &&
          magicClaim.hasOwnProperty("fingerprint") &&
          localClaim["fingerprint"] === magicClaim["fingerprint"]
        ) {
          const res = await apiAuth.resetPassword(password, claim, token);
          if (res.msg) {
            dispatch(
              addNotice({
                title: "Success",
                content: res.msg,
              }),
            );
          } else throw "Error";
        }
      } catch (error) {
        dispatch(
          addNotice({
            title: "Login error",
            content:
              "Ensure you're using the same browser and that the token hasn't expired.",
            icon: "error",
          }),
        );
        dispatch(deleteTokens());
      }
    }
  };
