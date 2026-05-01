const aiService = require("../services/ai.service");

async function streamReview(req, res) {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).send("Code is required");
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.flushHeaders();

    const stream = await aiService.streamFromGroq(code);

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;

      if (content) {
        res.write(`data: ${content}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();

  } catch (err) {
    console.error("Streaming error:", err);
    res.end();
  }
}

module.exports = {
  streamReview,
};