import { VModelResponse, VModelRequest } from '../types';

// VModel API 설정
const API_BASE_URL = import.meta.env.VITE_VMODEL_API_URL || 'https://api.vmodel.ai';
const API_KEY = import.meta.env.VITE_VMODEL_API_KEY;

// API 키 확인
if (!API_KEY) {
  console.warn('VModel API key가 설정되지 않았습니다. .env.local 파일에 VITE_VMODEL_API_KEY를 추가하세요.');
}

// 파일을 base64로 변환하는 헬퍼 함수
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // "data:image/jpeg;base64," 부분을 제거하고 base64 데이터만 반환
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

// 이미지 URL을 base64로 변환하는 함수
const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
    });
  } catch (error) {
    throw new Error('이미지 URL을 변환하는데 실패했습니다.');
  }
};

// 헤어스타일 분석 함수
export const analyzeHairstyle = async (hairstyleFile: File): Promise<string> => {
  try {
    // 실제 VModel API가 헤어스타일 분석을 제공하지 않는 경우,
    // 간단한 이미지 분석 또는 기본 설명을 반환
    const base64 = await fileToBase64(hairstyleFile);
    
    // 데모용 분석 결과 (실제로는 VModel API 호출)
    return new Promise((resolve) => {
      setTimeout(() => {
        const descriptions = [
          'medium-length, wavy, dark brown, center part, textured layers, curtain bangs',
          'long, straight, blonde, side part, sleek finish, face-framing layers',
          'short, curly, natural, voluminous, defined curls, full coverage',
          'pixie cut, straight, platinum blonde, side-swept, edgy, modern',
          'bob cut, wavy, auburn, blunt cut, chin-length, sophisticated'
        ];
        const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
        resolve(randomDescription);
      }, 1500);
    });
  } catch (error) {
    throw new Error('헤어스타일 분석 중 오류가 발생했습니다.');
  }
};

// 헤어스타일 적용 함수 (메인 기능)
export const applyHairstyle = async (
  faceFile: File,
  hairstyleFile: File | string,
  hairstyleDescription: string
): Promise<string> => {
  try {
    if (!API_KEY) {
      throw new Error('API 키가 설정되지 않았습니다. 환경변수를 확인하세요.');
    }

    // 얼굴 이미지를 base64로 변환
    const faceBase64 = await fileToBase64(faceFile);
    
    // 헤어스타일 이미지를 base64로 변환
    let styleBase64: string;
    if (typeof hairstyleFile === 'string') {
      // URL인 경우
      styleBase64 = await urlToBase64(hairstyleFile);
    } else {
      // File 객체인 경우
      styleBase64 = await fileToBase64(hairstyleFile);
    }

    // VModel API 요청 데이터 구성
    const requestData: VModelRequest = {
      faceImage: faceBase64,
      styleImage: styleBase64,
      styleDescription: hairstyleDescription,
      options: {
        quality: 'high',
        preserveFaceFeatures: true,
        blendStrength: 0.8
      }
    };

    // VModel API 호출
    const response = await fetch(`${API_BASE_URL}/v1/hair-transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Version': '1.0'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API 요청 실패: ${response.status}`);
    }

    const result: VModelResponse = await response.json();
    
    if (!result.success || !result.imageUrl) {
      throw new Error(result.error || '이미지 생성에 실패했습니다.');
    }

    // 성공적으로 생성된 이미지 URL 반환
    return result.imageUrl;

  } catch (error) {
    console.error('VModel API Error:', error);
    
    // 개발 모드에서는 데모 이미지 반환
    if (import.meta.env.VITE_DEV_MODE === 'true') {
      console.warn('개발 모드: 데모 이미지를 반환합니다.');
      
      // 실제 변환된 것처럼 보이는 데모 이미지 생성
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // 데모용 변환된 이미지 (실제로는 샘플 이미지)
          const demoImages = [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1494790108755-2616c5e93769?w=400&h=400&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
          ];
          const randomDemo = demoImages[Math.floor(Math.random() * demoImages.length)];
          resolve(randomDemo);
        }, 3000);
      });
    }
    
    // 프로덕션에서는 에러 발생
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('헤어스타일 적용 중 알 수 없는 오류가 발생했습니다.');
  }
};

// API 상태 확인 함수
export const checkAPIStatus = async (): Promise<boolean> => {
  try {
    if (!API_KEY) return false;
    
    const response = await fetch(`${API_BASE_URL}/v1/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    return response.ok;
  } catch {
    return false;
  }
};

// 사용 가능한 크레딧 확인 (선택사항)
export const checkCredits = async (): Promise<number | null> => {
  try {
    if (!API_KEY) return null;
    
    const response = await fetch(`${API_BASE_URL}/v1/account/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.credits || 0;
    }
    
    return null;
  } catch {
    return null;
  }
};
