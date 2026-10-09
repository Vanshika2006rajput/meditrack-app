const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const analyzeMedicineLabel = async ({
  imageBase64,
  mimeType
}) => {
  console.log("Gemini image analysis started");

  if (!imageBase64 || !mimeType) {
    throw new Error(
      "Medicine label image data is required."
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  const prompt = `
Analyze this medicine package or medicine label image.

Provide useful general information about the medicine.

Include:

- Medicine or brand name
- Active ingredient
- Strength
- Dosage form
- Manufacturer, if visible
- What the medicine is generally used for
- Common uses
- Common side effects
- Important warnings
- Important precautions
- Important interaction warnings, if relevant
- Storage information, if visible or reliably known
- Important information visible on the package

Keep the answer concise but useful.

IMPORTANT SAFETY RULES:

- Do not diagnose the user.
- Do not prescribe treatment.
- Do not recommend or change dosage.
- Do not tell the user how often they personally should take it.
- Do not tell the user to start or stop medication.
- Do not provide personalized medical advice.
- Do not invent information that cannot be supported.
- If something cannot be read from the image, clearly say
  that it is not visible or cannot be confirmed.
- General medicine information should be educational only.
- Important medicine information should be confirmed
  with a doctor or pharmacist.

Format the response with clear headings and bullet points.
`;

  try {
    console.log(
      "Sending medicine image to Gemini..."
    );

    const response =
      await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",

        contents: [
          {
            role: "user",

            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageBase64
                }
              },

              {
                text: prompt
              }
            ]
          }
        ]
      });

    console.log(
      "Gemini image response received"
    );

    const analysis =
      response.text || "";

    if (!analysis) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    return analysis;
  } catch (error) {
    console.error(
      "Gemini image analysis error:",
      error
    );

    throw new Error(
      error.message ||
        "Gemini could not analyze the medicine label."
    );
  }
};

module.exports = {
  analyzeMedicineLabel
};