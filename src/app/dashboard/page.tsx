"use client";

import { useEffect, useState } from "react";
import { DataService } from "@/lib/data";
import { Assignment, Submission, User } from "@/types";
import { StudentDashboard } from "@/components/features/StudentDashboard";
import { TeacherDashboard } from "@/components/features/TeacherDashboard";

import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await DataService.getCurrentUser();
        setUser(currentUser);

        // Load assignments based on role
        const classId = currentUser.role === 'student' ? currentUser.classId : undefined;
        const classAssignments = await DataService.getAssignments(classId);
        setAssignments(classAssignments);

        // Load student's submissions if student role
        if (currentUser.role === 'student') {
          const allSubmissions: Submission[] = [];
          for (const assignment of classAssignments) {
            const submission = await DataService.getStudentSubmission(assignment.id, currentUser.id);
            if (submission) {
              allSubmissions.push(submission);
            }
          }
          setSubmissions(allSubmissions);
        } else if (currentUser.role === 'teacher') {
          // For teacher, load ALL submissions for these assignments to calculate stats
          const allSubmissions: Submission[] = [];
          for (const assignment of classAssignments) {
            const assignmentSubmissions = await DataService.getSubmissionsByAssignmentId(assignment.id);
            allSubmissions.push(...assignmentSubmissions);
          }
          setSubmissions(allSubmissions);


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
      {user.role === 'teacher' ? (
        <TeacherDashboard user={user} assignments={assignments} submissions={submissions} />
      ) : (
        <StudentDashboard user={user} assignments={assignments} submissions={submissions} />
      )}
    </>
  );
}
