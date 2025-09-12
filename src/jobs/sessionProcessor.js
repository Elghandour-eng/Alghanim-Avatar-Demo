import axios from "axios";
import Session from "../models/session.js"; // Adjust path if needed
import Message from "../models/message.js"; // Adjust path if needed
import Label from "../models/label.js"; // Adjust path if needed
import config from "../config/config.js";
// --- Configuration (loaded from process.env by the scheduler) ---
const DIFY_API_ENDPOINT = config.DIFY_API_ENDPOINT + "/v1/workflows/run";
const DIFY_WORKFLOW_API_KEY = config.DIFY_WORKFLOW_API_KEY;
const INACTIVITY_THRESHOLD_MINUTES = config.INACTIVITY_THRESHOLD_MINUTES || 10;

// --- Helper Function: Call Dify API ---
// NOTE: You must adjust the payload and response parsing to match your Dify workflow.
async function callDifyAPI(formattedMessages, allLabels, sessionId) {
  try {
    console.log(`[${sessionId}] Calling Dify API...`);
    const payload = {
      inputs: {
        chat: JSON.stringify(formattedMessages),
        lablels: JSON.stringify(allLabels),
      },
      response_mode: "blocking",
      user: `session-processor-${sessionId}`,
    };
    console.log(payload);
    const headers = {
      Authorization: `Bearer ${DIFY_WORKFLOW_API_KEY}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(DIFY_API_ENDPOINT, payload, { headers });
    const apiResult = await response.data;
    console.log(`[${sessionId}] Dify API response:`, apiResult);

    const result = JSON.parse(apiResult.data?.outputs?.result);
    console.log(`[${sessionId}] Dify API response:`, result);

    if (
      result &&
      result.interest != null &&
      result.labels != null &&
      result.summary != null
    ) {
      console.log(`[${sessionId}] Dify API call successful.`);
      return {
        summary: result.summary,
        interest: result.interest,
        labels: result.labels,
      };
    } else {
      console.error(
        `[${sessionId}] Dify API response has unexpected structure:`,
        apiResult
      );
      return null;
    }
  } catch (error) {
    console.error(error);
    console.error(
      `[${sessionId}] Error calling Dify API:`,
      error.response ? error.response.data : error.message
    );
    return null;
  }
}

/**
 * Main job logic: Finds and processes sessions that have been inactive.
 * This function is exported to be called by a scheduler.
 */
export async function processInactiveSessions(sessionId = null) {
  console.log("Starting session processing job...");

  // 1. Fetch all labels (placeholder - replace with DB query if needed)
  const allLabels = await Label.find().select("name description -_id").exec();
  console.log(
    `Fetched ${allLabels.length} labels from the database., Labels: ${allLabels}`
  );

  // 2. Find sessions where the last message is older than the threshold
  const threshold = new Date(
    Date.now() - INACTIVITY_THRESHOLD_MINUTES * 60 * 1000
  );

  const match = { end_time: null };
  if (sessionId) {
    match.session_id = sessionId;
  }
  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "messages",
        localField: "session_id",
        foreignField: "session_id",
        as: "messages",
      },
    },
    { $match: { "messages.0": { $exists: true } } },
    { $addFields: { lastMessageTimestamp: { $max: "$messages.created_at" } } },
    { $match: { lastMessageTimestamp: { $lt: threshold } } },
    { $project: { session_id: 1, _id: 0 } },
  ];
  if (sessionId) {
    pipeline.splice(4, 1);
  }
  console.log(JSON.stringify(pipeline, null, 2));
  const inactiveSessions = await Session.aggregate(pipeline);
  console.log(inactiveSessions);
  console.log(
    `Found ${inactiveSessions.length} inactive sessions., Sessions: ${inactiveSessions}`
  );
  if (inactiveSessions.length === 0) {
    console.log("No inactive sessions to process. Job finished.");
    return;
  }

  console.log(
    `Found ${inactiveSessions.length} inactive session(s) to process.`
  );

  // 3. Process each session
  for (const session of inactiveSessions) {
    const { session_id } = session;
    console.log(`\nProcessing session: ${session_id}`);
    try {
      const messages = await Message.find({ session_id }).sort({
        timestamp: "asc",
      });
      if (messages.length === 0) continue;

      const formattedMessages = messages.map((msg) => ({
        role: msg.sender === "USER" ? "user" : "assistant",
        content: msg.message_text,
      }));

      const difyData = await callDifyAPI(
        formattedMessages,
        allLabels,
        session_id
      );

      if (difyData) {
        await Session.updateOne(
          { session_id: session_id },
          {
            $set: {
              summary: difyData.summary,
              interest: difyData.interest,
              labels: difyData.labels,
              end_time: new Date(),
            },
          }
        );
        console.log(
          `[${session_id}] Successfully updated session in the database.`
        );
      } else {
        console.error(
          `[${session_id}] Failed to get data from Dify API. Will retry on next run.`
        );
      }
    } catch (error) {
      console.error(`[${session_id}] An unexpected error occurred:`, error);
    }
  }

  console.log("\nSession processing job complete.");
}
