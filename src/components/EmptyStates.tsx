import { FileQuestion, FolderOpen, MessageSquare, Users, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-12 text-center"
        >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                {icon || <FileQuestion className="w-10 h-10" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 max-w-md mb-6">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                    {action.label}
                </button>
            )}
        </motion.div>
    );
}

export function NoAnnouncementsEmpty({ onCreate }: { onCreate: () => void }) {
    return (
        <EmptyState
            icon={<MessageSquare className="w-10 h-10" />}
            title="Chưa có thông báo nào"
            description="Tạo thông báo đầu tiên để chia sẻ thông tin với lớp học của bạn."
            action={{ label: "Tạo thông báo", onClick: onCreate }}
        />
    );
}

export function NoAssignmentsEmpty({ onCreate }: { onCreate: () => void }) {
    return (
        <EmptyState
            icon={<BookOpen className="w-10 h-10" />}
            title="Chưa có bài tập nào"
            description="Tạo bài tập đầu tiên để giao việc cho học sinh."
            action={{ label: "Tạo bài tập", onClick: onCreate }}
        />
    );
}

export function NoStudentsEmpty() {
    return (
        <EmptyState
            icon={<Users className="w-10 h-10" />}
            title="Chưa có học sinh nào"
            description="Học sinh có thể tham gia lớp bằng mã lớp học hoặc bạn có thể mời họ trực tiếp."
        />
    );
}

export function NoResourcesEmpty({ onUpload }: { onUpload: () => void }) {
    return (
        <EmptyState
            icon={<FolderOpen className="w-10 h-10" />}
            title="Chưa có tài liệu nào"
            description="Tải lên tài liệu học tập để chia sẻ với học sinh trong lớp."
            action={{ label: "Tải lên tài liệu", onClick: onUpload }}
        />
    );
}

export function NoSearchResults() {
    return (
        <EmptyState
            icon={<FileQuestion className="w-10 h-10" />}
            title="Không tìm thấy kết quả"
            description="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc của bạn."
        />
    );
}
