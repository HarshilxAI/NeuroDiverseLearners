import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_CONFIG = {
    Student: { icon: '🎓', color: '#7c5cfc', bg: 'linear-gradient(135deg, #ede8ff, #f5f0ff)' },
    Teacher: { icon: '📚', color: '#e05297', bg: 'linear-gradient(135deg, #fce8f4, #fff0f8)' },
    Parent: { icon: '👨‍👩‍👧', color: '#f59e0b', bg: 'linear-gradient(135deg, #fef3c7, #fffbeb)' },
};

export default function LoginPage() {
    const [searchParams] = useSearchParams();
    const selectedRole = searchParams.get('role') || 'Student';
    const config = ROLE_CONFIG[selectedRole] || ROLE_CONFIG.Student;

    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let user;
            if (isLogin) {
                user = await login(email, password);
            } else {
                if (!name) { setError('Name is required.'); setLoading(false); return; }
                user = await register(name, email, password, selectedRole);
            }
            const routes = {
                Student: user.onboardingComplete ? '/dashboard/student' : '/diagnostic',
                Teacher: '/dashboard/teacher',
                Parent: '/dashboard/parent'
            };
            navigate(routes[user.role] || '/');
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={s.wrapper}>
            {/* Decorative blobs */}
            <div style={s.blobs}>
                <div style={{ ...s.blob, width: 400, height: 400, background: `${config.color}12`, top: '-10%', right: '-5%', animation: 'float 8s ease-in-out infinite' }} />
                <div style={{ ...s.blob, width: 300, height: 300, background: `${config.color}10`, bottom: '-5%', left: '-5%', animation: 'float 10s ease-in-out infinite', animationDelay: '3s' }} />
            </div>

            <div style={s.container} className="animate-slide-up">
                {/* Back to role select */}
                <Link to="/" style={s.backLink}>← Change role</Link>

                {/* Role badge */}
                <div style={s.logoSection}>
                    <div style={{ ...s.roleChip, background: config.bg, borderColor: `${config.color}30` }}>
                        <span style={{ fontSize: 22 }}>{config.icon}</span>
                        <span style={{ fontWeight: 700, color: config.color }}>{selectedRole}</span>
                    </div>
                    <h1 style={s.title}>{isLogin ? 'Welcome Back!' : 'Create Your Account'}</h1>
                    <p style={s.subtitle}>{isLogin ? 'Sign in to continue your learning journey' : `Join NeuroAdapt as a ${selectedRole}`}</p>
                </div>

                {/* Toggle */}
                <div style={s.toggleRow}>
                    <button onClick={() => setIsLogin(true)} style={{ ...s.toggleBtn, ...(isLogin ? { ...s.toggleActive, borderColor: config.color, color: config.color } : {}) }}>Sign In</button>
                    <button onClick={() => setIsLogin(false)} style={{ ...s.toggleBtn, ...(!isLogin ? { ...s.toggleActive, borderColor: config.color, color: config.color } : {}) }}>Sign Up</button>
                </div>

                <form onSubmit={handleSubmit} style={s.form}>
                    {!isLogin && (
                        <div style={s.field}>
                            <label style={s.label}>Full Name</label>
                            <input id="auth-name" className="input-field" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                    )}
                    <div style={s.field}>
                        <label style={s.label}>Email Address</label>
                        <input id="auth-email" type="email" className="input-field" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Password</label>
                        <input id="auth-password" type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                    </div>

                    {error && <div style={s.error}>⚠️ {error}</div>}

                    <button id="auth-submit" type="submit" className="btn-primary" style={{ ...s.submitBtn, background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)` }} disabled={loading}>
                        {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>
            </div>
        </div>
    );
}

const s = {
    wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' },
    blobs: { position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' },
    blob: { position: 'absolute', borderRadius: '50%', filter: 'blur(80px)' },
    container: { position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, background: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '40px 36px', boxShadow: 'var(--shadow-lg)' },
    backLink: { color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600, display: 'inline-block', marginBottom: 20, transition: 'color 0.2s' },
    logoSection: { textAlign: 'center', marginBottom: 28 },
    roleChip: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 100, border: '2px solid', marginBottom: 16 },
    title: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 },
    subtitle: { color: 'var(--text-secondary)', fontSize: '0.9rem' },
    toggleRow: { display: 'flex', gap: 8, marginBottom: 24, background: 'var(--bg-input)', padding: 4, borderRadius: 'var(--radius-md)' },
    toggleBtn: { flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)', border: '2px solid transparent', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-muted)', transition: 'all 0.3s' },
    toggleActive: { background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' },
    form: { display: 'flex', flexDirection: 'column', gap: 18 },
    field: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
    error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600 },
    submitBtn: { width: '100%', padding: '16px', fontSize: '1rem', marginTop: 4 },
};
