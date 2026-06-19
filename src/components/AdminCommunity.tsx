import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Trash2, Ban, ShieldAlert, AlertTriangle, Search, Users, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text?: string;
  mediaType?: string;
  createdAt: any;
}

interface UserStatus {
  status: 'active' | 'banned' | 'blocked';
  warnings: number;
}

export default function AdminCommunity() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>({});
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'messages' | 'users'>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'users' && allUsers.length === 0) {
      const fetchUsers = async () => {
        setUsersLoading(true);
        try {
          const snap = await getDocs(collection(db, 'users'));
          const usersList = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
          })) as any[];
          setAllUsers(usersList);
          
          // Also pre-fill statuses
          const newStatuses: Record<string, UserStatus> = { ...userStatuses };
          usersList.forEach(u => {
            if (u.status || u.warnings !== undefined) {
              newStatuses[u.id] = {
                status: u.status || 'active',
                warnings: u.warnings || 0
              };
            }
          });
          setUserStatuses(newStatuses);
        } catch (error) {
          console.error("Error fetching users:", error);
          toast.error("Failed to load users");
        } finally {
          setUsersLoading(false);
        }
      };
      fetchUsers();
    }
  }, [activeTab]);

  const filteredUsers = allUsers.filter(u => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    const name = (u.name || u.displayName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  useEffect(() => {
    let unsubscribeMessages: () => void;
    // Listen to messages
    const q = query(collection(db, 'community_messages'), orderBy('createdAt', 'desc'));
    unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgs);
      setLoading(false);
      
      // Extract unique user IDs and fetch their status
      const uniqueUserIds = [...new Set(msgs.map(m => m.userId))];
      uniqueUserIds.forEach(fetchUserStatus);
    }, (error: any) => {
      if (error.code !== 'permission-denied') {
        console.error("Snapshot error:", error);
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, []);

  const fetchUserStatus = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setUserStatuses(prev => ({
          ...prev,
          [userId]: userDoc.data() as UserStatus
        }));
      } else {
        setUserStatuses(prev => ({
          ...prev,
          [userId]: { status: 'active', warnings: 0 }
        }));
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'active' | 'banned' | 'blocked') => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { status: newStatus }, { merge: true });
      setUserStatuses(prev => ({
        ...prev,
        [userId]: { ...(prev[userId] || { warnings: 0 }), status: newStatus }
      }));
      toast.success(`User status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update status");
    }
  };

  const warnUser = async (userId: string) => {
    try {
      const currentWarnings = userStatuses[userId]?.warnings || 0;
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { warnings: currentWarnings + 1 }, { merge: true });
      setUserStatuses(prev => ({
        ...prev,
        [userId]: { ...(prev[userId] || { status: 'active' }), warnings: currentWarnings + 1 }
      }));
      toast.success("User warned successfully");
    } catch (error) {
      console.error("Error warning user:", error);
      toast.error("Failed to warn user");
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (window.confirm('Delete this message?')) {
      try {
        await deleteDoc(doc(db, 'community_messages', messageId));
        toast.success("Message deleted successfully");
      } catch (error) {
        console.error("Error deleting message:", error);
        toast.error("Failed to delete message");
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Community</h1>
          <p className="text-sm text-gray-500">Monitor messages and manage user access.</p>
        </div>
      </div>

      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('messages')}
          className={`pb-3 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'messages' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <MessageSquare className="w-4 h-4" />
          Messages
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Users className="w-4 h-4" />
          Users Directory
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'messages' ? (
          <div className="grid grid-cols-1 divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No community messages found.</div>
            ) : messages.map(msg => {
              const status = userStatuses[msg.userId] || { status: 'active', warnings: 0 };
              return (
                <div key={msg.id} className="p-6 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{msg.userName}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">ID: {msg.userId}</span>
                    {status.status === 'banned' && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">Banned</span>
                    )}
                    {status.status === 'blocked' && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">Blocked</span>
                    )}
                    {status.warnings > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">{status.warnings} Warning(s)</span>
                    )}
                  </div>
                  {msg.text && <p className="text-gray-700 text-sm mb-2">{msg.text}</p>}
                  {msg.mediaType && <p className="text-sm text-blue-600 font-medium">[{msg.mediaType.toUpperCase()} ATTACHMENT]</p>}
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end sm:min-w-[140px]">
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Post
                  </button>
                  <button
                    onClick={() => warnUser(msg.userId)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-md transition-colors w-full sm:w-auto"
                  >
                    <AlertTriangle className="w-4 h-4" /> Warn User
                  </button>
                  {status.status === 'active' ? (
                    <>
                      <button
                        onClick={() => updateUserStatus(msg.userId, 'blocked')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors w-full sm:w-auto"
                      >
                        <ShieldAlert className="w-4 h-4" /> Block User
                      </button>
                      <button
                        onClick={() => updateUserStatus(msg.userId, 'banned')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors w-full sm:w-auto"
                      >
                        <Ban className="w-4 h-4" /> Ban User
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => updateUserStatus(msg.userId, 'active')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors w-full sm:w-auto"
                    >
                      Restore Access
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="relative max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 divide-y divide-gray-200 h-full overflow-y-auto max-h-[600px]">
              {usersLoading ? (
                <div className="p-8 text-center text-gray-500">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No users found matching "{searchQuery}"</div>
              ) : filteredUsers.map(user => {
                const status = userStatuses[user.id] || { status: 'active', warnings: 0 };
                return (
                  <div key={user.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{user.name || user.displayName || 'Unknown Name'}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">ID: {user.id}</span>
                        {status.status === 'banned' && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">Banned</span>
                        )}
                        {status.status === 'blocked' && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">Blocked</span>
                        )}
                        {status.warnings > 0 && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">{status.warnings} Warning(s)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Email: {user.email || 'No email provided'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                      <button
                        onClick={() => warnUser(user.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-md transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" /> Warn
                      </button>
                      {status.status === 'active' ? (
                        <>
                          <button
                            onClick={() => updateUserStatus(user.id, 'blocked')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors"
                          >
                            <ShieldAlert className="w-4 h-4" /> Block
                          </button>
                          <button
                            onClick={() => updateUserStatus(user.id, 'banned')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                          >
                            <Ban className="w-4 h-4" /> Ban
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => updateUserStatus(user.id, 'active')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
