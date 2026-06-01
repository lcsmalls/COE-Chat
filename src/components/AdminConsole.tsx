import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { fetchServerMembers } from '../hooks/useServers'
import { getAvatarColor } from '../utils/avatar'
import { getFontFamily, loadFont } from '../utils/fonts'
import { getFlagUrl } from '../utils/flags'
import { renderEmojis, isEmojiOnly, EMOJI_RE } from '../utils/openmoji'
import { nameToEmoji } from 'gemoji'
import type { Profile, Server, Channel, Message, ServerMember } from '../types'
import { Icon } from '../components/Icon'
import { AdminBadge } from '../components/AdminBadge'
import { Select } from '../components/Select'

type Tab = 'servers' | 'users'

const FLAG_RE = /:flag-([a-z0-9-]+):/g
const EMOJI_SHORTCODE_RE = /:([a-z0-9_*+-]+):/gi

function replaceEmojiShortcodes(text: string): string {
  return text.replace(EMOJI_SHORTCODE_RE, (match, name) => {
    const emoji = nameToEmoji[name.toLowerCase()]
    return emoji || match
  })
}

function renderContent(text: string): string {
  const withFlags = text.replace(FLAG_RE, (_, name) => {
    const src = getFlagUrl(name)
    return `<img class="inline-flag" src="${src}" alt="${name}" loading="lazy" />`
  })
  const withShortcodes = replaceEmojiShortcodes(withFlags)
  return renderEmojis(withShortcodes)
}

function MessageAvatar({ profile }: { profile?: Profile }) {
  if (!profile) return <div className="msg-avatar" />
  if (profile.avatar_url) {
    return (
      <div className="msg-avatar">
        <img src={profile.avatar_url} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
      </div>
    )
  }
  const name = profile.display_name || profile.username || '?'
  return (
    <div className="msg-avatar default" style={{ backgroundColor: getAvatarColor(profile.id) }}>
      {name[0].toUpperCase()}
    </div>
  )
}

function FilePreview({ msg }: { msg: Message }) {
  if (!msg.file_url) return null
  const isImage = msg.file_type?.startsWith('image/')
  if (isImage) {
    return (
      <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="msg-image-link">
        <img src={msg.file_url} alt={msg.file_name || ''} className="msg-image" />
      </a>
    )
  }
  const sizeStr = msg.file_size ? formatSize(msg.file_size) : ''
  return (
    <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="msg-file-link" download={msg.file_name || undefined}>
      <span className="file-icon"><Icon name={getFileIcon(msg.file_type || '')} /></span>
      <span className="file-info">
        <span className="file-name">{msg.file_name}</span>
        {sizeStr && <span className="file-size">{sizeStr}</span>}
      </span>
      <span className="file-download"><Icon name="download" /></span>
    </a>
  )
}

function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return 'file_image'
  if (type.startsWith('audio/')) return 'file_audio'
  if (type.startsWith('video/')) return 'file_video'
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('7z') || type.includes('gzip')) return 'file_zip'
  return 'file'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

interface MessageListProps {
  messages: Message[]
  loading: boolean
  onDelete?: (msg: Message) => void
  onEdit?: (msg: Message, newContent: string) => void
}

function MessageList({ messages, loading, onDelete, onEdit }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    for (const msg of messages) {
      if (msg.profile?.message_font) loadFont(msg.profile.message_font)
    }
  }, [messages])

  function startEdit(msg: Message) {
    setEditingId(msg.id)
    setEditText(msg.content)
  }

  function saveEdit() {
    if (editingId !== null && onEdit && editText.trim()) {
      onEdit(messages.find(m => m.id === editingId)!, editText.trim())
    }
    setEditingId(null)
  }

  return (
    <div className="messages-container">
      {loading ? (
        <div className="loading">Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className="empty-messages">No messages</div>
      ) : (
        messages.map((msg, i) => {
          const prev = messages[i - 1]
          const isSameSender = prev && prev.sender_id === msg.sender_id &&
            new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 600000
          const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          const replyMsg = msg.reply_to ? messages.find(m => m.id === msg.reply_to) : null
          return (
            <div id={`msg-${msg.id}`} key={msg.id} className={`msg-row${isSameSender ? ' same-sender' : ''}`}>
              {isSameSender ? (
                <div className="msg-avatar" />
              ) : (
                <MessageAvatar profile={msg.profile} />
              )}
              <div className="msg-body">
                {!isSameSender && (
                  <div className="msg-header">
                    <span className="msg-name" style={{
                      fontFamily: msg.profile?.name_font ? getFontFamily(msg.profile.name_font) : undefined,
                      color: msg.profile?.name_color || undefined,
                      ...((msg.profile?.role === 'admin' || msg.profile?.role === 'owner') ? { textShadow: `1px 0 0.3px ${msg.profile.admin_outline_color || '#cba6f7'}, -1px 0 0.3px ${msg.profile.admin_outline_color || '#cba6f7'}, 0 1px 0.3px ${msg.profile.admin_outline_color || '#cba6f7'}, 0 -1px 0.3px ${msg.profile.admin_outline_color || '#cba6f7'}, 1px 1px 0.3px ${msg.profile.admin_outline_color || '#cba6f7'}, -1px 1px 0.3px ${msg.profile.admin_outline_color || '#cba6f7'}, -1px -1px 0.3px ${msg.profile.admin_outline_color || '#cba6f7'}, 1px -1px 0.3px ${msg.profile.admin_outline_color || '#cba6f7'}` } : {}),
                    }}>
                      {msg.profile?.display_name || msg.profile?.username || 'Unknown'}
                      <AdminBadge role={msg.profile?.role} />
                    </span>
                    <span className="msg-time">{time}</span>
                    <div className="chat-header-spacer" />
                    {(onDelete || onEdit) && (
                      <div className="msg-actions-row">
                        {onEdit && (
                          <button className="msg-reply-btn" onClick={() => startEdit(msg)} title="Edit message">
                            <Icon name="edit" />
                          </button>
                        )}
                        {onDelete && (
                          <button className="msg-reply-btn" onClick={() => onDelete(msg)} title="Delete message">
                            <Icon name="close" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {replyMsg && (
                  <div className="msg-reply-preview" onClick={() => {
                    document.getElementById(`msg-${replyMsg.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}>
                    <div className="msg-reply-line" />
                    <div className="msg-reply-content">
                      <span className="msg-reply-name">
                        {replyMsg.profile?.display_name || replyMsg.profile?.username || 'Unknown'}
                      </span>
                      <span className="msg-reply-text">
                        {replyMsg.content ? replyMsg.content.slice(0, 80) : (replyMsg.file_name || 'File')}
                        {replyMsg.content && replyMsg.content.length > 80 ? '…' : ''}
                      </span>
                    </div>
                  </div>
                )}
                {editingId === msg.id ? (
                  <div className="msg-edit-box">
                    <input
                      type="text"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }; if (e.key === 'Escape') setEditingId(null) }}
                      autoFocus
                      style={{ flex: 1, fontSize: '0.85rem', padding: '0.3rem 0.5rem', background: 'var(--base)', border: '1px solid var(--surface0)', color: 'var(--text)', borderRadius: 4, fontFamily: 'inherit', width: '100%' }}
                    />
                    <div className="msg-edit-actions" style={{ marginTop: '0.25rem', display: 'flex', gap: '0.3rem' }}>
                      <button className="settings-btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }} onClick={saveEdit}>Save</button>
                      <button className="settings-btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }} onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {msg.content && (
                      <div className={`msg-text${isEmojiOnly(msg.content) ? ' msg-emoji-only' : EMOJI_RE.test(msg.content) ? ' msg-has-emoji' : ''}`} style={{
                        fontFamily: msg.profile?.message_font ? getFontFamily(msg.profile.message_font) : undefined,
                      }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                          {renderContent(msg.content)}
                        </ReactMarkdown>
                      </div>
                    )}
                    <FilePreview msg={msg} />
                    {msg.edited && <span className="msg-edited">(edited)</span>}
                  </>
                )}
              </div>
            </div>
          )
        })
      )}
      <div ref={bottomRef} />
    </div>
  )
}

interface Props {
  onClose: () => void
}

export function AdminConsole({ onClose }: Props) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userStatuses, setUserStatuses] = useState<Record<string, string>>({})

  const [tab, setTab] = useState<Tab>('servers')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  const [allServers, setAllServers] = useState<Server[]>([])
  const [serverSearch, setServerSearch] = useState('')
  const [activeServerId, setActiveServerId] = useState<number | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null)
  const [channelMessages, setChannelMessages] = useState<Message[]>([])
  const [channelLoading, setChannelLoading] = useState(false)
  const [serverMembers, setServerMembers] = useState<ServerMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  const [userSearch, setUserSearch] = useState('')
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [userFriends, setUserFriends] = useState<Profile[]>([])
  const [friendsLoading, setFriendsLoading] = useState(false)

  const [dmChatId, setDmChatId] = useState<number | null>(null)
  const [dmMessages, setDmMessages] = useState<Message[]>([])
  const [dmLoading, setDmLoading] = useState(false)
  const [dmFriend, setDmFriend] = useState<Profile | null>(null)

  const [editingProfile, setEditingProfile] = useState(false)
  const [editProfileForm, setEditProfileForm] = useState<Partial<Profile>>({})
  const [editingServer, setEditingServer] = useState(false)
  const [editServerName, setEditServerName] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) setProfile(data)
    })
    fetchAllServers()
    fetchAllUsers()
  }, [user])

  // Poll user statuses
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.rpc('get_online_users')
      if (data) {
        const map: Record<string, string> = {}
        for (const row of data as { user_id: string; status: string }[]) {
          map[row.user_id] = row.status
        }
        setUserStatuses(map)
      }
    }, 10000)
    fetchStatuses()
    return () => clearInterval(interval)
  }, [])

  async function fetchStatuses() {
    const { data } = await supabase.rpc('get_online_users')
    if (data) {
      const map: Record<string, string> = {}
      for (const row of data as { user_id: string; status: string }[]) {
        map[row.user_id] = row.status
      }
      setUserStatuses(map)
    }
  }

  async function fetchAllServers() {
    const { data } = await supabase.from('servers').select('*').order('created_at', { ascending: false })
    if (data) setAllServers(data)
  }

  async function fetchAllUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
    if (data) { setAllUsers(data); setSearchResults(data) }
  }

  async function fetchChannels(serverId: number) {
    const { data } = await supabase.from('channels').select('*').eq('server_id', serverId).order('position', { ascending: true })
    if (data) setChannels(data)
  }

  async function fetchChannelMessages(channelId: number) {
    setChannelLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*, profile:profiles(*)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
    if (data) setChannelMessages(data)
    setChannelLoading(false)
  }

  async function loadServerMembers(serverId: number) {
    setMembersLoading(true)
    const members = await fetchServerMembers(serverId)
    setServerMembers(members)
    setMembersLoading(false)
  }

  function searchUsers() {
    const q = userSearch.trim()
    if (!q) {
      setSearchResults(allUsers)
      return
    }
    const lower = q.toLowerCase()
    setSearchResults(allUsers.filter(p =>
      p.username?.toLowerCase().includes(lower) ||
      p.display_name?.toLowerCase().includes(lower) ||
      p.uid?.toLowerCase().includes(lower) ||
      p.id?.toLowerCase().includes(lower)
    ))
  }

  async function fetchUserFriends(userId: string) {
    setFriendsLoading(true)
    const { data } = await supabase
      .from('friend_requests')
      .select('sender_id, receiver_id')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    if (data) {
      const friendIds = data.map(r => r.sender_id === userId ? r.receiver_id : r.sender_id)
      if (friendIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', friendIds)
        if (profiles) setUserFriends(profiles)
        else setUserFriends([])
      } else {
        setUserFriends([])
      }
    }
    setFriendsLoading(false)
  }

  async function openDm(friend: Profile) {
    if (!selectedUserId) return
    setDmFriend(friend)
    setDmChatId(null)
    const { data } = await supabase
      .rpc('find_or_create_dm', { user_a: selectedUserId, user_b: friend.id }) as { data: number | null }
    const chatId = data as number
    if (chatId) {
      setDmChatId(chatId)
      fetchDmMessages(chatId)
    }
  }

  async function fetchDmMessages(chatId: number) {
    setDmLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*, profile:profiles(*)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
    if (data) setDmMessages(data)
    setDmLoading(false)
  }

  function selectServer(server: Server) {
    setActiveServerId(server.id)
    setActiveChannelId(null)
    setChannelMessages([])
    setEditingServer(false)
    setEditServerName(server.name)
    setServerMembers([])
    fetchChannels(server.id)
    loadServerMembers(server.id)
  }

  function selectChannel(channel: Channel) {
    setActiveChannelId(channel.id)
    fetchChannelMessages(channel.id)
  }

  function selectUser(other: Profile) {
    setSelectedUserId(other.id)
    setSelectedUser(other)
    setEditingProfile(false)
    setEditProfileForm({})
    setDmChatId(null)
    setDmFriend(null)
    setDmMessages([])
    setUserFriends([])
    fetchUserFriends(other.id)
  }

  function switchTab(t: Tab) {
    setTab(t)
    setMsg(null)
    setActiveServerId(null)
    setActiveChannelId(null)
    setChannelMessages([])
    setServerMembers([])
    setSelectedUserId(null)
    setSelectedUser(null)
    setEditingProfile(false)
    setDmChatId(null)
    setDmFriend(null)
    setDmMessages([])
  }

  function startEditProfile() {
    if (!selectedUser) return
    setEditingProfile(true)
    setEditProfileForm({
      username: selectedUser.username,
      uid: selectedUser.uid,
      display_name: selectedUser.display_name,
      role: selectedUser.role || 'user',
      name_color: selectedUser.name_color,
      banner_color: selectedUser.banner_color,
      admin_outline_color: selectedUser.admin_outline_color,
      status: selectedUser.status,
    })
  }

  async function saveProfile() {
    if (!selectedUserId) return
    setMsg(null)
    const { error } = await supabase.from('profiles').update(editProfileForm).eq('id', selectedUserId)
    if (error) setMsg({ type: 'error', text: error.message })
    else {
      setMsg({ type: 'success', text: 'Profile updated' })
      setEditingProfile(false)
      const { data } = await supabase.from('profiles').select('*').eq('id', selectedUserId).single()
      if (data) { setSelectedUser(data); setAllUsers(prev => prev.map(p => p.id === data.id ? data : p)) }
    }
  }

  async function saveServerName() {
    if (!activeServerId || !editServerName.trim()) return
    setMsg(null)
    const { error } = await supabase.from('servers').update({ name: editServerName.trim() }).eq('id', activeServerId)
    if (error) setMsg({ type: 'error', text: error.message })
    else {
      setMsg({ type: 'success', text: 'Server renamed' })
      setEditingServer(false)
      fetchAllServers()
    }
  }

  async function deleteServer() {
    if (!activeServerId) return
    if (!confirm('Delete this server and all its channels and messages?')) return
    const { error } = await supabase.from('servers').delete().eq('id', activeServerId)
    if (error) setMsg({ type: 'error', text: error.message })
    else {
      setMsg({ type: 'success', text: 'Server deleted' })
      setActiveServerId(null)
      setActiveChannelId(null)
      setChannelMessages([])
      setChannels([])
      setServerMembers([])
      fetchAllServers()
    }
  }

  async function deleteChannel(channelId: number) {
    if (!confirm('Delete this channel and all its messages?')) return
    const { error } = await supabase.from('channels').delete().eq('id', channelId)
    if (error) setMsg({ type: 'error', text: error.message })
    else {
      setMsg({ type: 'success', text: 'Channel deleted' })
      if (activeChannelId === channelId) { setActiveChannelId(null); setChannelMessages([]) }
      if (activeServerId) fetchChannels(activeServerId)
    }
  }

  function handleChannelDelete(msg: Message) {
    if (!confirm('Delete this message?')) return
    supabase.from('messages').delete().eq('id', msg.id).then(({ error }) => {
      if (error) setMsg({ type: 'error', text: error.message })
      else setChannelMessages(prev => prev.filter(m => m.id !== msg.id))
    })
  }

  function handleChannelEdit(msg: Message, newContent: string) {
    supabase.from('messages').update({ content: newContent, edited: true, updated_at: new Date().toISOString() }).eq('id', msg.id).then(({ error }) => {
      if (error) setMsg({ type: 'error', text: error.message })
      else setChannelMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: newContent, edited: true } : m))
    })
  }

  function handleDmDelete(msg: Message) {
    if (!confirm('Delete this message?')) return
    supabase.from('messages').delete().eq('id', msg.id).then(({ error }) => {
      if (error) setMsg({ type: 'error', text: error.message })
      else setDmMessages(prev => prev.filter(m => m.id !== msg.id))
    })
  }

  function handleDmEdit(msg: Message, newContent: string) {
    supabase.from('messages').update({ content: newContent, edited: true, updated_at: new Date().toISOString() }).eq('id', msg.id).then(({ error }) => {
      if (error) setMsg({ type: 'error', text: error.message })
      else setDmMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: newContent, edited: true } : m))
    })
  }

  async function removeFriend(friendId: string) {
    if (!selectedUserId || !confirm('Remove this friend?')) return
    await supabase
      .from('friend_requests')
      .delete()
      .eq('status', 'accepted')
      .or(`and(sender_id.eq.${selectedUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${selectedUserId})`)
    await supabase.rpc('delete_dm', { other_user: friendId })
    if (dmFriend?.id === friendId) { setDmChatId(null); setDmFriend(null); setDmMessages([]) }
    fetchUserFriends(selectedUserId)
  }

  const filteredServers = allServers.filter(s =>
    !serverSearch || s.name.toLowerCase().includes(serverSearch.toLowerCase())
  )
  const activeChannel = channels.find(c => c.id === activeChannelId)

  function renderMemberGroups() {
    const grouped: Record<string, { members: ServerMember[]; color: string | null; position: number }> = {}
    const noRoleMembers: ServerMember[] = []
    for (const m of serverMembers) {
      if (m.role) {
        const key = m.role.name
        if (!grouped[key]) grouped[key] = { members: [], color: m.role.color, position: m.role.position }
        grouped[key].members.push(m)
      } else {
        noRoleMembers.push(m)
      }
    }
    const sortedGroups = Object.entries(grouped).sort((a, b) => a[1].position - b[1].position)
    return (
      <>
        {sortedGroups.map(([name, group]) => (
          <div key={name} className="member-role-section">
            <div className="member-role-label" style={group.color ? { color: group.color } : undefined}>
              {name} — {group.members.length}
            </div>
            {group.members.map(m => {
              const p = m.profile as Profile | undefined
              const status = p ? userStatuses[p.id] || 'offline' : 'offline'
              return (
                <div key={m.id} className="member-item">
                  <div style={{ position: 'relative', flexShrink: 0, width: 28, height: 28 }}>
                    <div className="member-item-avatar">
                      {p?.avatar_url ? (
                        <img src={p.avatar_url} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: p ? getAvatarColor(p.id) : 'var(--surface0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--base)' }}>
                          {p ? (p.display_name || p.username || '?')[0].toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                    <span className={`presence-dot ${status}`} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="member-item-name" style={{
                      fontFamily: p?.name_font ? getFontFamily(p.name_font) : undefined,
                      color: p?.name_color || undefined,
                      ...((p?.role === 'admin' || p?.role === 'owner') ? { textShadow: `1px 0 0.3px ${p.admin_outline_color || '#cba6f7'}, -1px 0 0.3px ${p.admin_outline_color || '#cba6f7'}, 0 1px 0.3px ${p.admin_outline_color || '#cba6f7'}, 0 -1px 0.3px ${p.admin_outline_color || '#cba6f7'}, 1px 1px 0.3px ${p.admin_outline_color || '#cba6f7'}, -1px 1px 0.3px ${p.admin_outline_color || '#cba6f7'}, -1px -1px 0.3px ${p.admin_outline_color || '#cba6f7'}, 1px -1px 0.3px ${p.admin_outline_color || '#cba6f7'}` } : {}),
                    }}>
                      {p?.display_name || p?.username || 'Unknown'}
                      <AdminBadge role={p?.role} />
                    </div>
                    <div className="member-item-status">{status}</div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        {noRoleMembers.length > 0 && (
          <div className="member-role-section">
            <div className="member-role-label">Members — {noRoleMembers.length}</div>
            {noRoleMembers.map(m => {
              const p = m.profile as Profile | undefined
              const status = p ? userStatuses[p.id] || 'offline' : 'offline'
              return (
                <div key={m.id} className="member-item">
                  <div style={{ position: 'relative', flexShrink: 0, width: 28, height: 28 }}>
                    <div className="member-item-avatar">
                      {p?.avatar_url ? (
                        <img src={p.avatar_url} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: p ? getAvatarColor(p.id) : 'var(--surface0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--base)' }}>
                          {p ? (p.display_name || p.username || '?')[0].toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                    <span className={`presence-dot ${status}`} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="member-item-name" style={{
                      fontFamily: p?.name_font ? getFontFamily(p.name_font) : undefined,
                      color: p?.name_color || undefined,
                      ...((p?.role === 'admin' || p?.role === 'owner') ? { textShadow: `1px 0 0.3px ${p.admin_outline_color || '#cba6f7'}, -1px 0 0.3px ${p.admin_outline_color || '#cba6f7'}, 0 1px 0.3px ${p.admin_outline_color || '#cba6f7'}, 0 -1px 0.3px ${p.admin_outline_color || '#cba6f7'}, 1px 1px 0.3px ${p.admin_outline_color || '#cba6f7'}, -1px 1px 0.3px ${p.admin_outline_color || '#cba6f7'}, -1px -1px 0.3px ${p.admin_outline_color || '#cba6f7'}, 1px -1px 0.3px ${p.admin_outline_color || '#cba6f7'}` } : {}),
                    }}>
                      {p?.display_name || p?.username || 'Unknown'}
                      <AdminBadge role={p?.role} />
                    </div>
                    <div className="member-item-status">{status}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </>
    )
  }

  return (
    <div className="settings-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="settings-modal admin-modal" style={{ maxWidth: '95vw', width: '95vw', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="settings-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2>Admin Console</h2>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                className={`settings-tab${tab === 'servers' ? ' active' : ''}`}
                onClick={() => switchTab('servers')}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', background: 'none', border: 'none', color: tab === 'servers' ? 'var(--blue)' : 'var(--overlay0)', borderBottom: tab === 'servers' ? '2px solid var(--blue)' : '2px solid transparent', fontFamily: 'inherit' }}
              >
                Servers
              </button>
              <button
                className={`settings-tab${tab === 'users' ? ' active' : ''}`}
                onClick={() => switchTab('users')}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', background: 'none', border: 'none', color: tab === 'users' ? 'var(--blue)' : 'var(--overlay0)', borderBottom: tab === 'users' ? '2px solid var(--blue)' : '2px solid transparent', fontFamily: 'inherit' }}
              >
                Users
              </button>
            </div>
          </div>
          <button className="settings-close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="settings-scroll" style={{ flex: 1, display: 'flex', padding: 0, overflow: 'hidden' }}>
          {/* Left panel */}
          <div style={{ width: 280, minWidth: 280, borderRight: '1px solid var(--surface0)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {tab === 'servers' ? (
              <>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--surface0)' }}>
                  <input
                    className="admin-search"
                    placeholder="Search servers..."
                    value={serverSearch}
                    onChange={e => setServerSearch(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {filteredServers.map(s => (
                    <div
                      key={s.id}
                      className={`list-item clickable${activeServerId === s.id ? ' active' : ''}`}
                      onClick={() => selectServer(s)}
                      style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                    >
                      {s.icon_url ? (
                        <img src={s.icon_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div className="friend-list-avatar default" style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: getAvatarColor(String(s.id)), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--base)', flexShrink: 0 }}>
                          {s.name[0].toUpperCase()}
                        </div>
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.name}</span>
                    </div>
                  ))}
                  {filteredServers.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--overlay0)', fontSize: '0.85rem' }}>No servers found</div>
                  )}
                </div>
                {activeServerId && (
                  <div style={{ borderTop: '1px solid var(--surface0)', flexShrink: 0, overflow: 'auto' }}>
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--overlay0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Channels</span>
                      <button
                        className="sidebar-icon-btn"
                        style={{ fontSize: '0.7rem', padding: '0.15rem 0.3rem', color: 'var(--red)' }}
                        onClick={deleteServer}
                        title="Delete server"
                      >
                        <Icon name="close" />
                      </button>
                    </div>
                    {channels.filter(c => c.type === 'text').map(ch => (
                      <div
                        key={ch.id}
                        className={`list-item clickable${activeChannelId === ch.id ? ' active' : ''}`}
                        style={{ padding: '0.35rem 1rem 0.35rem 1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        onClick={() => selectChannel(ch)}
                      >
                        <span style={{ color: 'var(--overlay0)' }}>#</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ch.name}</span>
                        <button
                          className="sidebar-icon-btn"
                          style={{ fontSize: '0.6rem', padding: '0.1rem 0.2rem', color: 'var(--overlay0)', opacity: 0.4 }}
                          onClick={e => { e.stopPropagation(); deleteChannel(ch.id) }}
                          title="Delete channel"
                        >
                          <Icon name="close" />
                        </button>
                      </div>
                    ))}
                    <div style={{ padding: '0.5rem 1rem' }}>
                      {editingServer ? (
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <input
                            value={editServerName}
                            onChange={e => setEditServerName(e.target.value)}
                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.2rem 0.4rem', background: 'var(--base)', border: '1px solid var(--surface0)', color: 'var(--text)', borderRadius: 4, fontFamily: 'inherit' }}
                            onKeyDown={e => { if (e.key === 'Enter') saveServerName() }}
                          />
                          <button className="settings-btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }} onClick={saveServerName}>Save</button>
                          <button className="settings-btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }} onClick={() => setEditingServer(false)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="settings-btn" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', width: '100%' }} onClick={() => setEditingServer(true)}>
                          Rename Server
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--surface0)' }}>
                  <form onSubmit={e => { e.preventDefault(); searchUsers() }} style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      className="admin-search"
                      placeholder="Search by name, display name, or UID..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                    />
                    <button type="submit" style={{ padding: '0.4rem 0.6rem', border: 'none', background: 'var(--surface0)', color: 'var(--text)', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                      <Icon name="search" />
                    </button>
                  </form>
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {!selectedUser ? (
                    searchResults.length > 0 ? (
                      searchResults.map(p => (
                        <div
                          key={p.id}
                          className="list-item clickable"
                          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                          onClick={() => selectUser(p)}
                        >
                          <div className="friend-list-avatar-wrap" style={{ flexShrink: 0 }}>
                            {p.avatar_url ? (
                              <img src={p.avatar_url} className="friend-list-avatar" alt="" />
                            ) : (
                              <div className="friend-list-avatar default" style={{ backgroundColor: getAvatarColor(p.id) }}>
                                {(p.display_name || p.username || '?')[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="friend-list-name" style={{ fontFamily: p.name_font ? getFontFamily(p.name_font) : undefined, color: p.name_color || undefined }}>
                            {p.display_name || p.username}
                            <AdminBadge role={p.role} />
                          </span>
                          <span className="uid">#{p.uid}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--overlay0)', fontSize: '0.85rem' }}>No users found</div>
                    )
                  ) : (
                    <>
                      <div
                        className="list-item clickable"
                        onClick={() => { setSelectedUserId(null); setSelectedUser(null); setEditingProfile(false); setDmFriend(null); setDmMessages([]) }}
                        style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--surface0)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                      >
                        <Icon name="back" />
                        <span>Back to search</span>
                      </div>
                      <div className="friend-list">
                        <div className="list-header" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                          <span><Icon name="user" /> {selectedUser.display_name || selectedUser.username}</span>
                          <span className="uid">#{selectedUser.uid}</span>
                        </div>
                        {editingProfile ? (
                          <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', borderBottom: '1px solid var(--surface0)' }}>
                            <div className="field-row">
                              <label style={{ fontSize: '0.7rem', minWidth: 70 }}>Username</label>
                              <input value={editProfileForm.username || ''} onChange={e => setEditProfileForm(f => ({ ...f, username: e.target.value }))} style={{ flex: 1, fontSize: '0.8rem', padding: '0.2rem 0.4rem', background: 'var(--base)', border: '1px solid var(--surface0)', color: 'var(--text)', borderRadius: 4, fontFamily: 'inherit' }} />
                            </div>
                            <div className="field-row">
                              <label style={{ fontSize: '0.7rem', minWidth: 70 }}>UID</label>
                              <input value={editProfileForm.uid || ''} onChange={e => setEditProfileForm(f => ({ ...f, uid: e.target.value }))} style={{ flex: 1, fontSize: '0.8rem', padding: '0.2rem 0.4rem', background: 'var(--base)', border: '1px solid var(--surface0)', color: 'var(--text)', borderRadius: 4, fontFamily: 'inherit' }} />
                            </div>
                            <div className="field-row">
                              <label style={{ fontSize: '0.7rem', minWidth: 70 }}>Display Name</label>
                              <input value={editProfileForm.display_name || ''} onChange={e => setEditProfileForm(f => ({ ...f, display_name: e.target.value || null }))} style={{ flex: 1, fontSize: '0.8rem', padding: '0.2rem 0.4rem', background: 'var(--base)', border: '1px solid var(--surface0)', color: 'var(--text)', borderRadius: 4, fontFamily: 'inherit' }} />
                            </div>
                            <div className="field-row">
                              <label style={{ fontSize: '0.7rem', minWidth: 70 }}>Role</label>
                              <Select
                                value={editProfileForm.role || 'user'}
                                onChange={v => setEditProfileForm(f => ({ ...f, role: v }))}
                                options={[
                                  { value: 'user', label: 'User' },
                                  { value: 'moderator', label: 'Moderator' },
                                  { value: 'admin', label: 'Admin' },
                                ]}
                              />
                            </div>
                            <div className="field-row">
                              <label style={{ fontSize: '0.7rem', minWidth: 70 }}>Name Color</label>
                              <input type="color" value={editProfileForm.name_color || '#89b4fa'} onChange={e => setEditProfileForm(f => ({ ...f, name_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: 'none' }} />
                            </div>
                            <div className="field-row">
                              <label style={{ fontSize: '0.7rem', minWidth: 70 }}>Banner Color</label>
                              <input type="color" value={editProfileForm.banner_color || '#313244'} onChange={e => setEditProfileForm(f => ({ ...f, banner_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: 'none' }} />
                            </div>
                            <div className="field-row">
                              <label style={{ fontSize: '0.7rem', minWidth: 70 }}>Outline</label>
                              <input type="color" value={editProfileForm.admin_outline_color || '#cba6f7'} onChange={e => setEditProfileForm(f => ({ ...f, admin_outline_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: 'none' }} />
                            </div>
                            <div className="field-row">
                              <label style={{ fontSize: '0.7rem', minWidth: 70 }}>Status</label>
                              <input value={editProfileForm.status || ''} onChange={e => setEditProfileForm(f => ({ ...f, status: e.target.value || null }))} style={{ flex: 1, fontSize: '0.8rem', padding: '0.2rem 0.4rem', background: 'var(--base)', border: '1px solid var(--surface0)', color: 'var(--text)', borderRadius: 4, fontFamily: 'inherit' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem' }}>
                              <button className="settings-btn" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} onClick={saveProfile}>Save</button>
                              <button className="settings-btn" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} onClick={() => setEditingProfile(false)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '0.4rem 1rem', borderBottom: '1px solid var(--surface0)' }}>
                            <button className="settings-btn" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', width: '100%' }} onClick={startEditProfile}>
                              Edit Profile
                            </button>
                          </div>
                        )}
                        <div style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--overlay0)' }}>
                          Friends ({userFriends.length})
                        </div>
                        {friendsLoading ? (
                          <div className="admin-loading">Loading...</div>
                        ) : userFriends.length === 0 ? (
                          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--overlay0)', fontSize: '0.85rem' }}>No friends</div>
                        ) : (
                          userFriends.map(f => (
                            <div
                              key={f.id}
                              className={`list-item clickable${dmFriend?.id === f.id ? ' active' : ''}`}
                              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                            >
                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }} onClick={() => openDm(f)}>
                                <div className="friend-list-avatar-wrap" style={{ flexShrink: 0 }}>
                                  {f.avatar_url ? (
                                    <img src={f.avatar_url} className="friend-list-avatar" alt="" />
                                  ) : (
                                    <div className="friend-list-avatar default" style={{ backgroundColor: getAvatarColor(f.id) }}>
                                      {(f.display_name || f.username || '?')[0].toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <span className="friend-list-name" style={{ fontFamily: f.name_font ? getFontFamily(f.name_font) : undefined, color: f.name_color || undefined }}>
                                  {f.display_name || f.username}
                                  <AdminBadge role={f.role} />
                                </span>
                              </div>
                              <button
                                className="sidebar-icon-btn"
                                style={{ fontSize: '0.65rem', padding: '0.1rem 0.25rem', color: 'var(--overlay0)', flexShrink: 0 }}
                                onClick={() => removeFriend(f.id)}
                                title="Remove friend"
                              >
                                <Icon name="close" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Center: messages */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {msg && (
              <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: msg.type === 'error' ? 'var(--red)' : 'var(--green)', color: 'var(--base)' }}>
                {msg.text}
              </div>
            )}
            {tab === 'servers' && activeChannel ? (
              <div className="chat-layout" style={{ flex: 1 }}>
                <div className="chat-panel">
                  <div className="chat-panel-header">
                    <span className="channel-hash chat-channel-hash">#</span>
                    <span className="chat-channel-name">{activeChannel.name}</span>
                    <div className="chat-header-spacer" />
                    <span style={{ fontSize: '0.7rem', color: 'var(--overlay0)' }}>admin</span>
                  </div>
                  <MessageList messages={channelMessages} loading={channelLoading} onDelete={handleChannelDelete} onEdit={handleChannelEdit} />
                </div>
              </div>
            ) : tab === 'users' && dmChatId ? (
              <div className="chat-layout" style={{ flex: 1 }}>
                <div className="chat-panel">
                  <div className="chat-panel-header">
                    <span className="chat-partner-name" style={{
                      fontFamily: dmFriend?.name_font ? getFontFamily(dmFriend.name_font) : undefined,
                      color: dmFriend?.name_color || undefined,
                    }}>
                      {dmFriend?.display_name || dmFriend?.username || 'Unknown'}
                      <AdminBadge role={dmFriend?.role} />
                    </span>
                    <div className="chat-header-spacer" />
                    <span style={{ fontSize: '0.7rem', color: 'var(--overlay0)' }}>
                      DM of <strong>{selectedUser?.display_name || selectedUser?.username}</strong>
                    </span>
                  </div>
                  <MessageList messages={dmMessages} loading={dmLoading} onDelete={handleDmDelete} onEdit={handleDmEdit} />
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--overlay0)', flexDirection: 'column', gap: '0.5rem' }}>
                <Icon name="shield" />
                <h3 style={{ margin: 0 }}>Admin Console</h3>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  {tab === 'servers'
                    ? 'Select a server and channel to browse messages'
                    : 'Search for a user to view their friends and DMs'}
                </p>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          {tab === 'servers' && activeServerId && serverMembers.length > 0 && (
            <aside className="member-sidebar" style={{ width: 220, minWidth: 220 }}>
              <div className="member-sidebar-header">
                Members — {serverMembers.length}
              </div>
              {renderMemberGroups()}
            </aside>
          )}
          {tab === 'users' && selectedUser && (
            <aside className="partner-sidebar" style={{ width: 220, minWidth: 220 }}>
              <div className="partner-banner" style={{ backgroundColor: selectedUser.banner_color || 'var(--surface0)' }} />
              <div className="partner-avatar">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <Icon name="user" />
                )}
              </div>
              <div className="partner-name" style={{
                fontFamily: selectedUser.name_font ? getFontFamily(selectedUser.name_font) : undefined,
                color: selectedUser.name_color || undefined,
                ...((selectedUser.role === 'admin' || selectedUser.role === 'owner') ? { textShadow: `1px 0 0.3px ${selectedUser.admin_outline_color || '#cba6f7'}, -1px 0 0.3px ${selectedUser.admin_outline_color || '#cba6f7'}, 0 1px 0.3px ${selectedUser.admin_outline_color || '#cba6f7'}, 0 -1px 0.3px ${selectedUser.admin_outline_color || '#cba6f7'}, 1px 1px 0.3px ${selectedUser.admin_outline_color || '#cba6f7'}, -1px 1px 0.3px ${selectedUser.admin_outline_color || '#cba6f7'}, -1px -1px 0.3px ${selectedUser.admin_outline_color || '#cba6f7'}, 1px -1px 0.3px ${selectedUser.admin_outline_color || '#cba6f7'}` } : {}),
              }}>
                {selectedUser.display_name || selectedUser.username}
                <AdminBadge role={selectedUser.role} />
              </div>
              <div className="partner-tag">{selectedUser.username}#{selectedUser.uid}</div>
              {selectedUser.status && <div className="partner-status">{selectedUser.status}</div>}
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
