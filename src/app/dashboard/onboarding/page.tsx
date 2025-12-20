"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, User, Phone, FileText, ArrowRight, Loader2, Sparkles } from "lucide-react";

const AVATAR_OPTIONS = [
    "https://api.dicebear.com/7.x/notionists/svg?seed=Felix",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Milo",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Luna",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Oscar",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Bella",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Max",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Coco",
];

export default function OnboardingPage() {
    const router = useRouter();
    const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [bio, setBio] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleComplete = async () => {
        setIsLoading(true);

        try {
            // Call API to update user profile
            const response = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    avatarUrl: selectedAvatar,
                    phoneNumber: phoneNumber || undefined,
                    bio: bio || undefined,
                }),
            });

            if (response.ok) {
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-lg p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
                        <Sparkles className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-bold">Hoàn thiện hồ sơ</h1>
                    <p className="text-muted-foreground mt-2">Giúp mọi người nhận ra bạn dễ dàng hơn</p>
                </div>

                <div className="space-y-6">
                    {/* Avatar Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Chọn ảnh đại diện
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {AVATAR_OPTIONS.map((avatar, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setSelectedAvatar(avatar)}
                                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${selectedAvatar === avatar
                                            ? 'border-primary ring-2 ring-primary/30'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover bg-muted" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2" htmlFor="phone">
                            <Phone className="h-4 w-4" />
                            Số điện thoại
                            <span className="text-xs text-muted-foreground font-normal">(tùy chọn)</span>
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            placeholder="0901 234 567"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2" htmlFor="bio">
                            <FileText className="h-4 w-4" />
                            Giới thiệu bản thân
                            <span className="text-xs text-muted-foreground font-normal">(tùy chọn)</span>
                        </label>
                        <textarea
                            id="bio"
                            placeholder="Viết vài dòng về bạn..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-col gap-3">
                    <button
                        onClick={handleComplete}
                        disabled={isLoading}
                        className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                Hoàn tất
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleSkip}
                        className="w-full text-muted-foreground py-2.5 rounded-md font-medium hover:text-foreground hover:bg-secondary/50 transition-colors"
                    >
                        Bỏ qua, làm sau
                    </button>
                </div>
            </div>
        </div>
    );
}
