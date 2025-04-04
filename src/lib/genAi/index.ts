const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEN_AI_API_KEY);
const imageGeneratingModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp-image-generation" });
const textGeneratingModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const generationImageConfig = {
	temperature: 1,
	topP: 0.95,
	topK: 40,
	maxOutputTokens: 8192,
	responseModalities: ['image', 'text'],
	responseMimeType: 'text/plain',
};

const generationTextConfig = {
	temperature: 1,
	topP: 0.95,
	topK: 40,
	maxOutputTokens: 8192,
	responseModalities: [
	],
	responseMimeType: "text/plain",
  };

export {
	imageGeneratingModel,
	textGeneratingModel,
	generationImageConfig,
	generationTextConfig,
	genAI,
}