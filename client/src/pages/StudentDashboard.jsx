import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PracticeReadingPanel from '../components/PracticeReadingPanel';
import ProgressDashboard from '../components/ProgressDashboard';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [contents, setContents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedContent, setSelectedContent] = useState(null);
    const [adaptedText, setAdaptedText] = useState(null);
    const [adapting, setAdapting] = useState(false);
    const [activeTab, setActiveTab] = useState('reader');
    const [contentDifficulty, setContentDifficulty] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [contentRes, sessionRes] = await Promise.all([
                api.get('/content'),
                api.get('/test-sessions/my')
            ]);
            setContents(contentRes.data.contents || []);
            setSessions(sessionRes.data.sessions || []);
        } catch (err) { console.error(err); }
    };

    const handleAdapt = async (text) => {
        setAdapting(true);
        try {
            const res = await api.post('/adapt', { text, mode: 'simplify' });
            setAdaptedText(res.data);
        } catch (err) { console.error(err); }
        finally { setAdapting(false); }
    };

    const latestCLI = sessions[0]?.calculatedCLI || 0;

    const profileStyles = {
        ADHD: { badge: 'badge-adhd', note: '🎯 Focus Mode is active — reduced animations' },
        Dyslexia: { badge: 'badge-dyslexia', note: '📖 Dyslexia-friendly font and spacing active' },
        Typical: { badge: 'badge-typical', note: '✨ Standard adaptive interface' },
    };
    const pStyle = profileStyles[user?.cognitiveProfile] || profileStyles.Typical;

    return (
        <div style={styles.page}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <span style={{ fontSize: 28 }}>🧠</span>
                    <h1 style={styles.logo}>NeuroAdapt</h1>
                </div>
                <div style={styles.headerRight}>
                    <span className={`badge ${pStyle.badge}`}>{user?.cognitiveProfile || 'Typical'}</span>
                    <span style={styles.userName}>{user?.name}</span>
                    <button onClick={logout} style={styles.logoutBtn}>Logout</button>
                </div>
            </header>

            {/* Profile note */}
            <div style={styles.profileNote}>{pStyle.note}</div>

            {/* Tabs */}
            <div style={styles.tabs}>
                {[
                    { id: 'reader', label: '📚 Adaptive Reader' },
                    { id: 'practice', label: '🎤 Practice Reading' },
                    { id: 'progress', label: '📈 My Progress' },
                    { id: 'history', label: '📊 My Sessions' },
                    { id: 'test', label: '🧪 Retake Test' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => tab.id === 'test' ? navigate('/diagnostic') : setActiveTab(tab.id)}
                        style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Reader Tab */}
            {activeTab === 'reader' && (
                <div style={styles.content} className="animate-fade-in">
                    <div style={styles.splitLayout}>
                        {/* Content List */}
                        <div style={styles.contentList}>
                            <h3 style={styles.sectionTitle}>Available Content</h3>
                            <div style={styles.difficultyFilter}>
                                <span style={styles.filterLabel}>Difficulty:</span>
                                {['all', 'easy', 'medium', 'hard'].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setContentDifficulty(d)}
                                        style={{ ...styles.filterBtn, ...(contentDifficulty === d ? styles.filterBtnActive : {}) }}
                                    >
                                        {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
                                    </button>
                                ))}
                            </div>
                            {contents.length === 0 && <p style={styles.emptyText}>No content available yet. Your teacher will upload materials soon.</p>}
                            {contents
                                .filter(c => contentDifficulty === 'all' || (c.difficulty || 'medium') === contentDifficulty)
                                .filter(c => {
                                    const profile = user?.cognitiveProfile || 'Typical';
                                    const recommended = c.recommendedFor || ['ADHD', 'Dyslexia', 'Typical'];
                                    return recommended.includes(profile);
                                })
                                .map(c => (
                                <button
                                    key={c._id}
                                    onClick={() => { setSelectedContent(c); setAdaptedText(null); }}
                                    style={{ ...styles.contentItem, ...(selectedContent?._id === c._id ? styles.contentItemActive : {}) }}
                                >
                                    <span style={styles.contentTag}>{c.topicTag} · {(c.difficulty || 'medium').charAt(0).toUpperCase() + (c.difficulty || 'medium').slice(1)}</span>
                                    <span style={styles.contentTitle}>{c.title}</span>
                                </button>
                            ))}
                        </div>

                        {/* Reader Panel */}
                        <div style={styles.readerPanel}>
                            {!selectedContent ? (
                                <div style={styles.readerEmpty}>
                                    <span style={{ fontSize: 48, opacity: 0.4 }}>📖</span>
                                    <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Select content from the left to start reading</p>
                                </div>
                            ) : (
                                <>
                                    <div style={styles.readerHeader}>
                                        <h2 style={styles.readerTitle}>{selectedContent.title}</h2>
                                        {latestCLI > 0.7 && (
                                            <button
                                                onClick={() => handleAdapt(selectedContent.originalText)}
                                                className="btn-primary"
                                                style={{ fontSize: '0.85rem', padding: '8px 20px' }}
                                                disabled={adapting}
                                            >
                                                {adapting ? 'Simplifying...' : '✨ Simplify Text'}
                                            </button>
                                        )}
                                        {latestCLI <= 0.7 && latestCLI > 0 && (
                                            <span style={{ ...styles.cliNote }}>CLI: {(latestCLI * 100).toFixed(0)}% — Standard mode</span>
                                        )}
                                    </div>

                                    {adaptedText ? (
                                        <div>
                                            <div style={styles.adaptedSection}>
                                                <h4 style={styles.adaptedLabel}>🔹 Simplified Version</h4>
                                                <p style={styles.adaptedText}>{adaptedText.simplified}</p>
                                            </div>
                                            <div style={styles.adaptedSection}>
                                                <h4 style={styles.adaptedLabel}>📌 Key Points</h4>
                                                <ul style={styles.bulletList}>
                                                    {adaptedText.bullets?.map((b, i) => <li key={i} style={styles.bulletItem}>{b}</li>)}
                                                </ul>
                                            </div>
                                            <div style={styles.adaptedSection}>
                                                <h4 style={styles.adaptedLabel}>🏷️ Keywords</h4>
                                                <div style={styles.keywordRow}>
                                                    {adaptedText.keyKeywords?.map((k, i) => <span key={i} style={styles.keyword}>{k}</span>)}
                                                </div>
                                            </div>
                                            <button onClick={() => setAdaptedText(null)} className="btn-secondary" style={{ marginTop: 12, fontSize: '0.85rem' }}>Show Original</button>
                                        </div>
                                    ) : (
                                        <div style={styles.originalText}>{selectedContent.originalText}</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Practice Reading Tab */}
            {activeTab === 'practice' && (
                <div style={styles.content}>
                    <PracticeReadingPanel user={user} />
                </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
                <div style={styles.content}>
                    <ProgressDashboard />
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div style={styles.content} className="animate-fade-in">
                    <h3 style={styles.sectionTitle}>Test Session History</h3>
                    {sessions.length === 0 && <p style={styles.emptyText}>No sessions yet. Take the diagnostic test to get started!</p>}
                    <div style={styles.sessionGrid}>
                        {sessions.map((s, idx) => (
                            <div key={s._id} style={styles.sessionCard}>
                                <div style={styles.sessionHeader}>
                                    <span style={styles.sessionNum}>Session #{sessions.length - idx}</span>
                                    <span className={`badge badge-${s.resultProfile?.toLowerCase()}`}>{s.resultProfile}</span>
                                </div>
                                <div style={styles.sessionStats}>
                                    <div><span style={styles.statVal}>{(s.calculatedCLI * 100).toFixed(0)}%</span><span style={styles.statLbl}>CLI</span></div>
                                    <div><span style={styles.statVal}>{(s.rawBehaviorData?.totalTimeMs / 1000).toFixed(0)}s</span><span style={styles.statLbl}>Time</span></div>
                                    <div><span style={styles.statVal}>{s.rawBehaviorData?.reReadingCount || 0}</span><span style={styles.statLbl}>Re-reads</span></div>
                                </div>
                                <span style={styles.sessionDate}>{new Date(s.createdAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: { maxWidth: 1200, margin: '0 auto', padding: 24, minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
    logo: { fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
    userName: { color: 'var(--text-secondary)', fontSize: '0.9rem' },
    logoutBtn: { background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '6px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'var(--font-primary)' },
    profileNote: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 20px', color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 },
    tabs: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
    tab: { padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.3s' },
    tabActive: { background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)' },
    content: {},
    splitLayout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, minHeight: 400 },
    contentList: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 16, overflowY: 'auto', maxHeight: '70vh' },
    difficultyFilter: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
    filterLabel: { fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 },
    filterBtn: { padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-primary)', fontSize: '0.8rem' },
    filterBtnActive: { background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)' },
    sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 },
    emptyText: { color: 'var(--text-muted)', fontSize: '0.88rem' },
    contentItem: { display: 'flex', flexDirection: 'column', gap: 4, width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid transparent', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-primary)', color: 'var(--text-primary)', transition: 'all 0.2s', marginBottom: 4 },
    contentItemActive: { background: 'rgba(124,92,252,0.1)', borderColor: 'var(--accent-primary)' },
    contentTag: { fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)', fontWeight: 700 },
    contentTitle: { fontSize: '0.88rem', fontWeight: 600 },
    readerPanel: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 28, overflowY: 'auto', maxHeight: '70vh' },
    readerEmpty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
    readerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
    readerTitle: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 },
    cliNote: { fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '6px 14px', borderRadius: 'var(--radius-sm)' },
    originalText: { lineHeight: 1.9, fontSize: '1.02rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' },
    adaptedSection: { marginBottom: 20 },
    adaptedLabel: { fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 8 },
    adaptedText: { lineHeight: 1.8, fontSize: '0.98rem', color: 'var(--text-primary)' },
    bulletList: { listStyle: 'none', padding: 0 },
    bulletItem: { padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.6 },
    keywordRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    keyword: { background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '4px 12px', borderRadius: 100, fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 },
    sessionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
    sessionCard: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 20 },
    sessionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sessionNum: { fontWeight: 700, fontSize: '0.92rem' },
    sessionStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12, textAlign: 'center' },
    statVal: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)', display: 'block' },
    statLbl: { fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    sessionDate: { fontSize: '0.78rem', color: 'var(--text-muted)' },
};
