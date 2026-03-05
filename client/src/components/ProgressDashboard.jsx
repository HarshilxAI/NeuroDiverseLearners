import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

export default function ProgressDashboard() {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProgress();
    }, []);

    const loadProgress = async () => {
        try {
            const res = await api.get('/reading-practice/progress');
            setProgress(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !progress) {
        return (
            <div style={styles.panel}>
                <div style={styles.loading}>Loading your progress...</div>
            </div>
        );
    }

    const chartData = progress.recentSessions
        .slice()
        .reverse()
        .map((s, i) => ({
            name: `Session ${i + 1}`,
            accuracy: s.accuracy,
            words: s.words,
            date: new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }));

    return (
        <div style={styles.panel} className="animate-fade-in">
            <h3 style={styles.sectionTitle}>My Reading Progress</h3>
            <p style={styles.hint}>Track your improvement over time</p>

            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <span style={styles.statIcon}>📚</span>
                    <span style={styles.statValue}>{progress.totalSessions}</span>
                    <span style={styles.statLabel}>Total Sessions</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statIcon}>✓</span>
                    <span style={styles.statValue}>{Math.round(progress.avgAccuracy)}%</span>
                    <span style={styles.statLabel}>Average Accuracy</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statIcon}>📊</span>
                    <span style={styles.statValue}>
                        E:{progress.byDifficulty.easy} M:{progress.byDifficulty.medium} H:{progress.byDifficulty.hard}
                    </span>
                    <span style={styles.statLabel}>Easy / Medium / Hard</span>
                </div>
            </div>

            {chartData.length > 0 ? (
                <div style={styles.chartContainer}>
                    <h4 style={styles.chartTitle}>Accuracy Over Recent Sessions</h4>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                            <Tooltip
                                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                                formatter={(value) => [`${value}%`, 'Accuracy']}
                                labelFormatter={(_, payload) => payload[0]?.payload?.date}
                            />
                            <Area
                                type="monotone"
                                dataKey="accuracy"
                                stroke="var(--accent-primary)"
                                strokeWidth={2}
                                fill="url(#accuracyGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div style={styles.emptyState}>
                    <span style={{ fontSize: 48, opacity: 0.4 }}>📈</span>
                    <p style={styles.emptyText}>No reading practice sessions yet.</p>
                    <p style={styles.emptySub}>Use the "Practice Reading" tab to paste text and read aloud — your progress will appear here.</p>
                </div>
            )}
        </div>
    );
}

const styles = {
    panel: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 24 },
    sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 },
    hint: { color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 24 },
    loading: { textAlign: 'center', padding: 40, color: 'var(--text-muted)' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 32 },
    statCard: { background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 20, textAlign: 'center' },
    statIcon: { fontSize: '1.5rem', display: 'block', marginBottom: 8 },
    statValue: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)', display: 'block' },
    statLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 },
    chartContainer: { marginTop: 16 },
    chartTitle: { fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 },
    emptyState: { textAlign: 'center', padding: 48 },
    emptyText: { color: 'var(--text-secondary)', marginTop: 12 },
    emptySub: { color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 8 },
};
