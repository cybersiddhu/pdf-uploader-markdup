
import { GoogleGenAI, Chat } from '@google/genai';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function convertToMarkdown(text: string): Promise<string> {
  try {
    const model = 'gemini-2.5-pro'; // Using Pro for better formatting
    const prompt = `Please convert the following text, extracted from a PDF, into well-structured Markdown. Pay close attention to headings, lists, paragraphs, and any potential table-like structures. Format it cleanly for readability.\n\n---\n\n${text}`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error converting to Markdown:", error);
    throw new Error("Failed to convert content to Markdown.");
  }
}

export function startChatSession(pdfText: string): Chat {
  const model = 'gemini-2.5-flash'; // Using Flash for faster chat responses
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: `You are an intelligent assistant designed to help users with the content of a PDF document they've uploaded. The full text of the document is provided below. Your primary role is to answer questions and perform tasks based *only* on this text. Do not use any external knowledge. If a question cannot be answered from the provided text, state that the information is not available in the document.\n\n--- DOCUMENT CONTENT ---\n\n${pdfText}\n\n--- END OF DOCUMENT ---`,
    },
  });
  return chat;
}

export async function sendMessageToChat(chat: Chat, message: string): Promise<string> {
  try {
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error sending message to chat:", error);
    throw new Error("Failed to get a response from the chat assistant.");
  }
}
