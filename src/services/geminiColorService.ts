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
  private apiEndpoint: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('VITE_GEMINI_API_KEY 환경변수를 설정해주세요.');
    }
  }

  /**
   * 메인 염색 가상체험 함수
   */
  async tryOnHairColor(request: ColorTryOnRequest): Promise<ColorTryOnResult> {
    try {
      const startTime = Date.now();

      // 1. 사용자 사진에서 머리카락 영역 분석
      const hairAnalysis = await this.analyzeHairRegion(request.userPhotoUrl);
      
      // 2. 염색 스타일 분석
      const colorAnalysis = await this.analyzeColorStyle(request.colorStyleUrl);
      
      // 3. 피부톤 분석
      const skinToneAnalysis = await this.analyzeSkinTone(request.userPhotoUrl);
      
      // 4. 이미지 변환 시뮬레이션 (실제로는 전문 이미지 처리 API 사용)
      const resultImageUrl = await this.processColorTransformation(
        request.userPhotoUrl,
        hairAnalysis,
        colorAnalysis,
        request
      );

      // 5. AI 추천사항 생성
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
      throw new Error('염색 가상체험 처리 중 오류가 발생했습니다: ' + (error as Error).message);
    }
  }

  /**
   * Gemini API를 사용하여 머리카락 영역 분석
   */
  private async analyzeHairRegion(imageUrl: string): Promise<HairAnalysis> {
    const prompt = `
    이 이미지에서 머리카락을 분석해주세요. 다음 JSON 형태로 응답해주세요:
    {
      "currentColor": "현재 머리카락 색상 (예: 검은색, 갈색, 금발 등)",
      "texture": "머리카락 질감 (예: 직모, 곱슬, 웨이브)",
      "length": "머리카락 길이 (예: 짧음, 중간, 긺)",
      "clarity": 0.8
    }
    
    머리카락이 선명하고 분석하기 좋은 상태면 clarity를 높게, 흐리거나 가려져 있으면 낮게 설정해주세요.
    `;

    try {
      const imageData = await this.fetchImageAsBase64(imageUrl);
      const response = await this.callGeminiAPI(prompt, imageData);
      return JSON.parse(response);
    } catch (error) {
      console.error('Hair analysis failed:', error);
      // 기본값 반환
      return {
        currentColor: "갈색",
        texture: "직모",
        length: "중간",
        clarity: 0.7
      };
    }
  }

  /**
   * 염색 스타일 이미지 분석
   */
  private async analyzeColorStyle(styleImageUrl: string): Promise<ColorAnalysis> {
    const prompt = `
    이 염색 스타일 이미지를 분석해주세요. 다음 JSON 형태로 응답해주세요:
    {
      "dominantColors": ["#8B4513", "#D2691E"],
      "technique": "발레아쥬",
      "gradientPattern": "자연스러운 그라데이션",
      "difficulty": "중급",
      "suitableSkinTones": ["웜톤", "뉴트럴톤"],
      "compatibility": 0.8
    }
    
    주요 색상은 hex 코드로, 기법과 패턴은 한국어로 설명해주세요.
    `;

    try {
      const imageData = await this.fetchImageAsBase64(styleImageUrl);
      const response = await this.callGeminiAPI(prompt, imageData);
      return JSON.parse(response);
    } catch (error) {
      console.error('Color style analysis failed:', error);
      // 기본값 반환
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

  /**
   * 피부톤 분석
   */
  private async analyzeSkinTone(imageUrl: string): Promise<SkinToneAnalysis> {
    const prompt = `
    이 사진에서 피부톤을 분석해주세요. 다음 JSON 형태로 응답해주세요:
    {
      "type": "웜톤",
      "undertone": "황색 언더톤",
      "rgbValue": "rgb(205, 170, 140)",
      "suitableColors": ["갈색 계열", "골드 계열", "따뜻한 적갈색"],
      "avoidColors": ["차가운 애쉬 계열", "실버 계열"]
    }
    
    피부톤은 웜톤/쿨톤/뉴트럴톤으로 분류하고, 어울리는 헤어컬러를 추천해주세요.
    `;

    try {
      const imageData = await this.fetchImageAsBase64(imageUrl);
      const response = await this.callGeminiAPI(prompt, imageData);
      return JSON.parse(response);
    } catch (error) {
      console.error('Skin tone analysis failed:', error);
      // 기본값 반환
      return {
        type: "뉴트럴톤",
        undertone: "중성 언더톤",
        rgbValue: "rgb(200, 170, 145)",
        suitableColors: ["갈색 계열", "자연스러운 색상"],
        avoidColors: ["극단적인 색상"]
      };
    }
  }

  /**
   * Gemini API 호출 함수
   */
  private async callGeminiAPI(prompt: string, imageData?: string): Promise<string> {
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
        maxOutputTokens: 2048,
      }
    };

    // 이미지가 있는 경우 추가
    if (imageData) {
      requestBody.contents[0].parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: imageData
        }
      });
    }

    const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Gemini API 응답 형식이 올바르지 않습니다.');
    }

    return data.candidates[0].content.parts[0].text;
  }

  /**
   * 이미지를 Base64로 변환
   */
  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`이미지 로드 실패: ${response.status}`);
      }
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Image to base64 conversion failed:', error);
      throw new Error('이미지 변환에 실패했습니다.');
    }
  }

  /**
   * 이미지 변환 처리 (시뮬레이션)
   */
  private async processColorTransformation(
    originalImageUrl: string,
    hairAnalysis: HairAnalysis,
    colorAnalysis: ColorAnalysis,
    request: ColorTryOnRequest
  ): Promise<string> {
    // 실제 구현에서는 다음과 같은 서비스들을 사용할 수 있습니다:
    // - Adobe Photoshop API
    // - Canva API
    // - AI 이미지 편집 서비스 (Stability AI, RunwayML 등)
    // - 커스텀 이미지 처리 서버

    // 현재는 시뮬레이션을 위해 지연 후 처리된 URL 반환
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 실제로는 처리된 새로운 이미지 URL을 반환
    return originalImageUrl + `?processed=true&color=${request.colorType}&intensity=${request.intensity}`;
  }

  /**
   * AI 기반 추천사항 생성
   */
  private async generateRecommendations(
    skinToneAnalysis: SkinToneAnalysis,
    colorAnalysis: ColorAnalysis,
    request: ColorTryOnRequest
  ): Promise<string[]> {
    const prompt = `
    다음 정보를 바탕으로 염색에 대한 실용적인 조언을 3-5개 해주세요:
    
    피부톤: ${skinToneAnalysis.type} (${skinToneAnalysis.undertone})
    염색 기법: ${colorAnalysis.technique}
    색상: ${colorAnalysis.dominantColors.join(', ')}
    염색 방식: ${request.colorType}
    
    다음 형태로 답변해주세요:
    ["첫 번째 조언", "두 번째 조언", "세 번째 조언"]
    
    조언은 색상 조화, 관리 방법, 주의사항 등을 포함해주세요.
    `;

    try {
      const response = await this.callGeminiAPI(prompt);
      const recommendations = JSON.parse(response);
      return Array.isArray(recommendations) ? recommendations.slice(0, 5) : [];
    } catch (error) {
      console.error('Recommendations generation failed:', error);
      // 기본 추천사항 반환
      return [
        "염색 후 컬러 전용 샴푸를 사용하여 색상을 오래 유지하세요",
        "염색 후 2-3일은 머리를 감지 않는 것이 좋습니다",
        "자외선 차단을 위해 모자나 헤어 보호제를 사용하세요",
        "정기적인 트리트먼트로 모발 건강을 관리하세요"
      ];
    }
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(hairAnalysis: HairAnalysis, colorAnalysis: ColorAnalysis): number {
    let confidence = 0.7; // 기본 신뢰도
    
    // 머리카락 선명도가 높을수록 신뢰도 증가
    if (hairAnalysis.clarity > 0.8) confidence += 0.15;
    else if (hairAnalysis.clarity > 0.6) confidence += 0.1;
    
    // 색상 호환성이 높을수록 신뢰도 증가
    if (colorAnalysis.compatibility > 0.8) confidence += 0.1;
    else if (colorAnalysis.compatibility > 0.6) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * 피부톤-색상 매칭 평가
   */
  private evaluateSkinToneMatch(
    skinToneAnalysis: SkinToneAnalysis, 
    colorAnalysis: ColorAnalysis
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    // 피부톤과 추천 색상의 호환성 평가
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

// React Hook for Color Try-On
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
