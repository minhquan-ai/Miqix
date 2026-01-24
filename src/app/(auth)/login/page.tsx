import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthForm } from "../AuthForm";

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <p className="text-gray-500 font-medium">Đang tải...</p>
                </div>
            </div>
        }>
            <AuthForm initialMode="login" />
        </Suspense>
    );
}
