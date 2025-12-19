"use client";

import { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onCancel?: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{
        handwriting: boolean;
        effort: string;
        completeness: number;
    } | null>(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Use back camera on mobile
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageDataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(imageDataUrl);
                stopCamera();
            }
        }
    };

    const retake = () => {
        setCapturedImage(null);
        startCamera();
    };

    const confirm = () => {
        if (capturedImage) {
            // Convert Data URL to File
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "homework_capture.jpg", { type: "image/jpeg" });
                    onCapture(file);
                });
        }
    };

    return (
        <div className="relative bg-black rounded-xl overflow-hidden aspect-[3/4] md:aspect-video shadow-lg">
            {/* Camera View / Preview */}
            {!capturedImage ? (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />

                    {/* Controls */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8">
                        <button
                            onClick={onCancel}
                            className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <button
                            onClick={takePhoto}
                            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all active:scale-95"
                        >
                            <div className="w-12 h-12 rounded-full bg-white"></div>
                        </button>
                        <button
                            className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-white opacity-0 pointer-events-none"
                        >
                            <RefreshCw className="w-6 h-6" />
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />



                    {/* Confirm Controls */}
                    {!isAnalyzing && (
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4">
                            <button
                                onClick={retake}
                                className="px-6 py-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" /> Chụp lại
                            </button>
                            <button
                                onClick={confirm}
                                className="px-6 py-2 rounded-full bg-primary hover:bg-primary/90 text-white font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/25"
                            >
                                <Check className="w-4 h-4" /> Sử dụng ảnh này
                            </button>
                        </div>
                    )}
                </>
            )}

            <canvas ref={canvasRef} className="hidden" />


        </div>
    );
}
