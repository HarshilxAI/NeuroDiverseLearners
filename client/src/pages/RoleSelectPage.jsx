import { useNavigate } from 'react-router-dom';

const ROLES = [
    {
        id: 'Student', icon: '🎓', emoji2: '✨',
        title: 'I\'m a Student',
        desc: 'Take adaptive tests, discover your learning style, and read content tailored just for you.',
        color: '#7c5cfc', bg: 'linear-gradient(135deg, #ede8ff 0%, #f5f0ff 100%)',
        features: ['Diagnostic reading test', 'Personalized themes', 'AI-powered reader']
    },
    {
        id: 'Teacher', icon: '📚', emoji2: '👩‍🏫',
        title: 'I\'m a Teacher',
        desc: 'Monitor your classroom, upload study materials, and communicate with parents.',
        color: '#e05297', bg: 'linear-gradient(135deg, #fce8f4 0%, #fff0f8 100%)',
        features: ['Classroom overview', 'Content management', 'Parent messaging']
    },
    {
        id: 'Parent', icon: '👨‍👩‍👧', emoji2: '📊',
        title: 'I\'m a Parent',
        desc: 'Track your child\'s reading progress with visual charts and chat with their teachers.',
        color: '#f59e0b', bg: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
        features: ['Progress charts', 'Teacher communication', 'Student linking']
    },
];

export default function RoleSelectPage() {
    const navigate = useNavigate();

    return (
        <div style={s.wrapper}>
            {/* Decorative blobs */}
            <div style={s.blobs}>
                <div style={{ ...s.blob, width: 500, height: 500, background: 'rgba(124,92,252,0.08)', top: '-15%', right: '-10%' }} />
                <div style={{ ...s.blob, width: 400, height: 400, background: 'rgba(224,82,151,0.06)', bottom: '-10%', left: '-5%' }} />
                <div style={{ ...s.blob, width: 300, height: 300, background: 'rgba(245,158,11,0.06)', top: '40%', left: '10%' }} />
            </div>

            <div style={s.content} className="animate-slide-up">
                {/* Header */}
                <div style={s.header}>
                    <div style={s.logoRow}>
                        <span style={s.logoEmoji}>🧠</span>
                        <h1 style={s.logoText}>NeuroAdapt</h1>
                    </div>
                    <p style={s.tagline}>Adaptive Learning, Powered by AI</p>
                    <h2 style={s.heading}>Who are you?</h2>
                    <p style={s.subheading}>Select your role to get a personalized experience</p>
                </div>

                {/* Role Cards */}
                <div style={s.grid}>
                    {ROLES.map((role, idx) => (
                        <button
                            key={role.id}
                            id={`select-role-${role.id.toLowerCase()}`}
                            onClick={() => navigate(`/login?role=${role.id}`)}
                            style={s.card}
                            className={`animate-slide-up stagger-${idx + 1}`}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                                e.currentTarget.style.boxShadow = `0 20px 50px ${role.color}25`;
                                e.currentTarget.style.borderColor = role.color;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.boxShadow = '';
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                        >
                            <div style={{ ...s.cardTop, background: role.bg }}>
                                <span style={s.cardIcon}>{role.icon}</span>
                                <span style={s.cardIcon2}>{role.emoji2}</span>
                            </div>
                            <div style={s.cardBody}>
                                <h3 style={{ ...s.cardTitle, color: role.color }}>{role.title}</h3>
                                <p style={s.cardDesc}>{role.desc}</p>
                                <div style={s.featureList}>
                                    {role.features.map((f, i) => (
                                        <span key={i} style={{ ...s.featureTag, borderColor: `${role.color}30`, color: role.color, background: `${role.color}08` }}>
                                            {f}
                                        </span>
                                    ))}
                                </div>
                                <div style={{ ...s.cardBtn, background: role.color }}>
                                    Get Started →
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

const s = {
    wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' },
    blobs: { position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' },
    blob: { position: 'absolute', borderRadius: '50%', filter: 'blur(80px)' },
    content: { position: 'relative', zIndex: 1, width: '100%', maxWidth: 960, textAlign: 'center' },
    header: { marginBottom: 40 },
    logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 },
    logoEmoji: { fontSize: 40, filter: 'drop-shadow(0 4px 12px rgba(124,92,252,0.3))' },
    logoText: { fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    tagline: { color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 },
    heading: { fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 },
    subheading: { color: 'var(--text-secondary)', fontSize: '1rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 20 },
    card: { background: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.4s ease', textAlign: 'left', fontFamily: 'var(--font-primary)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' },
    cardTop: { padding: '28px 24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    cardIcon: { fontSize: 44 },
    cardIcon2: { fontSize: 28, opacity: 0.6 },
    cardBody: { padding: '4px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' },
    cardTitle: { fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, marginBottom: 8 },
    cardDesc: { fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, flex: 1 },
    featureList: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
    featureTag: { padding: '4px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, border: '1px solid' },
    cardBtn: { color: '#fff', padding: '12px 0', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 700, fontSize: '0.92rem' },
};
