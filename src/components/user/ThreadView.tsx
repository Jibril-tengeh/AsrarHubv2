import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { Send, X, ArrowLeft, Reply, Heart, Smile, Flag, Eye } from "lucide-react";
import { format, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import EmojiPicker, { Theme } from "emoji-picker-react";

const BAD_WORDS = [
  "merde", "putain", "connard", "salope", "enculé", "bâtard", "con", "conne",
  "fuck", "shit", "asshole"
];

function filterProfanity(text: string | undefined): string {
  if (!text) return "";
  let filtered = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
}

interface ThreadViewProps {
  messageId: string;
  parentMessage?: any;
  onClose: () => void;
  textSizeClass?: string;
  fontFamilyClass?: string;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: any;
  likes?: string[];
  replyToInfo?: {
    id: string;
    userId?: string;
    userName: string;
    userPhoto?: string;
    text?: string;
  };
}

export default function ThreadView({
  messageId,
  parentMessage,
  onClose,
  textSizeClass = "text-sm",
  fontFamilyClass = "font-sans",
}: ThreadViewProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment["replyToInfo"] | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formatMode, setFormatMode] = useState<"none" | "bold" | "italic">("none");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formatMessageText = (text: string) => {
    let formattedText = filterProfanity(text);
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formattedText = formattedText.replace(/`(.*?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 rounded">$1</code>');
    formattedText = formattedText.replace(/@(\w+)/g, '<span class="text-amber-500 font-semibold cursor-pointer hover:underline">@$1</span>');
    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (!messageId) return;
        if (unsubscribe) unsubscribe();
        const q = query(
          collection(db, "community_messages", messageId, "comments"),
          orderBy("createdAt", "asc"),
        );
        let initialLoad = true;
        unsubscribe = onSnapshot(q, (snapshot) => {
          let shouldScroll = initialLoad;
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              shouldScroll = true;
            }
          });
          initialLoad = false;

          const msgs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Comment[];
          setComments(msgs);
          
          if (shouldScroll) {
            setTimeout(() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }
        }, (err) => console.error(err));
      } else {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = undefined;
        }
        setComments([]);
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribe) unsubscribe();
    };
  }, [messageId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !auth.currentUser) return;
    try {
      await addDoc(
        collection(db, "community_messages", messageId, "comments"),
        {
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || "Utilisateur",
          userPhoto: auth.currentUser.photoURL || null,
          text: filterProfanity(newComment.trim()),
          replyToInfo: replyingTo || null,
          createdAt: serverTimestamp(),
        },
      );
      
      if (replyingTo && replyingTo.userId && replyingTo.userId !== auth.currentUser.uid) {
        try {
          await addDoc(collection(db, "community_notifications"), {
            recipientId: replyingTo.userId,
            senderId: auth.currentUser.uid,
            senderName: auth.currentUser.displayName || "Utilisateur",
            type: "reply",
            messageId: messageId,
            text: newComment.trim().substring(0, 50) + "...",
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (e) { console.error("Could not send notification", e); }
      }
      
      const parentRef = doc(db, "community_messages", messageId);
      await updateDoc(parentRef, {
        commentCount: increment(1)
      });
      
      setNewComment("");
      setReplyingTo(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de l'envoi du commentaire: " + err.message);
    }
  };

  const handleReplyClick = (c: Comment) => {
    const replyInfo: any = {
      id: c.id,
      userId: c.userId,
      userName: c.userName,
      text: c.text,
    };
    if (c.userPhoto) replyInfo.userPhoto = c.userPhoto;
    
    setReplyingTo(replyInfo as Comment["replyToInfo"]);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleLikeComment = async (commentId: string, likes: string[] = []) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const isLiked = likes.includes(uid);
    const commentRef = doc(db, "community_messages", messageId, "comments", commentId);
    
    try {
      if (isLiked) {
        await updateDoc(commentRef, {
          likes: arrayRemove(uid)
        });
      } else {
        await updateDoc(commentRef, {
          likes: arrayUnion(uid)
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (!auth.currentUser) return;
    if (confirm("Signaler ce commentaire pour contenu inapproprié ?")) {
      try {
        await addDoc(collection(db, "reports"), {
          reportedItemId: commentId,
          itemType: "comment",
          reporterId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        alert("Commentaire signalé avec succès. Merci !");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEmojiClick = (emojiObj: any) => {
    setNewComment((prev) => prev + emojiObj.emoji);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <div className="flex items-center p-4 border-b border-black/10 dark:border-white/10 shrink-0 bg-white/50 dark:bg-black/50 backdrop-blur-md">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold ml-2">Commentaires</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {parentMessage && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-2">
              {parentMessage.userPhoto ? (
                <img
                  src={parentMessage.userPhoto}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  alt={parentMessage.userName}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <span className="font-bold text-amber-700 dark:text-amber-300 text-xs text-center uppercase leading-none">
                    {parentMessage.userName?.substring(0, 2) || "?"}
                  </span>
                </div>
              )}
              <p className="font-bold text-sm">{parentMessage.userName}</p>
            </div>
            {parentMessage.text && (
              <p className={`whitespace-pre-wrap ${textSizeClass} ${fontFamilyClass}`}>
                {filterProfanity(parentMessage.text)}
              </p>
            )}
            {parentMessage.mediaUrl && parentMessage.mediaType === "image" && (
              <img
                src={parentMessage.mediaUrl}
                className="mt-2 rounded-2xl max-h-64 object-cover"
                alt="attachment"
              />
            )}
          </div>
        )}

        <h3 className="font-bold text-xs uppercase opacity-50 tracking-wider mb-2">
          Commentaires ({comments.length})
        </h3>

        {comments.length === 0 && (
          <p className="text-center opacity-50 mt-10 text-sm">
            Soyez le premier à commenter !
          </p>
        )}
        {comments.map((c) => {
          const isMe = c.userId === auth.currentUser?.uid;
          const isLiked = c.likes?.includes(auth.currentUser?.uid || "");
          const time = c.createdAt?.toDate
            ? isToday(c.createdAt.toDate()) ? format(c.createdAt.toDate(), "HH:mm", { locale: fr }) : format(c.createdAt.toDate(), "dd/MM HH:mm", { locale: fr })
            : "";
          return (
            <div
              key={c.id}
              className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe && (
                <div className="relative mt-auto mb-2 flex-shrink-0">
                  {c.userPhoto ? (
                    <img
                      src={c.userPhoto}
                      className="w-6 h-6 rounded-full object-cover border border-white dark:border-neutral-900 shadow-sm"
                      alt={c.userName}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[9px] font-bold text-amber-700 dark:text-amber-400 border border-white dark:border-neutral-900 shadow-sm">
                      {c.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              )}
              <div
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%]`}
              >
                <div
                  className={`relative group rounded-2xl p-3 w-full ${
                    isMe
                      ? "bg-amber-100 dark:bg-amber-900/30 text-neutral-900 dark:text-neutral-100 rounded-br-none"
                      : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-bl-none text-neutral-900 dark:text-neutral-100"
                  }`}
                >
                  {!isMe && (
                    <p className="text-[10px] font-bold opacity-70 mb-1 flex items-center justify-between">
                      <span>{c.userName}</span>
                    </p>
                  )}
                  {c.replyToInfo && (
                    <div
                      className={`mb-2 p-2 rounded text-[10px] border-l-2 ${isMe ? "bg-black/10 border-white/40" : "bg-black/5 dark:bg-white/5 border-amber-500"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {c.replyToInfo.userPhoto ? (
                          <img src={c.replyToInfo.userPhoto} alt="" className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[8px] font-bold">
                            {c.replyToInfo.userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <p className="font-bold opacity-75">
                          {c.replyToInfo.userName}
                        </p>
                      </div>
                      {c.replyToInfo.text && (
                        <p className="truncate opacity-80">
                          {filterProfanity(c.replyToInfo.text)}
                        </p>
                      )}
                    </div>
                  )}
                  <p className={`whitespace-pre-wrap word-break-words ${textSizeClass} ${fontFamilyClass}`}>
                    {formatMessageText(c.text)}
                  </p>
                  <div
                    className={`flex justify-end items-center text-[10px] mt-1 gap-1 ${isMe ? "text-amber-600/70 dark:text-amber-400/70" : "opacity-50"} text-right`}
                  >
                    {time}
                  </div>
                </div>
                <div className={`mt-0.5 flex flex-wrap items-center gap-2 px-1`}>
                  <button onClick={() => handleLikeComment(c.id, c.likes)} className={`flex items-center gap-1 text-[10px] transition-colors ${isLiked ? "text-red-500" : "text-neutral-500 hover:text-red-500"}`}>
                    <Heart className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`} />
                    <span>{c.likes?.length || 0}</span>
                  </button>
                  <button onClick={() => handleReplyClick(c)} className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-amber-600 transition-colors">
                    <Reply className="w-3 h-3" />
                    <span>Répondre</span>
                  </button>
                  {!isMe && (
                    <button onClick={() => handleReportComment(c.id)} className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-red-600 transition-colors ml-auto md:ml-0">
                      <Flag className="w-3 h-3" />
                      <span>Signaler</span>
                    </button>
                  )}
                </div>
              </div>
              {isMe && (
                <div className="relative mt-auto mb-2 flex-shrink-0">
                  {c.userPhoto ? (
                    <img
                      src={c.userPhoto}
                      className="w-6 h-6 rounded-full object-cover border border-white dark:border-neutral-900 shadow-sm"
                      alt={c.userName}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[9px] font-bold text-amber-700 dark:text-amber-400 border border-white dark:border-neutral-900 shadow-sm">
                      {c.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white dark:bg-neutral-900 border-t border-black/10 dark:border-white/10 shrink-0">
        <form
          onSubmit={handleSend}
          className="flex flex-col max-w-md mx-auto relative gap-2"
        >
          {replyingTo && (
            <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-800 p-2 pl-3 rounded-lg text-xs animate-in fade-in slide-in-from-bottom-2">
              <div className="overflow-hidden">
                <p className="font-bold text-amber-600 dark:text-amber-400">
                  En réponse à {replyingTo.userName}
                </p>
                {replyingTo.text && (
                  <p className="truncate opacity-75">
                    {filterProfanity(replyingTo.text)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 shrink-0 ml-2 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2.5 rounded-full shrink-0 mb-0.5 transition-colors ${showEmojiPicker ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-amber-600 dark:hover:text-amber-400 bg-neutral-100 dark:bg-neutral-800"}`}
              title="Emojis"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPreview(!showPreview);
                setShowEmojiPicker(false);
              }}
              className={`p-2.5 rounded-full shrink-0 mb-0.5 transition-colors ${showPreview ? "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400" : "text-neutral-500 hover:text-amber-600 dark:hover:text-amber-400 bg-neutral-100 dark:bg-neutral-800"}`}
              title="Aperçu du commentaire"
            >
              <Eye className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowEmojiPicker(false)}
                  />
                  <div className="relative z-50 shadow-xl rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme={
                        typeof document !== "undefined" &&
                        document.documentElement.classList.contains("dark")
                          ? Theme.DARK
                          : Theme.LIGHT
                      }
                      searchDisabled
                      skinTonesDisabled
                      height={300}
                      width={280}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                </div>
              )}
              {showPreview ? (
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl py-2.5 px-4 min-h-[44px] max-h-32 overflow-y-auto text-sm">
                  {newComment ? formatMessageText(newComment) : <span className="opacity-50 italic">Aperçu vide...</span>}
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                }}
                placeholder="Votre commentaire..."
                className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl py-2.5 px-4 min-h-[44px] max-h-32 resize-none focus:ring-2 focus:ring-amber-500 text-sm block"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              )}
            </div>
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="p-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 disabled:opacity-50 disabled:hover:bg-amber-600 transition-all shrink-0 mb-0.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

