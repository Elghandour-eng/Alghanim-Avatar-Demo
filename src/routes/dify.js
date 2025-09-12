import { Router } from "express";
import fetch from "node-fetch";
import NodeCache from "node-cache";

import Message from "../models/message.js";

// In-memory store for user conversations
const userConversations = new NodeCache();

const difyRouter = Router();
export default difyRouter;

// API endpoint to send message to Dify
difyRouter.post("/api/dify-chat", async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const conversationMessage = new Message({
      session_id: userId,
      sender: "USER",
      message_text: message,
      screen_type: "chat_box",
    });
    await conversationMessage.save();

    // Get or create conversation ID for this user
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

    // Set up Server-Sent Events
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    let fullAnswer = "";
    let currentConversationId = "";

    // Process the streaming response
    const reader = response.body;
    let buffer = "";

    reader.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "") continue; // Skip empty data lines
          console.log("jsonStr", jsonStr);
          console.log("line", line);
          try {
            const data = JSON.parse(jsonStr);

            if (data.event === "message" || data.event === "agent_message") {
              fullAnswer += data.answer;
              currentConversationId = data.conversation_id;

              // Send the streaming data to client
              res.write(
                `data: ${JSON.stringify({
                  type: "message",
                  content: data.answer,
                  conversation_id: data.conversation_id,
                })}\n\n`
              );
            } else if (data.event === "message_end") {
              currentConversationId = data.conversation_id;

              // Store conversation ID for future messages
              if (currentConversationId) {
                userConversations.set(userId, currentConversationId);
              }

              // Try to parse the full answer as JSON to extract screen info
              let parsedAnswer = null;
              let screenType = "default";
              let cleanAnswer = fullAnswer;
              const conversationMessage = new Message({
                session_id: userId,
                sender: "BOT",
                message_text: fullAnswer,
                screen_type: "chat_box",
              });
              conversationMessage.save().then(() => {
                console.log("Bot message saved");
              });

              try {
                // Try to parse as JSON
                parsedAnswer = JSON.parse(fullAnswer);
                if (parsedAnswer.answer) {
                  cleanAnswer = parsedAnswer.answer;
                }
                if (parsedAnswer.screen) {
                  screenType = parsedAnswer.screen;
                }
              } catch (jsonError) {
                // If not JSON, use the full answer as is
                cleanAnswer = fullAnswer;
              }

              // Send end event with parsed data
              res.write(
                `data: ${JSON.stringify({
                  type: "message_end",
                  conversation_id: data.conversation_id,
                  full_message: cleanAnswer,
                  screen: screenType,
                })}\n\n`
              );

              res.end();
            } else if (data.event === "tts_message") {
              // Handle TTS if needed
              res.write(
                `data: ${JSON.stringify({
                  type: "tts_message",
                  audio: data.audio,
                  conversation_id: data.conversation_id,
                })}\n\n`
              );
            } else if (data.event === "tts_message_end") {
              // Handle TTS end if needed
              res.write(
                `data: ${JSON.stringify({
                  type: "tts_message_end",
                  conversation_id: data.conversation_id,
                })}\n\n`
              );
            }
          } catch (parseError) {
            // Silently ignore parsing errors for incomplete JSON chunks
            // console.error('Error parsing Dify response:', parseError);
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
  } catch (error) {
    console.error("Error in Dify chat:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process chat message" });
    }
  }
});
