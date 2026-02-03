import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const { login, changePassword, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const statePrefill = location.state || {};

  const [email, setEmail] = useState(statePrefill.email || "");
  const [password, setPassword] = useState(statePrefill.password || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeSuccess, setChangeSuccess] = useState("");
  const [changeSubmitting, setChangeSubmitting] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);

  useEffect(() => {
    if (statePrefill.email) setEmail(statePrefill.email);
    if (statePrefill.password) setPassword(statePrefill.password);
  }, [statePrefill.email, statePrefill.password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await login(email, password);

    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.message);
    }

    setSubmitting(false);
  };

  const isChangeDisabled =
    !email ||
    !oldPassword ||
    !newPassword ||
    !confirmPassword ||
    newPassword !== confirmPassword ||
    newPassword.length < 6 ||
    changeSubmitting;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (isChangeDisabled) return;

    setChangeSubmitting(true);
    setChangeError("");
    setChangeSuccess("");

    const res = await changePassword({
      email,
      oldPassword,
      newPassword,
      confirmPassword,
    });

    if (res.success) {
      setChangeSuccess("Password updated and session refreshed.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setChangeError(res.message);
    }

    setChangeSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white w-full max-w-md shadow-lg rounded-xl p-8 border">
        {!showChangeForm ? (
          <div>
            <h1 className="text-2xl font-bold text-center mb-6">SSC Portal Login</h1>

            {(error || authError) && (
              <p className="text-red-600 text-center mb-3">{error || authError}</p>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-3 border rounded-lg bg-gray-50"
                  placeholder="aditya@sscportal.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Password</label>
                <input
                  type="password"
                  className="w-full p-3 border rounded-lg bg-gray-50"
                  placeholder="Aditya@sscportal123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Login"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShowChangeForm(true)}
              className="mt-4 w-full text-center text-indigo-600 font-medium hover:text-indigo-500"
            >
              Forgot password?
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-center mb-4">Change Password</h2>
            {changeError && (
              <p className="text-red-600 text-center mb-3">{changeError}</p>
            )}
            {changeSuccess && (
              <p className="text-green-600 text-center mb-3">{changeSuccess}</p>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-3 border rounded-lg bg-gray-50"
                  placeholder="you@sscportal.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Old Password</label>
                <input
                  type="password"
                  className="w-full p-3 border rounded-lg bg-gray-50"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full p-3 border rounded-lg bg-gray-50"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">At least 6 characters</p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full p-3 border rounded-lg bg-gray-50"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isChangeDisabled}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-500 transition disabled:opacity-60"
              >
                {changeSubmitting ? "Updating..." : "Update Password"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShowChangeForm(false)}
              className="mt-4 w-full text-center text-gray-700 font-medium hover:text-black"
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
