import { Dispatch } from "@reduxjs/toolkit";
import { apiAuth } from "../api";
import { tokenExpired, tokenParser } from "../utilities";
import { addNotice } from "../slices/toastsSlice";
import { setTokens, setMagicToken, deleteTokens } from "../slices/tokensSlice";
import { RootState } from "../store";

export const getTokens = (payload: { username: string; password?: string }) => {
  return async (dispatch: Dispatch) => {
    try {
      if (payload.password !== undefined) {
        const response = await apiAuth.loginWithOauth(
          payload.username,
          payload.password,
        );
        if (response.access_token) {
          dispatch(setTokens(response));
        } else {
          throw "error";
        }
      } else {
        const response = await apiAuth.loginWithMagicLink(payload.username);
        if (response.claim) {
          dispatch(setMagicToken(response));
        } else {
          throw "error";
        }
      }
    } catch (error) {
      dispatch(
        addNotice({
          title: "Login error",
          content: "Your email and/or password is incorrect. Please try again.",
          icon: "error",
        }),
      );
      dispatch(deleteTokens());
    }
  };
};

export const validateMagicTokens =
  (token: string) => async (dispatch: Dispatch) => {
    try {
      const data: string = token;
      // Check the two magic tokens meet basic criteria
      const localClaim = tokenParser(data);
      const magicClaim = tokenParser(token);
      if (
        localClaim.hasOwnProperty("fingerprint") &&
        magicClaim.hasOwnProperty("fingerprint") &&
        localClaim["fingerprint"] === magicClaim["fingerprint"]
      ) {
        const response = await apiAuth.validateMagicLink(token, {
          claim: data,
        });
        dispatch(setTokens(response));
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
  };

export const validateTOTPClaim =
  (data: string) => async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      const access_token = getState().tokens.access_token;
      const response = await apiAuth.loginWithTOTP(access_token, {
        claim: data,
      });
      dispatch(setTokens(response));
    } catch (error) {
      dispatch(
        addNotice({
          title: "Two-factor error",
          content:
            "Unable to validate your verification code. Make sure it is the latest.",
          icon: "error",
        }),
      );
    }
  };

export const refreshTokens =
  () => async (dispatch: Dispatch, getState: () => RootState) => {
    const currentState = getState();
    const hasAccessTokenExpired = currentState.tokens.access_token
      ? tokenExpired(currentState.tokens.access_token)
      : true;
    if (hasAccessTokenExpired) {
      const hasRefreshTokenExpired = currentState.tokens.refresh_token
        ? tokenExpired(currentState.tokens.refresh_token)
        : true;
      if (!hasRefreshTokenExpired) {
        try {
          const response = await apiAuth.getRefreshedToken(
            currentState.tokens.refresh_token,
          );
          dispatch(setTokens(response));
        } catch (error) {
          dispatch(deleteTokens());
        }
      } else {
        dispatch(deleteTokens());
      }
    }
  };
