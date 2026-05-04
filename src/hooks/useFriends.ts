import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { DbProfile, DbFriendRequest } from '../types/db';

export interface FriendProfile extends DbProfile {
  requestId?: string; // set when there's a pending incoming request
}

export interface PendingOut {
  requestId: string;
  toUserId: string;
  displayName: string;
}

export function useFriends() {
  const [friends, setFriends] = useState<DbProfile[]>([]);
  const [pendingIn, setPendingIn] = useState<(DbFriendRequest & { from_profile: DbProfile })[]>([]);
  const [pendingOut, setPendingOut] = useState<PendingOut[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserIdRef = useRef<string | null>(null);

  const fetchAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    currentUserIdRef.current = user.id;

    // Accepted friends: get friend_ids, then load their profiles
    const { data: friendRows } = await supabase
      .from('friends')
      .select('friend_id')
      .eq('user_id', user.id);

    const friendIds = (friendRows ?? []).map(r => r.friend_id);

    let friendProfiles: DbProfile[] = [];
    if (friendIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, created_at')
        .in('id', friendIds)
        .order('display_name');
      friendProfiles = data ?? [];
    }
    setFriends(friendProfiles);

    // Incoming pending requests + sender profiles
    const { data: inRows } = await supabase
      .from('friend_requests')
      .select('id, from_user, to_user, status, created_at')
      .eq('to_user', user.id)
      .eq('status', 'pending');

    const inWithProfiles: (DbFriendRequest & { from_profile: DbProfile })[] = [];
    for (const req of (inRows ?? []) as DbFriendRequest[]) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, created_at')
        .eq('id', req.from_user)
        .single();
      if (profile) inWithProfiles.push({ ...req, from_profile: profile });
    }
    setPendingIn(inWithProfiles);

    // Outgoing pending requests + recipient profiles
    const { data: outRows } = await supabase
      .from('friend_requests')
      .select('id, from_user, to_user, status, created_at')
      .eq('from_user', user.id)
      .eq('status', 'pending');

    const outWithNames: PendingOut[] = [];
    for (const req of (outRows ?? []) as DbFriendRequest[]) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', req.to_user)
        .single();
      if (profile) outWithNames.push({
        requestId: req.id,
        toUserId: req.to_user,
        displayName: profile.display_name,
      });
    }
    setPendingOut(outWithNames);

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Search profiles excluding self, existing friends, and already-requested users
  const searchUsers = useCallback(async (query: string): Promise<DbProfile[]> => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Escape Postgres LIKE metacharacters so % and _ are treated as literals
    const escaped = trimmed.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');

    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, created_at')
      .ilike('display_name', `%${escaped}%`)
      .neq('id', user.id)
      .order('display_name')
      .limit(20);

    return data ?? [];
  }, []);

  const sendRequest = useCallback(async (toUserId: string, displayName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('friend_requests')
      .insert({ from_user: user.id, to_user: toUserId, status: 'pending' })
      .select('id')
      .single();

    if (!error && data) {
      setPendingOut(prev => [...prev, { requestId: data.id, toUserId, displayName }]);
    }
  }, []);

  const acceptRequest = useCallback(async (requestId: string, _fromUserId: string, fromProfile: DbProfile) => {
    // Bidirectional insert is done server-side via SECURITY DEFINER RPC —
    // the friends INSERT policy only allows inserting rows you own (user_id = you),
    // so the reverse row must be created by the function.
    const { error } = await supabase.rpc('accept_friend_request', { p_request_id: requestId });
    if (error) {
      if (import.meta.env.DEV) console.error('acceptRequest:', error.message);
      return;
    }

    setPendingIn(prev => prev.filter(r => r.id !== requestId));
    setFriends(prev => [...prev, fromProfile].sort((a, b) => a.display_name.localeCompare(b.display_name)));
  }, []);

  const declineRequest = useCallback(async (requestId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('friend_requests')
      .update({ status: 'declined' })
      .eq('id', requestId)
      .eq('to_user', user.id); // defensive: only decline requests addressed to you

    setPendingIn(prev => prev.filter(r => r.id !== requestId));
  }, []);

  const removeFriend = useCallback(async (friendId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Two separate deletes — avoids building a filter string from UUIDs
    await supabase.from('friends').delete().eq('user_id', user.id).eq('friend_id', friendId);
    await supabase.from('friends').delete().eq('user_id', friendId).eq('friend_id', user.id);

    setFriends(prev => prev.filter(f => f.id !== friendId));
  }, []);

  // Set of user IDs with an existing outgoing request (for search result badges)
  const pendingOutIds = new Set(pendingOut.map(p => p.toUserId));
  const friendIds = new Set(friends.map(f => f.id));

  return {
    friends,
    pendingIn,
    pendingOut,
    pendingOutIds,
    friendIds,
    loading,
    searchUsers,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    refetch: fetchAll,
  };
}
