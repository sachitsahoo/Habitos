import { useState, useCallback, useRef } from 'react';
import { Search, UserPlus, UserCheck, UserX, Users, Clock, X } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';
import { useFriends } from '../../hooks/useFriends';
import type { DbProfile } from '../../types/db';

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function FriendsView() {
  const { isDark } = useDarkMode();
  const {
    friends, pendingIn, pendingOut,
    pendingOutIds, friendIds,
    loading,
    searchUsers, sendRequest, acceptRequest, declineRequest, removeFriend,
  } = useFriends();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DbProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Debounced search
  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (q.trim().length < 2) { setResults([]); setSearching(false); return; }
      setSearching(true);
      const data = await searchUsers(q);
      setResults(data);
      setSearching(false);
    }, 350),
    [searchUsers],
  );

  const handleQueryChange = (q: string) => {
    setQuery(q);
    doSearch(q);
  };

  const handleSend = async (profile: DbProfile) => {
    await sendRequest(profile.id, profile.display_name);
  };

  const handleRemove = async (friendId: string) => {
    setRemovingId(friendId);
    await removeFriend(friendId);
    setRemovingId(null);
  };

  // Shared class helpers
  const card = `rounded-xl border transition-colors ${isDark ? 'bg-[#243347] border-[#3A4A5E]' : 'bg-white border-[#D4D2CA]'}`;
  const sectionLabel = `uppercase tracking-wider text-xs font-semibold mb-3 ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`;
  const rowBase = `flex items-center gap-3 p-3 rounded-lg transition-colors ${isDark ? 'hover:bg-[#2D3E54]' : 'hover:bg-[#F8F7F4]'}`;
  const avatarBg = isDark ? 'bg-[#2D3E54]' : 'bg-[#E8E6E0]';
  const accentText = isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]';
  const mutedText = isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]';
  const primaryText = isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]';

  const Avatar = ({ name }: { name: string }) => (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm ${avatarBg} ${accentText}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );

  const statusBadge = (profile: DbProfile) => {
    if (friendIds.has(profile.id)) return (
      <span className={`text-xs font-medium flex items-center gap-1 ${accentText}`}>
        <UserCheck className="w-3.5 h-3.5" /> Friends
      </span>
    );
    if (pendingOutIds.has(profile.id)) return (
      <span className={`text-xs font-medium flex items-center gap-1 ${mutedText}`}>
        <Clock className="w-3.5 h-3.5" /> Pending
      </span>
    );
    return (
      <button
        onClick={() => handleSend(profile)}
        className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
          isDark ? 'bg-[#7AA897]/20 text-[#7AA897] hover:bg-[#7AA897]/30' : 'bg-[#6B9B8C]/10 text-[#6B9B8C] hover:bg-[#6B9B8C]/20'
        }`}
      >
        <UserPlus className="w-3.5 h-3.5" /> Add
      </button>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center pt-16">
        <div className={`w-6 h-6 rounded-full border-2 border-t-transparent animate-spin ${isDark ? 'border-[#7AA897]' : 'border-[#6B9B8C]'}`} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">

      {/* Search */}
      <div className={`${card} p-4 sm:p-5`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className={sectionLabel}>Find Friends</div>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedText}`} />
          <input
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search by display name…"
            maxLength={50}
            className={`w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 transition-all ${
              isDark
                ? 'bg-[#1A2332] text-[#E8E6E0] placeholder-[#9B9B9B] focus:ring-[#7AA897]/40'
                : 'bg-[#F8F7F4] text-[#2D2D2D] placeholder-[#6B6B6B] focus:ring-[#6B9B8C]/30'
            }`}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded ${mutedText}`}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Results */}
        {query.trim().length >= 2 && (
          <div className="mt-3 space-y-1">
            {searching && (
              <div className={`text-xs text-center py-3 ${mutedText}`}>Searching…</div>
            )}
            {!searching && results.length === 0 && (
              <div className={`text-sm text-center py-3 ${mutedText}`}>No users found matching "{query}"</div>
            )}
            {!searching && results.map(profile => (
              <div key={profile.id} className={rowBase}>
                <Avatar name={profile.display_name} />
                <span className={`flex-1 text-sm font-medium ${primaryText}`}>{profile.display_name}</span>
                {statusBadge(profile)}
              </div>
            ))}
          </div>
        )}
        {query.trim().length > 0 && query.trim().length < 2 && (
          <p className={`text-xs mt-2 ${mutedText}`}>Type at least 2 characters to search.</p>
        )}
      </div>

      {/* Incoming Requests */}
      {pendingIn.length > 0 && (
        <div className={`${card} p-4 sm:p-5`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className={sectionLabel}>Friend Requests ({pendingIn.length})</div>
          <div className="space-y-1">
            {pendingIn.map(req => (
              <div key={req.id} className={rowBase}>
                <Avatar name={req.from_profile.display_name} />
                <span className={`flex-1 text-sm font-medium ${primaryText}`}>{req.from_profile.display_name}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acceptRequest(req.id, req.from_user, req.from_profile)}
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                      isDark ? 'bg-[#7AA897]/20 text-[#7AA897] hover:bg-[#7AA897]/30' : 'bg-[#6B9B8C]/10 text-[#6B9B8C] hover:bg-[#6B9B8C]/20'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button
                    onClick={() => declineRequest(req.id)}
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                      isDark ? 'bg-[#3A4A5E] text-[#9B9B9B] hover:text-[#D66A6A]' : 'bg-[#E8E6E0] text-[#6B6B6B] hover:text-[#C84C4C]'
                    }`}
                  >
                    <UserX className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {pendingOut.length > 0 && (
        <div className={`${card} p-4 sm:p-5`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className={sectionLabel}>Sent Requests ({pendingOut.length})</div>
          <div className="space-y-1">
            {pendingOut.map(req => (
              <div key={req.requestId} className={rowBase}>
                <Avatar name={req.displayName} />
                <span className={`flex-1 text-sm font-medium ${primaryText}`}>{req.displayName}</span>
                <span className={`text-xs flex items-center gap-1 ${mutedText}`}>
                  <Clock className="w-3.5 h-3.5" /> Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className={`${card} p-4 sm:p-5`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className={sectionLabel} style={{ marginBottom: 0 }}>Your Friends ({friends.length})</div>
          <Users className={`w-4 h-4 ${mutedText}`} />
        </div>
        {friends.length === 0 ? (
          <p className={`text-sm py-4 text-center ${mutedText}`}>
            No friends yet — search above to add some.
          </p>
        ) : (
          <div className="space-y-1">
            {friends.map(friend => (
              <div key={friend.id} className={`${rowBase} group`}>
                <Avatar name={friend.display_name} />
                <span className={`flex-1 text-sm font-medium ${primaryText}`}>{friend.display_name}</span>
                <button
                  onClick={() => handleRemove(friend.id)}
                  disabled={removingId === friend.id}
                  className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${
                    isDark ? 'text-[#9B9B9B] hover:text-[#D66A6A] hover:bg-[#3A4A5E]' : 'text-[#6B6B6B] hover:text-[#C84C4C] hover:bg-[#E8E6E0]'
                  }`}
                  title="Remove friend"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
