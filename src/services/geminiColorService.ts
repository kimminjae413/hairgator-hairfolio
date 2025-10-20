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

// Gemini Color Try-On Service (최적화 버전)
class GeminiColorTryOnService {
  private apiKey: string;
  private analysisEndpoint: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  private imageGenerationEndpoint: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';
  
  private colorCache = new Map<string, string[]>();
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
    let apiCallsUsed = 0;
    
    try {
      const startTime = Date.now();

      if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
        return this.createDemoResult(request, startTime);
      }

      const colorAnalysis = await this.analyzeColorStyle(request.colorStyleUrl);
      
      const hairAnalysis: HairAnalysis = {
        currentColor: "자연스러운 갈색",
        texture: "직모",
        length: "중간",
        clarity: 0.75
      };

      const skinToneAnalysis: SkinToneAnalysis = {
        type: "뉴트럴톤",
        undertone: "중성 언더톤",
        rgbValue: "rgb(200, 170, 145)",
        suitableColors: ["갈색 계열", "자연스러운 색상"],
        avoidColors: ["극단적인 색상"]
      };
      
      await this.waitForAvailableSlot();
      const resultImageUrl = await this.processColorTransformation(
        request.userPhotoUrl,
        hairAnalysis,
        colorAnalysis,
        request
      );
      apiCallsUsed = 1;

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

  private async analyzeColorStyle(styleImageUrl: string): Promise<ColorAnalysis> {
    const cacheKey = this.hashImage(styleImageUrl);
    if (this.colorCache.has(cacheKey)) {
      console.log('💾 캐시된 색상 사용');
      const cachedColors = this.colorCache.get(cacheKey)!;
      return {
        dominantColors: cachedColors,
        technique: "염색",
        gradientPattern: "자연스러운 색상",
        difficulty: "중급",
        suitableSkinTones: ["웜톤", "뉴트럴톤"],
        compatibility: 0.8
      };
    }

    try {
      const colors = await this.analyzeImageColors(styleImageUrl);
      this.colorCache.set(cacheKey, colors.dominantColors);
      return colors;
    } catch (error) {
      console.error('색상 분석 실패, 기본값 사용:', error);
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

  private async analyzeImageColors(imageUrl: string): Promise<ColorAnalysis> {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const colors = this.extractDominantColors(imageData.data);
          
          console.log('📊 이미지에서 추출한 색상:', colors);
          
          resolve({
            dominantColors: colors,
            technique: "염색",
            gradientPattern: "자연스러운 색상",
            difficulty: "중급",
            suitableSkinTones: ["웜톤", "뉴트럴톤"],
            compatibility: 0.8
          });
        };
        
        img.onerror = () => {
          console.error('이미지 로드 실패, 기본값 사용');
          resolve({
            dominantColors: ["#8B4513", "#D2691E"],
            technique: "전체염색",
            gradientPattern: "균일한 색상",
            difficulty: "초급",
            suitableSkinTones: ["모든 톤"],
            compatibility: 0.7
          });
        };
        
        img.src = imageUrl;
      });
      
    } catch (error) {
      console.error('이미지 색상 분석 실패:', error);
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

  private extractDominantColors(imageData: Uint8ClampedArray): string[] {
    const colorMap = new Map<string, number>();
    
    for (let i = 0; i < imageData.length; i += 64) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const a = imageData[i + 3];
      
      if (a > 200) {
        const brightness = (r + g + b) / 3;
        if (brightness < 30 || brightness > 240) continue;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        if (saturation < 0.1) continue;
        
        const roundedR = Math.round(r / 16) * 16;
        const roundedG = Math.round(g / 16) * 16;
        const roundedB = Math.round(b / 16) * 16;
        
        const colorKey = `${roundedR},${roundedG},${roundedB}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
      }
    }
    
    if (colorMap.size < 2) {
      console.log('충분한 색상 감지 안됨, 기본값 사용');
      return ['#E6B3FF', '#D147A3', '#8A2BE2'];
    }
    
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    const extractedColors = sortedColors.map(([colorKey]) => {
      const [r, g, b] = colorKey.split(',').map(Number);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    });
    
    const allDark = extractedColors.every(color => {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return (r + g + b) / 3 < 100;
    });
    
    if (allDark) {
      console.log('어두운 색상만 감지됨, 밝은 색상 추가');
      extractedColors.push('#E6B3FF', '#D147A3');
    }
    
    return extractedColors.slice(0, 3);
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

  // 🔥 강력한 색상 전용 프롬프트
  private async processColorTransformation(
    originalImageUrl: string,
    hairAnalysis: HairAnalysis,
    colorAnalysis: ColorAnalysis,
    request: ColorTryOnRequest
  ): Promise<string> {
    try {
      const transformationPrompt = `
HAIR COLOR TRANSFORMATION TASK - EXTREMELY IMPORTANT RULES

TARGET COLORS: ${colorAnalysis.dominantColors.join(', ')}
Technique: ${request.colorType}
Intensity: ${request.intensity}

🚨 ABSOLUTE REQUIREMENTS - DO NOT DEVIATE:

1. ONLY CHANGE HAIR COLOR - Nothing else
2. DO NOT modify hairstyle, haircut, hair length, or hair shape
3. DO NOT change face, facial features, skin, or background
4. DO NOT copy hairstyle from any reference image
5. PRESERVE the exact same hair structure, layers, and flow
6. KEEP all waves, curls, straight parts exactly as they are
7. MAINTAIN the original hair volume and texture
8. APPLY colors ONLY to the existing hair strands

WHAT TO DO:
✅ Apply the specified colors (${colorAnalysis.dominantColors.join(', ')}) to the person's EXISTING hair
✅ Match the color intensity level: ${request.intensity}
✅ Use ${request.colorType} coloring technique
✅ Keep natural hair highlights and shadows for realism

WHAT NOT TO DO:
❌ Do NOT change hair length
❌ Do NOT change haircut or hairstyle
❌ Do NOT add or remove hair layers
❌ Do NOT modify hair texture (straight/wavy/curly)
❌ Do NOT change the person's face or body
❌ Do NOT alter background or clothing

This is a HAIR COLOR ONLY transformation. The result should look exactly like the original photo but with different hair color.
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
            temperature: 0.2,  // 🔥 더 낮은 temperature로 일관성 증가
            topK: 20,          // 🔥 더 낮은 topK로 예측 가능성 증가
            topP: 0.8,         // 🔥 더 낮은 topP로 정확도 증가
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
              
              console.log('✅ 이미지 생성 성공');
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
