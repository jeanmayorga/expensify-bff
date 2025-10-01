import axios, { AxiosInstance } from "axios";
import { Message } from "@/models/messages.model";
import { getErrorMessage } from "@/utils/handle-error";

export class MessagesService {
  private readonly messagesApi: AxiosInstance;

  constructor(private readonly accessToken: string) {
    this.messagesApi = axios.create({
      baseURL: "https://graph.microsoft.com/v1.0/me/messages",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getMessageById(messageId: string): Promise<Message | null> {
    try {
      console.log("MessagesService->getMessageById()");
      const response = await this.messagesApi.get(
        `/${messageId}?$select=from,receivedDateTime,body`
      );

      const formattedMessage: Message = {
        id: messageId,
        from: response.data?.from?.emailAddress?.address?.toLowerCase() || "",
        receivedDateTime:
          response.data?.receivedDateTime || new Date().toISOString(),
        body: response.data?.body?.content || "",
      };

      return formattedMessage;
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("MessagesService->getMessageById()->", message);
      return null;
    }
  }
}
