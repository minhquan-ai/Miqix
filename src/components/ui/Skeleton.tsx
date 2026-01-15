import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const skeletonVariants = cva(
    // Base shimmer animation
    "relative overflow-hidden bg-muted before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
    {
        variants: {
            variant: {
                default: "rounded-md",
                text: "rounded-md h-4",
                heading: "rounded-md h-7",
                avatar: "rounded-full",
                card: "rounded-2xl",
                button: "rounded-xl h-10",
                image: "rounded-xl",
                circle: "rounded-full aspect-square",
            },
            size: {
                sm: "",
                md: "",
                lg: "",
                full: "w-full",
            }
        },
        compoundVariants: [
            // Avatar sizes
            { variant: "avatar", size: "sm", className: "w-8 h-8" },
            { variant: "avatar", size: "md", className: "w-10 h-10" },
            { variant: "avatar", size: "lg", className: "w-12 h-12" },
            // Circle sizes
            { variant: "circle", size: "sm", className: "w-8" },
            { variant: "circle", size: "md", className: "w-10" },
            { variant: "circle", size: "lg", className: "w-12" },
        ],
        defaultVariants: {
            variant: "default",
        }
    }
);

export interface SkeletonProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> { }

function Skeleton({ className, variant, size, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(skeletonVariants({ variant, size }), className)}
            {...props}
        />
    );
}

// ============================================
// SKELETON PRIMITIVES - Reusable Building Blocks
// ============================================

/** Multiple lines of text skeleton */
function SkeletonText({
    lines = 3,
    className,
    lastLineWidth = "w-2/3"
}: {
    lines?: number;
    className?: string;
    lastLineWidth?: string;
}) {
    return (
        <div className={cn("space-y-2", className)}>
            {[...Array(lines)].map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    className={cn(
                        "h-4",
                        i === lines - 1 ? lastLineWidth : "w-full"
                    )}
                />
            ))}
        </div>
    );
}

/** Avatar with optional text beside it */
function SkeletonUser({
    size = "md",
    showText = true,
    className
}: {
    size?: "sm" | "md" | "lg";
    showText?: boolean;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <Skeleton variant="avatar" size={size} />
            {showText && (
                <div className="space-y-2 flex-1">
                    <Skeleton variant="text" className="h-4 w-28" />
                    <Skeleton variant="text" className="h-3 w-20" />
                </div>
            )}
        </div>
    );
}

/** Stat card skeleton */
function SkeletonStatCard({ className }: { className?: string }) {
    return (
        <div className={cn(
            "bg-white dark:bg-card rounded-2xl p-5 border border-border",
            className
        )}>
            <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton variant="circle" size="sm" />
            </div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
        </div>
    );
}

/** List item skeleton */
function SkeletonListItem({ className }: { className?: string }) {
    return (
        <div className={cn(
            "flex items-center gap-4 p-4 rounded-xl border border-border bg-white dark:bg-card",
            className
        )}>
            <Skeleton variant="avatar" size="lg" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="h-5 w-48" />
                <div className="flex gap-3">
                    <Skeleton variant="text" className="h-3 w-24" />
                    <Skeleton variant="text" className="h-3 w-16" />
                </div>
            </div>
            <Skeleton variant="button" className="w-20" />
        </div>
    );
}

/** Card skeleton */
function SkeletonCard({
    variant = "simple",
    className
}: {
    variant?: "simple" | "detailed";
    className?: string;
}) {
    return (
        <div className={cn(
            "bg-white dark:bg-card rounded-2xl p-6 border border-border",
            className
        )}>
            {variant === "detailed" && (
                <div className="flex items-start gap-3 mb-4">
                    <Skeleton variant="avatar" size="md" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            )}
            <SkeletonText lines={3} />
        </div>
    );
}

/** Table row skeleton */
function SkeletonTableRow({
    columns = 4,
    className
}: {
    columns?: number;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center gap-4 py-3", className)}>
            {[...Array(columns)].map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        "h-4",
                        i === 0 ? "w-32" : i === columns - 1 ? "w-16" : "flex-1"
                    )}
                />
            ))}
        </div>
    );
}

/** Input field skeleton */
function SkeletonInput({ className }: { className?: string }) {
    return (
        <Skeleton className={cn("h-11 w-full rounded-lg", className)} />
    );
}

/** Button skeleton */
function SkeletonButton({
    size = "md",
    className
}: {
    size?: "sm" | "md" | "lg";
    className?: string;
}) {
    const sizeClasses = {
        sm: "h-8 w-20",
        md: "h-10 w-28",
        lg: "h-12 w-36"
    };

    return (
        <Skeleton
            variant="button"
            className={cn(sizeClasses[size], className)}
        />
    );
}

/** Image/Media skeleton */
function SkeletonImage({
    aspectRatio = "video",
    className
}: {
    aspectRatio?: "square" | "video" | "wide";
    className?: string;
}) {
    const ratioClasses = {
        square: "aspect-square",
        video: "aspect-video",
        wide: "aspect-[21/9]"
    };

    return (
        <Skeleton
            variant="image"
            className={cn("w-full", ratioClasses[aspectRatio], className)}
        />
    );
}

export {
    Skeleton,
    SkeletonText,
    SkeletonUser,
    SkeletonStatCard,
    SkeletonListItem,
    SkeletonCard,
    SkeletonTableRow,
    SkeletonInput,
    SkeletonButton,
    SkeletonImage,
    skeletonVariants
};
