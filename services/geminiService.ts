
import { GoogleGenAI, Type } from "@google/genai";
import { Client, GeocodeResult, StrategicInsight } from "../types";

const API_KEY = process.env.API_KEY || "";

export const getGeminiGeocode = async (address: string): Promise<GeocodeResult | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Geocode this address into latitude and longitude coordinates: "${address}". Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            latitude: { type: Type.NUMBER },
            longitude: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            formattedAddress: { type: Type.STRING }
          },
          required: ["latitude", "longitude", "confidence", "formattedAddress"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
};

export const parseClientList = async (rawText: string): Promise<{ name: string, address: string, industry: string }[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract a list of entities (Schools or Services) and their full addresses from the following text. 
      Categorize each as exactly one of: 'Christian School', 'Public School', 'Catholic School', 'Charter', or 'Roofing'.
      
      Text: "${rawText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              address: { type: Type.STRING },
              industry: { type: Type.STRING }
            },
            required: ["name", "address", "industry"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Parsing failed:", error);
    return [];
  }
};

export const getStrategicAnalysis = async (clients: Client[]): Promise<StrategicInsight | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const clientData = clients.map(c => ({
      name: c.name,
      loc: [c.latitude, c.longitude],
      cat: c.industry
    }));

    const prompt = `Analyze this geographic distribution of institutions (Christian, Public, Catholic, and Charter Schools) and Roofing services. 
    Identify coverage gaps where certain types of schools are missing, or where roofing services are concentrated relative to schools.
    
    Data: ${JSON.stringify(clientData)}
    
    Provide strategic community insights including regional clusters and underserved areas.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            hotspots: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskAreas: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "recommendations", "hotspots", "riskAreas"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Analysis failed:", error);
    return null;
  }
};

export const querySchoolAssistant = async (query: string, visibleClients: Client[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const context = visibleClients.map(c => `${c.name} (${c.industry}) at ${c.address}`).join(', ');
    
    const prompt = `You are a helpful education and community assistant. 
    A user is asking: "${query}". 
    
    Context of current visible entries on the map: ${context || "No schools currently on the map."}
    
    Provide a concise, helpful answer. If they are asking about specific schools, use the context. If they are asking general educational questions, provide expert insights. Keep it professional.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    return response.text || "I'm sorry, I couldn't process that query.";
  } catch (error) {
    console.error("AI Assistant query failed:", error);
    return "I encountered an error while processing your request.";
  }
};
