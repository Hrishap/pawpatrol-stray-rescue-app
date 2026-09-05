import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/types/database';

export function useChat(caseId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['chat', caseId],
    enabled: !!caseId,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('case_id', caseId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!caseId) return;
    const channel = supabase
      .channel(`chat-${caseId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `case_id=eq.${caseId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat', caseId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId, queryClient]);

  return query;
}

export async function sendChatMessage(caseId: string, text: string) {
  const { error } = await supabase.rpc('send_chat_message', { p_case_id: caseId, p_text: text });
  if (error) throw error;
}
