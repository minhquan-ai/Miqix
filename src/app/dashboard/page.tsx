"use client";

import { useEffect, useState } from "react";

import { getDashboardDataAction, DashboardData } from "@/lib/actions/analytics-actions";
import { DashboardSkeleton } from "@/components/skeletons";
import { AIPlayground } from "@/components/features/ai-playground/AIPlayground";


export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Single combined action - reduces round-trips
        const dashboardData = await getDashboardDataAction();
        setData(dashboardData);
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

  if (!data?.user) return null;

  return (
    <>
      {data.user.role === 'teacher' || data.user.role === 'student' ? (
        <AIPlayground user={data.user} initialData={data} />
      ) : (
        <div className="text-center py-20">Không thể tải dữ liệu bảng điều khiển.</div>
      )}
    </>
  );
}
