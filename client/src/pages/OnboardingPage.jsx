import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const INTEREST_OPTIONS = [
    { id: 'Space', icon: '🚀', label: 'Space & Astronomy', color: '#a78bfa' },
    { id: 'Sports', icon: '⚽', label: 'Sports & Fitness', color: '#f59e0b' },
    { id: 'Nature', icon: '🌿', label: 'Nature & Wildlife', color: '#34d399' },
    { id: 'Music', icon: '🎵', label: 'Music & Arts', color: '#ec4899' },
    { id: 'Technology', icon: '💻', label: 'Technology', color: '#3b82f6' },
    { id: 'History', icon: '🏛️', label: 'History', color: '#f97316' },
    { id: 'Science', icon: '🔬', label: 'Science', color: '#06b6d4' },
    { id: 'Literature', icon: '📖', label: 'Literature', color: '#8b5cf6' },
];

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [loading, setLoading] = useState(false);
    const { updateUser } = useAuth();
    const navigate = useNavigate();

    const toggleInterest = (id) => {
        setSelectedInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleComplete = async () => {
        if (selectedInterests.length === 0) return;
        setLoading(true);
        try {
            await api.put('/users/profile', {
                interests: selectedInterests,
                themePreference: selectedInterests[0]?.toLowerCase() || 'default',
                onboardingComplete: true
            });
            updateUser({ interests: selectedInterests, onboardingComplete: true });
            navigate('/diagnostic');
        } catch (err) {
            console.error('Onboarding error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.bgOrbs}>
                <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'var(--accent-primary)', filter: 'blur(120px)', opacity: 0.15, top: '-15%', left: '20%' }} />
                <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: '#4cd8e0', filter: 'blur(100px)', opacity: 0.1, bottom: '-10%', right: '10%' }} />
            </div>

            <div style={styles.container} className="animate-slide-up">
                <div style={styles.header}>
                    <span style={{ fontSize: 48 }}>✨</span>
                    <h1 style={styles.title}>Let's Personalize Your Experience</h1>
                    <p style={styles.subtitle}>Choose topics that interest you. We'll tailor your learning environment accordingly.</p>
                </div>

                {/* Step indicator */}
                <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: step === 1 ? '50%' : '100%' }} />
                </div>

                {step === 1 && (
                    <div className="animate-fade-in">
                        <p style={styles.stepLabel}>Select your interests (choose at least 1)</p>
                        <div style={styles.grid}>
                            {INTEREST_OPTIONS.map((opt) => {
                                const selected = selectedInterests.includes(opt.id);
                                return (
                                    <button
                                        key={opt.id}
                                        id={`interest-${opt.id.toLowerCase()}`}
                                        onClick={() => toggleInterest(opt.id)}
                                        style={{
                                            ...styles.card,
                                            borderColor: selected ? opt.color : 'var(--border-color)',
                                            background: selected ? `${opt.color}15` : 'var(--bg-input)',
                                            boxShadow: selected ? `0 0 25px ${opt.color}30` : 'none',
                                        }}
                                    >
                                        <span style={{ fontSize: 32 }}>{opt.icon}</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{opt.label}</span>
                                        {selected && <span style={{ ...styles.checkMark, background: opt.color }}>✓</span>}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            id="onboarding-continue"
                            className="btn-primary"
                            style={styles.btn}
                            disabled={selectedInterests.length === 0}
                            onClick={handleComplete}
                        >
                            {loading ? 'Saving...' : `Continue with ${selectedInterests.length} interest${selectedInterests.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' },
    bgOrbs: { position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' },
    container: { position: 'relative', zIndex: 1, width: '100%', maxWidth: 600, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '44px 40px', backdropFilter: 'blur(20px)', boxShadow: '0 25px 80px rgba(0,0,0,0.5)' },
    header: { textAlign: 'center', marginBottom: 24 },
    title: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '12px 0 8px' },
    subtitle: { color: 'var(--text-secondary)', fontSize: '0.9rem' },
    progressBar: { height: 4, background: 'var(--border-color)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' },
    progressFill: { height: '100%', background: 'var(--accent-gradient)', borderRadius: 2, transition: 'width 0.4s ease' },
    stepLabel: { color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 16, textAlign: 'center' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 },
    card: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 12px', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'var(--font-primary)', color: 'var(--text-primary)', position: 'relative' },
    checkMark: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', fontWeight: 700 },
    btn: { width: '100%', padding: '16px', fontSize: '1rem' },
};
