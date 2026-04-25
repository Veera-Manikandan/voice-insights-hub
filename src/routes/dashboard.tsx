import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — VoxPulse AI" },
      { name: "description", content: "Your VoxPulse AI dashboard." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate({ to: "/login" });
  }, [loading, isAuthenticated, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative text-center"
        >
          <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Welcome, <span className="text-gradient">{user.fullName}</span>
          </h1>
        </motion.div>
      </main>
    </div>
  );
}
