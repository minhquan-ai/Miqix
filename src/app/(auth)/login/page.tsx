import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
            <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
