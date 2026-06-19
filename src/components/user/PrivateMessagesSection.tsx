import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, serverTimestamp, setDoc, doc, addDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { db as firestore } from '../../firebase';
import { MessageSquare, ArrowLeft, Send } from 'lucide-react';

export default function PrivateMessagesSection() {
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const currentUser = auth.currentUser;
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Load friends
  useEffect(() => {
    let unsubFriends: (() => void) | undefined;
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (unsubFriends) unsubFriends();
        const qFriends = query(collection(db, "users", user.uid, "friends"));
        unsubFriends = onSnapshot(qFriends, (snap) => {
          setFriends(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => { /* ignore */ });
      } else {
        if (unsubFriends) {
          unsubFriends();
          unsubFriends = undefined;
        }
        setFriends([]);
        setSelectedFriend(null);
      }
    });

    return () => {
      unsubAuth();
      if (unsubFriends) unsubFriends();
    };
  }, []);

  // Load messages with friend
  useEffect(() => {
    let unsubMessages: (() => void) | undefined;
    const currentUser = auth.currentUser;
    if (!currentUser || !selectedFriend) return;
    
    // The chat ID is a composite of both UIDs to ensure uniqueness
    const chatId = [currentUser.uid, selectedFriend.friendId].sort().join('_');
    const qMsg = query(collection(db, 'private_chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
    
    let initialLoad = true;
    unsubMessages = onSnapshot(qMsg, (snap) => {
      let shouldScroll = initialLoad;
      snap.docChanges().forEach(change => {
        if (change.type === 'added') shouldScroll = true;
      });
      initialLoad = false;
      
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      if (shouldScroll) {
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }, (err) => { /* ignore */ });

    return () => {
      if (unsubMessages) unsubMessages();
    };
  }, [selectedFriend]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedFriend || !newMessage.trim()) return;

    const chatId = [currentUser.uid, selectedFriend.friendId].sort().join('_');
    try {
      await addDoc(collection(db, 'private_chats', chatId, 'messages'), {
        text: newMessage,
        senderId: currentUser.uid,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      console.error("Error sending private message", err);
    }
  };

  if (selectedFriend) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-black relative">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <button onClick={() => setSelectedFriend(null)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-bold">
               {selectedFriend.friendName.charAt(0).toUpperCase()}
             </div>
             <h3 className="font-bold">{selectedFriend.friendName}</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full opacity-50 flex-col gap-2">
              <MessageSquare className="w-8 h-8" />
              <p>Envoyez un message pour commencer la conversation.</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.senderId === currentUser?.uid;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[70%] ${isMe ? 'bg-amber-500 text-white rounded-br-none' : 'bg-neutral-100 dark:bg-neutral-800 rounded-bl-none'}`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
          <form onSubmit={handleSendMessage} className="flex gap-2 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
              placeholder="Écrivez un message..."
              className="flex-1 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none min-h-[40px] max-h-32"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button type="submit" disabled={!newMessage.trim()} className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-amber-500" />
        Messages Privés
      </h2>

      {friends.length === 0 ? (
        <div className="text-center opacity-50 p-8 flex flex-col items-center">
          <MessageSquare className="w-12 h-12 mb-4" />
          <p>Vous n'avez pas encore d'amis pour discuter en privé.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {friends.map(friend => (
            <div 
              key={friend.id} 
              onClick={() => setSelectedFriend(friend)}
              className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 transition group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold shadow group-hover:scale-105 transition">
                {friend.friendName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                 <h3 className="font-medium text-lg">{friend.friendName}</h3>
                 <p className="text-sm opacity-50 line-clamp-1">Cliquez pour discuter</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
