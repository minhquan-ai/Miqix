// Base Skeleton Components
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
    SkeletonImage
} from "@/components/ui/Skeleton";

// Page Skeletons
export { DashboardSkeleton, TeacherDashboardSkeleton } from "./DashboardSkeleton";
export {
    ClassDashboardSkeleton,
    StreamSkeleton,
    ClassworkSkeleton,
    PeopleSkeleton,
    ResourcesSkeleton,
    GradesSkeleton
} from "./ClassPageSkeletons";
export { AIPlaygroundSkeleton, AIChatLoadingSkeleton } from "./AIPlaygroundSkeleton";
export {
    AssignmentsPageSkeleton,
    AssignmentDetailSkeleton,
    SubmissionsPageSkeleton
} from "./AssignmentPageSkeletons";
export { SchedulePageSkeleton, MiniCalendarSkeleton } from "./SchedulePageSkeleton";
