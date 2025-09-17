import { GoogleGenAI, Modality } from "@google/genai";

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve((reader.result as string).split(',')[1]);
      } else {
        reject(new Error("Failed to read file."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      mimeType: file.type,
      data: base64EncodedData,
    },
  };
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeHairstyle = async (hairstyleFile: File): Promise<string> => {
  const hairstylePart = await fileToGenerativePart(hairstyleFile);
  const model = 'gemini-2.5-flash';

  const prompt = `You are a hairstyle analysis expert. Your task is to analyze the provided image and extract the most important defining features of the hairstyle.
Provide your output as a concise, comma-separated list of keywords.
Focus on:
- **Style:** (e.g., layered bob, wolf cut, pixie, slicked back)
- **Texture:** (e.g., straight, wavy, curly, coily, fine, thick)
- **Color:** (e.g., platinum blonde, jet black, auburn, balayage)
- **Length:** (e.g., short, medium-length, long)
- **Key Features:** (e.g., side-swept bangs, center part, undercut, highlights)

Example output: medium-length, wavy, dark brown, center part, textured layers, curtain bangs

Do not use full sentences. Only provide the comma-separated keywords.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        hairstylePart,
        { text: prompt },
      ],
    },
  });
  
  return response.text;
};

export const applyHairstyle = async (faceFile: File, hairstyleFile: File, hairstyleDescription: string): Promise<string> => {
  const facePart = await fileToGenerativePart(faceFile);
  const hairstylePart = await fileToGenerativePart(hairstyleFile);
  const model = 'gemini-2.5-flash-image-preview';

  const prompt = `You are an expert digital artist specializing in hyper-realistic hair replacement. Your mission is to edit the person's photo ([PERSON_IMAGE]) to give them the **exact hairstyle** from the reference photo ([HAIRSTYLE_REFERENCE_IMAGE]).

**Your primary source of truth is the visual information in [HAIRSTYLE_REFERENCE_IMAGE]. The keywords provided are to guide your focus.**

**Core Directives:**
1.  **Visual Replication is Paramount:** The [HAIRSTYLE_REFERENCE_IMAGE] is your absolute directive. You must visually analyze and replicate its every detail:
    *   **The Cut, Shape, and Flow:** The overall silhouette, layering, movement, and how the hair is arranged (e.g., swept back, falling forward).
    *   **Texture and Volume:** The thickness, curls, waves, or straightness, and the overall body of the hair.
    *   **Color and Parting:** The exact hair color, highlights, and where the hair is parted.

2.  **Complete Replacement:** You must **entirely remove and replace the original hair** from the [PERSON_IMAGE]. Do not blend or merge it with the new style.

3.  **Preserve the Subject:** Do NOT change the person's face, features, skin tone, expression, glasses, clothing, or the image background. The hair is the ONLY element to be changed.

4.  **Use Keywords as a Guide:** Use the [Guiding Keywords] to ensure you capture the most critical aspects of the hairstyle shown in the reference image.

5.  **Realistic Integration:** The new hairstyle must be seamlessly integrated. Pay close attention to the lighting, shadows, and perspective of the [PERSON_IMAGE] to make the result look like a natural photograph.

**Inputs:**
-   **Image to Edit:** [PERSON_IMAGE]
-   **Hairstyle to Replicate:** [HAIRSTYLE_REFERENCE_IMAGE]
-   **Guiding Keywords:** ${hairstyleDescription}

Execute this with the highest level of artistic and technical precision. The final image should be indistinguishable from a real photograph.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        facePart,
        hairstylePart,
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("AI did not return an image. Please try a different set of photos.");
};
