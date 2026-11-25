import { useState } from "react";
import { CheckCircle2, ArrowRight, Shield, GraduationCap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export function LoginForm() {
  const [role, setRole] = useState("ADMIN");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("••••••••••••");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSwitch = (selectedRole) => {
    setRole(selectedRole);
    setError(null);
    if (selectedRole === "ADMIN") {
      setUsername("admin");
      setPassword("••••••••••••");
    } else {
      setUsername("student01");
      setPassword("••••••••••••");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await login({ username, password, role });
      const actualRole = response.user?.role || role;
      navigate(
        actualRole === "ADMIN" ? "/admin/dashboard" : "/student/dashboard",
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Invalid credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="flex flex-col justify-center bg-surface-canvas px-6 py-12 sm:px-12 lg:px-14 border-l border-border-subtle/50">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-ink-primary">
            Welcome back
          </h2>
          <p className="text-sm text-ink-muted">Sign in to your workspace</p>
        </div>

        {/* Role Switcher */}
        <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-border-subtle bg-surface-input p-1">
          <button
            type="button"
            onClick={() => handleRoleSwitch("ADMIN")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition cursor-pointer ${
              role === "ADMIN"
                ? "bg-brand-500 text-white shadow-brand-glow"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            Placement Admin
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch("STUDENT")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition cursor-pointer ${
              role === "STUDENT"
                ? "bg-brand-500 text-white shadow-brand-glow"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Student
          </button>
        </div>

        {/* Demo Credentials Callout */}
        <div className="flex items-start gap-3 rounded-xl border border-brand-500/25 bg-brand-900/25 p-3.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-info" />
          <div className="text-xs leading-relaxed">
            <p className="font-medium text-brand-400">
              {role === "ADMIN" ? "Admin" : "Student"} demo credentials
              pre-filled
            </p>
            <p className="text-ink-muted">
              Click Sign In to explore the full platform
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-xs font-medium text-ink-secondary"
            >
              {role === "ADMIN" ? "Admin username" : "Username / Enrollment ID"}
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                role === "ADMIN"
                  ? "Enter admin username"
                  : "Enter your username"
              }
              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted transition focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-ink-secondary"
              >
                Password
              </label>
              <a
                href="#forgot-password"
                className="text-xs font-medium text-brand-400 hover:text-brand-500 transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted transition focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:opacity-60 cursor-pointer"
          >
            <span>{isLoading ? "Signing in..." : "Sign in to NexHire"}</span>
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="relative flex items-center py-1">
          <div className="grow border-t border-border-subtle" />
          <span className="mx-3 shrink text-xs text-ink-muted">
            or continue with
          </span>
          <div className="grow border-t border-border-subtle" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center rounded-lg border border-border-subtle bg-surface-input px-3 py-2.5 text-xs font-medium text-ink-secondary transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
          >
            Google Workspace
          </button>
          <button
            type="button"
            className="flex items-center justify-center rounded-lg border border-border-subtle bg-surface-input px-3 py-2.5 text-xs font-medium text-ink-secondary transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
          >
            Microsoft SSO
          </button>
        </div>

        <div className="space-y-4 pt-2 text-center">
          <p className="text-xs text-ink-muted">
            {role === "STUDENT" ? (
              <>
                Don’t have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-brand-400 hover:underline"
                >
                  Create student account
                </Link>
              </>
            ) : (
              <>
                Don’t have an account?{" "}
                <a
                  href="#request-access"
                  className="font-medium text-brand-400 hover:underline"
                >
                  Request access
                </a>
              </>
            )}
          </p>

          <p className="text-[11px] text-ink-muted/70">
            © 2026 NexHire Inc. · Privacy · Terms · Security
          </p>
        </div>
      </div>
    </aside>
  );
}
