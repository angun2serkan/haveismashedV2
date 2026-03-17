import { useEffect, useState, useMemo } from 'react'
import { Search, Trash2, ArrowUpDown, X } from 'lucide-react'
import { adminApi } from '@/services/api'

interface ForumTopic {
  id: string
  title: string
  author_nickname: string | null
  is_anonymous: boolean
  category: string
  like_count: number
  comment_count: number
  is_pinned: boolean
  is_locked: boolean
  is_deleted: boolean
  created_at: string
}

interface ForumReport {
  id: string
  reporter_nickname: string | null
  target_type: string
  target_id: string
  target_preview: string | null
  reported_user_id: string
  reported_user_nickname: string | null
  reason: string
  description: string | null
  status: string
  total_reports_on_target: number
  created_at: string
}

interface ActiveBan {
  id: string
  user_id: string
  nickname: string | null
  banned_until: string | null
  reason: string | null
  total_reports: number
  created_at: string
}

type SortKey = 'title' | 'like_count' | 'comment_count' | 'created_at'

const categoryColors: Record<string, { bg: string; text: string }> = {
  genel: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  soru: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  tartisma: { bg: 'bg-orange-500/15', text: 'text-orange-400' },
  oneri: { bg: 'bg-green-500/15', text: 'text-green-400' },
  sikayet: { bg: 'bg-red-500/15', text: 'text-red-400' },
}

const defaultCategoryColor = { bg: 'bg-dark-600/50', text: 'text-dark-300' }

const BAN_DURATIONS = [
  { value: 24, label: '1 gun (24h)' },
  { value: 72, label: '3 gun (72h)' },
  { value: 168, label: '7 gun (168h)' },
  { value: 720, label: '30 gun (720h)' },
  { value: 0, label: 'Kalici' },
]

export default function ForumPage() {
  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortAsc, setSortAsc] = useState(false)

  // Reports state
  const [reports, setReports] = useState<ForumReport[]>([])
  const [reportsError, setReportsError] = useState('')

  // Active bans state
  const [activeBans, setActiveBans] = useState<ActiveBan[]>([])
  const [bansError, setBansError] = useState('')

  // Ban modal state
  const [banModalUserId, setBanModalUserId] = useState<string | null>(null)
  const [banModalNickname, setBanModalNickname] = useState<string>('')
  const [banDuration, setBanDuration] = useState(24)
  const [banReason, setBanReason] = useState('')
  const [banSubmitting, setBanSubmitting] = useState(false)

  // Active tab
  const [activeTab, setActiveTab] = useState<'topics' | 'reports' | 'bans'>('topics')

  function fetchTopics() {
    adminApi
      .getForumTopics()
      .then(setTopics)
      .catch((err: Error) => setError(err.message))
  }

  function fetchReports() {
    adminApi
      .getForumReports()
      .then(setReports)
      .catch((err: Error) => setReportsError(err.message))
  }

  function fetchBans() {
    adminApi
      .getActiveBans()
      .then(setActiveBans)
      .catch((err: Error) => setBansError(err.message))
  }

  useEffect(() => {
    fetchTopics()
    fetchReports()
    fetchBans()
  }, [])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this topic? This action cannot be undone.')) return
    try {
      await adminApi.deleteForumTopic(id)
      fetchTopics()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete topic')
    }
  }

  async function handleTogglePin(id: string) {
    try {
      await adminApi.toggleForumPin(id)
      fetchTopics()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle pin')
    }
  }

  async function handleToggleLock(id: string) {
    try {
      await adminApi.toggleForumLock(id)
      fetchTopics()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle lock')
    }
  }

  async function handleReviewReport(id: string, status: string) {
    try {
      await adminApi.reviewReport(id, status)
      fetchReports()
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : 'Failed to review report')
    }
  }

  function openBanModal(userId: string, nickname: string) {
    setBanModalUserId(userId)
    setBanModalNickname(nickname)
    setBanDuration(24)
    setBanReason('')
  }

  async function handleBanSubmit() {
    if (!banModalUserId) return
    setBanSubmitting(true)
    try {
      await adminApi.banForumUser(banModalUserId, {
        duration_hours: banDuration,
        reason: banReason.trim() || undefined,
      })
      setBanModalUserId(null)
      fetchReports()
      fetchBans()
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : 'Failed to ban user')
    } finally {
      setBanSubmitting(false)
    }
  }

  async function handleUnban(userId: string) {
    if (!confirm('Unban this user?')) return
    try {
      await adminApi.unbanForumUser(userId)
      fetchBans()
    } catch (err) {
      setBansError(err instanceof Error ? err.message : 'Failed to unban user')
    }
  }

  const filteredTopics = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = topics.filter(
      (t) =>
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.author_nickname && t.author_nickname.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q)
    )

    filtered.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'like_count':
          cmp = a.like_count - b.like_count
          break
        case 'comment_count':
          cmp = a.comment_count - b.comment_count
          break
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      return sortAsc ? cmp : -cmp
    })

    return filtered
  }, [topics, search, sortKey, sortAsc])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString()
  }

  const sortableHeader = (label: string, key: SortKey) => (
    <th
      className="text-left px-4 py-3 text-dark-400 font-medium cursor-pointer hover:text-dark-200 transition-colors select-none"
      onClick={() => handleSort(key)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          size={12}
          className={sortKey === key ? 'text-neon-400' : 'text-dark-600'}
        />
      </span>
    </th>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Forum</h2>
        <span className="text-dark-400 text-sm">{topics.length} total</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-dark-700">
        <button
          onClick={() => setActiveTab('topics')}
          className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer border-b-2 ${
            activeTab === 'topics'
              ? 'border-neon-500 text-neon-500'
              : 'border-transparent text-dark-400 hover:text-dark-200'
          }`}
        >
          Topics
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer border-b-2 ${
            activeTab === 'reports'
              ? 'border-neon-500 text-neon-500'
              : 'border-transparent text-dark-400 hover:text-dark-200'
          }`}
        >
          Reports
          {reports.filter((r) => r.status === 'pending').length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400">
              {reports.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('bans')}
          className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer border-b-2 ${
            activeTab === 'bans'
              ? 'border-neon-500 text-neon-500'
              : 'border-transparent text-dark-400 hover:text-dark-200'
          }`}
        >
          Active Bans
          {activeBans.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-orange-500/20 text-orange-400">
              {activeBans.length}
            </span>
          )}
        </button>
      </div>

      {/* Topics tab */}
      {activeTab === 'topics' && (
        <>
          {error && (
            <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              Failed to load forum topics: {error}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500"
            />
            <input
              placeholder="Search by title, author, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-neon-500 transition-colors"
            />
          </div>

          {/* Topics Table */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dark-800 border-b border-dark-700">
                  {sortableHeader('Title', 'title')}
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Author</th>
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Category</th>
                  {sortableHeader('Likes', 'like_count')}
                  {sortableHeader('Comments', 'comment_count')}
                  <th className="text-center px-4 py-3 text-dark-400 font-medium">Pinned</th>
                  <th className="text-center px-4 py-3 text-dark-400 font-medium">Locked</th>
                  {sortableHeader('Created', 'created_at')}
                  <th className="text-right px-4 py-3 text-dark-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTopics.map((topic) => {
                  const catColor = categoryColors[topic.category] ?? defaultCategoryColor
                  return (
                    <tr
                      key={topic.id}
                      className="border-b border-dark-700/50 hover:bg-dark-900/50"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`text-white font-medium ${topic.is_deleted ? 'line-through text-dark-500' : ''}`}
                        >
                          {topic.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-dark-300">
                        {topic.is_anonymous ? 'Anonim' : (topic.author_nickname ?? 'Anonim')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${catColor.bg} ${catColor.text}`}
                        >
                          {topic.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-dark-300">{topic.like_count}</td>
                      <td className="px-4 py-3 text-dark-300">{topic.comment_count}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleTogglePin(topic.id)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            topic.is_pinned
                              ? 'bg-yellow-500/20 hover:bg-yellow-500/30'
                              : 'bg-dark-700/50 hover:bg-dark-600'
                          }`}
                          title={topic.is_pinned ? 'Unpin topic' : 'Pin topic'}
                        >
                          <span className={topic.is_pinned ? '' : 'opacity-30'}>📌</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleLock(topic.id)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            topic.is_locked
                              ? 'bg-red-500/20 hover:bg-red-500/30'
                              : 'bg-dark-700/50 hover:bg-dark-600'
                          }`}
                          title={topic.is_locked ? 'Unlock topic' : 'Lock topic'}
                        >
                          <span className={topic.is_locked ? '' : 'opacity-30'}>🔒</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-dark-400">{formatDate(topic.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(topic.id)}
                          className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          title="Delete topic"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredTopics.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-dark-500">
                      {search ? 'No topics match your search' : 'No forum topics found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Reports tab */}
      {activeTab === 'reports' && (
        <>
          {reportsError && (
            <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              Failed to load reports: {reportsError}
            </div>
          )}

          <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dark-800 border-b border-dark-700">
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Reporter</th>
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Target</th>
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Reported User</th>
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Reason</th>
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-dark-400 font-medium">Total Reports</th>
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Date</th>
                  <th className="text-right px-4 py-3 text-dark-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className={`border-b border-dark-700/50 hover:bg-dark-900/50 ${
                      report.total_reports_on_target > 3 ? 'bg-yellow-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-dark-300">
                      {report.reporter_nickname ?? 'Anonim'}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-dark-600 text-dark-300">
                          {report.target_type}
                        </span>
                        {report.target_preview && (
                          <p className="text-xs text-dark-400 mt-1 truncate max-w-[200px]">
                            {report.target_preview}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-300">
                      {report.reported_user_nickname ?? 'Anonim'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-dark-300">{report.reason}</span>
                      {report.description && (
                        <p className="text-[10px] text-dark-500 mt-0.5 truncate max-w-[150px]">
                          {report.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                          report.status === 'pending'
                            ? 'bg-yellow-500/15 text-yellow-400'
                            : report.status === 'reviewed'
                              ? 'bg-green-500/15 text-green-400'
                              : 'bg-dark-600 text-dark-400'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-sm font-semibold ${
                          report.total_reports_on_target > 3 ? 'text-yellow-400' : 'text-dark-300'
                        }`}
                      >
                        {report.total_reports_on_target}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {report.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleReviewReport(report.id, 'reviewed')}
                              className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors cursor-pointer"
                              title="Mark as reviewed"
                            >
                              Incele
                            </button>
                            <button
                              onClick={() => handleReviewReport(report.id, 'dismissed')}
                              className="px-2 py-1 text-xs rounded bg-dark-600 text-dark-300 hover:bg-dark-500 transition-colors cursor-pointer"
                              title="Dismiss report"
                            >
                              Reddet
                            </button>
                          </>
                        )}
                        <button
                          onClick={() =>
                            openBanModal(
                              report.reported_user_id,
                              report.reported_user_nickname ?? 'Anonim'
                            )
                          }
                          className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer"
                          title="Ban user"
                        >
                          Ban Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-dark-500">
                      No reports found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Active Bans tab */}
      {activeTab === 'bans' && (
        <>
          {bansError && (
            <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              Failed to load bans: {bansError}
            </div>
          )}

          <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dark-800 border-b border-dark-700">
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Nickname</th>
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Banned Until</th>
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Reason</th>
                  <th className="text-center px-4 py-3 text-dark-400 font-medium">Total Reports</th>
                  <th className="text-right px-4 py-3 text-dark-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeBans.map((ban) => (
                  <tr
                    key={ban.id}
                    className="border-b border-dark-700/50 hover:bg-dark-900/50"
                  >
                    <td className="px-4 py-3 text-dark-300 font-medium">
                      {ban.nickname ?? 'Anonim'}
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">
                      {ban.banned_until
                        ? new Date(ban.banned_until).toLocaleString()
                        : 'Kalici'}
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">
                      {ban.reason ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-dark-300">
                      {ban.total_reports}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleUnban(ban.user_id)}
                        className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors cursor-pointer"
                      >
                        Unban
                      </button>
                    </td>
                  </tr>
                ))}
                {activeBans.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-dark-500">
                      No active bans
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Ban Modal */}
      {banModalUserId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBanModalUserId(null)
          }}
        >
          <div className="bg-dark-800 border border-dark-600 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-dark-600">
              <h2 className="text-lg font-semibold text-white">Ban Ver</h2>
              <button
                onClick={() => setBanModalUserId(null)}
                className="text-dark-400 hover:text-neon-500 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-dark-300">
                <span className="text-white font-medium">{banModalNickname}</span> kullanicisina ban ver
              </p>

              {/* Duration */}
              <div>
                <label className="block text-sm text-dark-300 mb-1">Sure</label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(Number(e.target.value))}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-500 transition-colors"
                >
                  {BAN_DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm text-dark-300 mb-1">Sebep (istege bagli)</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Ban sebebi..."
                  rows={3}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-500 transition-colors resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setBanModalUserId(null)}
                  className="px-4 py-2 text-sm rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 transition-colors cursor-pointer"
                >
                  Iptal
                </button>
                <button
                  onClick={handleBanSubmit}
                  disabled={banSubmitting}
                  className="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {banSubmitting ? 'Isleniyor...' : 'Ban Ver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
