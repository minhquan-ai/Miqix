"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { uploadResourceAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";

interface FileUploadProps {
    classId: string;
    teacherId: string;
    onUploadSuccess: () => void;
}

export function FileUpload({ classId, teacherId, onUploadSuccess }: FileUploadProps) {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileSelect = (file: File) => {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            showToast("File quá lớn. Giới hạn 10MB.", "error");
            return;
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            showToast("Chỉ hỗ trợ PDF và ảnh (PNG, JPG).", "error");
            return;
        }

        setSelectedFile(file);
        setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !title.trim()) {
            showToast("Vui lòng chọn file và nhập tên tài liệu.", "error");
            return;
        }

        setUploading(true);
        try {
            // In a real app, upload to cloud storage first and get URL
            // For prototype, we'll save to public/uploads
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('classId', classId);

            const uploadResponse = await fetch('/api/upload-resource', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Upload failed');
            }

            const { fileUrl } = await uploadResponse.json();

            // Save metadata to database
            const result = await uploadResourceAction({
                classId,
                teacherId,
                title: title.trim(),
                description: description.trim() || undefined,
                fileUrl,
                fileType: selectedFile.type,
                fileSize: selectedFile.size
            });

            if (result.success) {
                showToast(result.message, 'success');
                setSelectedFile(null);
                setTitle("");
                setDescription("");
                onUploadSuccess();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast("Có lỗi xảy ra khi upload", "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Drag and Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
            >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium mb-1">
                    {selectedFile ? selectedFile.name : "Kéo thả file vào đây hoặc click để chọn"}
                </p>
                <p className="text-sm text-muted-foreground">
                    Hỗ trợ PDF, PNG, JPG (tối đa 10MB)
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileInputChange}
                    className="hidden"
                />
            </div>

            {/* File Details Form */}
            {selectedFile && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Chi tiết tài liệu</h4>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="p-1 hover:bg-muted rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground">Tên tài liệu *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
                            placeholder="VD: Sách giáo khoa Toán 10"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground">Mô tả (tùy chọn)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 resize-none"
                            placeholder="Thêm mô tả ngắn về tài liệu..."
                            rows={2}
                        />
                    </div>
                    <button
                        onClick={handleUpload}
                        disabled={uploading || !title.trim()}
                        className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {uploading ? "Đang upload..." : "Upload tài liệu"}
                    </button>
                </div>
            )}
        </div>
    );
}
