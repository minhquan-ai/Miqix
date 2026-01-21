import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getClassesAction, setMainClassAction } from '@/lib/actions';
import { Class, User } from '@/types';
import { Shield, Check, Star } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface SelectMainClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
}

export const SelectMainClassModal: React.FC<SelectMainClassModalProps> = ({ isOpen, onClose, currentUser }) => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            loadClasses();
        }
    }, [isOpen]);

    const loadClasses = async () => {
        setLoading(true);
        try {
            // In a real app, we'd fetch classes the student is a member of
            // For mock, we'll fetch all classes and filter (assuming student is in them or can join)
            // Actually, let's just fetch all classes for now as candidates
            const allClasses = await getClassesAction(); // Fetch teacher's classes for demo
            setClasses(allClasses);
        } catch (error) {
            console.error("Failed to load classes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedClassId) return;

        setSaving(true);
        try {
            const result = await setMainClassAction(selectedClassId);

            if (result.success) {
                showToast("Đã chọn lớp chính thành công!", "success");
                onClose();
                // Force reload to reflect changes
                window.location.reload();
            } else {
                showToast(result.message || "Có lỗi xảy ra", "error");
            }
        } catch (error) {
            showToast("Có lỗi xảy ra", "error");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
                >
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Chọn Lớp Chủ Nhiệm</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Chọn lớp học chính của bạn để ưu tiên hiển thị thông báo và theo dõi tiến độ học tập.
                        </p>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto mb-6 text-left">
                            {loading ? (
                                <div className="text-center py-4">Đang tải danh sách lớp...</div>
                            ) : (
                                classes.map(cls => (
                                    <div
                                        key={cls.id}
                                        onClick={() => setSelectedClassId(cls.id)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedClassId === cls.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                                            : 'border-gray-100 dark:border-gray-700 hover:border-blue-200'
                                            }`}
                                    >
                                        <img
                                            src={cls.avatar}
                                            alt={cls.name}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{cls.name}</h3>
                                            <p className="text-sm text-gray-500">{cls.subject}</p>
                                        </div>
                                        {selectedClassId === cls.id && (
                                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={!selectedClassId}
                            className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" />
                            Xác nhận chọn
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
