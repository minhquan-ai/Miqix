"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Video, Square, Trash2, Check, Circle } from "lucide-react";
import { useToast } from "./Toast";

interface MultimediaRecorderProps {
    type: 'audio' | 'video';
    onRecordingComplete: (file: File) => void;
    onCancel?: () => void;
}

export function MultimediaRecorder({ type, onRecordingComplete, onCancel }: MultimediaRecorderProps) {
    const { showToast } = useToast();
    const [status, setStatus] = useState<'ready' | 'recording' | 'preview'>('ready');
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-start camera/mic when component mounts
    useEffect(() => {
        initMedia();
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            stopStream();
        };
    }, []);

    const initMedia = async () => {
        try {
            const constraints = type === 'video'
                ? { video: { facingMode: 'user' }, audio: true }
                : { audio: true };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (type === 'video' && videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error("Error accessing media devices:", error);
            showToast("Không thể truy cập thiết bị. Kiểm tra quyền truy cập camera/micro.", "error");
            onCancel?.();
        }
    };

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const startRecording = () => {
        if (!streamRef.current) return;

        const mediaRecorder = new window.MediaRecorder(streamRef.current);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: type === 'video' ? 'video/webm' : 'audio/webm' });
            setMediaBlob(blob);
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setStatus('preview');
        };

        mediaRecorder.start();
        setStatus('recording');
        setRecordingTime(0);

        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.stop();
            stopStream();
        }
    };

    const handleConfirm = () => {
        if (!mediaBlob) return;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${type === 'video' ? 'video' : 'audio'}-${timestamp}.webm`;
        const file = new File([mediaBlob], fileName, { type: mediaBlob.type });
        onRecordingComplete(file);
    };

    const handleDiscard = () => {
        stopStream();
        onCancel?.();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const themeColor = type === 'video' ? 'blue' : 'amber';

    return (
        <div className={`
            w-full rounded-xl overflow-hidden border-2 transition-all
            ${status === 'recording'
                ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
                : `border-${themeColor}-200 bg-${themeColor}-50/50 dark:bg-${themeColor}-950/20`
            }
        `}>
            {/* Content Area */}
            <div className="p-4">
                {type === 'video' ? (
                    /* Video Preview/Recording Area */
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                        {(status === 'ready' || status === 'recording') && (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                        )}
                        {status === 'preview' && previewUrl && (
                            <video
                                src={previewUrl}
                                controls
                                className="w-full h-full object-contain"
                            />
                        )}

                        {/* Recording indicator overlay */}
                        {status === 'recording' && (
                            <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-red-600 text-white rounded-full text-xs font-bold">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                REC {formatTime(recordingTime)}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Audio Visualizer/Preview Area */
                    <div className={`
                        rounded-lg p-6 mb-4 flex flex-col items-center justify-center
                        ${status === 'recording' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100/50 dark:bg-amber-900/20'}
                    `}>
                        {status === 'recording' ? (
                            <>
                                {/* Animated waveform */}
                                <div className="flex items-end justify-center gap-1 h-16 mb-3">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 bg-red-500 rounded-full transition-all"
                                            style={{
                                                height: `${20 + Math.sin(Date.now() / 200 + i) * 30 + Math.random() * 20}%`,
                                                animation: `pulse 0.3s ease-in-out ${i * 0.05}s infinite alternate`,
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="text-2xl font-mono font-bold text-red-600 tabular-nums">
                                    {formatTime(recordingTime)}
                                </div>
                            </>
                        ) : status === 'preview' && previewUrl ? (
                            <audio src={previewUrl} controls className="w-full" />
                        ) : (
                            <>
                                <Mic className="w-10 h-10 text-amber-500 mb-2" />
                                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                                    Sẵn sàng ghi âm
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3">
                    {status === 'ready' && (
                        <>
                            <button
                                type="button"
                                onClick={handleDiscard}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={startRecording}
                                className={`
                                    flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95
                                    ${type === 'video' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}
                                `}
                            >
                                <Circle className="w-4 h-4 fill-current" />
                                Bắt đầu {type === 'video' ? 'quay' : 'ghi'}
                            </button>
                        </>
                    )}

                    {status === 'recording' && (
                        <button
                            type="button"
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                        >
                            <Square className="w-4 h-4 fill-current" />
                            Dừng
                        </button>
                    )}

                    {status === 'preview' && (
                        <>
                            <button
                                type="button"
                                onClick={handleDiscard}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Ghi lại
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                            >
                                <Check className="w-4 h-4" />
                                Sử dụng
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
