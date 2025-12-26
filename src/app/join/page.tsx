import { Suspense } from "react";
import dynamic from "next/dynamic";

const JoinClassPageContent = dynamic(() => import("./JoinClassContent").then(mod => mod.JoinClassPageContent), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
    )
});

export default function JoinClassPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <JoinClassPageContent />
        </Suspense>
    );
}
