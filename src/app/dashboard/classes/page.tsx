"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Plus, Users } from "lucide-react";
import { DataService } from "@/lib/data";
import { Class, User } from "@/types";

export default function ClassesPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const currentUser = await DataService.getCurrentUser();
                if (!currentUser) {
                    router.push('/login');
                    return;
                }
                setUser(currentUser);

                if (currentUser.role === 'teacher') {
                    const classList = await DataService.getClasses(currentUser.id);
                    setClasses(classList);
                } else {
                    // For student, get their class if they have one
                    if (currentUser.classId) {
                        const cls = await DataService.getClassById(currentUser.classId);
                        if (cls) setClasses([cls]);
                    }
                }
            } catch (error) {
                console.error("Failed to load classes", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router]);

    const copyInviteCode = (code: string) => {
        navigator.clipboard.writeText(code);
        alert(`Đã sao chép mã mời: ${code}`);
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (!user) return null;

    return (
        <div className="space-y-6 -m-8 p-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <button className="p-2 hover:bg-muted rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{user.role === 'teacher' ? 'Quản lý lớp học' : 'Lớp học của tôi'}</h1>
                        <p className="text-muted-foreground">{user.role === 'teacher' ? 'Danh sách các lớp bạn đang phụ trách.' : 'Thông tin lớp học bạn đã tham gia.'}</p>
                    </div>
                </div>
                {user.role === 'teacher' && (
                    <Link href="/dashboard/classes/create">
                        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Tạo lớp mới
                        </button>
                    </Link>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {classes.map((cls) => (
                    <Link key={cls.id} href={user.role === 'teacher' ? `/dashboard/classes/${cls.id}` : '#'}>
                        <div className={`bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col ${user.role === 'student' ? 'cursor-default' : ''}`}>
                            <div>
                                <h3 className="font-bold text-lg">{cls.name}</h3>
                                <p className="text-sm text-muted-foreground">{cls.subject}</p>
                            </div>

                            {cls.description && (
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                                    {cls.description}
                                </p>
                            )}

                            <div className="pt-4 border-t border-border mt-auto" onClick={(e) => e.preventDefault()}>
                                <div className="text-xs text-muted-foreground mb-1">Mã mời tham gia</div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyInviteCode(cls.code);
                                    }}
                                    className="w-full flex items-center justify-between bg-muted/50 hover:bg-muted p-2 rounded-md border border-dashed border-border transition-colors group"
                                >
                                    <code className="font-mono font-bold text-primary">{cls.code}</code>
                                    <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                                </button>
                            </div>
                        </div>
                    </Link>
                ))}

                {classes.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">{user.role === 'teacher' ? 'Chưa có lớp học nào' : 'Bạn chưa tham gia lớp học nào'}</h3>
                        <p className="text-muted-foreground mb-6">{user.role === 'teacher' ? 'Hãy tạo lớp học đầu tiên để bắt đầu quản lý học sinh.' : 'Hãy nhập mã mời từ giáo viên để tham gia lớp học.'}</p>
                        {user.role === 'teacher' ? (
                            <Link href="/dashboard/classes/create">
                                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
                                    Tạo lớp ngay
                                </button>
                            </Link>
                        ) : (
                            <Link href="/dashboard">
                                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
                                    Về Dashboard để tham gia
                                </button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
