
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const askRitualAssistant = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Bạn là một chuyên gia văn hóa và tâm linh Việt Nam của 'Modern Ritual'. Bạn tư vấn khách hàng về các nghi lễ cúng kiến truyền thống (Đầy tháng, Thôi nôi, Tân gia, Khai trương, Giỗ chạp) một cách tinh tế, hiện đại và chuyên nghiệp. Hãy trả lời ngắn gọn, lịch sự.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Xin lỗi, tôi đang gặp chút gián đoạn. Bạn vui lòng thử lại sau nhé!";
  }
};
