import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorTryOn, ColorTryOnRequest } from '../services/geminiColorService';
import { detectFaceFromFile, getFaceShapeRecommendation, FaceDetectionResult } from '../services/faceDetectionService';

interface ColorTryOnModalProps {
  colorStyleImage: {
    name: string;
    url: string;
    serviceSubCategory?: string;
    description?: string;
  };
  userFaceFile?: File | null;
  userFacePreview?: string | null;
  onClose: () => void;
  onComplete: (result: any) => void;
}

const ColorTryOnModal: React.FC<ColorTryOnModalProps> = ({
  colorStyleImage,
  userFaceFile: initialFaceFile,
  userFacePreview: initialFacePreview,
  onClose,
  onComplete
}) => {
  const { t } = useTranslation();
  
  const [userPhoto, setUserPhoto] = useState<File | null>(initialFaceFile || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialFacePreview || null);
  
  // 얼굴 인식 결과 상태 추가
  const [faceDetection, setFaceDetection] = useState<FaceDetectionResult | null>(null);
  const [isFaceDetecting, setIsFaceDetecting] = useState(false);
  
  const [colorType, setColorType] = useState<'highlight' | 'full-color' | 'ombre' | 'balayage'>('full-color');
  const [intensity, setIntensity] = useState<'light' | 'medium' | 'bold'>('medium');
  const [currentStep, setCurrentStep] = useState<'upload' | 'options' | 'processing' | 'result'>(
    initialFaceFile ? 'options' : 'upload'
  );
  
  const { isProcessing, result, error, tryOnColor } = useColorTryOn();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // 얼굴 인식이 통합된 파일 업로드 핸들러
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하만 가능합니다.');
      return;
    }

    // 미리보기 설정
    setUserPhoto(file);
    if (previewUrl && previewUrl !== initialFacePreview) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    
    // 얼굴 인식 시작
    setIsFaceDetecting(true);
    setFaceDetection(null);
    
    try {
      console.log('🔍 얼굴 인식 시작...');
      const detection = await detectFaceFromFile(file);
      setFaceDetection(detection);
      
      if (detection.detected) {
        console.log('✅ 얼굴 감지 성공:', detection.faceShape);
      } else {
        console.warn('⚠️ 얼굴 감지 실패:', detection.message);
      }
    } catch (err) {
      console.error('❌ 얼굴 인식 오류:', err);
      setFaceDetection({
        detected: false,
        message: '얼굴 인식 중 오류가 발생했습니다.'
      });
    } finally {
      setIsFaceDetecting(false);
      setCurrentStep('options');
    }
  };

  const handleStartTryOn = async () => {
    if (!userPhoto) return;

    setCurrentStep('processing');

    const userPhotoUrl = previewUrl || URL.createObjectURL(userPhoto);

    const request: ColorTryOnRequest = {
      userPhotoUrl,
      colorStyleUrl: colorStyleImage.url,
      colorType,
      intensity,
      colorName: colorStyleImage.name
    };

    try {
      await tryOnColor(request);
      setCurrentStep('result');
    } catch (err) {
      console.error('Color try-on failed:', err);
      setCurrentStep('options');
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  const colorTypeLabels = {
    'full-color': '전체 염색',
    'highlight': '하이라이트',
    'ombre': '옴브레',
    'balayage': '발레아쥬'
  };

  const intensityLabels = {
    'light
