"use client";

import React, { useState, useCallback } from 'react';
import { X, Upload, FileText, Image, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createWorksheetAction } from '@/lib/worksheet-actions';
import { useToast } from '@/components/ui/Toast';

interface WorksheetUploaderProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    preSelectedClassId?: string;
    classes: { id: string; name: string; studentCount?: number }[];
}

const SUBJECTS = ['Toán', 'Ngữ văn', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Lịch sử', 'Địa lý', 'GDCD', 'Tin học'];

export function WorksheetUploader({
    isOpen,
    onClose,
    onSuccess,
    preSelectedClassId,
    classes
}: WorksheetUploaderProps) {
    const { showToast } = useToast();
    const [step, setStep] = useState(1); // 1: Upload, 2: Assign
    const [loading, setLoading] = useState(false);

    // Form data
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [worksheetCode, setWorksheetCode] = useState('');
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [selectedClasses, setSelectedClasses] = useState<string[]>(preSelectedClassId ? [preSelectedClassId] : []);
    const [dueDate, setDueDate] = useState('');
    const [requirePhoto, setRequirePhoto] = useState(false);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(selectedFile.type)) {
            showToast('Chỉ hỗ trợ file PDF hoặc ảnh (JPG, PNG, WebP)', 'error');
            return;
        }

        // Check file size (max 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            showToast('File quá lớn. Tối đa 10MB', 'error');
            return;
        }

        setFile(selectedFile);

        // Create preview for images
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setFilePreview(null);
        }
    }, [showToast]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            // Create a synthetic event to reuse handleFileChange logic
            const syntheticEvent = {
                target: { files: [droppedFile] }
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileChange(syntheticEvent);
        }
    }, [handleFileChange]);

    const toggleClass = (classId: string) => {
        setSelectedClasses(prev =>
            prev.includes(classId)
                ? prev.filter(id => id !== classId)
                : [...prev, classId]
        );
    };

    const handleSubmit = async () => {
        if (!file || !title || selectedClasses.length === 0) {
            showToast('Vui lòng điền đầy đủ thông tin', 'error');
            return;
        }

        setLoading(true);
        try {
            // For now, we'll use a placeholder URL
            // In production, upload to Cloudinary first
            const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';

            // Convert file to base64 for demo (in production, upload to cloud)
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;

                const result = await createWorksheetAction({
                    title,
                    worksheetCode: worksheetCode || undefined,
                    subject: subject || undefined,
                    worksheetFileUrl: base64, // In production: Cloudinary URL
                    worksheetFileType: fileType,
                    classIds: selectedClasses,
                    dueDate: dueDate || undefined,
                    requirePhoto
                });

                if (result.success) {
                    showToast('Đã giao đề cương thành công!', 'success');
                    onSuccess?.();
                    onClose();
                    resetForm();
                } else {
                    showToast(result.message || 'Có lỗi xảy ra', 'error');
                }
                setLoading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error(error);
            showToast('Có lỗi xảy ra', 'error');
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setFile(null);
        setFilePreview(null);
        setWorksheetCode('');
        setTitle('');
        setSubject('');
        setSelectedClasses(preSelectedClassId ? [preSelectedClassId] : []);
        setDueDate('');
        setRequirePhoto(false);
    };

    const totalStudents = selectedClasses.reduce((sum, classId) => {
        const cls = classes.find(c => c.id === classId);
        return sum + (cls?.studentCount || 0);
    }, 0);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {step === 1 ? '📤 Upload Đề cương' : '📋 Giao cho lớp'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {step === 1 ? 'Tải lên file PDF hoặc ảnh' : 'Chọn lớp và thiết lập'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                            </div>
                            <span className="text-sm font-medium">Upload</span>
                        </div>
                        <div className="flex-1 h-px bg-gray-200" />
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                                2
                            </div>
                            <span className="text-sm font-medium">Giao bài</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        {step === 1 ? (
                            <>
                                {/* File Upload */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                                        }`}
                                >
                                    {file ? (
                                        <div className="flex flex-col items-center gap-3">
                                            {filePreview ? (
                                                <img src={filePreview} alt="Preview" className="max-h-32 rounded-lg" />
                                            ) : (
                                                <FileText className="w-12 h-12 text-red-500" />
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">{file.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => { setFile(null); setFilePreview(null); }}
                                                className="text-sm text-red-600 hover:underline"
                                            >
                                                Chọn file khác
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                                                <Upload className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Kéo thả file vào đây</p>
                                                <p className="text-sm text-gray-500">hoặc click để chọn file</p>
                                                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (tối đa 10MB)</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept=".pdf,image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>

                                {/* Worksheet Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mã đề cương (tùy chọn)
                                    </label>
                                    <input
                                        type="text"
                                        value={worksheetCode}
                                        onChange={e => setWorksheetCode(e.target.value)}
                                        placeholder="VD: 3.6, BT-T10-C2"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tiêu đề <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="VD: Bài tập Đạo hàm chương 3"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Môn học
                                    </label>
                                    <select
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="">-- Chọn môn --</option>
                                        {SUBJECTS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Class Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn lớp <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {classes.map(cls => (
                                            <label
                                                key={cls.id}
                                                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedClasses.includes(cls.id)
                                                        ? 'border-indigo-500 bg-indigo-50'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedClasses.includes(cls.id)}
                                                    onChange={() => toggleClass(cls.id)}
                                                    className="w-4 h-4 text-indigo-600 rounded"
                                                />
                                                <span className="flex-1 font-medium">{cls.name}</span>
                                                <span className="text-sm text-gray-500">
                                                    {cls.studentCount || 0} HS
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hạn hoàn thành
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Options */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={requirePhoto}
                                            onChange={e => setRequirePhoto(e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Yêu cầu chụp ảnh bài làm khi đánh dấu hoàn thành
                                        </span>
                                    </label>
                                </div>

                                {/* Summary */}
                                {selectedClasses.length > 0 && (
                                    <div className="p-4 bg-indigo-50 rounded-lg">
                                        <p className="text-sm text-indigo-800">
                                            <strong>{selectedClasses.length}</strong> lớp, <strong>{totalStudents}</strong> học sinh sẽ nhận được đề cương này.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                        {step === 1 ? (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!file || !title}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Tiếp tục →
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    ← Quay lại
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || selectedClasses.length === 0}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang giao...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Giao đề cương
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
