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
        
        // 1단계: 코드 블록 제거
        cleanText = cleanText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

        // 2단계: { ... } 추출
        const jsonStart = cleanText.indexOf('{');
        const jsonEnd = cleanText.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
        }

        // 3단계: 불완전한 JSON 복구 (괄호/중괄호 자동 닫기)
        let openBrackets = (cleanText.match(/\[/g) || []).length;
        let closeBrackets = (cleanText.match(/\]/g) || []).length;
        let openBraces = (cleanText.match(/\{/g) || []).length;
        let closeBraces = (cleanText.match(/\}/g) || []).length;

        // 부족한 괄호 자동 추가
        for (let i = 0; i < (openBrackets - closeBrackets); i++) {
          cleanText += ']';
        }
        for (let i = 0; i < (openBraces - closeBraces); i++) {
          cleanText += '}';
        }

        console.log('🔧 정리된 JSON:', cleanText.substring(0, 200) + '...');
        
        return JSON.parse(cleanText);
        
      } catch (parseError) {
        console.error('❌ JSON 파싱 최종 실패:', parseError);
        console.error('원본 텍스트:', text.substring(0, 500));
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

      // 1. 포트폴리오 색상 분석
      const colorAnalysis = await this.analyzeColorStyleWithGemini(request.colorStyleUrl);
      apiCallsUsed++;
      
      // 2. 사용자 사진 분석
      const { hairAnalysis, skinToneAnalysis } = await this.analyzeUserPhotoForHairAndSkinTone(request.userPhotoUrl);
      apiCallsUsed++;

      // 3. 폴백 색상 처리
      if (colorAnalysis.dominantColors.includes("#8B4513") && colorAnalysis.technique === "full-color") {
        const recommendedColors = this.getRecommendedColorsBySkinTone(skinToneAnalysis.type);
        colorAnalysis.dominantColors = recommendedColors;
        console.log(`🎨 피부톤 ${skinToneAnalysis.type}에 맞는 추천 색상 적용:`, recommendedColors);
      }
      
      // 4. 염색 이미지 생성
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
      console.error('❌ Color try-on failed:', error);
      
      if (error instanceof Error && (error.message.includes('API') || error.message.includes('파싱'))) {
        console.warn('⚠️ AI 분석 오류 발생, 데모 모드로 전환합니다.');
        return { ...this.createDemoResult(request, Date.now()), apiCallsUsed };
      }
      
      throw new Error('염색 가상체험 처리 중 오류가 발생했습니다: ' + (error as Error).message);
    }
  }

  private getRecommendedColorsBySkinTone(skinToneType: string): string[] {
    const colorRecommendations = {
      'warm': ["#8B4513", "#C49A6C", "#D2691E"],
      'cool': ["#4A4A4A", "#8B7D7B", "#B8A99A"],
      'neutral': ["#8B4513", "#A0522D", "#C49A6C"]
    };

    return colorRecommendations[skinToneType as keyof typeof colorRecommendations] || colorRecommendations['neutral'];
  }

  private async analyzeUserPhotoForHairAndSkinTone(userPhotoUrl: string): Promise<{ hairAnalysis: HairAnalysis, skinToneAnalysis: SkinToneAnalysis }> {
    try {
      console.log('🔍 Gemini Vision으로 사용자 사진 분석 시작...');
      const imageData = await this.fetchImageAsBase64(userPhotoUrl);

      const prompt = `Analyze this person's hair and skin tone. Return ONLY this JSON:

{
  "hairAnalysis": {
    "currentColor": "brown|black|blonde|red|gray",
    "texture": "straight|wavy|curly",
    "length": "short|medium|long",
    "clarity": 0.8
  },
  "skinToneAnalysis": {
    "type": "warm|cool|neutral",
    "undertone": "peach|pink|olive",
    "rgbValue": "rgb(200,170,145)",
    "suitableColors": ["browns", "caramel"],
    "avoidColors": ["neon", "icy blue"]
  }
}

Rules: Use exact field names. No extra text.`;

      await this.waitForAvailableSlot();
      const response = await fetch(`${this.analysisEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: imageData } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2000, // 🔥 1000 → 2000 (MAX_TOKENS 방지)
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
      
      // finishReason 체크 (MAX_TOKENS 감지)
      if (result.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        console.error('🚨 MAX_TOKENS 에러 발생! 응답이 잘렸습니다.');
      }
      
      let jsonString = '';
      if (result.candidates?.[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.text) jsonString += part.text;
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
          suitableColors: ["natural browns", "warm beige"], 
          avoidColors: ["extreme bright colors"] 
        }
      };
    }
  }

  private async analyzeColorStyleWithGemini(imageUrl: string): Promise<ColorAnalysis> {
    const cacheKey = this.hashImage(imageUrl);
    if (this.colorCache.has(cacheKey)) {
      console.log('💾 캐시된 색상 분석 사용');
      return JSON.parse(this.colorCache.get(cacheKey)!);
    }

    try {
      console.log('🔍 Gemini Vision으로 헤어 색상 분석 시작...');
      const imageData = await this.fetchImageAsBase64(imageUrl);

      const prompt = `Analyze hair color in this image. Return ONLY this JSON:

{
  "dominantColors": ["#8B4513", "#C49A6C"],
  "technique": "full-color|highlight|ombre|balayage",
  "gradientPattern": "uniform|root-to-tip|natural-swept",
  "difficulty": "easy|medium|hard",
  "suitableSkinTones": ["warm", "cool", "neutral"],
  "compatibility": 0.8
}

Rules:
- Extract 2-3 hair colors (HEX format)
- Ignore background/skin/clothing
- Use exact field names
- No extra text`;

      await this.waitForAvailableSlot();
      const response = await fetch(`${this.analysisEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: imageData } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 4096, // 🔥 1024 → 4096 (MAX_TOKENS 완전 해결)
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
      
      // 🚨 MAX_TOKENS 체크
      const candidate = result.candidates?.[0];
      if (candidate?.finishReason === 'MAX_TOKENS') {
        console.error('🚨 MAX_TOKENS 에러! 응답이 잘림:', {
          finishReason: candidate.finishReason,
          usageMetadata: result.usageMetadata
        });
      }
      
      let jsonString = '';
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.text) jsonString += part.text;
        }
      }
      
      if (!jsonString) {
        console.error('❌ JSON 응답 없음:', JSON.stringify(result, null, 2));
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
      console.log('⚠️ 포트폴리오 색상 분석 실패, 범용 추천 색상으로 폴백');
      return {
        dominantColors: ["#8B4513", "#C49A6C", "#A0522D"],
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
      console.error('❌ Image conversion failed:', error);
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
      const targetColors = request.colorHex 
        ? [request.colorHex, ...colorAnalysis.dominantColors].slice(0, 3)
        : colorAnalysis.dominantColors;
      
      const colorDescription = request.colorName 
        ? `${request.colorName} (${targetColors.join(', ')})`
        : targetColors.join(', ');

      const transformationPrompt = `
HAIR COLOR TRANSFORMATION - STRICT RULES

CURRENT HAIR: ${hairAnalysis.currentColor}, ${hairAnalysis.texture}, ${hairAnalysis.length}
TARGET COLORS: ${colorDescription}
TECHNIQUE: ${request.colorType}
INTENSITY: ${request.intensity}

🚨 CRITICAL - MUST FOLLOW:
1. ONLY change hair color to: ${targetColors.join(', ')}
2. PRESERVE: exact hair shape, cut, length, texture (${hairAnalysis.texture})
3. PRESERVE: face, skin, body, clothing, background
4. DO NOT: change haircut, add/remove hair, modify texture
5. Result must be photorealistic

Apply ${request.colorType} technique with ${request.intensity} intensity.
Transform ONLY the hair color from ${hairAnalysis.currentColor} to target colors.
Keep everything else identical.
`;

      const imageData = await this.fetchImageAsBase64(originalImageUrl);
      
      const response = await fetch(`${this.imageGenerationEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: transformationPrompt },
              { inline_data: { mime_type: "image/jpeg", data: imageData } }
            ]
          }],
          generationConfig: {
            temperature: 0.15,
            topK: 10,
            topP: 0.7,
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
      
      const candidate = result.candidates?.[0];
      
      if (candidate?.finishReason === 'SAFETY') {
        console.warn('⚠️ 안전성 필터 차단');
        throw new Error('이미지 내용이 안전성 정책에 위배되어 처리할 수 없습니다.');
      }
      
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          const base64Data = part.inline_data?.data || part.inlineData?.data;
          if (base64Data) {
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

      console.warn('⚠️ 이미지 생성 실패, 원본 반환');
      return originalImageUrl;

    } catch (error) {
      console.error('❌ 이미지 변환 중 오류:', error);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return originalImageUrl;
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
      console.error('❌ Color try-on error:', err);
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
