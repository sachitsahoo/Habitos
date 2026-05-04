import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Copy, Check, UserPlus, LogOut, Trophy, Users, Link, X, UserCheck, UserX } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';
import { useGroups } from '../../hooks/useGroups';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { useFriends } from '../../hooks/useFriends';
import { supabase } from '../../lib/supabase';
import type { GroupMemberWithProfile } from '../../hooks/useGroups';

interface LeaderboardViewProps {
  pendingInviteCode: string | null;
  onJoinComplete: (groupId: string) => void;
}

// ── Modal shell ──────────────────────────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const { isDark } = useDarkMode();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        className={`relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl border ${
          isDark ? 'bg-[#243347] border-[#3A4A5E]' : 'bg-white border-[#D4D2CA]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ── Tooltip wrapper ──────────────────────────────────────────────────────────
// Portals to document.body so overflow:hidden ancestors never clip the label.
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top });
  };

  return (
    <div ref={triggerRef} className="flex items-center"
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && createPortal(
        <div
          className="fixed z-[9999] px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none
            bg-[#1A2332] text-[#E8E6E0] shadow-lg"
          style={{ left: pos.x, top: pos.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          {label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A2332]" />
        </div>,
        document.body
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export function LeaderboardView({ pendingInviteCode, onJoinComplete }: LeaderboardViewProps) {
  const { isDark } = useDarkMode();
  const { groups, incomingInvites, loading: groupsLoading, fetchMembers, createGroup, joinByCode, inviteFriend, respondToInvite, kickMember, leaveGroup } = useGroups();
  const { friends, friendIds, pendingOutIds, sendRequest } = useFriends();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joiningCode, setJoiningCode] = useState(false);

  // Modal state
  const [modal, setModal] = useState<'create' | 'join' | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const { rows, loading: lbLoading, refetch: refetchLeaderboard } = useLeaderboard(selectedGroupId, period);

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) setSelectedGroupId(groups[0].id);
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!pendingInviteCode || joiningCode) return;
    setJoiningCode(true);
    joinByCode(pendingInviteCode).then(gid => {
      if (gid) { setSelectedGroupId(gid); onJoinComplete(gid); }
      setJoiningCode(false);
    });
  }, [pendingInviteCode]);

  useEffect(() => {
    if (!selectedGroupId) { setMembers([]); return; }
    fetchMembers(selectedGroupId).then(setMembers);
  }, [selectedGroupId, fetchMembers]);

  // Reset modal state when closing
  const closeModal = () => {
    setModal(null);
    setNewGroupName('');
    setCodeInput('');
    setModalError('');
    setModalLoading(false);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!newGroupName.trim()) { setModalError('Please enter a group name.'); return; }
    setModalLoading(true);
    const gid = await createGroup(newGroupName.trim());
    setModalLoading(false);
    if (gid) { setSelectedGroupId(gid); closeModal(); }
    else setModalError('Failed to create group. Try again.');
  };

  const handleJoinByCode = async () => {
    if (!codeInput.trim()) { setModalError('Please enter an invite code or link.'); return; }

    // Accept full URL (paste the invite link directly) or bare code
    let code = codeInput.trim();
    try {
      const url = new URL(code);
      code = url.searchParams.get('join') ?? code;
    } catch {
      // not a URL — use as-is
    }

    setModalLoading(true);
    const gid = await joinByCode(code);
    setModalLoading(false);
    if (gid) { setSelectedGroupId(gid); closeModal(); }
    else setModalError('Invalid code. Check the link and try again.');
  };

  const handleCopyLink = async () => {
    if (!selectedGroup) return;
    await navigator.clipboard.writeText(`${window.location.origin}?join=${selectedGroup.invite_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddFriend = async (friendId: string) => {
    if (!selectedGroupId) return;
    setAddingFriendId(friendId);
    const ok = await inviteFriend(selectedGroupId, friendId);
    if (ok) fetchMembers(selectedGroupId).then(setMembers);
    setAddingFriendId(null);
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const memberUserIds = new Set(members.map(m => m.user_id));
  const friendsNotInGroup = friends.filter(f => !memberUserIds.has(f.id));
  // Map user_id → role for quick lookup in leaderboard rows
  const memberRoleMap = new Map(members.map(m => [m.user_id, m.role]));
  const currentUserIsAdmin = memberRoleMap.get(currentUserId ?? '') === 'admin';

  // ── Style helpers ────────────────────────────────────────────────────────

  const card = `rounded-xl border transition-colors ${isDark ? 'bg-[#2A3D55] border-[#4A5E72]' : 'bg-white border-[#D4D2CA]'}`;
  const accentText = isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]';
  const mutedText  = isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]';
  const primaryText = isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]';
  const sectionLabel = `uppercase tracking-wider text-xs font-semibold ${mutedText}`;
  const btnAccent = `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
    isDark ? 'bg-[#7AA897]/25 border-[#7AA897]/40 text-[#7AA897] hover:bg-[#7AA897]/35' : 'bg-[#6B9B8C]/10 border-[#6B9B8C]/20 text-[#6B9B8C] hover:bg-[#6B9B8C]/20'
  }`;
  const btnMuted = `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
    isDark ? 'bg-[#3D5068] text-[#C8C8C8] hover:text-[#D66A6A]' : 'bg-[#E8E6E0] text-[#6B6B6B] hover:text-[#C84C4C]'
  }`;
  const inputClass = `w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all ${
    isDark
      ? 'bg-[#1A2332] border-[#3A4A5E] text-[#E8E6E0] placeholder-[#9B9B9B] focus:border-[#7AA897]'
      : 'bg-[#F8F7F4] border-[#D4D2CA] text-[#2D2D2D] placeholder-[#6B6B6B] focus:border-[#6B9B8C]'
  }`;
  const modalTitle = `font-semibold text-lg mb-1 ${primaryText}`;
  const modalDesc  = `text-sm mb-5 ${mutedText}`;

  const medal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

  if (groupsLoading) {
    return (
      <div className="p-6 flex justify-center pt-16">
        <div className={`w-6 h-6 rounded-full border-2 border-t-transparent animate-spin ${isDark ? 'border-[#7AA897]' : 'border-[#6B9B8C]'}`} />
      </div>
    );
  }

  return (
    <>
      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {modal === 'create' && (
        <Modal onClose={closeModal}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className={modalTitle}>Create a Group</p>
              <p className={modalDesc}>Give your group a name. You'll get an invite link to share.</p>
            </div>
            <button onClick={closeModal} className={`p-1 rounded-lg ${mutedText} hover:opacity-70`}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            autoFocus
            type="text"
            value={newGroupName}
            onChange={e => { setNewGroupName(e.target.value); setModalError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="e.g. Study Squad, Morning Crew…"
            maxLength={60}
            className={inputClass}
          />
          {modalError && <p className="text-xs text-[#C84C4C] mt-2">{modalError}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={closeModal} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'bg-[#3A4A5E] text-[#9B9B9B] hover:text-[#E8E6E0]' : 'bg-[#E8E6E0] text-[#6B6B6B] hover:text-[#2D2D2D]'
            }`}>
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={modalLoading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
                isDark ? 'bg-[#7AA897] text-[#1A2332] hover:bg-[#669989]' : 'bg-[#6B9B8C] text-white hover:bg-[#5A8B7D]'
              }`}
            >
              {modalLoading ? 'Creating…' : 'Create Group'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'join' && (
        <Modal onClose={closeModal}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className={modalTitle}>Join with Invite Code</p>
              <p className={modalDesc}>Paste the invite link or just the code from a friend.</p>
            </div>
            <button onClick={closeModal} className={`p-1 rounded-lg ${mutedText} hover:opacity-70`}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            autoFocus
            type="text"
            value={codeInput}
            onChange={e => { setCodeInput(e.target.value); setModalError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleJoinByCode(); }}
            placeholder="Paste link or code…"
            maxLength={512}
            className={inputClass}
          />
          {modalError && <p className="text-xs text-[#C84C4C] mt-2">{modalError}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={closeModal} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'bg-[#3A4A5E] text-[#9B9B9B] hover:text-[#E8E6E0]' : 'bg-[#E8E6E0] text-[#6B6B6B] hover:text-[#2D2D2D]'
            }`}>
              Cancel
            </button>
            <button
              onClick={handleJoinByCode}
              disabled={modalLoading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
                isDark ? 'bg-[#7AA897] text-[#1A2332] hover:bg-[#669989]' : 'bg-[#6B9B8C] text-white hover:bg-[#5A8B7D]'
              }`}
            >
              {modalLoading ? 'Joining…' : 'Join Group'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-4 sm:gap-6 max-w-6xl mx-auto">

        {/* Groups sidebar */}
        <div className="w-full lg:w-60 flex-shrink-0 space-y-3">

          {/* Incoming group invites */}
          {incomingInvites.length > 0 && (
            <div className={`${card} p-4`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className={`${sectionLabel} mb-3`}>Group Invites ({incomingInvites.length})</div>
              <div className="space-y-3">
                {incomingInvites.map(invite => (
                  <div key={invite.id}>
                    <div className={`text-sm font-medium ${primaryText}`}>{invite.group_name}</div>
                    <div className={`text-xs mb-2 ${mutedText}`}>from {invite.invited_by_name}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondToInvite(invite.id, true)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isDark ? 'bg-[#7AA897]/20 text-[#7AA897] hover:bg-[#7AA897]/30' : 'bg-[#6B9B8C]/10 text-[#6B9B8C] hover:bg-[#6B9B8C]/20'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => respondToInvite(invite.id, false)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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

          <div className={`${card} p-4`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className={sectionLabel}>Your Groups</div>
              <div className="flex items-center gap-1">
                <Tooltip label="Create a group">
                  <button
                    onClick={() => setModal('create')}
                    className={`p-1.5 rounded-lg transition-colors ${accentText} ${isDark ? 'hover:bg-[#7AA897]/20' : 'hover:bg-[#6B9B8C]/10'}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip label="Join with invite code">
                  <button
                    onClick={() => setModal('join')}
                    className={`p-1.5 rounded-lg transition-colors ${mutedText} ${isDark ? 'hover:bg-[#2D3E54] hover:text-[#E8E6E0]' : 'hover:bg-[#E8E6E0] hover:text-[#2D2D2D]'}`}
                  >
                    <Link className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Group list */}
            {groups.length === 0 ? (
              <p className={`text-xs py-2 ${mutedText}`}>
                No groups yet.{' '}
                <button onClick={() => setModal('create')} className={`underline underline-offset-2 ${accentText}`}>Create one</button>
                {' or '}
                <button onClick={() => setModal('join')} className={`underline underline-offset-2 ${accentText}`}>join with a link</button>.
              </p>
            ) : (
              <div className="space-y-1">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedGroupId === group.id
                        ? isDark ? 'bg-[#7AA897]/30 text-[#7AA897] font-medium' : 'bg-[#6B9B8C]/15 text-[#6B9B8C] font-medium'
                        : `${primaryText} ${isDark ? 'hover:bg-[#2D3E54]' : 'hover:bg-[#F8F7F4]'}`
                    }`}
                  >
                    <span className="truncate block">{group.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard panel */}
        <div className="flex-1 min-w-0 space-y-4">
          {!selectedGroup ? (
            <div className={`${card} p-12 text-center`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <Trophy className={`w-10 h-10 mx-auto mb-3 opacity-20 ${primaryText}`} />
              <p className={`font-medium ${primaryText}`}>Select a group</p>
              <p className={`text-sm mt-1 ${mutedText}`}>
                <button onClick={() => setModal('create')} className={`underline underline-offset-2 ${accentText}`}>Create a group</button>
                {' or '}
                <button onClick={() => setModal('join')} className={`underline underline-offset-2 ${accentText}`}>join one with a link</button>
                {' to see the leaderboard.'}
              </p>
            </div>
          ) : (
            <>
              {/* Group header */}
              <div className={`${card} p-4 sm:p-5`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className={`font-semibold text-lg ${primaryText}`}>{selectedGroup.name}</h2>
                    <div className={`text-xs mt-0.5 flex items-center gap-1 ${mutedText}`}>
                      <Users className="w-3 h-3" />
                      {members.length} member{members.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleCopyLink} className={btnAccent}>
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Invite link'}
                    </button>
                    <button onClick={() => setShowAddFriend(v => !v)} className={btnAccent}>
                      <UserPlus className="w-3.5 h-3.5" />
                      {showAddFriend ? 'Done' : 'Add friend'}
                    </button>
                  </div>
                </div>

                {/* Add friend panel */}
                {showAddFriend && (
                  <div className={`mt-4 pt-4 border-t ${isDark ? 'border-[#3A4A5E]' : 'border-[#D4D2CA]'}`}>
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${mutedText}`}>
                      Invite friends to {selectedGroup.name}
                    </div>
                    {friendsNotInGroup.length === 0 ? (
                      <p className={`text-xs ${mutedText}`}>
                        {friends.length === 0
                          ? 'No friends yet. Add some in the Friends tab.'
                          : 'All your friends are already in this group.'}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {friendsNotInGroup.map(friend => (
                          <button
                            key={friend.id}
                            onClick={() => handleAddFriend(friend.id)}
                            disabled={addingFriendId === friend.id}
                            className={`${btnAccent} disabled:opacity-50`}
                          >
                            {addingFriendId === friend.id
                              ? <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                              : <UserPlus className="w-3 h-3" />}
                            {friend.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Period picker */}
              <div className={`${card} p-1 flex`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {(['week', 'month', 'all'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      period === p
                        ? isDark ? 'bg-[#7AA897]/30 text-[#7AA897]' : 'bg-[#6B9B8C]/15 text-[#6B9B8C]'
                        : `${mutedText} ${isDark ? 'hover:text-[#E8E6E0]' : 'hover:text-[#2D2D2D]'}`
                    }`}
                  >
                    {p === 'week' ? 'Last 7 Days' : p === 'month' ? 'This Month' : 'All Time'}
                  </button>
                ))}
              </div>

              {/* Leaderboard rows */}
              <div className={`${card} overflow-hidden`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {lbLoading ? (
                  <div className="p-8 flex justify-center">
                    <div className={`w-5 h-5 rounded-full border-2 border-t-transparent animate-spin ${isDark ? 'border-[#7AA897]' : 'border-[#6B9B8C]'}`} />
                  </div>
                ) : rows.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className={`text-sm ${mutedText}`}>No habit data logged yet for this period.</p>
                  </div>
                ) : (
                  <div>
                    {rows.map((row, i) => {
                      const isMe = row.user_id === currentUserId;
                      const m = medal(i);
                      const pct = Math.round(row.completion * 100);
                      const role = memberRoleMap.get(row.user_id);
                      const isAdmin = role === 'admin';
                      const canKick = currentUserIsAdmin && !isMe && !isAdmin;
                      const isAlreadyFriend = friendIds.has(row.user_id);
                      const hasPendingRequest = pendingOutIds.has(row.user_id);
                      const canAddFriend = !isMe && !isAlreadyFriend && !hasPendingRequest;
                      return (
                        <div
                          key={row.user_id}
                          className={`flex items-center gap-3 sm:gap-4 px-4 py-3.5 border-b last:border-0 ${
                            isDark ? 'border-[#3A4A5E]' : 'border-[#D4D2CA]'
                          } ${isMe ? isDark ? 'bg-[#7AA897]/10' : 'bg-[#6B9B8C]/5' : ''}`}
                        >
                          <div
                            className={`w-7 text-center flex-shrink-0 ${m ? 'text-lg leading-none' : `text-sm font-semibold ${mutedText}`}`}
                            style={{ fontFamily: m ? undefined : 'var(--font-mono)' }}
                          >
                            {m ?? i + 1}
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                            isDark ? 'bg-[#2D3E54]' : 'bg-[#E8E6E0]'
                          } ${accentText}`}>
                            {row.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium flex items-center gap-1.5 truncate ${isMe ? accentText : primaryText}`}>
                              <span className="truncate">{row.display_name}</span>
                              {isMe && <span className={`text-xs font-normal flex-shrink-0 ${mutedText}`}>(you)</span>}
                              {isAdmin && (
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
                                  isDark ? 'bg-[#7AA897]/30 text-[#7AA897]' : 'bg-[#6B9B8C]/15 text-[#6B9B8C]'
                                }`}>Admin</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`flex-1 rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-[#2D3E54]' : 'bg-[#E8E6E0]'}`}>
                                <div
                                  className={`h-full rounded-full transition-all ${isDark ? 'bg-[#7AA897]' : 'bg-[#6B9B8C]'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span
                                className={`text-xs flex-shrink-0 font-semibold ${isMe ? accentText : mutedText}`}
                                style={{ fontFamily: 'var(--font-mono)' }}
                              >
                                {pct}%
                              </span>
                            </div>
                          </div>
                          {/* Action buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {canAddFriend && (
                              <Tooltip label={hasPendingRequest ? 'Request sent' : 'Add friend'}>
                                <button
                                  onClick={() => sendRequest(row.user_id, row.display_name)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                    isDark
                                      ? 'text-[#9B9B9B] hover:text-[#7AA897] hover:bg-[#2D3E54]'
                                      : 'text-[#9B9B9B] hover:text-[#6B9B8C] hover:bg-[#E8E6E0]'
                                  }`}
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                </button>
                              </Tooltip>
                            )}
                            {hasPendingRequest && !isMe && (
                              <Tooltip label="Request sent">
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                  isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'
                                }`}>
                                  <UserCheck className="w-3.5 h-3.5" />
                                </span>
                              </Tooltip>
                            )}
                            {canKick && (
                              <Tooltip label="Remove from group">
                                <button
                                  disabled={kickingUserId === row.user_id}
                                  onClick={async () => {
                                    if (!selectedGroupId) return;
                                    setKickingUserId(row.user_id);
                                    const ok = await kickMember(selectedGroupId, row.user_id);
                                    if (ok) {
                                      setMembers(prev => prev.filter(m => m.user_id !== row.user_id));
                                      refetchLeaderboard();
                                    }
                                    setKickingUserId(null);
                                  }}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${
                                    isDark
                                      ? 'text-[#9B9B9B] hover:text-red-400 hover:bg-[#2D3E54]'
                                      : 'text-[#9B9B9B] hover:text-red-500 hover:bg-[#E8E6E0]'
                                  }`}
                                >
                                  {kickingUserId === row.user_id
                                    ? <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                                    : <UserX className="w-3.5 h-3.5" />}
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Leave group */}
              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    if (!selectedGroupId) return;
                    const ok = await leaveGroup(selectedGroupId);
                    if (ok) setSelectedGroupId(null);
                  }}
                  className={btnMuted}
                >
                  <LogOut className="w-3.5 h-3.5" /> Leave group
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
