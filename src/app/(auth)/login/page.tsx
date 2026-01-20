export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient Orbs */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-pink-400/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-cyan-400/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-400/5 to-purple-400/5 rounded-full blur-3xl" />

                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />
            </div>

            {/* Main Content */}
            <Suspense fallback={
                <div className="flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-[#F26C21]" />
                        <p className="text-gray-500 font-medium">Đang tải...</p>
                    </div>
                </div>
            }>
                <LoginForm />
            </Suspense>
        </div>
    );
}
