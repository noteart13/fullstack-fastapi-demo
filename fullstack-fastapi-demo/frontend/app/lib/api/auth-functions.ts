import { API_URL } from "./config";
import { ITokenResponse, IMsg, IErrorResponse } from "../interfaces";

export const jsonify = async (response: Response) => {
  if (response.ok) {
    return await response.json();
  } else {
    throw {
      message: `Request failed with ${response.status}: ${response.statusText}`,
      code: response.status,
    } as IErrorResponse;
  }
};

export async function getRefreshedToken(token: string): Promise<ITokenResponse> {
  // Note: refresh endpoint không dùng interceptor để tránh loop
  const res = await fetch(`${API_URL}/login/refresh`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return (await jsonify(res)) as ITokenResponse;
}

export async function revokeRefreshedToken(token: string): Promise<IMsg> {
  // Note: revoke endpoint không dùng interceptor để tránh loop và cần gửi refresh token
  const res = await fetch(`${API_URL}/login/revoke`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return (await jsonify(res)) as IMsg;
}
