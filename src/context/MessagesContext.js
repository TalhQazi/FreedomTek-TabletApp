import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'messages_threads_v1';
const BASE_URL = 'https://freedom-tech.onrender.com';

const MessagesContext = createContext(null);

export function MessagesProvider({ children }) {
  const { accessToken, user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // If not authenticated yet, just load any local cached threads
      if (!accessToken) {
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          const parsed = raw ? JSON.parse(raw) : [];
          if (Array.isArray(parsed)) {
            setThreads(parsed);
          } else {
            setThreads([]);
          }
        } catch {
          setThreads([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/messages/threads`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          // Fallback to any local cache if backend fails
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          const parsed = raw ? JSON.parse(raw) : [];
          setThreads(Array.isArray(parsed) ? parsed : []);
          setLoading(false);
          return;
        }

        const data = await res.json();
        const currentUserId = user?.id || user?._id;

        const mapped = (Array.isArray(data) ? data : []).map((t) => {
          const participants = t.participants || [];
          const other = participants.find((p) => {
            const pid = p._id?.toString?.() || p.id;
            return currentUserId && pid && pid !== currentUserId;
          });

          const contactName =
            t.contactName || other?.firstName || other?.email || t.subject || 'Contact';

          return {
            id: t._id,
            contactName,
            phone: t.contactPhone || '',
            relation: '',
            lastMessage: '',
            lastMessageTime: t.lastMessageAt || t.updatedAt || t.createdAt,
            updatedAt: t.updatedAt || t.createdAt,
            status: t.status || 'pending',
            messages: [],
          };
        });

        setThreads(mapped);
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        } catch {
          // ignore cache errors
        }
      } catch {
        // On network error, try to restore from local cache
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          const parsed = raw ? JSON.parse(raw) : [];
          setThreads(Array.isArray(parsed) ? parsed : []);
        } catch {
          setThreads([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, user?.id]);

  const persist = async (next) => {
    setThreads(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore for now
    }
  };

  const getThreadById = (id) => threads.find((t) => t.id === id) || null;

  const createContact = (contactName, phone, relation) => {
    const id = `local_${Date.now()}`;
    const now = new Date().toISOString();
    const newThread = {
      id,
      contactName,
      phone: phone || '',
      relation: relation || '',
      lastMessage: '',
      updatedAt: now,
      status: 'pending',
      messages: [],
    };
    const next = [newThread, ...threads];
    persist(next);
    return newThread;
  };

  const startNewThread = async (contactName, phone, firstMessageText) => {
    const now = new Date().toISOString();

    // If we have a backend session, create a real thread.
    // On failure, surface the error so UI can show it instead of pretending success.
    if (accessToken) {
      const res = await fetch(`${BASE_URL}/messages/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          // Store the actual first message text as subject for admin view
          subject: firstMessageText,
          recipientIds: [],
          body: firstMessageText,
          attachments: [],
          contactName,
          contactPhone: phone || '',
        }),
      });

      if (!res.ok) {
        let message = 'Failed to start conversation';
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      const thread = await res.json();

      const newThread = {
        id: thread._id,
        contactName,
        phone: phone || '',
        relation: '',
        lastMessage: firstMessageText,
        lastMessageTime: thread.lastMessageAt || now,
        updatedAt: thread.updatedAt || now,
        status: thread.status || 'pending',
        messages: [
          {
            id: `m_${Date.now()}`,
            text: firstMessageText,
            fromMe: true,
            createdAt: now,
          },
        ],
      };

      const next = [newThread, ...threads];
      await persist(next);
      return newThread;
    }

    const localId = `local_${Date.now()}`;
    const newLocalThread = {
      id: localId,
      contactName,
      phone: phone || '',
      relation: '',
      lastMessage: firstMessageText,
      lastMessageTime: now,
      updatedAt: now,
      status: 'pending',
      messages: [
        {
          id: `m_${Date.now()}`,
          text: firstMessageText,
          fromMe: true,
          createdAt: now,
        },
      ],
    };
    const nextLocal = [newLocalThread, ...threads];
    await persist(nextLocal);
    return newLocalThread;
  };

  const sendMessage = async (threadId, text, fromMe = true) => {
    const now = new Date().toISOString();

    let effectiveThreadId = threadId;
    let updatedThreads = threads;

    // If we are authenticated and this is still a local thread, promote it to a real backend thread
    if (accessToken && threadId.startsWith('local_')) {
      const localThread = threads.find((thread) => thread.id === threadId);

      if (localThread) {
        try {
          const res = await fetch(`${BASE_URL}/messages/threads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              // Use the actual message text as subject for admin view
              subject: text,
              contactName: localThread.contactName || 'Conversation',
              contactPhone: localThread.phone || '',
              recipientIds: [],
              body: text,
              attachments: [],
            }),
          });

          if (res.ok) {
            const apiThread = await res.json();
            effectiveThreadId = apiThread._id;

            // Replace local thread with backend-mapped thread
            updatedThreads = threads.map((thread) => {
              if (thread.id !== threadId) return thread;

              return {
                id: apiThread._id,
                contactName: localThread.contactName,
                phone: localThread.phone || '',
                relation: localThread.relation || '',
                lastMessage: text,
                lastMessageTime: apiThread.lastMessageAt || now,
                updatedAt: apiThread.updatedAt || now,
                status: apiThread.status || 'pending',
                messages: (thread.messages || []),
              };
            });
          }
        } catch {
          // if promotion fails, we'll still append locally below
        }
      }
    }

    // Try to send to backend if this is now a real thread and we are authenticated
    if (accessToken && !effectiveThreadId.startsWith('local_')) {
      // If we just promoted a local thread, the first message body was already sent in createThread
      // For subsequent messages, call the message send endpoint
      const isFirstForPromoted = threadId.startsWith('local_');

      if (!isFirstForPromoted) {
        try {
          await fetch(`${BASE_URL}/messages/threads/${effectiveThreadId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              body: text,
              attachments: [],
            }),
          });
        } catch {
          // ignore network errors for now, still append locally
        }
      }
    }

    const next = updatedThreads.map((thread) => {
      if (thread.id !== effectiveThreadId) return thread;
      const msg = {
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        text,
        fromMe,
        createdAt: now,
      };
      return {
        ...thread,
        lastMessage: text,
        lastMessageTime: now,
        updatedAt: now,
        messages: [...(thread.messages || []), msg],
      };
    });
    await persist(next);
  };

  const deleteThread = (threadId) => {
    const next = threads.filter((thread) => thread.id !== threadId);
    persist(next);
  };

  const value = {
    threads,
    loading,
    getThreadById,
    createContact,
    startNewThread,
    sendMessage,
    deleteThread,
  };

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) {
    throw new Error('useMessages must be used within MessagesProvider');
  }
  return ctx;
}
