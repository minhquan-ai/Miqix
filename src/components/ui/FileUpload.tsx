"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, X, File, FileImage, FileText, AlertCircle } from 'lucide-react';
import { formatFileSize, validateFileSize, validateFileType, isImageFile, isPDFFile } from '@/lib/fileUtils';

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    maxFiles?: number;
    acceptedTypes?: string[];  // e.g., ['image/*', 'application/pdf']
    maxSizeMB?: number;
    existingFiles?: File[];
}

export function FileUpload({
    onFilesSelected,
    maxFiles = 5,
    acceptedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    maxSizeMB = 10,
    existingFiles = []
}: FileUploadProps) {
    const [files, setFiles] = useState<File[]>(existingFiles);
    const [errors, setErrors] = useState<string[]>([]);

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        setErrors([]);
        const newErrors: string[] = [];

        // Check max files limit
        if (files.length + acceptedFiles.length > maxFiles) {
            newErrors.push(`Chỉ được tải lên tối đa ${maxFiles} tệp`);
            setErrors(newErrors);
            return;
        }

        // Validate each file
        const validFiles: File[] = [];
        acceptedFiles.forEach(file => {
            // Check file size
            if (!validateFileSize(file, maxSizeMB)) {
                newErrors.push(`${file.name}: Kích thước vượt quá ${maxSizeMB}MB`);
                return;
            }

            // Check file type
            if (!validateFileType(file, acceptedTypes)) {
                newErrors.push(`${file.name}: Loại tệp không được hỗ trợ`);
                return;
            }

            validFiles.push(file);
        });

        // Handle rejected files
        rejectedFiles.forEach(({ file, errors }) => {
            errors.forEach((err) => {
                if (err.code === 'file-too-large') {
                    newErrors.push(`${file.name}: Tệp quá lớn`);
                } else if (err.code === 'file-invalid-type') {
                    newErrors.push(`${file.name}: Loại tệp không hợp lệ`);
                }
            });
        });

        if (newErrors.length > 0) {
            setErrors(newErrors);
        }

        if (validFiles.length > 0) {
            const updatedFiles = [...files, ...validFiles];
            setFiles(updatedFiles);
            onFilesSelected(updatedFiles);
        }
    }, [files, maxFiles, maxSizeMB, acceptedTypes, onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles,
        maxSize: maxSizeMB * 1024 * 1024,
        accept: acceptedTypes.reduce((acc, type) => {
            acc[type] = [];
            return acc;
        }, {} as Record<string, string[]>)
    });

    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        onFilesSelected(updatedFiles);
    };

    const getFileIcon = (file: File) => {
        if (isImageFile(file)) {
            return <FileImage className="w-5 h-5 text-blue-500" />;
        } else if (isPDFFile(file)) {
            return <FileText className="w-5 h-5 text-red-500" />;
        } else {
            return <File className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-4">
            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                    <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Upload className={`w-8 h-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                        <p className="font-medium text-lg mb-1">
                            {isDragActive ? 'Thả tệp vào đây...' : 'Kéo & thả tệp vào đây'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            hoặc <span className="text-primary font-medium">nhấp để chọn</span>
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Tối đa {maxFiles} tệp • Dung lượng tối đa {maxSizeMB}MB mỗi tệp
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Hỗ trợ: Ảnh, PDF, Word, Text
                    </p>
                </div>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-red-900 mb-1">Lỗi tải tệp:</p>
                            <ul className="text-sm text-red-700 space-y-1">
                                {errors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                        Đã chọn {files.length}/{maxFiles} tệp
                    </p>
                    <div className="space-y-2">
                        {files.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-shadow"
                            >
                                {getFileIcon(file)}

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                </div>

                                {/* Preview for images */}
                                {isImageFile(file) && (
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="w-12 h-12 object-cover rounded"
                                    />
                                )}

                                <button
                                    onClick={() => removeFile(index)}
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                    title="Xóa tệp"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
