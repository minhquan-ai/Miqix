import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const LoginForm = dynamic(() => import("./LoginForm").then(mod => mod.LoginForm), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
});

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
            <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
