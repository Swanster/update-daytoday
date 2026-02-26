import { useState } from 'react';
import { authApi } from '../api/auth';

export default function LoginForm({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        displayName: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validate password confirmation for registration
        if (isRegister && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            let result;
            if (isRegister) {
                result = await authApi.register(
                    formData.username,
                    formData.password,
                    formData.displayName || formData.username
                );

                // Check if registration needs approval
                if (result.pendingApproval) {
                    setSuccess(result.message);
                    setFormData({ username: '', password: '', confirmPassword: '', displayName: '' });
                    setLoading(false);
                    return;
                }
            } else {
                result = await authApi.login(formData.username, formData.password);
            }

            // Save token and user
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            onLogin(result.user, result.token);
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-ch-primary via-purple-500 to-pink-500 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-ch-primary rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
            
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner border border-white/30 transform hover:scale-110 transition-transform duration-300">
                        <span className="text-3xl filter drop-shadow-md">📊</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm mb-2">Daily Activity</h1>
                    <p className="text-white/80 font-medium text-sm">{isRegister ? 'Create your account' : 'Sign in to continue'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-white/90 uppercase tracking-wider mb-2 ml-1">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter username"
                            required
                            minLength={3}
                            className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all backdrop-blur-md shadow-sm text-sm font-medium"
                        />
                    </div>

                    {isRegister && (
                        <div className="animate-slide-up">
                            <label className="block text-xs font-bold text-white/90 uppercase tracking-wider mb-2 ml-1">Display Name</label>
                            <input
                                type="text"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleChange}
                                placeholder="Your display name"
                                className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all backdrop-blur-md shadow-sm text-sm font-medium"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-white/90 uppercase tracking-wider mb-2 ml-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            required
                            minLength={6}
                            className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all backdrop-blur-md shadow-sm text-sm font-medium"
                        />
                    </div>

                    {isRegister && (
                        <div className="animate-slide-up">
                            <label className="block text-xs font-bold text-white/90 uppercase tracking-wider mb-2 ml-1">Re-Enter Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                required
                                minLength={6}
                                className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all backdrop-blur-md shadow-sm text-sm font-medium"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-white text-sm text-center font-medium backdrop-blur-sm animate-pulse">
                            ⚠️ {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-white text-sm text-center font-medium backdrop-blur-sm animate-pulse">
                            ✅ {success}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="w-full py-4 px-4 bg-white text-ch-primary font-extrabold rounded-xl hover:bg-ch-light focus:ring-4 focus:ring-white/30 transition-all duration-300 shadow-[0_8px_16px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_20px_rgba(0,0,0,0.15)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2 transform"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-ch-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Please wait...
                            </span>
                        ) : (isRegister ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-white/80 text-sm font-medium">
                        {isRegister ? 'Already have an account?' : "Don't have an account?"}
                        <button
                            type="button"
                            className="ml-2 font-bold text-white hover:text-ch-soft hover:underline transition-all focus:outline-none focus:ring-2 focus:ring-white/50 rounded px-1 group"
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError('');
                                setSuccess('');
                            }}
                        >
                            {isRegister ? 'Sign In' : 'Register'}
                            <span className="inline-block transition-transform group-hover:translate-x-1 ml-0.5">→</span>
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
