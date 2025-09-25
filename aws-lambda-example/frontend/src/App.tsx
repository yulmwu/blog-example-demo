import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'

const API_URL = 'https://43b9hejp5e.execute-api.ap-northeast-2.amazonaws.com'

let accessToken = ''

const fetchWithAuth = async (input: RequestInfo, init: RequestInit = {}) => {
    if (!init.headers) init.headers = {}
    ;(init.headers as any)['Authorization'] = `Bearer ${accessToken}`

    let res = await fetch(input, init)
    if (res.status === 401) {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, { credentials: 'include', method: 'POST' })
        if (refreshRes.ok) {
            const json = await refreshRes.json()
            accessToken = json.accessToken
            ;(init.headers as any)['Authorization'] = `Bearer ${accessToken}`
            res = await fetch(input, init)
        } else {
            throw new Error('Unauthorized')
        }
    }
    return res
}

const AuthContext = React.createContext({ user: '', setUser: (_: string) => {} })

const Login = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const { setUser } = React.useContext(AuthContext)
    const nav = useNavigate()

    const login = async () => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
        })
        if (res.ok) {
            const json = await res.json()
            accessToken = json.accessToken
            setUser(username)
            nav('/')
        } else {
            alert('Login failed')
        }
    }

    return (
        <div className='p-4 max-w-md mx-auto'>
            <h2 className='text-xl font-bold mb-4'>로그인</h2>
            <input
                className='border p-2 w-full mb-2'
                placeholder='아이디'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                className='border p-2 w-full mb-2'
                placeholder='비밀번호'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button className='bg-blue-500 text-white px-4 py-2' onClick={login}>
                로그인
            </button>
        </div>
    )
}

const Home = () => {
    const { user, setUser } = React.useContext(AuthContext)
    const [posts, setPosts] = useState<any[]>([])
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    const loadPosts = async () => {
        const res = await fetch(`${API_URL}/posts`)
        const json = await res.json()
        setPosts(json)
    }

    useEffect(() => {
        loadPosts()
    }, [])

    const logout = async () => {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            credentials: 'include',
        })
        accessToken = ''
        setUser('')
    }

    const createPost = async () => {
        const res = await fetchWithAuth(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content }),
        })
        if (res.ok) {
            setTitle('')
            setContent('')
            loadPosts()
        }
    }

    return (
        <div className='p-4 max-w-2xl mx-auto'>
            <h2 className='text-2xl font-bold mb-4'>게시판</h2>
            {user ? (
                <div className='mb-4'>
                    환영합니다 <strong>{user}</strong>님
                    <button className='ml-4 text-red-500' onClick={logout}>
                        로그아웃
                    </button>
                </div>
            ) : (
                <Link className='text-blue-500' to='/login'>
                    로그인
                </Link>
            )}

            {user && (
                <div className='mb-6'>
                    <input
                        className='border p-2 w-full mb-2'
                        placeholder='제목'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <textarea
                        className='border p-2 w-full mb-2'
                        placeholder='내용'
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <button className='bg-green-500 text-white px-4 py-2' onClick={createPost}>
                        작성
                    </button>
                </div>
            )}

            <ul>
                {posts.map((p) => (
                    <li key={p.id} className='border p-2 mb-2'>
                        <Link className='text-blue-600 font-semibold' to={`/posts/${p.id}`}>
                            {p.title}
                        </Link>
                        <div className='text-sm text-gray-500'>{p.userName}</div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

const PostDetail = ({ id }: { id: string }) => {
    const { user } = React.useContext(AuthContext)
    const [post, setPost] = useState<any | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editContent, setEditContent] = useState('')
    const nav = useNavigate()

    const load = async () => {
        const res = await fetch(`${API_URL}/posts/${id}`)
        const json = await res.json()
        setPost(json)
        setEditTitle(json.title)
        setEditContent(json.content)
    }

    useEffect(() => {
        load()
    }, [id])

    if (!post) return <div className='p-4'>Loading...</div>

    const updatePost = async () => {
        const res = await fetchWithAuth(`${API_URL}/posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: editTitle, content: editContent }),
        })
        if (res.ok) load()
    }

    const deletePost = async () => {
        const res = await fetchWithAuth(`${API_URL}/posts/${id}`, { method: 'DELETE' })
        if (res.ok) nav('/')
    }

    return (
        <div className='p-4 max-w-xl mx-auto'>
            <h2 className='text-xl font-bold mb-2'>{post.title}</h2>
            <p className='mb-4'>{post.content}</p>
            <p className='text-sm text-gray-500 mb-4'>작성자: {post.userName}</p>

            {user === post.userName && (
                <div>
                    <input
                        className='border p-2 w-full mb-2'
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <textarea
                        className='border p-2 w-full mb-2'
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                    />
                    <button className='bg-yellow-500 text-white px-4 py-2 mr-2' onClick={updatePost}>
                        수정
                    </button>
                    <button className='bg-red-500 text-white px-4 py-2' onClick={deletePost}>
                        삭제
                    </button>
                </div>
            )}
        </div>
    )
}

const PostDetailWrapper = () => {
    const id = window.location.pathname.split('/').pop() || ''
    return <PostDetail id={id} />
}

const App = () => {
    const [user, setUser] = useState('')

    useEffect(() => {
        const tryRefresh = async () => {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            })
            if (res.ok) {
                const json = await res.json()
                accessToken = json.accessToken
                const info = await fetchWithAuth(`${API_URL}/myinfo`)
                if (info.ok) {
                    const userInfo = await info.json()
                    setUser(userInfo.username)
                }
            }
        }
        tryRefresh()
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            <Router>
                <Routes>
                    <Route path='/' element={<Home />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/posts/:id' element={<PostDetailWrapper />} />
                    <Route path='*' element={<Navigate to='/' />} />
                </Routes>
            </Router>
        </AuthContext.Provider>
    )
}

export default App
