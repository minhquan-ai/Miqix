"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Download, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { importStudentsFromCSVAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { ModalHeader } from "@/components/ui/ModalHeader";

interface CSVImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    classId: string;
    onSuccess?: () => void;
}

interface StudentRow {
    name: string;
    email: string;
    studentId?: string;
    isValid?: boolean;
}

export default function CSVImportModal({ isOpen, onClose, classId, onSuccess }: CSVImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<StudentRow[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ added: number; failed: number; errors: any[] } | null>(null);
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClose = () => {
        setFile(null);
        setParsedData([]);
        setImportResult(null);
        onClose();
    };

    const handleFileUpload = (file: File) => {
        setFile(file);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data as any[];
                const processed: StudentRow[] = rows.map(row => {
                    const name = row['Họ và tên'] || row['name'] || row['Name'] || '';
                    const email = row['Email'] || row['email'] || '';
                    const studentId = row['Mã học sinh'] || row['studentId'] || row['Student ID'] || '';

                    const isValid = name.trim() !== '' && email.trim() !== '' && email.includes('@');

                    return { name, email, studentId, isValid };
                });
                setParsedData(processed);
            },
            error: (error) => {
                showToast("Lỗi khi đọc file CSV: " + error.message, "error");
            }
        });
    };

    const handleImport = async () => {
        if (!parsedData.length) return;

        const validRows = parsedData.filter(r => r.isValid);
        if (validRows.length === 0) {
            showToast("Không có dữ liệu hợp lệ để nhập", "error");
            return;
        }

        setIsImporting(true);
        try {
            // In a real app, we would send this to the server
            // For now, we'll simulate it or use the action if it supports bulk
            // The action importStudentsFromCSVAction takes formData, so we might need to adapt

            // Let's assume we send the file itself to the server action
            // Call server action with parsed data
            const result = await importStudentsFromCSVAction(classId, parsedData);

            if (result.success) {
                setImportResult({
                    added: result.results?.added || 0,
                    failed: result.results?.failed || 0,
                    errors: result.results?.errors || []
                });
                showToast(result.message, "success");
                if (onSuccess) onSuccess();
            } else {
                showToast(result.message, "error");
            }
        } catch (_error) {
            showToast("Có lỗi xảy ra khi nhập dữ liệu", "error");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <DraggableModal isOpen={isOpen} onClose={handleClose} className="max-w-2xl flex flex-col max-h-[90vh]">
            {(dragControls) => (
                <>
                    <ModalHeader
                        title="Nhập danh sách học sinh"
                        onClose={handleClose}
                        dragControls={dragControls}
                        className="shrink-0"
                    />

                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Step 1: Upload */}
                        {!file && !importResult && (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const droppedFile = e.dataTransfer.files[0];
                                        if (droppedFile && droppedFile.type === "text/csv") {
                                            handleFileUpload(droppedFile);
                                        } else {
                                            showToast("Vui lòng chọn file CSV", "error");
                                        }
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium mb-2">Kéo thả file CSV vào đây hoặc</p>
                                    <label className="inline-block" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                        />
                                        <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200 transition-colors font-medium">
                                            Chọn file từ máy tính
                                        </span>
                                    </label>
                                    <p className="text-xs text-gray-500 mt-4">Hỗ trợ file .csv (UTF-8)</p>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Hướng dẫn định dạng file CSV
                                    </h4>
                                    <p className="text-sm text-blue-700 mb-2">File CSV cần có các cột sau (theo thứ tự hoặc có tiêu đề):</p>
                                    <ul className="list-disc list-inside text-sm text-blue-600 space-y-1 ml-2">
                                        <li><strong>Họ và tên</strong> (Bắt buộc)</li>
                                        <li><strong>Email</strong> (Bắt buộc, duy nhất)</li>
                                        <li><strong>Mã học sinh</strong> (Tùy chọn)</li>
                                    </ul>
                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                        <a href="#" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                                            <Download className="w-3 h-3" />
                                            Tải file mẫu
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Preview */}
                        {file && !importResult && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setFile(null); setParsedData([]); }}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="border rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                        <h4 className="font-semibold text-gray-700 text-sm">Xem trước dữ liệu ({parsedData.length} dòng)</h4>
                                        <span className="text-xs text-gray-500">Hiển thị 5 dòng đầu tiên</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-2">Họ và tên</th>
                                                    <th className="px-4 py-2">Email</th>
                                                    <th className="px-4 py-2">Mã HS</th>
                                                    <th className="px-4 py-2">Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {parsedData.slice(0, 5).map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/50">
                                                        <td className="px-4 py-2">{row.name}</td>
                                                        <td className="px-4 py-2">{row.email}</td>
                                                        <td className="px-4 py-2 font-mono text-xs">{row.studentId || '-'}</td>
                                                        <td className="px-4 py-2">
                                                            {row.isValid ? (
                                                                <span className="text-green-600 flex items-center gap-1 text-xs font-medium"><CheckCircle className="w-3 h-3" /> Hợp lệ</span>
                                                            ) : (
                                                                <span className="text-red-600 flex items-center gap-1 text-xs font-medium"><AlertCircle className="w-3 h-3" /> Lỗi</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {parsedData.length > 5 && (
                                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500">
                                            ... và {parsedData.length - 5} dòng khác
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setFile(null); setParsedData([]); }}
                                        className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleImport}
                                        disabled={isImporting || parsedData.filter(r => r.isValid).length === 0}
                                        className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isImporting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Đang nhập...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                <span>Nhập {parsedData.filter(r => r.isValid).length} học sinh</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Result */}
                        {importResult && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Nhập dữ liệu thành công!</h3>
                                <p className="text-gray-600 mb-6">
                                    Đã thêm thành công <strong className="text-blue-600">{importResult.added}</strong> học sinh vào lớp học.
                                    {importResult.errors && importResult.errors.length > 0 && (
                                        <span className="block mt-2 text-sm text-orange-600">
                                            Có {importResult.errors.length} dòng bị lỗi không thể nhập.
                                        </span>
                                    )}
                                </p>
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-all"
                                >
                                    Hoàn tất
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </DraggableModal>
    );
}
