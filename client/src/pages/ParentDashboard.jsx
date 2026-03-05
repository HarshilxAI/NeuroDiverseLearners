import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function ParentDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('progress');
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [linkEmail, setLinkEmail] = useState('');
    const [linkMsg, setLinkMsg] = useState('');
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const endRef = useRef(null);

    useEffect(() => { loadStudents(); loadTeachers(); }, []);
    useEffect(() => { if (selectedStudent) loadSessions(selectedStudent._id); }, [selectedStudent]);
    useEffect(() => { if (selectedTeacher) loadMsgs(selectedTeacher._id); }, [selectedTeacher]);
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const loadStudents = async () => { try { const r = await api.get('/users/my-students'); setStudents(r.data.students || []); if (r.data.students?.length) setSelectedStudent(r.data.students[0]); } catch (e) { } };
    const loadSessions = async (id) => { try { const r = await api.get(`/test-sessions/student/${id}`); setSessions(r.data.sessions || []); } catch (e) { } };
    const loadTeachers = async () => { try { const r = await api.get('/users/teachers'); setTeachers(r.data.teachers || []); } catch (e) { } };
    const loadMsgs = async (id) => { try { const r = await api.get(`/chat/${id}`); setMessages(r.data.messages || []); } catch (e) { } };

    const handleLink = async () => {
        if (!linkEmail) return;
        try { const r = await api.post('/users/link-student', { studentEmail: linkEmail }); setLinkMsg('✅ ' + r.data.message); setLinkEmail(''); await loadStudents(); }
        catch (e) { setLinkMsg('❌ ' + (e.response?.data?.error || 'Failed')); }
    };

    const handleSend = async (e) => {
        e.preventDefault(); if (!newMessage.trim() || !selectedTeacher) return;
        try { await api.post('/chat', { receiverId: selectedTeacher._id, message: newMessage }); setNewMessage(''); await loadMsgs(selectedTeacher._id); } catch (e) { }
    };

    // Chart data from sessions
    const chartData = sessions.slice().reverse().map((s, i) => ({
        session: `#${i + 1}`,
        cli: +(s.calculatedCLI * 100).toFixed(0),
        time: +(s.rawBehaviorData?.totalTimeMs / 1000).toFixed(0),
        rereads: s.rawBehaviorData?.reReadingCount || 0,
    }));

    return (
        <div style={st.page}>
            <header style={st.header}>
                <div style={st.hLeft}><span style={{ fontSize: 28 }}>🧠</span><h1 style={st.logo}>NeuroAdapt</h1><span style={st.roleTag}>Parent</span></div>
                <div style={st.hRight}><span style={st.uName}>{user?.name}</span><button onClick={logout} style={st.logoutBtn}>Logout</button></div>
            </header>

            <div style={st.tabs}>
                {[{ id: 'progress', l: '📊 Progress' }, { id: 'chat', l: '💬 Teacher Chat' }].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ ...st.tab, ...(activeTab === t.id ? st.tabAct : {}) }}>{t.l}</button>
                ))}
            </div>

            {activeTab === 'progress' && (
                <div className="animate-fade-in">
                    {/* Link student */}
                    <div style={st.linkBox}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 8 }}>Link a Student</h4>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input className="input-field" placeholder="Student email" value={linkEmail} onChange={e => setLinkEmail(e.target.value)} style={{ flex: 1 }} />
                            <button onClick={handleLink} className="btn-primary" style={{ padding: '10px 20px' }}>Link</button>
                        </div>
                        {linkMsg && <p style={{ marginTop: 8, fontSize: '0.85rem', color: linkMsg.startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>{linkMsg}</p>}
                    </div>

                    {students.length === 0 ? (
                        <p style={st.empty}>No students linked yet. Use the form above to link your child's account.</p>
                    ) : (
                        <>
                            {/* Student selector */}
                            <div style={st.studentPills}>
                                {students.map(s => (
                                    <button key={s._id} onClick={() => setSelectedStudent(s)} style={{ ...st.pill, ...(selectedStudent?._id === s._id ? st.pillAct : {}) }}>
                                        {s.name}
                                    </button>
                                ))}
                            </div>

                            {selectedStudent && (
                                <>
                                    <div style={st.profileBar}>
                                        <span style={{ fontWeight: 700 }}>{selectedStudent.name}</span>
                                        <span className={`badge badge-${(selectedStudent.cognitiveProfile || 'typical').toLowerCase()}`}>{selectedStudent.cognitiveProfile || 'Typical'}</span>
                                    </div>

                                    {sessions.length === 0 ? (
                                        <p style={st.empty}>No test sessions yet.</p>
                                    ) : (
                                        <div style={st.chartsGrid}>
                                            <div style={st.chartCard}>
                                                <h4 style={st.chartTitle}>Cognitive Load Index Over Time</h4>
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <LineChart data={chartData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,92,252,0.1)" />
                                                        <XAxis dataKey="session" stroke="var(--text-muted)" fontSize={12} />
                                                        <YAxis stroke="var(--text-muted)" fontSize={12} />
                                                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                                                        <Line type="monotone" dataKey="cli" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 5, fill: 'var(--accent-primary)' }} name="CLI %" />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div style={st.chartCard}>
                                                <h4 style={st.chartTitle}>Reading Time & Re-reads</h4>
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <BarChart data={chartData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,92,252,0.1)" />
                                                        <XAxis dataKey="session" stroke="var(--text-muted)" fontSize={12} />
                                                        <YAxis stroke="var(--text-muted)" fontSize={12} />
                                                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                                                        <Bar dataKey="time" fill="var(--accent-secondary)" name="Time (s)" radius={[4, 4, 0, 0]} />
                                                        <Bar dataKey="rereads" fill="#f87171" name="Re-reads" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="animate-fade-in" style={st.chatLay}>
                    <div style={st.chatSide}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>Teachers</h3>
                        {teachers.map(t => (
                            <button key={t._id} onClick={() => setSelectedTeacher(t)} style={{ ...st.chatP, ...(selectedTeacher?._id === t._id ? st.chatPAct : {}) }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{t.name?.charAt(0)}</div>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</span>
                            </button>
                        ))}
                    </div>
                    <div style={st.chatMain}>
                        {!selectedTeacher ? (
                            <div style={st.chatEmpty}><span style={{ fontSize: 48, opacity: 0.4 }}>💬</span><p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Select a teacher</p></div>
                        ) : (
                            <>
                                <div style={st.chatHead}><h4>{selectedTeacher.name}</h4></div>
                                <div style={st.chatMsgs}>
                                    {messages.map((m, i) => (
                                        <div key={i} style={{ ...st.msg, ...(m.senderId === user?._id ? st.msgS : st.msgR) }}>
                                            <p style={{ fontSize: '0.9rem' }}>{m.message}</p>
                                            <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ))}
                                    <div ref={endRef} />
                                </div>
                                <form onSubmit={handleSend} style={st.chatIn}>
                                    <input className="input-field" placeholder="Type..." value={newMessage} onChange={e => setNewMessage(e.target.value)} style={{ flex: 1 }} />
                                    <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }}>Send</button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const st = {
    page: { maxWidth: 1200, margin: '0 auto', padding: 24, minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
    hLeft: { display: 'flex', alignItems: 'center', gap: 10 },
    logo: { fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    roleTag: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '4px 12px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' },
    hRight: { display: 'flex', alignItems: 'center', gap: 12 },
    uName: { color: 'var(--text-secondary)', fontSize: '0.9rem' },
    logoutBtn: { background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '6px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'var(--font-primary)' },
    tabs: { display: 'flex', gap: 8, marginBottom: 24 },
    tab: { padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.3s' },
    tabAct: { background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)' },
    linkBox: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20 },
    empty: { color: 'var(--text-muted)', fontSize: '0.88rem' },
    studentPills: { display: 'flex', gap: 8, marginBottom: 16 },
    pill: { padding: '8px 20px', borderRadius: 100, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.85rem' },
    pillAct: { background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)' },
    profileBar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' },
    chartsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
    chartCard: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 24 },
    chartTitle: { fontSize: '0.92rem', fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-display)' },
    chatLay: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, minHeight: 500 },
    chatSide: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 16 },
    chatP: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid transparent', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-primary)', color: 'var(--text-primary)', textAlign: 'left', marginBottom: 4 },
    chatPAct: { background: 'rgba(124,92,252,0.1)', borderColor: 'var(--accent-primary)' },
    chatMain: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' },
    chatEmpty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 },
    chatHead: { padding: '16px 20px', borderBottom: '1px solid var(--border-color)' },
    chatMsgs: { flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 350 },
    msg: { maxWidth: '70%', padding: '10px 16px', borderRadius: 'var(--radius-md)' },
    msgS: { alignSelf: 'flex-end', background: 'var(--accent-primary)', color: '#fff', borderBottomRightRadius: 4 },
    msgR: { alignSelf: 'flex-start', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderBottomLeftRadius: 4 },
    chatIn: { display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--border-color)' },
};
