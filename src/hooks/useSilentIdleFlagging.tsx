import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SilentIdleFlaggingConfig {
  activeTimeEntryId: string | null;
  isTimerActive: boolean;
  idleThreshold?: number; // milliseconds, default 15 minutes
}

export const useSilentIdleFlagging = ({
  activeTimeEntryId,
  isTimerActive,
  idleThreshold = 15 * 60 * 1000 // 15 minutes
}: SilentIdleFlaggingConfig) => {
  const idleTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<Date>(new Date());
  const hasFlaggedCurrentEntry = useRef<boolean>(false);

  const flagTimeEntry = useCallback(async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ needs_review: true })
        .eq('id', entryId);

      if (error) {
        console.error('Error flagging time entry:', error);
      } else {
        console.log('Time entry flagged for review:', entryId);
        hasFlaggedCurrentEntry.current = true;
      }
    } catch (error) {
      console.error('Error flagging time entry:', error);
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (!isTimerActive || !activeTimeEntryId) return;

    lastActivityRef.current = new Date();
    
    // Clear existing timeout
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    // Only set new timeout if we haven't already flagged this entry
    if (!hasFlaggedCurrentEntry.current) {
      idleTimeoutRef.current = setTimeout(() => {
        // Only flag if tab is hidden (user is not actively using the app)
        if (document.hidden && activeTimeEntryId && !hasFlaggedCurrentEntry.current) {
          flagTimeEntry(activeTimeEntryId);
        }
      }, idleThreshold);
    }
  }, [isTimerActive, activeTimeEntryId, idleThreshold, flagTimeEntry]);

  // Reset flagging state when timer changes
  useEffect(() => {
    hasFlaggedCurrentEntry.current = false;
  }, [activeTimeEntryId]);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    // Initial timer setup
    if (isTimerActive && activeTimeEntryId) {
      resetIdleTimer();
    }

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
      
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [resetIdleTimer, isTimerActive, activeTimeEntryId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  return null; // This hook doesn't return anything, it just manages the silent flagging
};