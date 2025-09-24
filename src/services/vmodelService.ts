import { VModelResponse, VModelRequest } from '../types';

// VModel API 설정 - 올바른 엔드포인트
const API_BASE_URL = 'https://api.vmodel.ai/api/tasks/v1';
const API_TOKEN = import.meta.env.VITE_VMODEL_API_TOKEN;
const HAIRSTYLE_MODEL_VERSION = '5c0440717a995b0bbd93377bd65dbb4fe360f67967c506aa6bd8f6b660733a7e';

// API 키 확인
if (!API_KEY) {
  console.warn('VModel API key가 설정되지 않았습니다. .env.local 파일에 VITE_VMODEL_API_KEY를 추가하세요.');
}

// VModel Task 응답 타입
interface VModelTask {
  task_id: string;
  user_id: number;
  version: string;
  error: string | null;
  total_time: number;
  predict_time: number;
  logs: string;
  output: string[] | null;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  create_at: number;
  completed_at: number | null;
}

interface VModelCreateResponse {
  code: number;
  result: {
    task_id: string;
    task_cost: number;
  };
  message: {
    en: string;
  };
}

interface VModelGetResponse {
  code: number;
  result: VModelTask;
  message: any;
}

// 이미지를 Cloudinary URL로 업로드하는 함수 (VModel은 URL만 허용)
const uploadImageToCloudinary = async (file: File): Promise<string> => {
  try {
    // Cloudinary 업로드 로직 재사용
    const { uploadToCloudinary } = await import('./cloudinaryService');
    return await uploadToCloudinary(file, {
      folder: 'hairfolio/temp',
      tags: ['hairfolio', 'vmodel-temp']
    });
  } catch (error) {
    console.error('Cloudinary 업로드 실패:', error);
    throw new Error('이미지 업로드에 실패했습니다. 네트워크 연결을 확인해주세요.');
  }
};

// Task 상태를 폴링하여 완료까지 기다리는 함수
const pollTaskStatus = async (taskId: string): Promise<VModelTask> => {
  const maxAttempts = 60; // 최대 5분 대기 (5초 간격)
  const pollInterval = 5000; // 5초

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/get/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Task 상태 확인 실패: ${response.status}`);
      }

      const data: VModelGetResponse = await response.json();
      const task = data.result;

      // Task 완료 상태 확인
      if (task.status === 'succeeded') {
        return task;
      } else if (task.status === 'failed') {
        throw new Error(task.error || 'VModel 처리 중 오류가 발생했습니다.');
      } else if (task.status === 'canceled') {
        throw new Error('Task가 취소되었습니다.');
      }

      // 아직 처리 중이면 대기
      if (task.status === 'starting' || task.status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }

    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      // 임시 오류인 경우 재시도
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error('처리 시간이 초과되었습니다. 다시 시도해주세요.');
};

// 헤어스타일 분석 함수 (VModel API에는 없으므로 간단한 분석)
export const analyzeHairstyle = async (hairstyleFile: File): Promise<string> => {
  try {
    // VModel API에는 별도 분석 기능이 없으므로 기본 설명 생성
    return new Promise((resolve) => {
      setTimeout(() => {
        const descriptions = [
          'modern layered cut with natural texture',
          'sleek straight hair with subtle highlights',
          'wavy shoulder-length style with volume',
          'short pixie cut with edgy finish',
          'long flowing hair with soft curls',
          'bob cut with blunt edges',
          'textured shag with face-framing layers'
        ];
        const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
        resolve(randomDescription);
      }, 1500);
    });
  } catch (error) {
    throw new Error('헤어스타일 분석 중 오류가 발생했습니다.');
  }
};

// 헤어스타일 적용 함수 (메인 기능) - VModel API 사용
export const applyHairstyle = async (
  faceFile: File,
  hairstyleFile: File | string,
  hairstyleDescription: string
): Promise<string> => {
  try {
    if (!API_KEY || API_KEY === 'your_vmodel_api_key_here') {
      console.warn('VModel API 키가 설정되지 않음. 데모 모드로 실행합니다.');
      
      // 데모 모드: 실제 변환된 것처럼 보이는 샘플 이미지 반환
      return new Promise((resolve) => {
        setTimeout(() => {
          const demoImages = [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1494790108755-2616c5e93769?w=400&h=400&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
          ];
          const randomDemo = demoImages[Math.floor(Math.random() * demoImages.length)];
          resolve(randomDemo);
        }, 3000);
      });
    }

    console.log('VModel API 요청 시작...');

    // 1단계: 이미지를 Cloudinary에 업로드하여 URL 획득
    const targetImageUrl = await uploadImageToCloudinary(faceFile);
    console.log('얼굴 이미지 업로드 완료:', targetImageUrl);

    let sourceImageUrl: string;
    if (typeof hairstyleFile === 'string') {
      sourceImageUrl = hairstyleFile; // 이미 URL인 경우
    } else {
      sourceImageUrl = await uploadImageToCloudinary(hairstyleFile);
      console.log('헤어스타일 이미지 업로드 완료:', sourceImageUrl);
    }

    // 2단계: VModel Task 생성
    const createResponse = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: HAIRSTYLE_MODEL_VERSION,
        input: {
          source: sourceImageUrl,    // 헤어스타일 참조 이미지
          target: targetImageUrl,    // 변경할 사람의 사진
          disable_safety_checker: false
        }
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('VModel Task 생성 실패:', errorText);
      
      if (createResponse.status === 401) {
        throw new Error('API 키가 유효하지 않습니다. VModel 계정을 확인해주세요.');
      } else if (createResponse.status === 402) {
        throw new Error('크레딧이 부족합니다. VModel 계정에서 크레딧을 충전해주세요.');
      } else if (createResponse.status === 403) {
        throw new Error('API 접근이 거부되었습니다. API 키 권한을 확인해주세요.');
      }
      
      throw new Error(`VModel API 오류: ${createResponse.status}`);
    }

    const createData: VModelCreateResponse = await createResponse.json();
    
    if (createData.code !== 200) {
      throw new Error(createData.message?.en || 'Task 생성에 실패했습니다.');
    }

    const taskId = createData.result.task_id;
    console.log('VModel Task 생성됨:', taskId, '비용:', createData.result.task_cost);

    // 3단계: Task 완료까지 폴링
    console.log('VModel 처리 대기 중...');
    const completedTask = await pollTaskStatus(taskId);

    // 4단계: 결과 이미지 URL 반환
    if (!completedTask.output || completedTask.output.length === 0) {
      throw new Error('VModel에서 결과 이미지를 생성하지 못했습니다.');
    }

    const resultImageUrl = completedTask.output[0];
    console.log('VModel 처리 완료:', resultImageUrl);
    
    return resultImageUrl;

  } catch (error) {
    console.error('VModel API Error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('헤어스타일 적용 중 알 수 없는 오류가 발생했습니다.');
  }
};

// API 상태 확인 함수
export const checkAPIStatus = async (): Promise<boolean> => {
  try {
    if (!API_KEY || API_KEY === 'your_vmodel_api_key_here') {
      return false;
    }
    
    // VModel API에는 별도 상태 확인 엔드포인트가 없으므로
    // 간단한 요청을 보내서 401이 아닌지 확인
    const response = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // 빈 요청으로 인증만 확인
    });
    
    // 401이 아니면 API 키는 유효함
    return response.status !== 401;
  } catch {
    return false;
  }
};

// 사용 가능한 크레딧 확인 (VModel API에는 직접적인 방법이 없음)
export const checkCredits = async (): Promise<number | null> => {
  try {
    console.log('VModel API에는 크레딧 확인 엔드포인트가 없습니다. 웹사이트에서 확인하세요.');
    return null;
  } catch {
    return null;
  }
};
