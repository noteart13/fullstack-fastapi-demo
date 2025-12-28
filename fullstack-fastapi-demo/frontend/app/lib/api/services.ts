import { ISendEmail, IMsg } from "../interfaces";
import { apiCore } from "./core";

export const apiService = {
  // USER CONTACT MESSAGE
  async postEmailContact(data: ISendEmail): Promise<IMsg> {
    return apiCore.fetchJSON<IMsg>(`${apiCore.url}/service/contact`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
