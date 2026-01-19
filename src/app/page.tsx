"use client";

import Link from "next/link";
import {
  ArrowRight, BookOpen, CheckCircle2, GraduationCap,
  Sparkles, Users, BrainCircuit, Calendar, ClipboardCheck,
  BarChart3, FileText, Clock, Target, Award, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Aurora from "@/components/ui/Aurora";

// --- Landing Page based on actual Miqix features ---
// Primary: #F26C21 (Orange)  
// Accent: #00D9A5 (Cyan/Mint)

// --- Components ---

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
      scrolled
        ? "bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 py-3 shadow-sm"
        : "bg-transparent py-6"
    )}>
      <div className="container max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-2xl group transition-all">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F26C21] to-[#FF8A4C] flex items-center justify-center text-white shadow-lg shadow-[#F26C21]/20 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-gradient-landing font-extrabold">MiQiX</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-10 text-sm font-semibold text-gray-500 dark:text-gray-400">
          <Link href="#features" className="hover:text-[#F26C21] transition-colors relative group">
            Tính năng
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F26C21] transition-all group-hover:w-full" />
          </Link>
          <Link href="#for-teachers" className="hover:text-[#F26C21] transition-colors relative group">
            Cho giáo viên
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F26C21] transition-all group-hover:w-full" />
          </Link>
          <Link href="#for-students" className="hover:text-[#F26C21] transition-colors relative group">
            Cho học sinh
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F26C21] transition-all group-hover:w-full" />
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-[#F26C21] transition-colors hidden sm:block"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="btn-gradient-landing text-white px-7 py-3 rounded-2xl text-sm font-bold hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-2"
          >
            Bắt đầu miễn phí
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden">
      {/* Gradient Mesh Background - Bottom layer */}
      <div className="absolute inset-0 bg-mesh-landing -z-30" />

      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern -z-20 opacity-50" />

      {/* Decorative Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-15 pointer-events-none">
        <div className="absolute top-20 left-[5%] w-[400px] h-[400px] bg-[#F26C21]/10 dark:bg-[#F26C21]/25 rounded-full blur-[100px]" />
        <div className="absolute top-40 right-[5%] w-[400px] h-[400px] bg-[#00D9A5]/10 dark:bg-[#00D9A5]/25 rounded-full blur-[100px]" />
      </div>

      {/* Aurora Background - Smooth animated gradient effect */}
      <div className="absolute inset-0 z-0">
        <Aurora
          colorStops={["#F26C21", "#7C3AED", "#00D9A5"]}
          amplitude={1.2}
          blend={0.6}
          speed={0.8}
        />
      </div>

      <div className="container max-w-7xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 glass-card-landing px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest mb-10"
        >
          <Sparkles className="w-4 h-4 text-[#F26C21]" />
          <span className="text-gray-700 dark:text-gray-300">Nền tảng quản lý lớp học thông minh</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]"
        >
          <span className="block text-gray-900 dark:text-white mb-2">Quản lý lớp học.</span>
          <span className="text-gradient-landing">
            Đơn giản & Hiệu quả.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-14 max-w-3xl mx-auto font-medium"
        >
          Tất cả trong một nền tảng: Quản lý lớp học, điểm danh, bài tập, lịch biểu và trợ lý AI hỗ trợ học tập 24/7.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          <Link
            href="/register?role=teacher"
            className="w-full sm:w-auto group relative px-10 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold shadow-2xl hover:shadow-gray-900/20 dark:hover:shadow-white/20 transition-all hover:-translate-y-1.5 active:scale-95"
          >
            <span className="flex items-center justify-center gap-3">
              <Users className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Tôi là Giáo viên
              <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-all" />
            </span>
          </Link>
          <Link
            href="/register?role=student"
            className="w-full sm:w-auto px-10 py-5 glass-card-landing text-gray-900 dark:text-white rounded-2xl font-bold transition-all hover:-translate-y-1.5 active:scale-95 flex items-center justify-center gap-3"
          >
            <BookOpen className="w-5 h-5 text-[#F26C21]" />
            Tôi là Học sinh
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {[
            { value: "AI", label: "Trợ lý thông minh", icon: BrainCircuit },
            { value: "24/7", label: "Hỗ trợ liên tục", icon: Clock },
            { value: "100%", label: "Miễn phí sử dụng", icon: Award },
            { value: "∞", label: "Không giới hạn lớp", icon: Users },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <stat.icon className="w-5 h-5 text-[#F26C21]" />
                <span className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: BrainCircuit,
      title: "Trợ lý AI thông minh",
      description: "Hỗ trợ học sinh giải đáp thắc mắc 24/7, hướng dẫn tư duy thay vì chỉ đưa đáp án. AI còn giúp giáo viên tạo bài tập và phân tích kết quả.",
      color: "from-[#F26C21] to-[#FF8A4C]",
      bgColor: "bg-[#F26C21]/10"
    },
    {
      icon: Users,
      title: "Quản lý lớp học",
      description: "Tạo và quản lý nhiều lớp học dễ dàng. Thêm học sinh bằng mã lớp, theo dõi tiến độ và tương tác qua bảng tin lớp học.",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: ClipboardCheck,
      title: "Điểm danh thông minh",
      description: "Điểm danh nhanh chóng với một chạm. Theo dõi tỉ lệ chuyên cần real-time, xuất báo cáo điểm danh chi tiết theo tuần/tháng.",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-500/10"
    },
    {
      icon: FileText,
      title: "Bài tập & Chấm điểm",
      description: "Tạo bài tập đa dạng: trắc nghiệm, tự luận, file đính kèm. Chấm bài nhanh với rubric tùy chỉnh và phản hồi chi tiết.",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: Calendar,
      title: "Lịch biểu & Thời khóa biểu",
      description: "Quản lý thời khóa biểu trực quan. Tạo sự kiện, deadline bài tập tự động đồng bộ. Nhắc nhở thông minh trước mỗi tiết học.",
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-500/10"
    },
    {
      icon: BarChart3,
      title: "Phân tích & Báo cáo",
      description: "Dashboard trực quan với biểu đồ tiến độ học tập. Theo dõi điểm số, chuyên cần và xu hướng học tập của từng học sinh.",
      color: "from-[#00D9A5] to-[#00B087]",
      bgColor: "bg-[#00D9A5]/10"
    },
  ];

  return (
    <section id="features" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh-landing opacity-30 -z-10" />

      <div className="container max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 glass-card-landing px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Target className="w-4 h-4 text-[#F26C21]" />
            <span className="text-gray-600 dark:text-gray-300">Tính năng nổi bật</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-gray-900 dark:text-white">
            Mọi thứ bạn cần, <span className="text-gradient-landing">trong một nền tảng</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-xl max-w-2xl mx-auto">
            MiQiX tích hợp đầy đủ công cụ để giáo viên quản lý lớp học hiệu quả và học sinh học tập chủ động.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card-landing rounded-3xl p-8 group"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                <feature.icon className={`w-7 h-7 bg-gradient-to-br ${feature.color} bg-clip-text`} style={{ color: feature.color.includes('#F26C21') ? '#F26C21' : feature.color.includes('blue') ? '#3b82f6' : feature.color.includes('emerald') ? '#10b981' : feature.color.includes('purple') ? '#8b5cf6' : feature.color.includes('amber') ? '#f59e0b' : '#00D9A5' }} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForTeachersSection() {
  return (
    <section id="for-teachers" className="py-32 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 glass-card-landing px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
              <Users className="w-4 h-4 text-[#F26C21]" />
              <span className="text-gray-600 dark:text-gray-300">Dành cho giáo viên</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight">
              Tiết kiệm thời gian,<br />
              <span className="text-gradient-landing">tập trung giảng dạy</span>
            </h2>

            <p className="text-xl text-gray-500 dark:text-gray-400">
              MiQiX giúp giáo viên tự động hóa các công việc hành chính, để bạn có nhiều thời gian hơn cho việc giảng dạy chất lượng.
            </p>

            <div className="space-y-4">
              {[
                "Tạo lớp học và thêm học sinh chỉ với vài click",
                "Điểm danh nhanh và theo dõi chuyên cần tự động",
                "Giao bài tập, chấm điểm và phản hồi dễ dàng",
                "AI hỗ trợ tạo câu hỏi và phân tích kết quả",
                "Dashboard tổng quan với insights chi tiết",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00D9A5]/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-[#00D9A5]" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/register?role=teacher"
              className="inline-flex items-center gap-3 btn-gradient-landing text-white px-8 py-4 rounded-2xl font-bold text-lg"
            >
              Bắt đầu ngay - Miễn phí
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#F26C21]/10 rounded-[40px] blur-3xl" />
            <div className="relative glass-card-landing rounded-3xl p-8 space-y-6">
              {/* Mock Dashboard */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F26C21] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Lớp 12A1 Toán</p>
                    <p className="text-sm text-gray-500">35 học sinh</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">98% chuyên cần</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Bài tập", value: "12", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
                  { label: "Cần chấm", value: "5", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
                  { label: "Điểm TB", value: "8.2", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-2xl ${stat.color}`}>
                    <p className="text-2xl font-black">{stat.value}</p>
                    <p className="text-xs font-medium opacity-80">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Hoạt động gần đây</p>
                {[
                  { text: "Nguyễn Văn A nộp bài tập Chương 5", time: "5 phút trước" },
                  { text: "Trần Thị B đặt câu hỏi về đạo hàm", time: "12 phút trước" },
                  { text: "Lê Văn C hoàn thành quiz trắc nghiệm", time: "30 phút trước" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{activity.text}</span>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ForStudentsSection() {
  return (
    <section id="for-students" className="py-32">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative order-2 lg:order-1"
          >
            <div className="absolute inset-0 bg-[#00D9A5]/10 rounded-[40px] blur-3xl" />
            <div className="relative glass-card-landing rounded-3xl p-8 space-y-6">
              {/* AI Chat Mock */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F26C21] to-[#FF8A4C] flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">MiQiX AI</p>
                  <p className="text-xs text-emerald-500">Đang hoạt động</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="bg-[#F26C21] text-white px-4 py-3 rounded-2xl rounded-br-md max-w-[80%]">
                    <p className="text-sm">Em không hiểu cách giải phương trình bậc 2, có thể giải thích được không ạ?</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md max-w-[80%]">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Tất nhiên! Phương trình bậc 2 có dạng ax² + bx + c = 0. Để giải, em có thể dùng công thức nghiệm...
                    </p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md max-w-[80%]">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Thử giải bài này nhé: x² - 5x + 6 = 0. Em tìm delta trước, rồi áp dụng công thức! 💪
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  placeholder="Hỏi MiQiX AI..."
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26C21]/50"
                />
                <button className="w-10 h-10 rounded-xl bg-[#F26C21] flex items-center justify-center text-white">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8 order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 glass-card-landing px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
              <BookOpen className="w-4 h-4 text-[#00D9A5]" />
              <span className="text-gray-600 dark:text-gray-300">Dành cho học sinh</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight">
              Học mọi lúc,<br />
              <span className="text-gradient-landing">với AI đồng hành</span>
            </h2>

            <p className="text-xl text-gray-500 dark:text-gray-400">
              Không còn lo lắng khi gặp bài khó. MiQiX AI luôn sẵn sàng giải đáp và hướng dẫn bạn từng bước một.
            </p>

            <div className="space-y-4">
              {[
                "Trợ lý AI 24/7 - hỏi bất cứ lúc nào",
                "Giải thích chi tiết, dễ hiểu từng bước",
                "Theo dõi deadline bài tập và lịch học",
                "Nộp bài tập trực tiếp trên nền tảng",
                "Xem điểm số và nhận phản hồi từ giáo viên",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#F26C21]/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-[#F26C21]" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/register?role=student"
              className="inline-flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:-translate-y-1 transition-all"
            >
              Tham gia lớp học
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F26C21]/5 to-transparent -z-10" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30 -z-10" />

      <div className="container max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-10 leading-tight text-gray-900 dark:text-white">
            Sẵn sàng thay đổi<br />
            <span className="text-gradient-landing">cách bạn dạy và học?</span>
          </h2>
          <p className="text-2xl text-gray-500 dark:text-gray-400 mb-16 max-w-2xl mx-auto font-medium leading-relaxed">
            Tham gia cùng hàng nghìn giáo viên và học sinh đang sử dụng MiQiX mỗi ngày.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="/register"
              className="px-12 py-6 btn-gradient-landing text-white text-xl font-black rounded-[24px] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Đăng ký miễn phí
              <ArrowRight className="w-6 h-6" />
            </Link>
            <Link
              href="/login"
              className="px-12 py-6 glass-card-landing text-gray-900 dark:text-white text-xl font-black rounded-[24px] hover:scale-105 active:scale-95 transition-all"
            >
              Đăng nhập
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-white/10 py-16 text-sm">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2.5 font-bold text-2xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F26C21] to-[#FF8A4C] flex items-center justify-center text-white">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-gradient-landing">MiQiX</span>
            </div>
            <p className="text-gray-400 text-base leading-relaxed">
              Nền tảng quản lý lớp học thông minh với AI, giúp giáo viên và học sinh kết nối hiệu quả hơn.
            </p>
          </div>
          <div className="text-left">
            <h4 className="font-black uppercase tracking-widest text-[10px] text-gray-400 mb-4">Tính năng</h4>
            <ul className="space-y-3 font-medium text-gray-500 dark:text-gray-400">
              <li><Link href="#features" className="hover:text-[#F26C21] transition-colors">Quản lý lớp học</Link></li>
              <li><Link href="#features" className="hover:text-[#F26C21] transition-colors">Điểm danh</Link></li>
              <li><Link href="#features" className="hover:text-[#F26C21] transition-colors">Bài tập</Link></li>
              <li><Link href="#features" className="hover:text-[#F26C21] transition-colors">AI Trợ lý</Link></li>
            </ul>
          </div>
          <div className="text-left">
            <h4 className="font-black uppercase tracking-widest text-[10px] text-gray-400 mb-4">Đối tượng</h4>
            <ul className="space-y-3 font-medium text-gray-500 dark:text-gray-400">
              <li><Link href="#for-teachers" className="hover:text-[#F26C21] transition-colors">Cho giáo viên</Link></li>
              <li><Link href="#for-students" className="hover:text-[#F26C21] transition-colors">Cho học sinh</Link></li>
            </ul>
          </div>
          <div className="text-left">
            <h4 className="font-black uppercase tracking-widest text-[10px] text-gray-400 mb-4">Liên hệ</h4>
            <ul className="space-y-3 font-medium text-gray-500 dark:text-gray-400">
              <li><a href="mailto:hello@miqix.edu.vn" className="hover:text-[#F26C21] transition-colors">hello@miqix.edu.vn</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-gray-200 dark:border-white/10">
          <div className="flex gap-6 font-medium text-gray-400">
            <Link href="#" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Điều khoản</Link>
            <Link href="#" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Bảo mật</Link>
          </div>
          <p className="text-gray-400 font-medium">&copy; {new Date().getFullYear()} MiQiX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  useEffect(() => {
    // Force dark mode for landing page
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');

    // Cleanup: remove dark mode when leaving landing page
    return () => {
      // Don't remove dark class on cleanup to avoid flash
    };
  }, []);

  return (
    <div className="dark">
      <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white font-sans selection:bg-[#F26C21]/20">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <ForTeachersSection />
          <ForStudentsSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
