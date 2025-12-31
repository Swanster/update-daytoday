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
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>📊 Project Survey Tracker</h1>
                    <p>{isRegister ? 'Create your account' : 'Sign in to continue'}</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter username"
                            required
                            minLength={3}
                        />
                    </div>

                    {isRegister && (
                        <div className="form-group">
                            <label>Display Name</label>
                            <input
                                type="text"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleChange}
                                placeholder="Your display name"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            required
                            minLength={6}
                        />
                    </div>

                    {isRegister && (
                        <div className="form-group">
                            <label>Re-Enter Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                required
                                minLength={6}
                            />
                        </div>
                    )}

                    {error && <div className="login-error">{error}</div>}
                    {success && <div className="login-success">{success}</div>}

                    <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                        {loading ? 'Please wait...' : (isRegister ? 'Register' : 'Sign In')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        {isRegister ? 'Already have an account?' : "Don't have an account?"}
                        <button
                            type="button"
                            className="link-btn"
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError('');
                                setSuccess('');
                            }}
                        >
                            {isRegister ? 'Sign In' : 'Register'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
