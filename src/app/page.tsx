import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle, GraduationCap, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <GraduationCap className="w-6 h-6" />
            <span>Ergonix</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Tính năng</Link>
            <Link href="#about" className="hover:text-foreground transition-colors">Giới thiệu</Link>
            <Link href="#contact" className="hover:text-foreground transition-colors">Liên hệ</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-32 text-center px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Nền tảng giáo dục tích hợp AI
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Nâng tầm học tập cùng AI
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Ergonix giúp giáo viên quản lý bài tập dễ dàng và cung cấp cho học sinh một gia sư AI riêng biệt để hỗ trợ học tập cá nhân hóa.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register?role=teacher"
                className="w-full sm:w-auto bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-5 h-5" />
                Dành cho Giáo viên
              </Link>
              <Link
                href="/register?role=student"
                className="w-full sm:w-auto bg-secondary text-secondary-foreground px-8 py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Dành cho Học sinh
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Tại sao chọn Ergonix?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<CheckCircle className="w-8 h-8 text-green-500" />}
                title="Bài tập thông minh"
                description="Giáo viên dễ dàng tạo và theo dõi bài tập. Biến bài tập về nhà thành các 'Nhiệm vụ' thú vị cho học sinh."
              />
              <FeatureCard
                icon={<LayoutDashboard className="w-8 h-8 text-blue-500" />}
                title="Phân tích thời gian thực"
                description="Nắm bắt chi tiết hiệu suất của học sinh. Nhận diện sớm những em cần hỗ trợ trước khi quá muộn."
              />
              <FeatureCard
                icon={<GraduationCap className="w-8 h-8 text-purple-500" />}
                title="Gia sư AI"
                description="Học sinh nhận sự trợ giúp tức thì từ gia sư AI, hướng dẫn giải quyết vấn đề thay vì chỉ đưa ra đáp án."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Ergonix. Bảo lưu mọi quyền.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
