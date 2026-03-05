import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
    { id: 'Student', icon: '🎓', title: 'Student', desc: 'Take diagnostic tests & learn adaptively' },
    { id: 'Parent', icon: '👨‍👩‍👧', title: 'Parent', desc: 'Track your child\'s progress' },
    { id: 'Teacher', icon: '📚', title: 'Teacher', desc: 'Monitor students & upload content' },
];

export default function SignupPage() {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleNext = (e) => {
        e.preventDefault();
        if (!name || !email || !password) {
            setError('All fields are required.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleSubmit = async () => {
        if (!role) {
            setError('Please select a role.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const user = await register(name, email, password, role);
            const routes = {
                Student: '/onboarding',
                Teacher: '/dashboard/teacher',
                Parent: '/dashboard/parent'
            };
            navigate(routes[user.role] || '/');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.bgOrbs}>
                <div style={{ ...styles.orb, width: 400, height: 400, background: 'var(--accent-primary)', top: '-10%', left: '-5%', animation: 'float 8s ease-in-out infinite' }} />
                <div style={{ ...styles.orb, width: 300, height: 300, background: '#4cd8e0', bottom: '-5%', right: '-5%', animation: 'float 10s ease-in-out infinite', animationDelay: '3s' }} />
            </div>

            <div style={styles.container} className="animate-slide-up">
                <div style={styles.logoSection}>
                    <div style={styles.logoIcon}>🧠</div>
                    <h1 style={styles.logoText}>Join NeuroAdapt</h1>
                    <p style={styles.subtitle}>Create your adaptive learning account</p>
                </div>

                {/* Step indicator */}
                <div style={styles.steps}>
                    <div style={{ ...styles.stepDot, ...(step >= 1 ? styles.stepActive : {}) }}>1</div>
                    <div style={styles.stepLine}>
                        <div style={{ ...styles.stepLineFill, width: step >= 2 ? '100%' : '0%' }} />
                    </div>
                    <div style={{ ...styles.stepDot, ...(step >= 2 ? styles.stepActive : {}) }}>2</div>
                </div>

                {step === 1 && (
                    <form onSubmit={handleNext} style={styles.form} className="animate-fade-in">
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Full Name</label>
                            <input id="signup-name" className="input-field" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Email Address</label>
                            <input id="signup-email" type="email" className="input-field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Password</label>
                            <input id="signup-password" type="password" className="input-field" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                        </div>
                        {error && <div style={styles.error}>{error}</div>}
                        <button id="signup-next" type="submit" className="btn-primary" style={styles.submitBtn}>Continue</button>
                    </form>
                )}

                {step === 2 && (
                    <div style={styles.form} className="animate-fade-in">
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 8 }}>I am a...</p>
                        <div style={styles.roleGrid}>
                            {ROLES.map((r) => (
                                <button
                                    key={r.id}
                                    id={`role-${r.id.toLowerCase()}`}
                                    onClick={() => setRole(r.id)}
                                    style={{
                                        ...styles.roleCard,
                                        ...(role === r.id ? styles.roleCardActive : {}),
                                    }}
                                >
                                    <span style={styles.roleIcon}>{r.icon}</span>
                                    <span style={styles.roleTitle}>{r.title}</span>
                                    <span style={styles.roleDesc}>{r.desc}</span>
                                </button>
                            ))}
                        </div>
                        {error && <div style={styles.error}>{error}</div>}
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                            <button id="signup-submit" onClick={handleSubmit} className="btn-primary" style={{ flex: 2 }} disabled={loading}>
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </div>
                    </div>
                )}

                <p style={styles.footerText}>
                    Already have an account? <Link to="/login" style={styles.link}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' },
    bgOrbs: { position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' },
    orb: { position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.25 },
    container: { position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '44px 40px', backdropFilter: 'blur(20px)', boxShadow: '0 25px 80px rgba(0,0,0,0.5)' },
    logoSection: { textAlign: 'center', marginBottom: 28 },
    logoIcon: { fontSize: 44, marginBottom: 10 },
    logoText: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    subtitle: { color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 6 },
    steps: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 },
    stepDot: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-input)', border: '2px solid var(--border-color)', transition: 'all 0.3s' },
    stepActive: { background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)', boxShadow: '0 0 20px var(--accent-glow)' },
    stepLine: { width: 80, height: 3, background: 'var(--border-color)', borderRadius: 2, position: 'relative', overflow: 'hidden' },
    stepLineFill: { position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.4s ease', borderRadius: 2 },
    form: { display: 'flex', flexDirection: 'column', gap: 18 },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
    label: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    error: { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' },
    submitBtn: { width: '100%', padding: '16px', fontSize: '1rem', marginTop: 4 },
    roleGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
    roleCard: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--bg-input)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.3s', textAlign: 'left', fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' },
    roleCardActive: { borderColor: 'var(--accent-primary)', background: 'rgba(124,92,252,0.08)', boxShadow: '0 0 20px var(--accent-glow)' },
    roleIcon: { fontSize: '1.6rem', flexShrink: 0 },
    roleTitle: { fontWeight: 700, fontSize: '0.95rem', display: 'block', marginBottom: 2 },
    roleDesc: { fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' },
    footerText: { textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: '0.88rem' },
    link: { color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 },
};
