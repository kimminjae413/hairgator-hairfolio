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
  apiCallsUsed: number;
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

// Gemini Color Try-On Service - Gemini Vision 사용
class GeminiColorTryOnService {
  private apiKey: string;
  private analysisEndpoint: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  private imageGenerationEndpoint: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';
  
  private colorCache = new Map<string, string>();
  private callTimestamps: number[] = [];
  private maxCallsPerMinute = 10;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      console.warn('VITE_GEMINI_API_KEY 환경변수가 설정되지 않았습니다. 데모 모드로 실행됩니다.');
    }
  }

  private async waitForAvailableSlot(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    this.callTimestamps = this.callTimestamps.filter(t => t > oneMinuteAgo);

    if (this.callTimestamps.length >= this.maxCallsPerMinute) {
      const oldestCall = this.callTimestamps[0];
      const waitTime = 60000 - (now - oldestCall) + 1000;
      console.log(`⏳ API 호출 제한: ${Math.ceil(waitTime / 1000)}초 대기`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.callTimestamps.push(now);
  }

  private hashImage(base64OrUrl: string): string {
    return base64OrUrl.slice(0, 100);
  }

  private extractJsonFromResponse(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      try {
        let cleanText = text.trim();
        
        // 1단계: ```json ... ``` 블록 제거
        const jsonBlockMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
          cleanText = jsonBlockMatch[1].trim();
        } else {
          // 2단계: ``` ... ``` 블록 제거
          const codeBlockMatch = cleanText.match(/```\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            cleanText = codeBlockMatch[1].trim();
            // "json" 키워드 제거
            cleanText = cleanText.replace(/^json\s*\n?/i, '');
          }
        }

        // 3단계: { ... } 추출
        const jsonStart = cleanText.indexOf('{');
        const jsonEnd = cleanText.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
        }

        // 4단계: 줄바꿈 및 공백 정리
        cleanText = cleanText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

        console.log('🔧 정리된 JSON:', cleanText.substring(0, 200) + '...');
        
        return JSON.parse(cleanText);
        
      } catch (parseError) {
        console.error('JSON 파싱 실패:', parseError);
        console.error('원본 텍스트:', text);
        throw new Error('응답 파싱 실패: JSON 형식이 아닙니다');
      }
    }
  }

  async tryOnHairColor(request: ColorTryOnRequest): Promise<ColorTryOnResult> {
    let apiCallsUsed = 0;
    
    try {
      const startTime = Date.now();

      if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
        return this.createDemoResult(request, startTime);
      }

      // 🆕 Gemini Vision으로 포트폴리오 이미지의 헤어 색상 분석
      const colorAnalysis = await this.analyzeColorStyleWithGemini(request.colorStyleUrl);
      apiCallsUsed++;
      
      // 🆕 Gemini Vision으로 사용자 사진 분석 (헤어 + 피부톤)
      const { hairAnalysis, skinToneAnalysis } = await this.analyzeUserPhotoForHairAndSkinTone(request.userPhotoUrl);
      apiCallsUsed++;
      
      await this.waitForAvailableSlot();
      const resultImageUrl = await this.processColorTransformation(
        request.userPhotoUrl,
        hairAnalysis,
        colorAnalysis,
        request
      );
      apiCallsUsed++;

      const recommendations = this.generateRecommendations(
        skinToneAnalysis,
        colorAnalysis,
        request
      );

      const processingTime = Date.now() - startTime;

      console.log(`✅ 염색 체험 완료! API 호출: ${apiCallsUsed}회`);

      return {
        resultImageUrl,
        confidence: this.calculateConfidence(hairAnalysis, colorAnalysis),
        processingTime,
        apiCallsUsed,
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
        return { ...this.createDemoResult(request, Date.now()), apiCallsUsed };
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
      apiCallsUsed: 0,
      colorAnalysis: {
        dominantColors: demo.dominantColors,
        skinToneMatch: demo.skinToneMatch,
        recommendations: demo.recommendations
      }
    };
  }

  // 🆕 Gemini Vision으로 사용자 사진 분석 (헤어 + 피부톤)
  private async analyzeUserPhotoForHairAndSkinTone(userPhotoUrl: string): Promise<{ hairAnalysis: HairAnalysis, skinToneAnalysis: SkinToneAnalysis }> {
    try {
      console.log('🔍 Gemini Vision으로 사용자 사진 분석 시작...');
      const imageData = await this.fetchImageAsBase64(userPhotoUrl);

      const prompt = `
Analyze the person's hair and skin tone in this image. Provide a JSON object with the following details:

{
  "hairAnalysis": {
    "currentColor": "brown" | "black" | "blonde" | "red" | "gray" | "other",
    "texture": "straight" | "wavy" | "curly" | "coily",
    "length": "short" | "medium" | "long" | "very-long",
    "clarity": 0.0-1.0
  },
  "skinToneAnalysis": {
    "type": "warm" | "cool" | "neutral",
    "undertone": "peach" | "pink" | "olive" | "yellow" | "neutral",
    "rgbValue": "rgb(R, G, B)",
    "suitableColors": ["color1", "color2"],
    "avoidColors": ["color1", "color2"]
  }
}

IMPORTANT:
- Analyze the current natural hair color
- Identify hair texture and length
- Determine skin tone and undertone for color matching
- Provide clarity score (how clear/distinct the hair is)

Strictly output only the JSON object. Do not add any conversational text.
      `;

      await this.waitForAvailableSlot();
      const response = await fetch(`${this.analysisEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageData
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini 사용자 분석 API 오류:', errorText);
        throw new Error(`Gemini 사용자 분석 실패: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 Gemini 사용자 분석 응답:', result);
      
      let jsonString = '';
      if (result.candidates && result.candidates[0]) {
        const candidate = result.candidates[0];
        
        // 텍스트 응답 추출
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              jsonString += part.text;
            }
          }
        }
      }
      
      if (!jsonString) {
        throw new Error('Gemini 사용자 분석 결과가 올바르지 않습니다.');
      }

      console.log('📝 원본 응답:', jsonString);
      const parsedResult = this.extractJsonFromResponse(jsonString);
      
      console.log('✅ 현재 헤어 색상:', parsedResult.hairAnalysis.currentColor);
      console.log('✅ 피부톤:', parsedResult.skinToneAnalysis.type);
      
      return {
        hairAnalysis: parsedResult.hairAnalysis,
        skinToneAnalysis: parsedResult.skinToneAnalysis
      };

    } catch (error) {
      console.error('❌ 사용자 사진 분석 실패, 기본값 사용:', error);
      return {
        hairAnalysis: { 
          currentColor: "brown", 
          texture: "straight", 
          length: "medium", 
          clarity: 0.7 
        },
        skinToneAnalysis: { 
          type: "neutral", 
          undertone: "neutral", 
          rgbValue: "rgb(200, 170, 145)", 
          suitableColors: ["browns", "natural tones"], 
          avoidColors: ["extreme colors"] 
        }
      };
    }
  }

  // 🆕 Gemini Vision을 사용한 헤어 색상 분석
  private async analyzeColorStyleWithGemini(imageUrl: string): Promise<ColorAnalysis> {
    const cacheKey = this.hashImage(imageUrl);
    if (this.colorCache.has(cacheKey)) {
      console.log('💾 캐시된 색상 분석 사용');
      const cachedData = this.colorCache.get(cacheKey)!;
      return JSON.parse(cachedData);
    }

    try {
      console.log('🔍 Gemini Vision으로 헤어 색상 분석 시작...');
      const imageData = await this.fetchImageAsBase64(imageUrl);

      const prompt = `
Analyze the hair color style in this image. Focus ONLY on the hair, not the background or skin.

Provide a JSON object with the following details:
{
  "dominantColors": ["#HEX1", "#HEX2", "#HEX3"],
  "technique": "full-color" | "highlight" | "ombre" | "balayage" | "unknown",
  "gradientPattern": "uniform" | "root-to-tip" | "natural-swept" | "defined-sections" | "subtle-blend" | "unknown",
  "difficulty": "easy" | "medium" | "hard",
  "suitableSkinTones": ["warm", "cool", "neutral", "all"],
  "compatibility": 0.0-1.0
}

IMPORTANT:
- Extract up to 3 dominant HAIR colors only (exclude background, skin, clothing)
- Identify the coloring technique used
- Provide HEX color codes (e.g., #8B4513 for brown)

Strictly output only the JSON object. Do not add any conversational text.
      `;

      await this.waitForAvailableSlot();
      const response = await fetch(`${this.analysisEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageData
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 500,
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini 색상 분석 API 오류:', errorText);
        throw new Error(`Gemini 색상 분석 실패: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 Gemini 색상 분석 응답:', result);
      
      let jsonString = '';
      if (result.candidates && result.candidates[0]) {
        const candidate = result.candidates[0];
        
        // 텍스트 응답 추출
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              jsonString += part.text;
            }
          }
        }
      }
      
      if (!jsonString) {
        throw new Error('Gemini 색상 분석 결과가 올바르지 않습니다.');
      }

      console.log('📝 원본 응답:', jsonString);
      const colorAnalysisResult = this.extractJsonFromResponse(jsonString) as ColorAnalysis;
      
      console.log('✅ 추출된 헤어 색상:', colorAnalysisResult.dominantColors);
      console.log('✅ 염색 기법:', colorAnalysisResult.technique);
      
      this.colorCache.set(cacheKey, JSON.stringify(colorAnalysisResult));
      return colorAnalysisResult;

    } catch (error) {
      console.error('❌ Gemini 이미지 색상 분석 실패:', error);
      // 폴백 기본값
      return {
        dominantColors: ["#8B4513", "#D2691E", "#A0522D"],
        technique: "full-color",
        gradientPattern: "uniform",
        difficulty: "easy",
        suitableSkinTones: ["all"],
        compatibility: 0.7
      };
    }
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

  // 🔥 강화된 색상 전용 프롬프트
  private async processColorTransformation(
    originalImageUrl: string,
    hairAnalysis: HairAnalysis,
    colorAnalysis: ColorAnalysis,
    request: ColorTryOnRequest
  ): Promise<string> {
    try {
      // 🆕 사용자가 직접 지정한 색상이 있으면 우선 사용
      const targetColors = request.colorHex 
        ? [request.colorHex, ...colorAnalysis.dominantColors].slice(0, 3)
        : colorAnalysis.dominantColors;
      
      const colorDescription = request.colorName 
        ? `${request.colorName} (${targetColors.join(', ')})`
        : targetColors.join(', ');

      const transformationPrompt = `
HAIR COLOR TRANSFORMATION - STRICT ADHERENCE REQUIRED

GOAL: ONLY change hair color. Preserve ALL other aspects of the original image.

USER'S CURRENT HAIR:
- Current Color: ${hairAnalysis.currentColor}
- Texture: ${hairAnalysis.texture}
- Length: ${hairAnalysis.length}

TARGET COLORS: ${colorDescription}
Primary Technique: ${request.colorType}
${colorAnalysis.technique !== request.colorType ? `Reference Style Nuance: ${colorAnalysis.technique} (use subtle elements if they complement the primary technique)` : ''}
Intensity: ${request.intensity}

🚨 CRITICAL INSTRUCTIONS - ABSOLUTE PRIORITY:

1. **HAIR SHAPE & STRUCTURE:** Maintain the original hair's EXACT SHAPE, CUT, LENGTH, LAYERS, and SILHOUETTE.
2. **HAIR TEXTURE:** Preserve the original hair's EXACT TEXTURE (${hairAnalysis.texture}), VOLUME, and NATURAL FLOW.
3. **FEATURES:** DO NOT alter the face, facial features, skin tone, body shape, clothing, background, or any non-hair elements.
4. **REALISM:** The result must be photorealistic. Seamlessly blend the new color into the existing hair strands, respecting natural highlights, shadows, and hair growth patterns.

WHAT TO DO:
- Apply the TARGET COLORS (${targetColors.join(', ')}) to the EXISTING hair area ONLY
- Implement the PRIMARY coloring TECHNIQUE: ${request.colorType}
- Match the requested INTENSITY: ${request.intensity}
- Ensure the new color follows the original hair's natural light and shadow contours
- Transform from current ${hairAnalysis.currentColor} hair to target colors naturally

WHAT NOT TO DO:
❌ DO NOT change the haircut or hair length in any way
❌ DO NOT add, remove, or modify hair strands, layers, or volume
❌ DO NOT introduce new styles or textures
❌ DO NOT deform or alter any part of the face or body
❌ DO NOT modify the background
❌ DO NOT copy hairstyle from any reference image
❌ DO NOT change the hair texture from ${hairAnalysis.texture}

The transformed image should be indistinguishable from the original, except for the hair color.
Focus on meticulous color application within the existing hair boundaries.

This is a portrait photo. Maintain all details with photorealistic quality.
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
            temperature: 0.15,  // 🔥 더 낮은 temperature로 일관성 극대화
            topK: 10,           // 🔥 더 낮은 topK로 예측 가능성 증가
            topP: 0.7,          // 🔥 더 낮은 topP로 정확도 증가
            maxOutputTokens: 4096,
            response_modalities: ["TEXT", "IMAGE"]
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 이미지 생성 API 오류:', errorText);
        throw new Error(`이미지 변환 실패: ${response.status}`);
      }

      const result = await response.json();
      console.log('📸 Gemini 이미지 생성 응답:', result);
      
      if (result.candidates && result.candidates[0]) {
        const candidate = result.candidates[0];
        
        if (candidate.finishReason === 'SAFETY') {
          console.warn('⚠️ 안전성 필터에 의해 차단됨');
          throw new Error('이미지 내용이 안전성 정책에 위배되어 처리할 수 없습니다.');
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
              
              console.log('✅ 염색 이미지 생성 성공');
              return blobUrl;
            }
          }
        }
      }

      console.warn('⚠️ 이미지 생성 실패, 원본 반환');
      return originalImageUrl;

    } catch (error) {
      console.error('❌ 이미지 변환 중 오류:', error);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return originalImageUrl;
    }
  }

  private generateRecommendations(
    skinToneAnalysis: SkinToneAnalysis,
    colorAnalysis: ColorAnalysis,
    request: ColorTryOnRequest
  ): string[] {
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
    } else if (recommendedSkinTones.includes('all') || recommendedSkinTones.includes('neutral')) {
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
      
      console.log(`📊 API 호출 횟수: ${colorResult.apiCallsUsed}회`);
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
