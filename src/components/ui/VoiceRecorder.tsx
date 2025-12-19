"use client";

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Pause } from 'lucide-react';

interface VoiceRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
    onDelete?: () => void;
    existingAudioUrl?: string | null;
}

export function VoiceRecorder({ onRecordingComplete, onDelete, existingAudioUrl }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
    const [isPlaying, setIsPlaying] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (existingAudioUrl) {
            setAudioUrl(existingAudioUrl);
        }
    }, [existingAudioUrl]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                onRecordingComplete(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const deleteRecording = () => {
        setAudioUrl(null);
        if (onDelete) onDelete();
    };

    const togglePlayback = () => {
        if (!audioRef.current && audioUrl) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => setIsPlaying(false);
        }

        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
            {!audioUrl ? (
                <>
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-3 rounded-full transition-all ${isRecording
                                ? 'bg-red-100 text-red-600 animate-pulse'
                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                            }`}
                    >
                        {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <div className="flex-1">
                        <div className="text-sm font-medium">
                            {isRecording ? "Đang ghi âm..." : "Ghi âm nhận xét"}
                        </div>
                        {isRecording && (
                            <div className="text-xs text-red-500 font-mono">
                                {formatTime(recordingTime)}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <button
                        onClick={togglePlayback}
                        className="p-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>

                    <div className="flex-1">
                        <div className="text-sm font-medium text-primary">Voice Note</div>
                        <div className="h-1 bg-primary/20 rounded-full mt-1 w-full max-w-[100px]">
                            <div className={`h-full bg-primary rounded-full ${isPlaying ? 'animate-[width_2s_linear_infinite]' : 'w-full'}`}></div>
                        </div>
                    </div>

                    <button
                        onClick={deleteRecording}
                        className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </>
            )}
        </div>
    );
}
