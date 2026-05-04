import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { DbGroup, DbGroupMember } from '../types/db';
import type { DbProfile } from '../types/db';

export type GroupMemberWithProfile = DbGroupMember & { profile: DbProfile };

export interface GroupInvite {
  id: string;
  group_id: string;
  group_name: string;
  invited_by_name: string;
  created_at: string;
}

export function useGroups() {
  const [groups, setGroups] = useState<DbGroup[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberRows } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    const groupIds = (memberRows ?? []).map(r => r.group_id);

    if (groupIds.length === 0) {
      setGroups([]);
      setLoading(false);
    } else {
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });
      setGroups(groupData ?? []);
      setLoading(false);
    }
  }, []);

  const fetchInvites = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: inviteRows } = await supabase
      .from('group_invites')
      .select('id, group_id, invited_by, created_at')
      .eq('invited_user', user.id);

    if (!inviteRows || inviteRows.length === 0) { setIncomingInvites([]); return; }

    // Enrich with group name and inviter display name
    const enriched: GroupInvite[] = [];
    for (const row of inviteRows) {
      const [{ data: group }, { data: inviter }] = await Promise.all([
        supabase.from('groups').select('name').eq('id', row.group_id).single(),
        supabase.from('profiles').select('display_name').eq('id', row.invited_by).single(),
      ]);
      enriched.push({
        id: row.id,
        group_id: row.group_id,
        group_name: group?.name ?? 'Unknown group',
        invited_by_name: inviter?.display_name ?? 'Someone',
        created_at: row.created_at,
      });
    }
    setIncomingInvites(enriched);
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchInvites();
  }, [fetchGroups, fetchInvites]);

  // Re-fetch when the tab regains focus so group membership and invites stay fresh
  useEffect(() => {
    const handleFocus = () => { fetchGroups(); fetchInvites(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchGroups, fetchInvites]);

  const fetchMembers = useCallback(async (groupId: string): Promise<GroupMemberWithProfile[]> => {
    const { data, error } = await supabase.rpc('get_group_members', { p_group_id: groupId });
    if (error || !data) return [];

    return (data as { group_id: string; user_id: string; role: string; joined_at: string; display_name: string }[]).map(row => ({
      group_id: row.group_id,
      user_id: row.user_id,
      role: row.role as 'admin' | 'member',
      joined_at: row.joined_at,
      profile: { id: row.user_id, display_name: row.display_name, created_at: '' },
    }));
  }, []);

  const createGroup = useCallback(async (name: string): Promise<string | null> => {
    const { data, error } = await supabase.rpc('create_group', { group_name: name.trim() });
    if (error || !data) return null;

    const { data: group } = await supabase.from('groups').select('*').eq('id', data).single();
    if (group) setGroups(prev => [group, ...prev]);
    return data as string;
  }, []);

  const joinByCode = useCallback(async (code: string): Promise<string | null> => {
    const { data, error } = await supabase.rpc('join_group_by_code', { code: code.trim() });
    if (error || !data) return null;

    const { data: group } = await supabase.from('groups').select('*').eq('id', data).single();
    if (group) setGroups(prev => prev.some(g => g.id === group.id) ? prev : [group, ...prev]);
    return data as string;
  }, []);

  // Sends a pending invite (does NOT directly add)
  const inviteFriend = useCallback(async (groupId: string, friendId: string): Promise<boolean> => {
    const { error } = await supabase.rpc('add_friend_to_group', {
      p_group_id: groupId,
      p_friend_id: friendId,
    });
    return !error;
  }, []);

  const respondToInvite = useCallback(async (inviteId: string, accept: boolean): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.rpc('respond_to_group_invite', {
      p_invite_id: inviteId,
      p_accept: accept,
    });

    // Optimistic: remove from pending invites
    setIncomingInvites(prev => prev.filter(i => i.id !== inviteId));

    // If accepted, reload groups to include the new one
    if (accept) fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    incomingInvites,
    loading,
    fetchGroups,
    fetchInvites,
    fetchMembers,
    createGroup,
    joinByCode,
    inviteFriend,
    respondToInvite,
  };
}
