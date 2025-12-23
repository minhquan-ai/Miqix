"use client";

import Link from "next/link";
import {
  ArrowRight, BookOpen, CheckCircle2, GraduationCap, LayoutDashboard,
  Sparkles, Users, BrainCircuit, ShieldCheck, Zap, BarChart3, MessageSquare,
  Trophy, MousePointer2, Rocket
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
      scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border py-3 shadow-sm" : "bg-transparent py-6"
    )}>
      <div className="container max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-2xl group transition-all">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 group-hover:from-primary group-hover:to-purple-600 transition-all duration-500">Miqix</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-10 text-sm font-semibold text-gray-500">
          <Link href="#features" className="hover:text-primary transition-colors relative group">
            Tính năng
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href="#roles" className="hover:text-primary transition-colors relative group">
            Đối tượng
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href="#about" className="hover:text-primary transition-colors relative group">
            Về Miqix
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
        </nav>
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-sm font-bold text-gray-600 hover:text-primary transition-colors hidden sm:block"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="bg-primary text-white px-7 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 transition-all"
          >
            Bắt đầu ngay
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 md:pt-56 md:pb-40 overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.08),transparent_50%)]" />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none">
        <div className="absolute top-20 left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-40 right-[10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      </div>

      <div className="container max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 bg-white/50 backdrop-blur-md border border-gray-100 shadow-sm text-primary px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-10"
        >
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Nền tảng giáo dục tích hợp AI thế hệ mới</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]"
        >
          <span className="block text-gray-900 mb-2">Học tập chủ động.</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-600 to-purple-600">
            Quản lý đỉnh cao.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-500 mb-14 max-w-3xl mx-auto font-medium"
        >
          Miqix giúp giáo viên tối ưu 80% thời gian quản lý và hỗ trợ học sinh học tập cá nhân hóa với trợ lý AI thông minh.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          <Link
            href="/register?role=teacher"
            className="w-full sm:w-auto group relative px-10 py-5 bg-gray-900 text-white rounded-2xl font-bold shadow-2xl hover:bg-gray-800 transition-all hover:-translate-y-1.5 active:scale-95"
          >
            <span className="flex items-center justify-center gap-3">
              <LayoutDashboard className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Dành cho Giáo viên
              <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-all" />
            </span>
          </Link>
          <Link
            href="/register?role=student"
            className="w-full sm:w-auto px-10 py-5 bg-white text-gray-900 border border-gray-200 rounded-2xl font-bold shadow-sm hover:border-primary/30 transition-all hover:-translate-y-1.5 active:scale-95 flex items-center justify-center gap-3"
          >
            <BookOpen className="w-5 h-5 text-primary" />
            Dành cho Học sinh
          </Link>
        </motion.div>

        {/* Fixed & Expanded UI Elements Preview */}
        <div className="mt-24 relative max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
            className="relative z-10 bg-white rounded-3xl p-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12),0_30px_60px_-30px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden aspect-[16/9] min-h-[350px] md:min-h-[550px]"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
            <div className="w-full h-full bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center relative">
              {/* Mock UI Background */}
              <img
                src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2670&auto=format&fit=crop"
                alt="Miqix Dashboard"
                className="w-full h-full object-cover opacity-60 scale-105"
              />
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto">
                    <GraduationCap className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Previewing Dashboard</p>
                </div>
              </div>
            </div>

            {/* High-Fidelity Floating Badge 1 */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute top-10 right-10 md:top-20 md:right-20 bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-white flex items-center gap-4 z-20 group cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-0.5">Hôm nay</p>
                <p className="text-base font-bold text-gray-900">100% Chuyên cần</p>
              </div>
            </motion.div>

            {/* High-Fidelity Floating Badge 2 */}
            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-10 left-10 md:bottom-20 md:left-20 bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-white flex items-center gap-4 z-20 group cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-0.5">AI Tutor</p>
                <p className="text-base font-bold text-gray-900">Đang giải đáp học sinh...</p>
              </div>
            </motion.div>

            {/* Mouse Pointer Effect */}
            <motion.div
              animate={{ x: [0, 100, -50, 0], y: [0, 50, 100, 0] }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              className="absolute top-1/2 left-1/3 pointer-events-none z-30 opacity-50 hidden md:block"
            >
              <MousePointer2 className="w-6 h-6 text-primary drop-shadow-lg" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function RoleShowcase() {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');

  return (
    <section id="roles" className="py-32 bg-gray-50/50">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Thiết kế cho thế hệ mới</h2>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium">
            Dù bạn là giáo viên muốn tối ưu lớp học hay học sinh muốn chinh phục kiến thức, Miqix đều có lộ trình riêng dành cho bạn.
          </p>
        </div>

        <div className="flex justify-center mb-16">
          <div className="bg-white p-2 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 inline-flex">
            <button
              onClick={() => setActiveTab('teacher')}
              className={cn(
                "px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3",
                activeTab === 'teacher'
                  ? "bg-gray-900 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Users className="w-5 h-5" />
              Giáo viên
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={cn(
                "px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3",
                activeTab === 'student'
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <GraduationCap className="w-5 h-5" />
              Học sinh
            </button>
          </div>
        </div>

        <div className="relative min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTab === 'teacher' ? (
              <motion.div
                key="teacher"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="grid lg:grid-cols-2 gap-16 items-center"
              >
                <div className="space-y-12">
                  <div className="space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                      <BarChart3 className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="text-4xl font-black">Làm chủ lớp học <br />trong lòng bàn tay</h3>
                    <p className="text-gray-500 text-xl leading-relaxed">
                      Thay vì quay cuồng với sổ sách, Miqix cung cấp bảng điều khiển trung tâm để bạn quản lý mọi thứ từ điểm danh đến kết quả học kì.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-8 text-left">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Zap className="w-5 h-5 fill-current" />
                        <span className="font-bold">Điểm danh 1 chạm</span>
                      </div>
                      <p className="text-sm text-gray-500">Tích hợp AI nhận diện và thống kê tỉ lệ chuyên cần real-time.</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <ShieldCheck className="w-5 h-5 fill-current" />
                        <span className="font-bold">Chấm bài tự động</span>
                      </div>
                      <p className="text-sm text-gray-500">Hỗ trợ chấm bài tập trắc nghiệm và phân tích lỗi sai ngay lập tức.</p>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/10 rounded-[40px] blur-3xl" />
                  <img
                    src="https://images.unsplash.com/photo-1544717297-fa95b3ee21f3?q=80&w=2670&auto=format&fit=crop"
                    alt="Teacher Interface"
                    className="relative rounded-[32px] shadow-2xl border border-white"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="student"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="grid lg:grid-cols-2 gap-16 items-center"
              >
                <div className="order-2 lg:order-1 relative">
                  <div className="absolute inset-0 bg-primary/10 rounded-[40px] blur-3xl" />
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop"
                    alt="Student Experience"
                    className="relative rounded-[32px] shadow-2xl border border-white"
                  />
                </div>
                <div className="order-1 lg:order-2 space-y-12">
                  <div className="space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Trophy className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-4xl font-black">Học không áp lực, <br />vui như chơi game</h3>
                    <p className="text-gray-500 text-xl leading-relaxed text-left">
                      Học sinh được giao các &quot;nhiệm vụ&quot;, thu hoạch XP, thăng hạng và trao đổi với bạn bè trong một môi trường học tập xã hội lành mạnh.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-8 text-left">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Rocket className="w-5 h-5" />
                        <span className="font-bold">Lộ trình XP</span>
                      </div>
                      <p className="text-sm text-gray-500">Mỗi nỗ lực đều được ghi nhận bằng điểm thưởng và huy hiệu danh dự.</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-purple-600">
                        <MessageSquare className="w-5 h-5 fill-current" />
                        <span className="font-bold">Kết nối Group</span>
                      </div>
                      <p className="text-sm text-gray-500">Thảo luận bài học, hỗ trợ bạn bè và cùng nhau thăng hạng lớp học.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function BentoGridFeatures() {
  return (
    <section id="features" className="py-32">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Trái tim của Miqix</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-7xl mx-auto">
          {/* Hero Feature 1 */}
          <motion.div
            whileHover={{ y: -10 }}
            className="md:col-span-8 bg-gray-900 rounded-[40px] p-12 text-white relative overflow-hidden group min-h-[450px]"
          >
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[150px] group-hover:bg-primary/30 transition-all duration-700" />
            <div className="relative z-10 h-full flex flex-col justify-between text-left">
              <div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
                  <BrainCircuit className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-4xl font-black mb-6 leading-tight">AI Tutor 24/7 <br />Gia sư tận tâm</h3>
                <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                  Sử dụng công nghệ LLM tiên tiến nhất, AI Tutor hỗ trợ học sinh giải đáp mọi thắc mắc ngay lập tức, hướng dẫn tư duy thay vì chỉ đưa ra đáp án cuối cùng.
                </p>
              </div>
              <div className="pt-10">
                <button className="flex items-center gap-3 font-bold text-sm tracking-widest uppercase hover:gap-5 transition-all">
                  Tìm hiểu thêm <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            whileHover={{ y: -10 }}
            className="md:col-span-4 bg-primary rounded-[40px] p-10 text-white flex flex-col justify-between text-left"
          >
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-4">Mạng xã hội Học tập</h3>
              <p className="text-white/80 font-medium">Bảng tin tương tác, bình luận và chia sẻ kiến thức giúp lớp học luôn sôi nổi.</p>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            whileHover={{ y: -10 }}
            className="md:col-span-4 bg-zinc-100 rounded-[40px] p-10 flex flex-col justify-between border border-zinc-200 shadow-sm text-left"
          >
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm">
              <Zap className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-4">Real-time Analytics</h3>
              <p className="text-gray-500 font-medium">Dữ liệu được cập nhật từng giây, giúp giáo viên can thiệp kịp thời khi học sinh gặp khó khăn.</p>
            </div>
          </motion.div>

          {/* Feature 4 */}
          <motion.div
            whileHover={{ y: -10 }}
            className="md:col-span-4 bg-zinc-100 rounded-[40px] p-10 flex flex-col justify-between border border-zinc-200 shadow-sm text-left"
          >
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm">
              <ShieldCheck className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-4">Bảo mật Tối đa</h3>
              <p className="text-gray-500 font-medium">Chúng tôi ưu tiên sự an toàn thông tin của học sinh và nhà trường lên hàng đầu.</p>
            </div>
          </motion.div>

          {/* Feature 5 */}
          <motion.div
            whileHover={{ y: -10 }}
            className="md:col-span-4 bg-zinc-100 rounded-[40px] p-10 flex flex-col justify-between border border-zinc-200 shadow-sm text-left"
          >
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm">
              <LayoutDashboard className="w-7 h-7 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-4">Tích hợp Đa kênh</h3>
              <p className="text-gray-500 font-medium">Sử dụng mượt mà trên mọi thiết bị: Mobile, Tablet và Desktop.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-40 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 -z-10" />
      <div className="container max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-10 leading-tight text-gray-900">Bắt đầu hành trình <br />Miqix ngay hôm nay</h2>
          <p className="text-2xl text-gray-500 mb-16 max-w-2xl mx-auto font-medium leading-relaxed">
            Dù bạn là trường học, giáo viên tự do hay học sinh, Miqix đều có phiên bản dành cho bạn. Tăng hiệu suất, giảm áp lực.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="/register"
              className="px-12 py-6 bg-primary text-white text-xl font-black rounded-[24px] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
            >
              Đăng ký miễn phí
            </Link>
            <Link
              href="/login"
              className="px-12 py-6 bg-white text-gray-900 border border-gray-200 text-xl font-black rounded-[24px] hover:bg-gray-50 shadow-sm hover:scale-105 active:scale-95 transition-all"
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
    <footer className="bg-white border-t border-gray-100 py-20 text-sm">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6 text-left">
            <div className="flex items-center gap-2.5 font-bold text-2xl">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span>Miqix</span>
            </div>
            <p className="text-gray-400 text-base leading-relaxed">Kiến tạo tương lai giáo dục dựa trên sức mạnh của Trí tuệ nhân tạo và Tư duy chủ động.</p>
          </div>
          <div className="text-left">
            <h4 className="font-black uppercase tracking-widest text-[10px] text-gray-400 mb-6">Sản phẩm</h4>
            <ul className="space-y-4 font-bold text-gray-500">
              <li><Link href="#features" className="hover:text-primary transition-colors">Tính năng</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Bảng giá</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">AI Tutor</Link></li>
            </ul>
          </div>
          <div className="text-left">
            <h4 className="font-black uppercase tracking-widest text-[10px] text-gray-400 mb-6">Công ty</h4>
            <ul className="space-y-4 font-bold text-gray-500">
              <li><Link href="#about" className="hover:text-primary transition-colors">Về Miqix</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Tuyển dụng</Link></li>
            </ul>
          </div>
          <div className="text-left">
            <h4 className="font-black uppercase tracking-widest text-[10px] text-gray-400 mb-6">Liên hệ</h4>
            <ul className="space-y-4 font-bold text-gray-500">
              <li><a href="mailto:hello@ergonix.vn" className="hover:text-primary transition-colors">hello@ergonix.vn</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Hỗ trợ 24/7</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-gray-100">
          <div className="flex gap-8 font-bold text-gray-400">
            <Link href="#" className="hover:text-gray-600 transition-colors">Điều khoản dịch vụ</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">Chính sách bảo mật</Link>
          </div>
          <p className="text-gray-400 font-medium">&copy; {new Date().getFullYear()} Miqix Platforms. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-primary/20">
      <Navbar />
      <main>
        <HeroSection />
        <RoleShowcase />
        <BentoGridFeatures />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
