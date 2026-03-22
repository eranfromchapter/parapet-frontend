import Link from "next/link";
import ParapetLogo from "@/components/ParapetLogo";
import { ArrowLeft } from "lucide-react";

export default function IntakeHomeTypePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
      <h1 className="text-xl font-bold text-foreground mb-2 text-center">
        Intake Wizard
      </h1>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-8">
        The renovation readiness assessment is coming soon. We&apos;re building something great for you.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#1E3A5F] hover:text-[#2A4F7A] transition-colors"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>
    </div>
  );
}
