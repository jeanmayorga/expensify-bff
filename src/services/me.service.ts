import axios, { AxiosInstance } from "axios";
import { getErrorMessage } from "@/utils/handle-error";

export class MeService {
  private readonly meApi: AxiosInstance;
  constructor(private readonly accessToken: string) {
    this.meApi = axios.create({
      baseURL: "https://graph.microsoft.com/v1.0/me",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getMe() {
    try {
      console.log("MeService->getMe()");
      const response = await this.meApi.get("/");
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("MeService->getMe()->", message);
      return null;
    }
  }
}
