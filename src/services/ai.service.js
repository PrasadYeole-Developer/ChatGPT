const { GoogleGenAI } = require("@google/genai");

const ai = GoogleGenAI();

async function generateResponse(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    content: prompt,
  });

  return response.text;
}

module.exports = generateResponse;
