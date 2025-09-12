import fetch from "node-fetch";
import NodeCache from "node-cache";
import Message from "../models/message.js";

const userConversations = new NodeCache();

const difyService = {
  async sendMessage(message, userId, res) {
    const userMessage = new Message({
      session_id: userId,
      sender: "USER",
      message_text: message,
      screen_type: "chat_box",
    });
    await userMessage.save();

    let conversationId = userConversations.get(userId) || "";

    const difyPayload = {
      inputs: {},
      query: message,
      response_mode: "streaming",
      conversation_id: conversationId,
      user: userId,
      files: [],
    };

    const response = await fetch("https://api.dify.ai/v1/chat-messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(difyPayload),
    });

    if (!response.ok) {
      throw new Error(
        `Dify API error: ${response.status} ${response.statusText}`
      );
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    let fullAnswer = "";
    let currentConversationId = "";

    const reader = response.body;
    let buffer = "";

    reader.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "") continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.event === "message" || data.event === "agent_message") {
              fullAnswer += data.answer;
              currentConversationId = data.conversation_id;

              res.write(
                `data: ${JSON.stringify({
                  type: "message",
                  content: data.answer,
                  conversation_id: data.conversation_id,
                })}\n\n`
              );
            } else if (data.event === "message_end") {
              currentConversationId = data.conversation_id;

              if (currentConversationId) {
                userConversations.set(userId, currentConversationId);
              }

              const conversationMessage = new Message({
                reply_to: userMessage._id,
                session_id: userId,
                sender: "BOT",
                message_text: fullAnswer,
                screen_type: "chat_box",
              });
              conversationMessage.save();

              let cleanAnswer = fullAnswer;
              let screenType = "default";
              try {
                const parsedAnswer = JSON.parse(fullAnswer);
                if (parsedAnswer.answer) {
                  cleanAnswer = parsedAnswer.answer;
                }
                if (parsedAnswer.screen) {
                  screenType = parsedAnswer.screen;
                }
              } catch (jsonError) {
                // Not a JSON response
              }

              res.write(
                `data: ${JSON.stringify({
                  type: "message_end",
                  conversation_id: data.conversation_id,
                  full_message: cleanAnswer,
                  screen: screenType,
                })}\n\n`
              );
              res.end();
            }
          } catch (parseError) {
            // Ignore parsing errors
          }
        }
      }
    });

    reader.on("end", () => {
      if (!res.headersSent) {
        res.end();
      }
    });

    reader.on("error", (error) => {
      console.error("Stream error:", error);
      if (!res.headersSent) {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            message: "Stream error occurred",
          })}\n\n`
        );
        res.end();
      }
    });
  },
};

export default difyService;
