import { useState, useEffect, useCallback, useRef } from 'react';

interface IdleDetectionConfig {
  idleThreshold: number; // milliseconds
  notificationDelay: number; // milliseconds after idle threshold
  onIdle: (idleStartTime: Date) => void;
  onReturn: (idleDuration: number) => void;
  isTimerActive: boolean;
}

export const useIdleDetection = ({
  idleThreshold = 15 * 60 * 1000, // 15 minutes
  notificationDelay = 2 * 60 * 1000, // 2 minutes
  onIdle,
  onReturn,
  isTimerActive
}: IdleDetectionConfig) => {
  const [isIdle, setIsIdle] = useState(false);
  const [idleStartTime, setIdleStartTime] = useState<Date | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  const idleTimeoutRef = useRef<NodeJS.Timeout>();
  const notificationTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<Date>(new Date());
  const originalFaviconRef = useRef<string>();
  const originalTitleRef = useRef<string>();

  // Store original favicon and title on mount
  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    originalFaviconRef.current = favicon?.href || '/favicon.ico';
    originalTitleRef.current = document.title;
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (!isTimerActive) return;

    lastActivityRef.current = new Date();
    
    // Clear existing timeouts
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    // If we were idle and user returned, handle return
    if (isIdle) {
      setIsIdle(false);
      setIdleStartTime(null);
      restoreFaviconAndTitle();
      
      if (idleStartTime) {
        const idleDuration = Date.now() - idleStartTime.getTime();
        onReturn(idleDuration);
      }
    }

    // Set new idle timeout
    idleTimeoutRef.current = setTimeout(() => {
      handleIdleDetected();
    }, idleThreshold);
  }, [isTimerActive, isIdle, idleStartTime, idleThreshold, onReturn]);

  const handleIdleDetected = useCallback(() => {
    // Only proceed if tab is hidden (user is not actively using the app)
    if (!document.hidden || !isTimerActive) return;

    const idleStart = new Date(Date.now() - idleThreshold);
    setIsIdle(true);
    setIdleStartTime(idleStart);
    onIdle(idleStart);

    // Change favicon and title
    changeFaviconAndTitle();

    // Set notification timeout
    notificationTimeoutRef.current = setTimeout(() => {
      sendPushNotification();
    }, notificationDelay);
  }, [idleThreshold, notificationDelay, isTimerActive, onIdle]);

  const changeFaviconAndTitle = useCallback(() => {
    // Change favicon to pause icon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      // Create a simple pause icon as data URL
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw pause icon
        ctx.fillStyle = '#f59e0b'; // amber color
        ctx.fillRect(8, 6, 4, 20);
        ctx.fillRect(20, 6, 4, 20);
        favicon.href = canvas.toDataURL();
      }
    }

    // Change title
    document.title = '⏸️ Timer Paused • SoloFlow';
  }, []);

  const restoreFaviconAndTitle = useCallback(() => {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon && originalFaviconRef.current) {
      favicon.href = originalFaviconRef.current;
    }
    
    if (originalTitleRef.current) {
      document.title = originalTitleRef.current;
    }
  }, []);

  const sendPushNotification = useCallback(() => {
    if (!isIdle || !document.hidden || notificationPermission !== 'granted') return;

    const notification = new Notification('SoloFlow: Timer Still Running', {
      body: 'Your timer has been running for over 15 minutes while you\'ve been idle.',
      icon: '/favicon.ico',
      tag: 'soloflow-idle-timer'
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }, [isIdle, notificationPermission]);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return false;
  }, []);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    // Initial timer setup
    if (isTimerActive) {
      resetIdleTimer();
    }

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
      
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [resetIdleTimer, isTimerActive]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isIdle) {
        // User returned to tab while idle
        resetIdleTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isIdle, resetIdleTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isIdle) {
        restoreFaviconAndTitle();
      }
    };
  }, [isIdle, restoreFaviconAndTitle]);

  return {
    isIdle,
    idleStartTime,
    notificationPermission,
    requestNotificationPermission
  };
};