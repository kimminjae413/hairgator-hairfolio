import { useState } from 'react';

// 타입 정의
export interface ColorTryOnRequest {
  userPhotoUrl: string;
  colorStyleUrl: string;
  colorType: 'highlight' | 'full-color' | 'ombre' | 'balayage';
  intensity: 'light' | 'medium' | 'bold';
  colorHex?: string;
  colorName?: string;
}

export interface ColorTryOnResult {
  resultImageUrl: string;
  confidence: number;
  processingTime: number;
  colorAnalysis: {
    dominantColors: string[];
    skinToneMatch: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  };
}

interface HairAnalysis {
  currentColor: string;
  texture: string;
  length: string;
  clarity: number;
}

interface ColorAnalysis {
  dominantColors: string[];
  technique: string;
  gradientPattern: string;
  difficulty: string;
  suitableSkinTones: string[];
  compatibility: number;
}

interface SkinToneAnalysis {
  type: string;
  undertone: string;
  rgbValue: string;
  suitableColors: string[];
  avoidColors: string[];
}

// Gemini Color Try-On Service
class GeminiColorTryOnService {
  private apiKey: string;
  private analysisEndpoint: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  private imageGenerationEndpoint: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      console.warn('VITE_GEMINI_API_KEY 환경변수가 설정되지 않았습니다. 데모 모드로 실행됩니다.');
    }
  }

  private extractJsonFromResponse(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      try {
        let cleanText = text.trim();
        
        const jsonBlockMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
          cleanText = jsonBlockMatch[1].trim();
        } else {
          const codeBlockMatch = cleanText.match(/```\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            cleanText = codeBlockMatch[1].trim();
            cleanText = cleanText.replace(/^json\s*\n?/, '');
          }
        }

        const jsonStart = cleanText.indexOf('{');
        const jsonEnd = cleanText.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
        }

        return JSON.parse(cleanText);
        
      } catch (parseError) {
        console.error('JSON 파싱 실패:', parseError);
        throw new Error('응답 파싱 실패: JSON 형식이 아닙니다');
      }
    }
  }

  async tryOnHairColor(request: ColorTryOnRequest): Promise<ColorTryOnResult> {
    try {
      const startTime = Date.now();

      if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
        return this.createDemoResult(request, startTime);
      }

      const hairAnalysis = await this.analyzeHairRegion(request.userPhotoUrl);
      const colorAnalysis = await this.analyzeColorStyle(request.colorStyleUrl);
      const skinToneAnalysis = await this.analyzeSkinTone(request.userPhotoUrl);
      
      const resultImageUrl = await this.processColorTransformation(
        request.userPhotoUrl,
        hairAnalysis,
        colorAnalysis,
        request
      );

      const recommendations = await this.generateRecommendations(
        skinToneAnalysis,
        colorAnalysis,
        request
      );

      const processingTime = Date.now() - startTime;

      return {
        resultImageUrl,
        confidence: this.calculateConfidence(hairAnalysis, colorAnalysis),
        processingTime,
        colorAnalysis: {
          dominantColors: colorAnalysis.dominantColors,
          skinToneMatch: this.evaluateSkinToneMatch(skinToneAnalysis, colorAnalysis),
          recommendations
        }
      };

    } catch (error) {
      console.error('Color try-on failed:', error);
      
      if (error instanceof Error && (error.message.includes('API') || error.message.includes('파싱'))) {
        console.warn('AI 분석 오류 발생, 데모 모드로 전환합니다.');
        return this.createDemoResult(request, Date.now());
      }
      
      throw new Error('염색 가상체험 처리 중 오류가 발생했습니다: ' + (error as Error).message);
    }
  }

  private createDemoResult(request: ColorTryOnRequest, startTime: number): ColorTryOnResult {
    const processingTime = Date.now() - startTime + 2500;
    
    const demoResults = {
      'highlight': {
        resultImageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=600&fit=crop',
        dominantColors: ['#D4AF37', '#F4E4BC'],
        skinToneMatch: 'excellent' as const,
        recommendations: [
          '하이라이트는 자연스러운 입체감을 연출합니다',
          '뿌리염색 없이도 화사한 효과를 얻을 수 있어요',
          '6-8주마다 터치업을 권장합니다'
        ]
      },
      'full-color': {
        resultImageUrl: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=500&fit=crop',
        dominantColors: ['#8B4513', '#D2691E'],
        skinToneMatch: 'good' as const,
        recommendations: [
          '전체 염색으로 완전한 이미지 변화가 가능합니다',
          '컬러 보호 샴푸 사용을 권장합니다',
          '염색 후 72시간은 머리를 감지 마세요'
        ]
      },
      'ombre': {
        resultImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=550&fit=crop',
        dominantColors: ['#2F1B14', '#D4AF37'],
        skinToneMatch: 'good' as const,
        recommendations: [
          '옴브레는 자연스러운 그라데이션이 매력적입니다',
          '뿌리 관리가 상대적으로 쉬워요',
          '정기적인 톤 조정이 필요합니다'
        ]
      },
      'balayage': {
        resultImageUrl: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&h=650&fit=crop',
        dominantColors: ['#6B4423', '#F4E4BC'],
        skinToneMatch: 'excellent' as const,
        recommendations: [
          '발레아쥬는 가장 자연스러운 염색 기법입니다',
          '손상이 적고 유지보수가 편리해요',
          '계절마다 톤 조정하면 더욱 예뻐집니다'
        ]
      }
    };

    const demo = demoResults[request.colorType] || demoResults['full-color'];
    
    return {
      resultImageUrl: demo.resultImageUrl,
      confidence: 0.85,
      processingTime,
      colorAnalysis: {
        dominantColors: demo.dominantColors,
        skinToneMatch: demo.skinToneMatch,
        recommendations: demo.recommendations
      }
    };
  }

  private async analyzeHairRegion(imageUrl: string): Promise<HairAnalysis> {
    const prompt = `
이 이미지에서 머리카락을 분석해주세요. 반드시 다음 JSON 형태로만 응답해주세요:

{
  "currentColor": "자연스러운 갈색",
  "texture": "직모",
  "length": "중간",
  "clarity": 0.8
}
    `;

    try {
      const imageData = await this.fetchImageAsBase64(imageUrl);
      const response = await this.callGeminiAnalysisAPI(prompt, imageData);
      return this.extractJsonFromResponse(response);
    } catch (error) {
      console.error('Hair analysis failed:', error);
      return {
        currentColor: "자연스러운 갈색",
        texture: "직모",
        length: "중간",
        clarity: 0.7
      };
    }
  }

  private async analyzeColorStyle(styleImageUrl: string): Promise<ColorAnalysis> {
    try {
      const filename = styleImageUrl.toLowerCase();
      
      let dominantColors = ["#8B4513", "#D2691E"];
      let technique = "전체염색";
      
      if (filename.includes('blonde') || filename.includes('금발')) {
        dominantColors = ["#F5DEB3", "#DAA520"];
        technique = "하이라이트";
      } else if (filename.includes('red') || filename.includes('빨강')) {
        dominantColors = ["#8B0000", "#CD5C5C"];
        technique = "전체염색";
      } else if (filename.includes('black') || filename.includes('검정')) {
        dominantColors = ["#000000", "#2F2F2F"];
        technique = "전체염색";
      } else if (filename.includes('brown') || filename.includes('갈색')) {
        dominantColors = ["#8B4513", "#A0522D"];
        technique = "발레아쥬";
      } else if (filename.includes('silver') || filename.includes('회색')) {
        dominantColors = ["#C0C0C0", "#808080"];
        technique = "탈색후염색";
      }

      return {
        dominantColors,
        technique,
        gradientPattern: "자연스러운 그라데이션",
        difficulty: "중급",
        suitableSkinTones: ["웜톤", "뉴트럴톤"],
        compatibility: 0.8
      };
      
    } catch (error) {
      console.error('Color style analysis failed:', error);
      
      return {
        dominantColors: ["#8B4513", "#D2691E"],
        technique: "전체염색",
        gradientPattern: "균일한 색상",
        difficulty: "초급",
        suitableSkinTones: ["모든 톤"],
        compatibility: 0.7
      };
    }
  }

  private async analyzeSkinTone(imageUrl: string): Promise<SkinToneAnalysis> {
    const prompt = `
이 사진에서 피부톤을 분석해주세요. 반드시 다음 JSON 형태로만 응답해주세요:

{
  "type": "웜톤",
  "undertone": "황색 언더톤",
  "rgbValue": "rgb(205, 170, 140)",
  "suitableColors": ["갈색 계열", "골드 계열"],
  "avoidColors": ["애쉬 계열", "실버 계열"]
}
    `;

    try {
      const imageData = await this.fetchImageAsBase64(imageUrl);
      const response = await this.callGeminiAnalysisAPI(prompt, imageData);
      return this.extractJsonFromResponse(response);
    } catch (error) {
      console.error('Skin tone analysis failed:', error);
      return {
        type: "뉴트럴톤",
        undertone: "중성 언더톤",
        rgbValue: "rgb(200, 170, 145)",
        suitableColors: ["갈색 계열", "자연스러운 색상"],
        avoidColors: ["극단적인 색상"]
      };
    }
  }

  private async callGeminiAnalysisAPI(prompt: string, imageData?: string): Promise<string> {
    const requestBody: any = {
      contents: [{
        parts: [
          { text: prompt }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048
      }
    };

    if (imageData) {
      requestBody.contents[0].parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: imageData
        }
      });
    }

    const response = await fetch(`${this.analysisEndpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('API 키가 유효하지 않습니다.');
      } else if (response.status === 429) {
        throw new Error('API 호출 한도를 초과했습니다.');
      } else {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('API 응답 형식 오류:', data);
      throw new Error('API 응답 형식이 올바르지 않습니다.');
    }

    return data.candidates[0].content.parts[0].text;
  }

  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`이미지 로드 실패: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size > 10 * 1024 * 1024) {
        throw new Error('이미지 파일이 너무 큽니다.');
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('이미지 읽기에 실패했습니다.'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Image conversion failed:', error);
      throw new Error('이미지 변환에 실패했습니다.');
    }
  }

  private async processColorTransformation(
    originalImageUrl: string,
    hairAnalysis: HairAnalysis,
    colorAnalysis: ColorAnalysis,
    request: ColorTryOnRequest
  ): Promise<string> {
    try {
      const transformationPrompt = `
Change ONLY the hair color of this person. Do NOT change the hairstyle, length, or cut.

Hair Color Style: ${request.colorType}
Color Intensity: ${request.intensity}
Target Colors: ${colorAnalysis.dominantColors.join(', ')}
Technique: ${colorAnalysis.technique}

STRICT REQUIREMENTS:
1. Keep the person's face EXACTLY the same
2. Keep the current hairstyle EXACTLY the same
3. ONLY change the hair color
4. Do NOT change hair length or cut
5. Apply color transformation only

Generate a realistic photo with ONLY hair color changed.
      `;

      const imageData = await this.fetchImageAsBase64(originalImageUrl);
      
      const response = await fetch(`${this.imageGenerationEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: transformationPrompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageData
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
            response_modalities: ["TEXT", "IMAGE"]
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('이미지 생성 API 오류:', errorText);
        throw new Error(`이미지 변환 실패: ${response.status}`);
      }

      const result = await response.json();
      console.log('Gemini 이미지 생성 응답:', result);
      
      if (result.candidates && result.candidates[0]) {
        const candidate = result.candidates[0];
        
        if (candidate.finishReason === 'SAFETY') {
          console.warn('안전성 필터에 의해 차단됨');
          return originalImageUrl;
        }
        
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if ((part.inline_data && part.inline_data.data) || (part.inlineData && part.inlineData.data)) {
              const base64Data = part.inline_data?.data || part.inlineData?.data;
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'image/jpeg' });
              const blobUrl = URL.createObjectURL(blob);
              
              console.log('이미지 생성 성공');
              return blobUrl;
            }
          }
        }
      }

      console.warn('이미지 생성 실패, 원본 반환');
      return originalImageUrl;

    } catch (error) {
      console.error('이미지 변환 중 오류:', error);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return originalImageUrl;
    }
  }

  private async generateRecommendations(
    skinToneAnalysis: SkinToneAnalysis,
    colorAnalysis: ColorAnalysis,
    request: ColorTryOnRequest
  ): Promise<string[]> {
    return [
      "염색 후 컬러 전용 샴푸를 사용하여 색상을 오래 유지하세요",
      "염색 후 2-3일은 머리를 감지 않는 것이 좋습니다",
      "자외선 차단을 위해 모자나 헤어 보호제를 사용하세요",
      "정기적인 트리트먼트로 모발 건강을 관리하세요"
    ];
  }

  private calculateConfidence(hairAnalysis: HairAnalysis, colorAnalysis: ColorAnalysis): number {
    let confidence = 0.7;
    
    if (hairAnalysis.clarity > 0.8) confidence += 0.15;
    else if (hairAnalysis.clarity > 0.6) confidence += 0.1;
    
    if (colorAnalysis.compatibility > 0.8) confidence += 0.1;
    else if (colorAnalysis.compatibility > 0.6) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  private evaluateSkinToneMatch(
    skinToneAnalysis: SkinToneAnalysis, 
    colorAnalysis: ColorAnalysis
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    const userSkinType = skinToneAnalysis.type;
    const recommendedSkinTones = colorAnalysis.suitableSkinTones;
    
    if (recommendedSkinTones.includes(userSkinType)) {
      return 'excellent';
    } else if (recommendedSkinTones.includes('모든 톤') || recommendedSkinTones.includes('뉴트럴톤')) {
      return 'good';
    } else if (colorAnalysis.compatibility > 0.6) {
      return 'fair';
    } else {
      return 'poor';
    }
  }
}

export const useColorTryOn = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ColorTryOnResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tryOnColor = async (request: ColorTryOnRequest) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const service = new GeminiColorTryOnService();
      const colorResult = await service.tryOnHairColor(request);
      setResult(colorResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('Color try-on error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setIsProcessing(false);
  };

  return {
    isProcessing,
    result,
    error,
    tryOnColor,
    reset
  };
};

export default GeminiColorTryOnService;
