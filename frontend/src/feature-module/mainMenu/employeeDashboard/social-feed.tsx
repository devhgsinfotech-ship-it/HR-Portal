import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { APP_CONFIG } from '../../../environment';
import moment from 'moment';

const API_BASE_URL = APP_CONFIG.getBackendUrl();

export const SocialFeed = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [content, setContent] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [commentTexts, setCommentTexts] = useState<{ [key: number]: string }>({});
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [activeCelebrationTab, setActiveCelebrationTab] = useState('birthdays');
    const [celebrations, setCelebrations] = useState({
        birthdaysToday: [],
        upcomingBirthdays: [],
        workAnniversariesToday: [],
        newJoiners: []
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(`${API_BASE_URL}/employees/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCurrentUserId(res.data.id);
            } catch (error) {
                console.error("Failed to fetch current user");
            }
        };
        const fetchCelebrations = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(`${API_BASE_URL}/api/celebrations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCelebrations(res.data);
            } catch (error) {
                console.error("Error fetching celebrations:", error);
            }
        };

        fetchMe();
        fetchPosts();
        fetchCelebrations();
    }, []);

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await axios.get(`${API_BASE_URL}/api/posts?limit=20`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPosts(res.data.posts);
        } catch (error) {
            console.error("Error fetching posts:", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && files.length === 0) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('content', content);
            formData.append('postType', 'GENERAL');

            files.forEach(file => {
                formData.append('attachments', file);
            });

            await axios.post(`${API_BASE_URL}/api/posts`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setContent('');
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchPosts();
        } catch (error) {
            console.error("Error creating post:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (postId: number) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPosts();
        } catch (error) {
            console.error("Error deleting post:", error);
        }
    };

    const handleToggleLike = async (postId: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/posts/${postId}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPosts(); // Refresh likes
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent, postId: number) => {
        e.preventDefault();
        const text = commentTexts[postId];
        if (!text || !text.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/posts/${postId}/comments`, { content: text }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCommentTexts({ ...commentTexts, [postId]: '' });
            fetchPosts(); // Refresh comments
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    return (
        <div className="social-feed d-flex flex-column gap-4 mx-auto w-100" style={{ fontFamily: "'Inter', 'Roboto', sans-serif", maxWidth: '750px' }}>
            <style>
                {`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shimmer {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes spinGradient {
                    0% { --angle: 0deg; }
                    100% { --angle: 360deg; }
                }
                
                .sf-card {
                    background: #ffffff;
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(74, 21, 75, 0.05);
                    border: 1px solid rgba(74, 21, 75, 0.04);
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    animation: fadeUp 0.5s ease-out forwards;
                }
                .sf-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 15px 35px rgba(74, 21, 75, 0.09);
                }
                
                .sf-tab {
                    color: #8392a5;
                    border-bottom: 3px solid transparent;
                    transition: all 0.3s ease;
                    font-weight: 500;
                    padding-bottom: 12px !important;
                }
                .sf-tab:hover {
                    color: #4a154b;
                    background-color: rgba(74, 21, 75, 0.03);
                }
                .sf-tab-active {
                    color: #4a154b;
                    border-bottom: 3px solid #4a154b;
                    font-weight: 700;
                    padding-bottom: 12px !important;
                }
                
                .sf-btn-primary {
                    background: linear-gradient(270deg, #6b21a8, #4a154b, #9333ea, #6b21a8);
                    background-size: 300% 300%;
                    border: none;
                    box-shadow: 0 6px 15px rgba(74, 21, 75, 0.25);
                    transition: all 0.3s ease;
                    animation: shimmer 6s ease infinite;
                }
                .sf-btn-primary:hover:not(:disabled) {
                    transform: scale(1.05) translateY(-2px);
                    box-shadow: 0 10px 20px rgba(74, 21, 75, 0.35);
                }
                
                .sf-avatar-ring {
                    padding: 3px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #f9a8d4, #9333ea);
                    box-shadow: 0 4px 10px rgba(147, 51, 234, 0.2);
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 61px;
                    height: 61px;
                }
                .sf-avatar-ring:hover {
                    transform: scale(1.1) rotate(5deg);
                }
                .sf-avatar-ring img {
                    border: 2px solid #fff;
                    border-radius: 50%;
                    width: 55px;
                    height: 55px;
                    object-fit: cover;
                }
                
                .sf-action-btn {
                    transition: all 0.2s;
                    border-radius: 10px;
                    padding: 8px 14px;
                    color: #64748b;
                }
                .sf-action-btn:hover {
                    background-color: #f1f5f9;
                    color: #4a154b !important;
                    transform: translateY(-1px);
                }
                
                .sf-input-area {
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    transition: all 0.3s ease;
                }
                .sf-input-area:focus-within {
                    background-color: #ffffff;
                    border-color: #9333ea;
                    box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.1);
                }
                .sf-input-area textarea {
                    font-size: 15px !important;
                    color: #1e293b;
                    font-weight: 500;
                    line-height: 1.5;
                }
                
                .sf-announcement-bar {
                    background: linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%);
                    border-left: 4px solid #9333ea;
                }

                /* React Quill Overrides */
                .sf-input-area .ql-toolbar.ql-snow {
                    border: none;
                    border-bottom: 1px solid #e2e8f0;
                    border-radius: 12px 12px 0 0;
                    background-color: #ffffff;
                }
                .sf-input-area .ql-container.ql-snow {
                    border: none;
                    font-family: inherit;
                    font-size: 15px;
                    border-radius: 0 0 12px 12px;
                }
                .sf-input-area .ql-editor {
                    min-height: 100px;
                }
                .sf-input-area .ql-editor.ql-blank::before {
                    color: #94a3b8;
                    font-style: normal;
                }
                `}
            </style>

            {/* 1. Post Creator */}
            <div className="sf-card">
                <div className="card-body py-4 px-4 border-0">
                    <div className="d-flex align-items-center gap-2 mb-3 px-1">
                        <i className="ti ti-edit  fs-16" style={{ color: '#9333ea' }}></i>
                        <span className="fw-bold text-dark  fs-16">Create Post</span>
                    </div>
                    <form onSubmit={handlePostSubmit}>
                        <div className="sf-input-area mb-3 shadow-sm" style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                placeholder="What do you want to share with your peers?"
                                modules={{
                                    toolbar: [
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        ['link', 'clean']
                                    ]
                                }}
                            />
                        </div>

                        {files.length > 0 && (
                            <div className="mt-3 d-flex gap-2 flex-wrap">
                                {files.map((f, i) => (
                                    <div key={i} className="badge bg-white text-dark border px-3 py-2 rounded-pill d-flex align-items-center shadow-sm">
                                        <i className="ti ti-file me-2" style={{ color: '#9333ea' }}></i> {f.name}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <div>
                                <input
                                    type="file"
                                    multiple
                                    className="d-none"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*,video/*,.pdf,.doc,.docx"
                                />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-white border rounded-pill px-4 py-2 text-muted fw-bold shadow-sm sf-action-btn bg-white">
                                    <i className="ti ti-paperclip me-2  fs-16 align-middle" style={{ color: '#9333ea' }}></i> Attach
                                </button>
                            </div>
                            <button type="submit" className="btn btn-sm text-white px-5 py-2 fw-bold rounded-pill sf-btn-primary" disabled={loading || (!content.trim() && files.length === 0)}>
                                {loading ? 'Posting...' : 'Publish'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* 2. Announcements Bar */}
            <div className="sf-card sf-announcement-bar p-3 px-4 d-flex flex-row justify-content-between align-items-center" style={{ animationDelay: '0.1s' }}>
                <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-white shadow-sm" style={{ width: '42px', height: '42px', color: '#9333ea' }}>
                        <i className="ti ti-speakerphone fs-16"></i>
                    </div>
                    <div>
                        <h6 className="mb-0 fw-bold text-dark">Announcements</h6>
                        <span className="text-muted small fw-medium">No new announcements today</span>
                    </div>
                </div>
                <button className="btn btn-sm text-white rounded-circle d-flex align-items-center justify-content-center sf-btn-primary shadow" style={{ width: '36px', height: '36px', padding: 0 }}>
                    <i className="ti ti-plus  fs-16"></i>
                </button>
            </div>

            {/* 3. Celebrations Widget */}
            <div className="sf-card" style={{ animationDelay: '0.2s' }}>
                <div className="d-flex px-3 pt-2 border-bottom border-light align-items-center justify-content-between">
                    <div className="d-flex overflow-auto hide-scrollbar">
                        <button
                            className={`btn btn-link text-decoration-none px-4 py-3 d-flex align-items-center gap-2 rounded-0 text-nowrap ${activeCelebrationTab === 'birthdays' ? 'sf-tab-active' : 'sf-tab'}`}
                            onClick={() => setActiveCelebrationTab('birthdays')}
                        >
                            <span className="badge bg-danger rounded-pill px-2 py-1 me-1">{celebrations.birthdaysToday.length + celebrations.upcomingBirthdays.length}</span> Birthdays
                        </button>
                        <button
                            className={`btn btn-link text-decoration-none px-4 py-3 d-flex align-items-center gap-2 rounded-0 text-nowrap ${activeCelebrationTab === 'anniversaries' ? 'sf-tab-active' : 'sf-tab'}`}
                            onClick={() => setActiveCelebrationTab('anniversaries')}
                        >
                            <span className="badge bg-primary rounded-pill px-2 py-1 me-1">{celebrations.workAnniversariesToday.length}</span> Work Anniversary
                        </button>
                        <button
                            className={`btn btn-link text-decoration-none px-4 py-3 d-flex align-items-center gap-2 rounded-0 text-nowrap ${activeCelebrationTab === 'newjoinees' ? 'sf-tab-active' : 'sf-tab'}`}
                            onClick={() => setActiveCelebrationTab('newjoinees')}
                        >
                            <span className="badge bg-secondary rounded-pill px-2 py-1 me-1">{celebrations.newJoiners.length}</span> New joinees
                        </button>
                    </div>
                </div>

                <div className="card-body px-5 py-4 border-0">
                    {activeCelebrationTab === 'birthdays' && (
                        <div className="animate__animated animate__fadeIn">
                            {/* Birthdays Today */}
                            {celebrations.birthdaysToday.length > 0 && (
                                <>
                                    <h6 className="small fw-bold text-muted text-uppercase tracking-wide mb-3" style={{ letterSpacing: '1px' }}>Birthdays today</h6>
                                    <div className="d-flex flex-wrap gap-4 mb-4">
                                        {celebrations.birthdaysToday.map((emp: any) => (
                                            <div key={emp.id} className="d-flex flex-column align-items-center text-decoration-none">
                                                <div className="sf-avatar-ring mb-2">
                                                    <img src={(emp.profilePhotoUrl && emp.profilePhotoUrl !== 'null') ? (emp.profilePhotoUrl.startsWith('http') ? emp.profilePhotoUrl : `${API_BASE_URL}${emp.profilePhotoUrl.startsWith('/') ? '' : '/'}${emp.profilePhotoUrl}`) : `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random&color=fff&size=100`} alt="Avatar" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random&color=fff&size=100`; }} />
                                                </div>
                                                <span className="fw-bold text-dark text-truncate text-center" style={{ fontSize: '13px', width: '70px' }}>{emp.firstName}</span>
                                                <span className="fw-bold mt-1 px-3 py-1 rounded-pill bg-light" style={{ color: '#9333ea', fontSize: '11px', cursor: 'pointer' }}>Wish</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Upcoming Birthdays */}
                            {celebrations.upcomingBirthdays.length > 0 && (
                                <>
                                    <h6 className="small fw-bold text-muted text-uppercase tracking-wide mt-4 mb-3" style={{ letterSpacing: '1px' }}>Upcoming Birthdays</h6>
                                    <div className="d-flex flex-wrap gap-4">
                                        {celebrations.upcomingBirthdays.map((emp: any) => (
                                            <div key={emp.id} className="d-flex flex-column align-items-center" style={{ width: '64px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                                                <div className="sf-avatar-ring mb-2 border border-2 border-white shadow-sm" style={{ padding: '2px', width: '54px', height: '54px' }}>
                                                    <img src={(emp.profilePhotoUrl && emp.profilePhotoUrl !== 'null') ? (emp.profilePhotoUrl.startsWith('http') ? emp.profilePhotoUrl : `${API_BASE_URL}${emp.profilePhotoUrl.startsWith('/') ? '' : '/'}${emp.profilePhotoUrl}`) : `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random&color=fff&size=100`} style={{ width: '50px', height: '50px' }} alt="Avatar" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random&color=fff&size=100`; }} />
                                                </div>
                                                <span className="fw-semibold text-truncate w-100 text-center text-dark" style={{ fontSize: '12px' }}>{emp.firstName}</span>
                                                <span className="text-muted fw-bold" style={{ fontSize: '11px' }}>{moment(emp.nextBirthday).format('DD MMM')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {celebrations.birthdaysToday.length === 0 && celebrations.upcomingBirthdays.length === 0 && (
                                <div className="text-muted small text-center py-5 fw-medium fs-12 d-flex flex-column align-items-center gap-2">
                                    <i className="ti ti-gift fs-1 text-danger opacity-50"></i>
                                    No upcoming birthdays in the next 30 days
                                </div>
                            )}
                        </div>
                    )}

                    {activeCelebrationTab === 'anniversaries' && (
                        <div className="animate__animated animate__fadeIn">
                            {celebrations.workAnniversariesToday.length > 0 ? (
                                <div className="d-flex flex-wrap gap-4 mb-4">
                                    {celebrations.workAnniversariesToday.map((emp: any) => (
                                        <div key={emp.id} className="d-flex flex-column align-items-center text-decoration-none">
                                            <div className="sf-avatar-ring mb-2" style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}>
                                                <img src={(emp.profilePhotoUrl && emp.profilePhotoUrl !== 'null') ? (emp.profilePhotoUrl.startsWith('http') ? emp.profilePhotoUrl : `${API_BASE_URL}${emp.profilePhotoUrl.startsWith('/') ? '' : '/'}${emp.profilePhotoUrl}`) : `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random&color=fff&size=100`} alt="Avatar" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random&color=fff&size=100`; }} />
                                            </div>
                                            <span className="fw-bold text-dark text-truncate text-center" style={{ fontSize: '13px', width: '70px' }}>{emp.firstName}</span>
                                            <span className="text-primary fw-bold" style={{ fontSize: '11px' }}>{emp.years} {emp.years === 1 ? 'Year' : 'Years'}</span>
                                            <span className="fw-bold mt-1 px-3 py-1 rounded-pill bg-light text-primary" style={{ fontSize: '11px', cursor: 'pointer' }}>Wish</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-muted small text-center py-5 fw-medium fs-12 d-flex flex-column align-items-center gap-2">
                                    <i className="ti ti-medal fs-1 text-primary opacity-50"></i>
                                    No work anniversaries today
                                </div>
                            )}
                        </div>
                    )}

                    {activeCelebrationTab === 'newjoinees' && (
                        <div className="animate__animated animate__fadeIn">
                            {celebrations.newJoiners.length > 0 ? (
                                <div className="d-flex flex-wrap gap-4 mb-4">
                                    {celebrations.newJoiners.map((emp: any) => (
                                        <div key={emp.id} className="d-flex flex-column align-items-center text-decoration-none">
                                            <div className="sf-avatar-ring mb-2" style={{ background: 'linear-gradient(135deg, #9ca3af, #4b5563)' }}>
                                                <img src={(emp.profilePhotoUrl && emp.profilePhotoUrl !== 'null') ? (emp.profilePhotoUrl.startsWith('http') ? emp.profilePhotoUrl : `${API_BASE_URL}${emp.profilePhotoUrl.startsWith('/') ? '' : '/'}${emp.profilePhotoUrl}`) : `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random&color=fff&size=100`} alt="Avatar" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random&color=fff&size=100`; }} />
                                            </div>
                                            <span className="fw-bold text-dark text-truncate text-center" style={{ fontSize: '13px', width: '70px' }}>{emp.firstName}</span>
                                            <span className="text-secondary fw-bold" style={{ fontSize: '11px' }}>Joined {moment(emp.dateOfJoining).format('MMM DD')}</span>
                                            <span className="fw-bold mt-1 px-3 py-1 rounded-pill bg-light text-secondary" style={{ fontSize: '11px', cursor: 'pointer' }}>Welcome</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-muted small text-center py-5 fw-medium fs-12 d-flex flex-column align-items-center gap-2">
                                    <i className="ti ti-users fs-1 text-secondary opacity-50"></i>
                                    No new joinees this month
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Restyled Feed List */}
            <div className="d-flex flex-column gap-4">
                {posts.map(post => (
                    <div className="sf-card overflow-hidden" key={post.id}>
                        <div className="card-body p-4 border-0">
                            <div className="d-flex align-items-start justify-content-between mb-3">
                                <div className="d-flex align-items-center">
                                    <img
                                        src={(post.author.profilePhotoUrl && post.author.profilePhotoUrl !== 'null') ? (post.author.profilePhotoUrl.startsWith('http') ? post.author.profilePhotoUrl : `${API_BASE_URL}${post.author.profilePhotoUrl.startsWith('/') ? '' : '/'}${post.author.profilePhotoUrl}`) : `https://ui-avatars.com/api/?name=${post.author.firstName}+${post.author.lastName}&background=random&color=fff&size=100`}
                                        alt="Author"
                                        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${post.author.firstName}+${post.author.lastName}&background=random&color=fff&size=100`; }}
                                        className="rounded-circle me-3 shadow-sm border"
                                        style={{ width: "48px", height: "48px", objectFit: "cover" }}
                                    />
                                    <div className="d-flex flex-column">
                                        <span className="fw-bold text-dark fs-16">
                                            {post.author.firstName} {post.author.lastName}
                                        </span>
                                        <span className="text-muted fw-medium" style={{ fontSize: '12px' }}>
                                            <i className="ti ti-clock me-1"></i> {moment(post.createdAt).fromNow()}
                                        </span>
                                    </div>
                                </div>

                                {currentUserId === post.authorId && (
                                    <div className="dropdown">
                                        <button className="btn btn-link text-muted p-2 rounded-circle sf-action-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            <i className="ti ti-dots-vertical  fs-16"></i>
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 mt-2">
                                            <li><button className="dropdown-item py-2 fw-medium" type="button"><i className="ti ti-edit me-2 text-primary"></i> Edit Post</button></li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><button className="dropdown-item py-2 fw-medium text-danger" type="button" onClick={() => handleDeletePost(post.id)}><i className="ti ti-trash me-2"></i> Delete Post</button></li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {post.content && (
                                <div
                                    className="mb-4 text-dark fs-16 quill-content"
                                    style={{ lineHeight: '1.6' }}
                                    dangerouslySetInnerHTML={{ __html: post.content }}
                                />
                            )}
                        </div>

                        {/* Beautiful Images/Attachments */}
                        {post.attachments && post.attachments.length > 0 && (
                            <div className="w-100 px-4 pb-2">
                                {post.attachments.map((att: any, idx: number) => (
                                    <div key={idx} className="w-100 mb-3 overflow-hidden rounded-4 shadow-sm border border-light">
                                        {att.fileType === 'image' ? (
                                            <img src={`${API_BASE_URL}/${att.fileUrl}`} alt="Attachment" className="img-fluid w-100" style={{ maxHeight: "350px", objectFit: "cover", backgroundColor: "#f8f9fa", display: "block", objectPosition: "center top" }} />
                                        ) : att.fileType === 'video' ? (
                                            <video src={`${API_BASE_URL}/${att.fileUrl}`} controls className="img-fluid w-100" style={{ maxHeight: "500px", objectFit: "contain", backgroundColor: "#f8f9fa", display: "block" }}></video>
                                        ) : (
                                            <a href={`${API_BASE_URL}/${att.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-light w-100 d-flex align-items-center justify-content-center py-5 rounded-0 text-decoration-none">
                                                <div className="text-center">
                                                    <div className="bg-white rounded-circle shadow-sm d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                                                        <i className="ti ti-file-text fs-2 text-primary"></i>
                                                    </div>
                                                    <span className="fw-bold d-block text-dark text-truncate mx-auto" style={{ maxWidth: "250px" }}>{att.fileName}</span>
                                                    <span className="text-muted small mt-1 d-block">Click to view document</span>
                                                </div>
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="card-body p-4 pt-2 border-0">
                            <div className="d-flex justify-content-between align-items-center border-top border-light pt-3">
                                <div className="d-flex gap-2">
                                    <button onClick={() => handleToggleLike(post.id)} className={`btn sf-action-btn fw-bold d-flex align-items-center gap-2 ${post.likes.some((l: any) => l.employeeId === currentUserId) ? 'text-primary bg-light' : 'text-muted'}`}>
                                        <i className={`ti ti-thumb-up fs-4 ${post.likes.some((l: any) => l.employeeId === currentUserId) ? 'text-primary' : ''}`}></i>
                                        <span>Like</span>
                                    </button>
                                    <button className="btn sf-action-btn fw-bold text-muted d-flex align-items-center gap-2">
                                        <i className="ti ti-message fs-4"></i>
                                        <span>Comment</span>
                                    </button>
                                </div>
                                <span className="text-muted fw-medium" style={{ fontSize: '13px' }}>
                                    {post.likes.length > 0 && <span className="badge bg-light text-dark border me-2"><i className="ti ti-thumb-up text-primary me-1"></i>{post.likes.length}</span>}
                                    {post.comments.length > 0 && <span className="badge bg-light text-dark border"><i className="ti ti-message text-muted me-1"></i>{post.comments.length}</span>}
                                </span>
                            </div>
                        </div>

                        {/* Elegant Comments Section */}
                        {post.comments.length > 0 && (
                            <div className="bg-light px-4 py-3 mx-4 mb-3 rounded-4">
                                {post.comments.map((comment: any, i: number) => (
                                    <div className={`d-flex align-items-start ${i !== post.comments.length - 1 ? 'mb-3' : ''}`} key={comment.id}>
                                        <img
                                            src={(comment.author.profilePhotoUrl && comment.author.profilePhotoUrl !== 'null') ? (comment.author.profilePhotoUrl.startsWith('http') ? comment.author.profilePhotoUrl : `${API_BASE_URL}${comment.author.profilePhotoUrl.startsWith('/') ? '' : '/'}${comment.author.profilePhotoUrl}`) : `https://ui-avatars.com/api/?name=${comment.author.firstName}+${comment.author.lastName}&background=random&color=fff&size=100`}
                                            alt="Author"
                                            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${comment.author.firstName}+${comment.author.lastName}&background=random&color=fff&size=100`; }}
                                            className="rounded-circle me-3 mt-1 shadow-sm border border-white"
                                            style={{ width: "32px", height: "32px", objectFit: "cover" }}
                                        />
                                        <div className="bg-white p-3 rounded-4 shadow-sm w-100 border border-light">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <h6 className="mb-0 fw-bold text-dark fs-16">{comment.author.firstName} {comment.author.lastName}</h6>
                                                <span className="text-muted" style={{ fontSize: '11px' }}>{moment(comment.createdAt).fromNow()}</span>
                                            </div>
                                            <p className="mb-0 text-secondary fs-16" style={{ lineHeight: '1.5' }}>{comment.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Interactive Comment Input */}
                        <div className="card-footer bg-white border-top-0 px-4 pb-4 pt-1">
                            <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="d-flex align-items-center position-relative">
                                <input
                                    type="text"
                                    className="form-control rounded-pill bg-light border-0 py-3 ps-4 pe-5 sf-comment-input transition-all"
                                    placeholder="Write a comment..."
                                    value={commentTexts[post.id] || ''}
                                    onChange={(e) => setCommentTexts({ ...commentTexts, [post.id]: e.target.value })}
                                />
                                <button type="submit" className="btn btn-link position-absolute end-0 text-primary text-decoration-none fw-bold me-2" disabled={!commentTexts[post.id]?.trim()}>
                                    <i className="ti ti-send fs-4"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                ))}

                {posts.length === 0 && !loading && (
                    <div className="sf-card text-center text-muted py-5 d-flex flex-column align-items-center">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                            <i className="ti ti-mood-empty fs-1 text-secondary"></i>
                        </div>
                        <h5 className="fw-bold text-dark">No posts yet</h5>
                        <p className="text-muted">Be the first to start a conversation with your team!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
