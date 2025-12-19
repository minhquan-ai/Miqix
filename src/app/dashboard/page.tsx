"use client";

import { useEffect, useState } from "react";
import { DataService } from "@/lib/data";
import { getCurrentUserAction } from "@/lib/actions";
import { User } from "@/types";
import { StudentDashboard } from "@/components/features/StudentDashboard";
import { TeacherDashboard } from "@/components/features/TeacherDashboard";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { StudentAnalytics } from "@/lib/student-analytics";
import { ClassAnalytics } from "@/lib/class-analytics";


export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics | null>(null);
  const [teacherAnalytics, setTeacherAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUserAction();
        setUser(currentUser);

        if (!currentUser) return;

        if (currentUser.role === 'student') {
          const analytics = await DataService.getStudentDashboardAnalytics();
          setStudentAnalytics(analytics as any);
        } else if (currentUser.role === 'teacher') {
          const analytics = await DataService.getTeacherDashboardAnalytics();
          setTeacherAnalytics(analytics);
        }

      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) return null;

  return (
    <>
      {user.role === 'teacher' && teacherAnalytics ? (
        <TeacherDashboard user={user} analytics={teacherAnalytics} />
      ) : user.role === 'student' && studentAnalytics ? (
        <StudentDashboard user={user} analytics={studentAnalytics} />
      ) : (
        <div className="text-center py-20">Không thể tải dữ liệu bảng điều khiển.</div>
      )}
    </>
  );
}
