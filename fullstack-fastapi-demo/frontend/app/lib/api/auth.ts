import {
  IUserProfile,
  IUserProfileUpdate,
  IUserProfileCreate,
  IUserOpenProfileCreate,
  ITokenResponse,
  IWebToken,
  INewTOTP,
  IEnableTOTP,
  IMsg,
  IErrorResponse,
} from "../interfaces";
import { apiCore } from "./core";

const jsonify = async (response: Response) => {
  if (response.ok) {
    return await response.json();
  } else {
    throw {
      message: `Request failed with ${response.status}: ${response.statusText}`,
      code: response.status,
    } as IErrorResponse;
  }
};

export const apiAuth = {
  // LOGIN WITH MAGIC LINK OR OAUTH2 (USERNAME/PASSWORD)
  async loginWithMagicLink(email: string): Promise<IWebToken> {
    const res = await fetch(`${apiCore.url}/login/magic/${email}`, {
      method: "POST",
    });
    return (await jsonify(res)) as IWebToken;
  },
  async validateMagicLink(
    token: string,
    data: IWebToken,
  ): Promise<ITokenResponse> {
    const res = await fetch(`${apiCore.url}/login/claim`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: apiCore.headers(token),
    });
    return (await jsonify(res)) as ITokenResponse;
  },
  async loginWithOauth(
    username: string,
    password: string,
  ): Promise<ITokenResponse> {
    // Version of this: https://github.com/unjs/ofetch/issues/37#issuecomment-1262226065
    // useFetch is borked, so you'll need to ignore errors https://github.com/unjs/ofetch/issues/37
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);
    params.append("grant_type", "password");
    const res = await fetch(`${apiCore.url}/login/oauth`, {
      method: "POST",
      body: params,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return (await jsonify(res)) as ITokenResponse;
  },
  // TOTP SETUP AND AUTHENTICATION
  async loginWithTOTP(token: string, data: IWebToken): Promise<ITokenResponse> {
    // Note: TOTP login không dùng interceptor vì token là TOTP token, không phải access token
    const res = await fetch(`${apiCore.url}/login/totp`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return (await jsonify(res)) as ITokenResponse;
  },
  async requestNewTOTP(token: string): Promise<INewTOTP> {
    return apiCore.fetchJSON<INewTOTP>(`${apiCore.url}/users/new-totp`, {
      method: "POST",
    });
  },
  async enableTOTPAuthentication(
    token: string,
    data: IEnableTOTP,
  ): Promise<IMsg> {
    return apiCore.fetchJSON<IMsg>(`${apiCore.url}/login/totp`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  async disableTOTPAuthentication(
    token: string,
    data: IUserProfileUpdate,
  ): Promise<IMsg> {
    return apiCore.fetchJSON<IMsg>(`${apiCore.url}/login/totp`, {
      method: "DELETE",
      body: JSON.stringify(data),
    });
  },
  // MANAGE JWT TOKENS (REFRESH / REVOKE)
  async getRefreshedToken(token: string): Promise<ITokenResponse> {
    // Note: refresh endpoint không dùng interceptor để tránh loop
    const res = await fetch(`${apiCore.url}/login/refresh`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return (await jsonify(res)) as ITokenResponse;
  },
  async revokeRefreshedToken(token: string): Promise<IMsg> {
    return apiCore.fetchJSON<IMsg>(`${apiCore.url}/login/revoke`, {
      method: "POST",
    });
  },
  // USER PROFILE MANAGEMENT
  async createProfile(data: IUserOpenProfileCreate): Promise<IUserProfile> {
    const res = await fetch(`${apiCore.url}/users/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return (await jsonify(res)) as IUserProfile;
  },
  async getProfile(token: string): Promise<IUserProfile> {
    return apiCore.fetchJSON<IUserProfile>(`${apiCore.url}/users/`, {
      method: "GET",
    });
  },
  async updateProfile(
    token: string,
    data: IUserProfileUpdate,
  ): Promise<IUserProfile> {
    return apiCore.fetchJSON<IUserProfile>(`${apiCore.url}/users/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  // ACCOUNT RECOVERY
  async recoverPassword(email: string): Promise<IMsg | IWebToken> {
    const res = await fetch(`${apiCore.url}/login/recover/${email}`, {
      method: "POST",
    });
    return (await jsonify(res)) as IMsg | IWebToken;
  },
  async resetPassword(
    password: string,
    claim: string,
    token: string,
  ): Promise<IMsg> {
    const res = await fetch(`${apiCore.url}/login/reset`, {
      method: "POST",
      body: JSON.stringify({
        new_password: password,
        claim,
      }),
      headers: apiCore.headers(token),
    });
    return (await jsonify(res)) as IMsg;
  },
  async requestValidationEmail(token: string): Promise<IMsg> {
    return apiCore.fetchJSON<IMsg>(`${apiCore.url}/users/send-validation-email`, {
      method: "POST",
    });
  },
  async validateEmail(token: string, validation: string): Promise<IMsg> {
    return apiCore.fetchJSON<IMsg>(`${apiCore.url}/users/validate-email`, {
      method: "POST",
      body: JSON.stringify({ validation }),
    });
  },
  // ADMIN USER MANAGEMENT
  async getAllUsers(token: string): Promise<IUserProfile[]> {
    return apiCore.fetchJSON<IUserProfile[]>(`${apiCore.url}/users/all`, {
      method: "GET",
    });
  },
  async toggleUserState(
    token: string,
    data: IUserProfileUpdate,
  ): Promise<IMsg> {
    return apiCore.fetchJSON<IMsg>(`${apiCore.url}/users/toggle-state`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async createUserProfile(
    token: string,
    data: IUserProfileCreate,
  ): Promise<IUserProfile> {
    return apiCore.fetchJSON<IUserProfile>(`${apiCore.url}/users/create`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
