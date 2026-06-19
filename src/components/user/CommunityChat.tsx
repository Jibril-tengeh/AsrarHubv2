import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../../firebase";
import {
  Send,
  Camera,
  Bold,
  Italic,
  Mic,
  Square,
  Paperclip,
  FileImage,
  Play,
  X,
  Video,
  Reply,
  ThumbsUp,
  ThumbsDown,
  Search,
  Flag,
  MessageSquare,
  Type,
  Settings2,
  Check,
  CheckCheck,
  Smile,
  Share2,
  Trash2,
  Edit2,
  Pin,
  Bookmark,
  BarChart2,
  Eye,
  Filter,
  MoreVertical,
  PlusCircle,
  Moon,
  Sun,
  Wand2,
  Compass,
  UserPlus,
  WifiOff,
  Clock
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import EmojiPicker from 'emoji-picker-react';
import ThreadView from "./ThreadView";
import FriendsSection from "./FriendsSection";
import PollsSection from "./PollsSection";
import PrivateMessagesSection from "./PrivateMessagesSection";
import OnlineMembersSection from "./OnlineMembersSection";
import CommunityProfileSection from "./CommunityProfileSection";
import { sendFriendRequest } from "../../lib/friendsUtils";

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

interface ChatMessage {
  id: string;
  isPending?: boolean;
  userId: string;
  userName: string;
  userPhoto?: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: "audio" | "image" | "video";
  createdAt: any;
  likes?: string[];
  dislikes?: string[];
  reactions?: Record<string, string[]>;
  commentCount?: number;
  isEdited?: boolean;
  isPinned?: boolean;
  readBy?: string[];
  savedBy?: string[];
  poll?: {
    question: string;
    options: { id: string; text: string; votes: string[] }[];
  };
  replyToInfo?: {
    id: string;
    userId?: string;
    userName: string;
    userPhoto?: string;
    text?: string;
    mediaType?: string;
  };
}

export default function CommunityChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fullscreenMedia, setFullscreenMedia] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const [replyingTo, setReplyingTo] = useState<
    ChatMessage["replyToInfo"] | null
  >(null);
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(
    new Map(),
  );
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [activeThreadMsg, setActiveThreadMsg] = useState<ChatMessage | null>(
    null,
  );

  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "saved" | "polls" | "pinned">("all");
  const location = useLocation();
  const initialSection = location.state?.activeSection || "general";
  const [activeSection, setActiveSection] = useState<"general" | "friends" | "polls" | "private" | "requests" | "profile" | "online">(initialSection);
  const [selectedUserProfile, setSelectedUserProfile] = useState<{ id: string, name: string, photo?: string } | null>(null);

  useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
    }
  }, [location.state?.activeSection]);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  
  const [chatTheme, setChatTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("communityChatTheme") as any) || (typeof document !== 'undefined' && document.documentElement.classList.contains("dark") ? "dark" : "light")
  );
  const [showInputBar, setShowInputBar] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [featureNotAvailableOpen, setFeatureNotAvailableOpen] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    if (location.state?.shareText) {
      setNewMessage(location.state.shareText);
      setShowInputBar(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.shareText]);

  useEffect(() => {
    localStorage.setItem("communityChatTheme", chatTheme);
  }, [chatTheme]);

  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl">(
    () => (localStorage.getItem("chatFontSize") as any) || "sm"
  );
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">(
    () => (localStorage.getItem("chatFontFamily") as any) || "sans"
  );

  useEffect(() => {
    localStorage.setItem("chatFontSize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("chatFontFamily", fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const getTextSizeClass = () => {
    switch (fontSize) {
      case "sm": return "text-sm";
      case "base": return "text-base";
      case "lg": return "text-lg";
      case "xl": return "text-xl";
      default: return "text-sm";
    }
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case "sans": return "font-sans";
      case "serif": return "font-serif";
      case "mono": return "font-mono";
      default: return "font-sans";
    }
  };

  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (bottomRef.current && messages.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          const lastMsgs = messages.slice(-10);
          lastMsgs.forEach(msg => {
            if (auth.currentUser && msg.userId !== auth.currentUser.uid && !msg.readBy?.includes(auth.currentUser.uid)) {
              markAsRead(msg.id, msg.readBy);
            }
          });
        }
      }, { threshold: 0.1 });
      observer.observe(bottomRef.current);
      return () => observer.disconnect();
    }
  }, [messages, auth.currentUser]);

  const insertFormatting = (syntax: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const newText = `${before}${syntax}${selected || "texte"}${syntax}${after}`;
    setNewMessage(newText);

    setTimeout(() => {
      textarea.focus();
      if (!selected) {
        textarea.setSelectionRange(start + syntax.length, start + syntax.length + 5);
      } else {
        textarea.setSelectionRange(start, start + selected.length + (syntax.length * 2));
      }
    }, 0);
  };

  useEffect(() => {
    let messagesUnsubscribe: () => void;
    let presenceUnsubscribe: () => void;
    let presenceInterval: NodeJS.Timeout;

    let initialLoad = true;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Setup messages listener
        const q = query(
          collection(db, "community_messages"),
          orderBy("createdAt", "asc"),
        );
        messagesUnsubscribe = onSnapshot(
          q,
          (snapshot) => {
            let shouldScrollToBottom = initialLoad;

            snapshot.docChanges().forEach((change) => {
              if (change.type === "added") {
                shouldScrollToBottom = true;
                if (!initialLoad && "Notification" in window && Notification.permission === "granted") {
                  const data = change.doc.data();
                  if (data.userId !== user.uid && data.createdAt && !change.doc.metadata.hasPendingWrites) {
                    if (data.text?.includes(`@${user.displayName}`)) {
                      new Notification("Nouvelle mention", { body: `${data.userName} vous a mentionné : ${data.text}` });
                    }
                  }
                }
              }
            });

            initialLoad = false;
            
            const msgs = snapshot.docs.map((doc) => ({
              id: doc.id,
              isPending: doc.metadata.hasPendingWrites,
              ...doc.data(),
            })) as ChatMessage[];
            setMessages(msgs);
            
            if (shouldScrollToBottom) {
              setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }
          },
          (error: any) => {
            if (error.code !== "permission-denied") {
              console.error("Snapshot error:", error);
            }
          },
        );

        // Setup presence loop
        const updatePresence = async () => {
          try {
            const presenceRef = doc(db, "community_presence", user.uid);
            await setDoc(
              presenceRef,
              {
                userId: user.uid,
                userName: user.displayName || "Utilisateur",
                lastActive: serverTimestamp(),
              },
              { merge: true },
            );
          } catch (e) {
            console.error("Presence update failed:", e);
          }
        };

        updatePresence();
        presenceInterval = setInterval(updatePresence, 60000);

        // Setup presence listener
        const presenceQ = query(collection(db, "community_presence"));
        presenceUnsubscribe = onSnapshot(
          presenceQ,
          (snapshot) => {
            const now = Date.now();
            const active = new Set<string>();
            const typing = new Map<string, string>();
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (data.lastActive) {
                const lastActive = data.lastActive.toMillis?.() || Date.now();
                if (now - lastActive < 5 * 60 * 1000) {
                  active.add(data.userId);
                  if (data.isTyping && data.userId !== user.uid) {
                    typing.set(data.userId, data.userName || "Quelqu'un");
                  }
                }
              }
            });
            setActiveUsers(active);
            setTypingUsers(typing);
          },
          (err) => { /* ignore */ },
        );
      } else {
        setMessages([]);
        setActiveUsers(new Set());
        setTypingUsers(new Map());
        if (messagesUnsubscribe) messagesUnsubscribe();
        if (presenceUnsubscribe) presenceUnsubscribe();
        if (presenceInterval) clearInterval(presenceInterval);
      }
    });

    return () => {
      authUnsubscribe();
      if (messagesUnsubscribe) messagesUnsubscribe();
      if (presenceUnsubscribe) presenceUnsubscribe();
      if (presenceInterval) clearInterval(presenceInterval);
    };
  }, []);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`; // Max height 32 (128px)

    if (!isTyping) {
      setIsTyping(true);
      if (auth.currentUser) {
        setDoc(
          doc(db, "community_presence", auth.currentUser.uid),
          { isTyping: true, lastActive: serverTimestamp() },
          { merge: true },
        ).catch((err) => { /* ignore */ });
      }
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (auth.currentUser) {
        setDoc(
          doc(db, "community_presence", auth.currentUser.uid),
          { isTyping: false },
          { merge: true },
        ).catch((err) => { /* ignore */ });
      }
    }, 2000);
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !showPollCreator) || !auth.currentUser) return;
    
    let pollData = null;
    if (showPollCreator && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length > 1) {
      pollData = {
        question: filterProfanity(pollQuestion.trim()),
        options: pollOptions.filter(o => o.trim()).map(opt => ({
          id: Math.random().toString(36).substring(2),
          text: filterProfanity(opt.trim()),
          votes: []
        }))
      };
    }

    if (!newMessage.trim() && !pollData) return;

    try {
      const newMsgRef = await addDoc(collection(db, "community_messages"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Utilisateur",
        userPhoto: auth.currentUser.photoURL || null,
        text: filterProfanity(newMessage.trim()),
        replyToInfo: replyingTo || null,
        poll: pollData,
        createdAt: serverTimestamp(),
      });
      
      if (replyingTo && replyingTo.userId && replyingTo.userId !== auth.currentUser.uid) {
        try {
          await addDoc(collection(db, "community_notifications"), {
            recipientId: replyingTo.userId,
            senderId: auth.currentUser.uid,
            senderName: auth.currentUser.displayName || "Utilisateur",
            type: "reply",
            messageId: newMsgRef.id,
            text: newMessage.trim().substring(0, 50) + "...",
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (e) { console.error(e); }
      }

      setNewMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setPollQuestion("");
      setPollOptions(["", ""]);
      setShowPollCreator(false);
      setReplyingTo(null);
      setIsTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (auth.currentUser) {
        setDoc(
          doc(db, "community_presence", auth.currentUser.uid),
          { isTyping: false },
          { merge: true },
        ).catch((err) => { /* ignore */ });
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (error.code === "permission-denied") {
        alert(
          "Vous ne pouvez pas envoyer de messages. Votre compte a peut-être été bloqué ou banni par un administrateur.",
        );
      } else {
        alert("Erreur lors de l'envoi du message.");
      }
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    setConfirmDialog({
      isOpen: true,
      message: "Voulez-vous vraiment supprimer ce message ?",
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "community_messages", msgId), {
            text: "[Message supprimé par son auteur]",
            mediaUrl: null,
            mediaType: null,
            poll: null,
          });
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleEditSubmit = async (msgId: string) => {
    if (!newMessage.trim()) return;
    try {
      await updateDoc(doc(db, "community_messages", msgId), {
        text: filterProfanity(newMessage.trim()),
        isEdited: true
      });
      setEditingMessageId(null);
      setNewMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  const handlePin = async (msgId: string, currentPinned?: boolean) => {
    try {
      await updateDoc(doc(db, "community_messages", msgId), {
        isPinned: !currentPinned
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (msgId: string, savedBy?: string[]) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const isSaved = savedBy?.includes(uid);
    try {
      await updateDoc(doc(db, "community_messages", msgId), {
        savedBy: isSaved ? arrayRemove(uid) : arrayUnion(uid)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePollVote = async (msgId: string, optionId: string, currentPoll: any) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const msgRef = doc(db, "community_messages", msgId);
    
    // Remove user's previous votes from this poll
    const newOptions = currentPoll.options.map((opt: any) => ({
      ...opt,
      votes: opt.votes.filter((v: string) => v !== uid)
    }));
    
    // Add vote to new option
    const optionIndex = newOptions.findIndex((o: any) => o.id === optionId);
    if (optionIndex > -1) {
      newOptions[optionIndex].votes.push(uid);
    }
    
    await updateDoc(msgRef, {
      "poll.options": newOptions
    });
  };

  const markAsRead = async (msgId: string, readBy: string[] = []) => {
    if (!auth.currentUser || readBy.includes(auth.currentUser.uid)) return;
    try {
      await updateDoc(doc(db, "community_messages", msgId), {
        readBy: arrayUnion(auth.currentUser.uid)
      });
    } catch (e) {
      // Background update, ignore errors silently
    }
  };

  const handleReport = async (msgId: string) => {
    setConfirmDialog({
      isOpen: true,
      message: "Voulez-vous signaler ce message comme inapproprié ?",
      onConfirm: async () => {
        try {
          await addDoc(collection(db, "reports"), {
            messageId: msgId,
            reportedBy: auth.currentUser?.uid || "anonymous",
            createdAt: serverTimestamp(),
            type: "community_message",
          });
          alert("Le message a été signalé.");
        } catch (e) {
          console.error(e);
          alert("Erreur lors du signalement.");
        }
      }
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await handleFileUpload(audioBlob, "audio");
        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Impossible d'accéder au microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleGenerateAiImage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!aiImagePrompt.trim() || !auth.currentUser) return;
    setIsGeneratingAiImage(true);
    try {
      const seed = Math.floor(Math.random() * 1000000);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiImagePrompt)}?seed=${seed}&width=1024&height=1024&nologo=true`;
      
      await addDoc(collection(db, "community_messages"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Utilisateur",
        userPhoto: auth.currentUser.photoURL || null,
        mediaUrl: url,
        mediaType: "image",
        text: `🎨 **IA:** *${filterProfanity(aiImagePrompt.trim())}*`,
        replyToInfo: replyingTo || null,
        createdAt: serverTimestamp(),
      });
      
      setShowAiPrompt(false);
      setAiImagePrompt("");
      setReplyingTo(null);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération de l'image IA.");
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  const handleFileUpload = async (
    file: Blob | File,
    type: "audio" | "image" | "video",
  ) => {
    if (!auth.currentUser) return;

    if (file.size > 50 * 1024 * 1024) {
      setFeatureNotAvailableOpen(true);
      return;
    }

    setUploadProgress(5);

    try {
      if (type === "video") {
        setFeatureNotAvailableOpen(true);
        setUploadProgress(0);
        return;
      }

      let dataUrlToSave = "";

      if (type === "image" && file instanceof File) {
        // Redimensionner l'image pour l'adapter à Firestore (max 1MB)
        dataUrlToSave = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const max_size = 600; // Small size to be safe for base64 limits

            if (width > height) {
              if (width > max_size) {
                height *= max_size / width;
                width = max_size;
              }
            } else {
              if (height > max_size) {
                width *= max_size / height;
                height = max_size;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              // Ensure white background for jpg compression
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
            }
            
            resolve(canvas.toDataURL("image/jpeg", 0.6));
          };
          img.onerror = () => reject(new Error("Image load failed"));
          img.src = URL.createObjectURL(file);
        });
      } else {
        // Pour l'audio (généralement très court de notre micro)
        dataUrlToSave = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      if (dataUrlToSave.length > 800000) {
        setUploadProgress(0);
        setFeatureNotAvailableOpen(true);
        return;
      }

      setUploadProgress(50);

      const payload = {
        userId: auth.currentUser!.uid,
        userName: auth.currentUser!.displayName || "Utilisateur",
        userPhoto: auth.currentUser!.photoURL || null,
        mediaUrl: dataUrlToSave,
        mediaType: type,
        replyToInfo: replyingTo || null,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "community_messages"), payload);
      setUploadProgress(0);
      setReplyingTo(null);

    } catch (err: any) {
      console.error("Error creating message with file:", err);
      setUploadProgress(0);
      if (err.code === "permission-denied") {
        alert("Action non autorisée.");
      } else {
        setFeatureNotAvailableOpen(true);
      }
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const type = file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "image";
      handleFileUpload(file, type);
      e.target.value = "";
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleLike = async (
    msgId: string,
    currentLikes: string[] = [],
    currentDislikes: string[] = [],
  ) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const msgRef = doc(db, "community_messages", msgId);

    if (currentLikes.includes(uid)) {
      await updateDoc(msgRef, { likes: arrayRemove(uid) });
    } else {
      await updateDoc(msgRef, {
        likes: arrayUnion(uid),
        dislikes: arrayRemove(uid),
      });
    }
  };

  const handleDislike = async (
    msgId: string,
    currentLikes: string[] = [],
    currentDislikes: string[] = [],
  ) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const msgRef = doc(db, "community_messages", msgId);

    if (currentDislikes.includes(uid)) {
      await updateDoc(msgRef, { dislikes: arrayRemove(uid) });
    } else {
      await updateDoc(msgRef, {
        dislikes: arrayUnion(uid),
        likes: arrayRemove(uid),
      });
    }
  };

  const handleReply = (msg: ChatMessage) => {
    const replyInfo: any = {
      id: msg.id,
      userId: msg.userId,
      userName: msg.userName,
    };
    if (msg.userPhoto) replyInfo.userPhoto = msg.userPhoto;
    if (msg.text) replyInfo.text = msg.text;
    if (msg.mediaType) replyInfo.mediaType = msg.mediaType;
    
    setReplyingTo(replyInfo as ChatMessage["replyToInfo"]);
    setShowInputBar(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const AVAILABLE_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "👏"];

  const handleReaction = async (msgId: string, emoji: string, currentReactions: Record<string, string[]> = {}) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const msgRef = doc(db, "community_messages", msgId);
    
    const reactionUsers = currentReactions[emoji] || [];
    const hasReacted = reactionUsers.includes(uid);
    
    const newReactions = { ...currentReactions };
    if (hasReacted) {
      newReactions[emoji] = reactionUsers.filter(id => id !== uid);
      if (newReactions[emoji].length === 0) delete newReactions[emoji];
    } else {
      newReactions[emoji] = [...reactionUsers, uid];
    }
    
    await updateDoc(msgRef, { reactions: newReactions });
    setShowReactionPicker(null);
  };

  const handleShare = async (msg: ChatMessage) => {
    const textToShare = msg.text ? msg.text : "Média partagé dans la communauté";
    const shareData = {
      title: `Message de ${msg.userName}`,
      text: textToShare,
      url: window.location.href, // Or a specific thread link if exists
    };
    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError' && !err.message?.includes('canceled')) {
          console.error("Erreur de partage:", err);
        }
      }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
      alert("Message copié dans le presse-papier !");
    }
  };

  const formatMessageText = (text: string) => {
    let formattedText = filterProfanity(text);
    // Replace **bold**
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Replace *italic*
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Replace `code`
    formattedText = formattedText.replace(/`(.*?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 rounded">$1</code>');
    // Replace @mentions
    formattedText = formattedText.replace(/@(\w+)/g, '<span class="text-amber-500 font-semibold cursor-pointer hover:underline">@$1</span>');
    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  const getUserColor = (userId: string) => {
    // Generate a fixed color based on userId hash
    const colors = [
      "text-rose-500", "text-blue-500", "text-emerald-500", 
      "text-indigo-500", "text-violet-500", "text-orange-500",
      "text-cyan-500", "text-fuchsia-500"
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const pinnedMessages = messages.filter((msg) => msg.isPinned);

  const filteredMessages = messages.filter((msg) => {
    if (activeFilter === "saved") {
      if (!auth.currentUser || !msg.savedBy?.includes(auth.currentUser.uid)) return false;
    } else if (activeFilter === "polls") {
      if (!msg.poll) return false;
    } else if (activeFilter === "pinned") {
      if (!msg.isPinned) return false;
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (msg.text && msg.text.toLowerCase().includes(q)) ||
      msg.userName.toLowerCase().includes(q)
    );
  });

  return (
    <div className={`flex flex-col h-full max-w-md mx-auto relative pt-4 bg-neutral-50 dark:bg-neutral-950 ${chatTheme === "dark" ? "dark" : ""}`}>
      {isOffline && (
        <div className="mx-4 mb-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-xl flex items-center justify-between border border-red-200 dark:border-red-800/50">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Mode hors ligne. Envoi en attente...</span>
          </div>
        </div>
      )}
      <div className="px-4 mb-2 flex-shrink-0 z-10 bg-neutral-50 dark:bg-neutral-950 pb-2 relative">
        {/* Settings popup moved to bottom */}
      </div>

      {activeSection === "general" ? (
        <>
          <div className="px-4 mb-2 flex-shrink-0 z-10 bg-neutral-50 dark:bg-neutral-950 pb-2 relative">
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Rechercher un message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 pr-10"
              />
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-neutral-400" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setActiveFilter("all")}
                className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center flex-shrink-0 ${activeFilter === "all" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`}
                title="Tous"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveFilter("saved")}
                className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center flex-shrink-0 ${activeFilter === "saved" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`}
                title="Favoris"
              >
                <Bookmark className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveFilter("polls")}
                className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center flex-shrink-0 ${activeFilter === "polls" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`}
                title="Sondages"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveFilter("pinned")}
                className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center flex-shrink-0 ${activeFilter === "pinned" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`}
                title="Épinglés"
              >
                <Pin className="w-4 h-4" />
              </button>
              <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-1 flex-shrink-0" />
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center flex-shrink-0 ${showSettings ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`}
                title="Apparence du texte"
              >
                <Type className="w-4 h-4" />
              </button>
            </div>
          </div>

        {showSettings && (
          <div className="absolute right-4 z-50 bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 w-64 animate-in fade-in slide-in-from-top-2" style={{ top: "135px" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm opacity-70 uppercase tracking-wider mb-0">Taille du texte</h3>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mb-4 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
              {(["sm", "base", "lg", "xl"] as const).map((size, i) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${fontSize === size ? "bg-white dark:bg-neutral-700 shadow-sm" : "opacity-60 hover:opacity-100"}`}
                >
                  {i === 0 ? "AA" : i === 1 ? "A" : i === 2 ? "A" : "A+"}
                </button>
              ))}
            </div>
            
            <h3 className="font-bold text-sm mb-3 opacity-70 uppercase tracking-wider">Police</h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setFontFamily("sans")}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-sans ${fontFamily === "sans" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
              >
                <span>Sans-serif</span>
                {fontFamily === "sans" && <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setFontFamily("serif")}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-serif ${fontFamily === "serif" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
              >
                <span>Serif</span>
                {fontFamily === "serif" && <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setFontFamily("mono")}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-mono ${fontFamily === "mono" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
              >
                <span>Monospace</span>
                {fontFamily === "mono" && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

      {activeFilter !== "pinned" && pinnedMessages.length > 0 && (
        <div className="px-4 mb-2 shrink-0 z-10 w-full animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => setActiveFilter("pinned")}
            className="w-full flex items-center justify-between bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 p-2.5 rounded-xl border-l-4 border-amber-500 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <Pin className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-left overflow-hidden">
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-0.5" style={{ color: "var(--theme-text)" }}>Message épinglé</p>
                <p className="text-xs truncate opacity-80 whitespace-nowrap overflow-hidden">
                  {pinnedMessages[pinnedMessages.length - 1].text || "Média épinglé"}
                </p>
              </div>
            </div>
            {pinnedMessages.length > 1 && (
              <span className="text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full shrink-0">
                +{pinnedMessages.length - 1}
              </span>
            )}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-[2px] pb-[180px] space-y-4 pt-4">
        {filteredMessages.map((msg) => {
          const isMe = msg.userId === auth.currentUser?.uid;
          const time = msg.createdAt?.toDate
            ? format(msg.createdAt.toDate(), "HH:mm")
            : "";
          
          const isPinned = msg.isPinned;
          const isSaved = auth.currentUser && msg.savedBy?.includes(auth.currentUser.uid);
          const viewsCount = msg.readBy?.length || 0;

          return (
            <div
              key={msg.id}
              className={`flex gap-2 relative group w-full ${isPinned ? "bg-amber-50 dark:bg-amber-900/10 p-2 -mx-2 rounded-xl" : ""} ${isMe ? "justify-end" : "justify-start"}`}
              onMouseEnter={() => !isMe && markAsRead(msg.id, msg.readBy)}
            >
              {isPinned && (
                <button 
                  onClick={() => setActiveFilter("pinned")}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 z-10 border border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
                >
                  <Pin className="w-3 h-3 shrink-0" />
                  <span className="whitespace-nowrap">Message épinglé</span>
                </button>
              )}
              
              {!isMe && (
                <button 
                  onClick={() => setSelectedUserProfile({ id: msg.userId, name: msg.userName, photo: msg.userPhoto })}
                  className="relative mt-auto mb-6 flex-shrink-0 hover:opacity-80 transition cursor-pointer"
                >
                  {msg.userPhoto ? (
                    <img
                      src={msg.userPhoto}
                      className="w-7 h-7 rounded-full object-cover border border-white dark:border-neutral-900 shadow-sm"
                      alt={msg.userName}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-white dark:border-neutral-900 shadow-sm">
                      {msg.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {activeUsers.has(msg.userId) && (
                    <div
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-neutral-950"
                      title="En ligne"
                    />
                  )}
                </button>
              )}
              <div
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${isMe ? "max-w-[calc(100%-8px)]" : "max-w-[calc(100%-44px)]"}`}
              >
                <div
                  className={`rounded-2xl p-3 relative ${
                    isMe
                      ? "bg-amber-100 dark:bg-amber-900/30 text-neutral-900 dark:text-neutral-100 rounded-br-none"
                      : "bg-black/5 dark:bg-white/10 rounded-bl-none text-neutral-900 dark:text-neutral-100"
                  }`}
                >
                  {isSaved && (
                     <div className="absolute -top-1 -right-1 text-amber-500 bg-white dark:bg-neutral-900 rounded-full p-0.5 shadow-sm">
                       <Bookmark className="w-3 h-3 fill-current" />
                     </div>
                  )}
                  {!isMe && (
                    <p className={`text-[10px] font-bold mb-1 ${getUserColor(msg.userId)}`}>
                      {msg.userName}
                    </p>
                  )}

                  {msg.replyToInfo && (
                    <div
                      className={`mb-2 p-2 rounded max-w-xs text-xs border-l-2 ${isMe ? "bg-black/10 border-white/40" : "bg-black/5 dark:bg-white/5 border-amber-500"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {msg.replyToInfo.userPhoto ? (
                          <img src={msg.replyToInfo.userPhoto} alt="" className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[8px] font-bold">
                            {msg.replyToInfo.userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <p className="font-bold opacity-75">
                          {msg.replyToInfo.userName}
                        </p>
                      </div>
                      {msg.replyToInfo.text && (
                        <p className="truncate opacity-80">
                          {filterProfanity(msg.replyToInfo.text)}
                        </p>
                      )}
                      {msg.replyToInfo.mediaType && (
                        <p className="opacity-80 italic flex items-center gap-1">
                          {msg.replyToInfo.mediaType === "image" && (
                            <FileImage className="w-3 h-3" />
                          )}
                          {msg.replyToInfo.mediaType === "video" && (
                            <Video className="w-3 h-3" />
                          )}
                          {msg.replyToInfo.mediaType === "audio" && (
                            <Mic className="w-3 h-3" />
                          )}
                          Média joint
                        </p>
                      )}
                    </div>
                  )}

                  {editingMessageId === msg.id ? (
                    <div className="flex flex-col mt-2">
                       <textarea 
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                          }}
                          className="w-full text-sm p-2 rounded-xl bg-white/50 dark:bg-black/20 border border-neutral-300 dark:border-neutral-700 outline-none focus:ring-1 focus:ring-neutral-500 dark:focus:ring-neutral-400 resize-none max-h-32 min-h-10"
                          rows={2}
                       />
                       <div className="flex justify-end gap-2 mt-2">
                         <button onClick={() => setEditingMessageId(null)} className="text-xs px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded">Annuler</button>
                         <button onClick={() => handleEditSubmit(msg.id)} className="text-xs px-2 py-1 bg-amber-500 text-white rounded">Enregistrer</button>
                       </div>
                    </div>
                  ) : msg.text ? (
                    <p className={`whitespace-pre-wrap ${getTextSizeClass()} ${getFontFamilyClass()}`}>
                      {formatMessageText(msg.text)}
                    </p>
                  ) : null}

                  {msg.mediaType === "audio" && msg.mediaUrl && (
                    <div className="mt-1">
                      <audio
                        controls
                        src={msg.mediaUrl}
                        className="max-w-full h-10"
                      />
                    </div>
                  )}

                  {msg.mediaType === "image" && msg.mediaUrl && (
                    <img
                      src={msg.mediaUrl}
                      alt="Image upload"
                      className="mt-1 rounded-xl max-w-full object-cover cursor-zoom-in active:scale-95 transition-transform"
                      onClick={() =>
                        setFullscreenMedia({
                          url: msg.mediaUrl!,
                          type: "image",
                        })
                      }
                    />
                  )}

                  {msg.mediaType === "video" && msg.mediaUrl && (
                    <div
                      className="relative mt-1 rounded-xl overflow-hidden cursor-pointer"
                      onClick={() =>
                        setFullscreenMedia({
                          url: msg.mediaUrl!,
                          type: "video",
                        })
                      }
                    >
                      <video src={msg.mediaUrl} className="max-w-full" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm">
                          <Play className="text-white w-6 h-6 ml-1" />
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.poll && msg.poll.options && (
                    <div className="mt-3 bg-white/50 dark:bg-black/20 p-3 rounded-xl w-full" style={{ maxWidth: "100%", overflow: "hidden" }}>
                      <h4 className="font-bold text-sm mb-2 flex items-center gap-1.5"><BarChart2 className="w-4 h-4"/> {msg.poll.question}</h4>
                      <div className="space-y-1.5 mb-4">
                        {msg.poll.options.map(opt => {
                           const totalVotes = msg.poll!.options.reduce((acc, curr) => acc + curr.votes.length, 0);
                           const percent = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100);
                           const hasVoted = opt.votes.includes(auth.currentUser?.uid || "");
                           return (
                             <button 
                               key={opt.id} 
                               onClick={() => handlePollVote(msg.id, opt.id, msg.poll)}
                               className={`w-full text-left rounded-lg p-2 text-xs transition-colors border ${hasVoted ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10" : "border-neutral-200 dark:border-neutral-700 hover:bg-black/5 dark:hover:bg-white/5"}`}
                             >
                                <div className="flex justify-between items-center">
                                  <span className={hasVoted ? "font-bold" : ""}>{opt.text}</span>
                                  <span className="opacity-70">{percent}%</span>
                                </div>
                             </button>
                           );
                        })}
                      </div>
                      
                      <div className="h-32 w-full pr-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={msg.poll.options.map(opt => ({ name: opt.text, votes: opt.votes.length, hasVoted: opt.votes.includes(auth.currentUser?.uid || "") }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "currentColor" }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} itemStyle={{ color: '#f59e0b' }} />
                            <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                              {msg.poll.options.map((entry, index) => (
                                <Cell fill={entry.votes.includes(auth.currentUser?.uid || "") ? "#f59e0b" : "#9ca3af"} key={`cell-${index}`} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="text-[9px] opacity-60 mt-1 text-right">
                         {msg.poll.options.reduce((acc, curr) => acc + curr.votes.length, 0)} votes
                      </div>
                    </div>
                  )}

                  <div
                    className={`flex justify-end gap-2 items-center text-[9px] mt-1 opacity-60 ${isMe ? "text-amber-100" : ""}`}
                  >
                    {msg.isEdited && <span className="italic">Modifié</span>}
                    {time}
                    {isMe && (
                       <span className="flex items-center gap-0.5 ml-1" title={msg.isPending ? "En cours d'envoi" : viewsCount > 0 ? `Lu par ${viewsCount} personne(s)` : "Envoyé"}>
                         {msg.isPending ? <Clock className="w-3 h-3" /> : viewsCount > 0 ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                       </span>
                    )}
                  </div>
                </div>
                
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5 mb-0.5 px-1">
                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji, msg.reactions)}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors flex items-center gap-1 ${users.includes(auth.currentUser?.uid || '') ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-100' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300'}`}
                      >
                        <span>{emoji}</span>
                        <span className="font-medium opacity-80">{users.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className={`flex items-center gap-2 mt-1 px-1 flex-wrap flex-row`}>
                  <div className="relative">
                    <button
                      onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                      className={`flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full transition-colors ${showReactionPicker === msg.id ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : "text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"}`}
                      title="Réagir"
                    >
                      <Smile className="w-3 h-3" />
                    </button>
                    {showReactionPicker === msg.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowReactionPicker(null)} />
                        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-800 rounded-full py-1.5 px-3 flex gap-2 z-50 animate-in fade-in zoom-in-95">
                          {AVAILABLE_EMOJIS.map(e => (
                            <button key={e} onClick={() => handleReaction(msg.id, e, msg.reactions)} className="hover:scale-125 transition-transform text-lg relative z-50">{e}</button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleReply(msg)}
                    className="flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    title="Citer"
                  >
                    <Reply className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setActiveThreadMsg(msg)}
                    className="flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full text-neutral-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    {msg.commentCount ? (
                      <span>{msg.commentCount}</span>
                    ) : null}
                  </button>
                  <button
                    onClick={() => handleShare(msg)}
                    className="flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    title="Partager"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleSave(msg.id, msg.savedBy)}
                    className={`flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full transition-colors ${auth.currentUser && msg.savedBy?.includes(auth.currentUser.uid) ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20" : "text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"}`}
                    title={auth.currentUser && msg.savedBy?.includes(auth.currentUser.uid) ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Bookmark className="w-3 h-3" />
                  </button>
                  
                  {isMe ? (
                    <>
                      <button
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setNewMessage(msg.text || "");
                        }}
                        className="flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleReport(msg.id)}
                      className="flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Signaler"
                    >
                      <Flag className="w-3 h-3" />
                    </button>
                  )}
                  {/* Pin Button for anyone, or just admins? Let's make it for anyone to pin important stuff for the community, or maybe just if they like. We'll add it to a "More" menu ideally, but let's just show it here. */}
                  <button
                    onClick={() => handlePin(msg.id, msg.isPinned)}
                    className={`flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full transition-colors ${msg.isPinned ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20" : "text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"}`}
                    title={msg.isPinned ? "Désépingler" : "Épingler le message"}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {isMe && (
                <div className="relative mt-auto mb-6 flex-shrink-0">
                  {msg.userPhoto ? (
                    <img
                      src={msg.userPhoto}
                      className="w-7 h-7 rounded-full object-cover border border-white dark:border-neutral-900 shadow-sm"
                      alt={msg.userName}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-white dark:border-neutral-900 shadow-sm">
                      {msg.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {activeUsers.has(msg.userId) && (
                    <div
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-neutral-950"
                      title="En ligne"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {uploadProgress > 0 && (
        <div className="absolute top-14 left-4 right-4 z-10 transition-all">
          <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs px-3 py-2 rounded-xl flex items-center justify-between">
            <span>Envoi du fichier...</span>
            <span className="font-bold">{Math.round(uploadProgress)}%</span>
            <div
              className="absolute bottom-0 left-0 h-1 bg-amber-500 rounded-b-xl"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="fixed bottom-[104px] left-0 right-0 z-40 pt-6 pb-2 px-[2px] max-w-md mx-auto pointer-events-none">
        {showInputBar ? (
          <div className="bg-gradient-to-t from-neutral-50 dark:from-neutral-950 pointer-events-auto rounded-t-3xl p-1 relative">
            <button 
              onClick={() => setShowInputBar(false)} 
              className="absolute -top-10 right-4 p-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full shadow hover:bg-neutral-300 dark:hover:bg-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>
            <form
              onSubmit={handleSendText}
              className="flex flex-col gap-2 relative"
            >
          {typingUsers.size > 0 && (
            <div className="px-4 text-[10px] sm:text-xs opacity-60 italic text-amber-700 dark:text-amber-400 absolute -top-5 left-0 right-0 text-center flex items-center justify-center gap-1.5">
              <span>{Array.from(typingUsers.values()).join(", ")} {typingUsers.size > 1 ? "écrivent" : "écrit"}</span>
              <div className="flex gap-0.5">
                <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}

          {replyingTo && (
            <div className="flex items-start justify-between bg-white dark:bg-neutral-800 p-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 mx-2 shadow-sm text-sm">
              <div className="flex-1 overflow-hidden pr-2 border-l-2 border-amber-500 pl-2">
                <p
                  className="text-[11px] font-bold opacity-70 mb-0.5"
                  style={{ color: "var(--theme-text)" }}
                >
                  En réponse à {replyingTo.userName}
                </p>
                {replyingTo.text && (
                  <p className="text-xs truncate opacity-80">
                    {replyingTo.text}
                  </p>
                )}
                {replyingTo.mediaType && (
                  <p className="text-xs opacity-80 flex items-center gap-1 italic">
                    {replyingTo.mediaType === "image" && (
                      <FileImage className="w-3 h-3" />
                    )}
                    {replyingTo.mediaType === "video" && (
                      <Video className="w-3 h-3" />
                    )}
                    {replyingTo.mediaType === "audio" && (
                      <Mic className="w-3 h-3" />
                    )}
                    Média joint
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isRecording ? (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-2xl border border-red-200 dark:border-red-900/30">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="font-bold flex-1 text-sm">
                Enregistrement... {formatDuration(recordingDuration)}
              </span>
              <button
                type="button"
                onClick={stopRecording}
                className="bg-red-500 text-white p-2 rounded-full"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2 bg-neutral-100 dark:bg-neutral-900/80 p-1.5 rounded-[1.5rem] border border-neutral-200 dark:border-neutral-800 relative z-10 w-full flex-col sm:flex-row backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500/30">
              {showPollCreator && (
                <div className="w-full bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-2xl mb-2 sm:mb-0 border border-neutral-200 dark:border-neutral-700">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Créer un sondage</h4>
                    <button type="button" onClick={() => setShowPollCreator(false)} className="opacity-50 hover:opacity-100"><X className="w-4 h-4"/></button>
                  </div>
                  <input type="text" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="Question..." className="w-full text-sm p-2 mb-2 rounded bg-white dark:bg-neutral-900 outline-none border border-neutral-200 dark:border-neutral-700" />
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex gap-1 mb-1">
                      <input type="text" value={opt} onChange={e => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        setPollOptions(newOpts);
                      }} placeholder={`Option ${i+1}`} className="w-full text-xs p-1.5 rounded bg-white dark:bg-neutral-900 outline-none border border-neutral-200 dark:border-neutral-700" />
                      {i > 1 && (
                        <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="p-1.5 text-red-500 hover:bg-white dark:hover:bg-neutral-900 rounded"><Trash2 className="w-3 h-3"/></button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 5 && (
                    <button type="button" onClick={() => setPollOptions([...pollOptions, ""])} className="text-xs text-amber-500 font-medium mt-1 hover:underline flex items-center gap-1"><PlusCircle className="w-3 h-3"/> Ajouter option</button>
                  )}
                </div>
              )}
              <div className="flex items-end gap-2 w-full relative">
                {showEmojiPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                    <div className="absolute bottom-14 left-0 z-50 shadow-xl rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 pb-2">
                       <div className="flex justify-between items-center p-2 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                          <span className="text-xs font-semibold text-neutral-500">Emojis</span>
                          <button type="button" onClick={() => setShowEmojiPicker(false)} className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"><X className="w-4 h-4" /></button>
                       </div>
                      <EmojiPicker 
                        theme={chatTheme === 'dark' ? 'dark' : 'light' as any} 
                        onEmojiClick={(e) => setNewMessage(newMessage + e.emoji)} 
                      />
                    </div>
                  </>
                )}
                
                <div className="flex items-center relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowAiPrompt(false);
                      setShowPollCreator(false);
                      setShowSettings(false);
                      setShowActions(false);
                    }}
                    className={`p-2.5 rounded-full transition-colors shrink-0 ${showEmojiPicker ? "text-neutral-900 bg-neutral-200 dark:bg-neutral-800 dark:text-white" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"}`}
                    title="Emojis"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPreview(!showPreview);
                      setShowEmojiPicker(false);
                      setShowActions(false);
                    }}
                    className={`p-2.5 rounded-full transition-colors shrink-0 ${showPreview ? "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"}`}
                    title="Aperçu du message"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowActions(!showActions)}
                    className={`p-2.5 rounded-full transition-colors shrink-0 ${showActions ? "text-neutral-900 bg-neutral-200 dark:bg-neutral-800 dark:text-white" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"}`}
                    title="Plus d'actions"
                  >
                    <PlusCircle className={`w-5 h-5 transition-transform ${showActions ? "rotate-45" : ""}`} />
                  </button>
                  
                  {showActions && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                      <div className="absolute bottom-14 left-0 z-50 bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-2 flex gap-1 flex-wrap w-[240px] sm:w-auto animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-full flex justify-between items-center mb-1 px-1">
                          <span className="text-xs font-semibold text-neutral-500">Actions</span>
                          <button type="button" onClick={() => setShowActions(false)} className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"><X className="w-4 h-4" /></button>
                        </div>
                        <button
                          type="button"
                        onClick={() => {
                          insertFormatting("**");
                          setShowActions(false);
                        }}
                        className="p-2 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
                        title="Gras"
                      >
                        <Bold className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          insertFormatting("*");
                          setShowActions(false);
                        }}
                        className="p-2 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
                        title="Italique"
                      >
                        <Italic className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          cameraInputRef.current?.click();
                          setShowActions(false);
                        }}
                        className="p-2 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
                        title="Prendre une photo"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAiPrompt(!showAiPrompt);
                          setShowPollCreator(false);
                          setShowEmojiPicker(false);
                          setShowSettings(false);
                          setShowActions(false);
                        }}
                        className={`p-2 rounded-xl flex items-center justify-center transition-colors ${showAiPrompt ? "text-purple-600 bg-purple-50 dark:bg-purple-900/20" : "text-neutral-500 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white"}`}
                        title="Générer une image IA"
                      >
                        <Wand2 className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowActions(false);
                        }}
                        className="p-2 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
                        title="Joindre une image ou vidéo"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPollCreator(!showPollCreator);
                          setShowAiPrompt(false);
                          setShowSettings(false);
                          setShowEmojiPicker(false);
                          setShowActions(false);
                        }}
                        className={`p-2 rounded-xl flex items-center justify-center transition-colors ${showPollCreator ? "text-neutral-900 bg-neutral-200 dark:bg-neutral-700 dark:text-white" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white"}`}
                        title="Créer un sondage"
                      >
                        <BarChart2 className="w-5 h-5" />
                      </button>
                      <Link
                        to="/tools"
                        className="p-2 rounded-xl flex items-center justify-center transition-colors text-neutral-500 hover:text-emerald-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-emerald-400"
                        title="Outils"
                      >
                        <Compass className="w-5 h-5" />
                      </Link>
                    </div>
                    </>
                  )}
                </div>

                {showAiPrompt ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      disabled={isGeneratingAiImage}
                      value={aiImagePrompt}
                      onChange={(e) => setAiImagePrompt(e.target.value)}
                      placeholder="Décrivez l'image à générer..."
                      className="flex-1 bg-transparent border-none px-3 py-2 text-sm outline-none w-full min-h-[44px] focus:ring-0"
                      style={{ color: "var(--theme-text)" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleGenerateAiImage();
                        }
                      }}
                    />
                  </div>
                ) : showPreview ? (
                  <div className="flex-1 px-3 py-2.5 max-h-32 min-h-[44px] overflow-y-auto text-sm" style={{ color: "var(--theme-text)" }}>
                    {newMessage ? formatMessageText(newMessage) : <span className="opacity-50 italic">Aperçu vide...</span>}
                  </div>
                ) : (
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder={showPollCreator ? "Saisissez votre question ci-dessus..." : "Votre message..."}
                    className="flex-1 bg-transparent border-none px-3 py-2.5 max-h-32 min-h-[44px] resize-none focus:ring-0 text-sm outline-none w-full"
                    style={{ color: "var(--theme-text)" }}
                    rows={1}
                    disabled={showPollCreator}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !showPollCreator) {
                        e.preventDefault();
                        handleSendText(e);
                      }
                    }}
                  />
                )}

                {showAiPrompt ? (
                  <button
                    onClick={handleGenerateAiImage}
                    disabled={isGeneratingAiImage || !aiImagePrompt.trim()}
                    type="button"
                    className="p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 active:scale-95 transition-all mb-0.5 mr-0.5 shrink-0"
                  >
                    {isGeneratingAiImage ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  </button>
                ) : newMessage.trim() || (showPollCreator && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length > 1) ? (
                  <button
                    type="submit"
                    className="p-2.5 bg-amber-600 text-white rounded-full hover:bg-amber-700 active:scale-95 transition-all mb-0.5 mr-0.5 shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95 transition-all mb-0.5 mr-0.5 shrink-0"
                      title="Enregistrer un message vocal"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                )}
              </div>
            </div>
          )}
          </form>
          <p className="text-[10px] text-center opacity-50 mt-1 pb-1">
            Restez courtois et respectez les autres membres.
          </p>
        </div>
        ) : (
          <div className="flex justify-end pr-4 pointer-events-auto">
            <button 
              onClick={() => setShowInputBar(true)}
              className="w-14 h-14 bg-amber-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-amber-700 active:scale-95 transition-all animate-in zoom-in-75"
              title="Nouveau message"
            >
              <PlusCircle className="w-8 h-8" />
            </button>
          </div>
        )}
      </div>
      </>
      ) : activeSection === "friends" ? (
        <FriendsSection />
      ) : activeSection === "polls" ? (
        <PollsSection />
      ) : activeSection === "private" ? (
        <PrivateMessagesSection />
      ) : activeSection === "requests" ? (
        <FriendsSection />
      ) : activeSection === "profile" ? (
        <CommunityProfileSection />
      ) : activeSection === "online" ? (
        <OnlineMembersSection />
      ) : null}

      {/* Fullscreen Media Modal */}
      {fullscreenMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 touch-none backdrop-blur-sm">
          <button
            onClick={() => setFullscreenMedia(null)}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center max-w-4xl max-h-screen">
            {fullscreenMedia.type === "image" ? (
              <img
                src={fullscreenMedia.url}
                className="max-w-full max-h-[90vh] object-contain"
                alt="Fullscreen upload"
              />
            ) : (
              <video
                src={fullscreenMedia.url}
                className="max-w-full max-h-[90vh]"
                controls
                autoPlay
              />
            )}
          </div>
        </div>
      )}

      {activeThreadMsg && (
        <ThreadView
          messageId={activeThreadMsg.id}
          parentMessage={activeThreadMsg}
          onClose={() => setActiveThreadMsg(null)}
          textSizeClass={getTextSizeClass()}
          fontFamilyClass={getFontFamilyClass()}
        />
      )}

      {featureNotAvailableOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 shadow-2xl backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-500/20 p-3 rounded-full mr-4">
                  <X className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Bientôt disponible</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    (cette fonctionnalité sera disponible dans les versions avenir.)
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 border-t border-gray-100 dark:border-neutral-800 flex justify-end">
              <button
                onClick={() => setFeatureNotAvailableOpen(false)}
                className="px-6 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:opacity-90 transition-opacity"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUserProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 shadow-2xl backdrop-blur-sm animate-in fade-in"
             onClick={() => setSelectedUserProfile(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col p-6 items-center text-center relative animate-in zoom-in-95"
               onClick={e => e.stopPropagation()}>
            <button 
               onClick={() => setSelectedUserProfile(null)}
               className="absolute top-4 right-4 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 transition"
            >
              <X className="w-5 h-5"/>
            </button>
            <div className="w-24 h-24 mb-4 mt-4">
              {selectedUserProfile.photo ? (
                <img src={selectedUserProfile.photo} className="w-full h-full rounded-full object-cover border-4 border-amber-500 shadow-lg" alt={selectedUserProfile.name}/>
              ) : (
                <div className="w-full h-full rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-3xl font-bold text-amber-700 dark:text-amber-400 border border-amber-500">
                  {selectedUserProfile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold mb-6">{selectedUserProfile.name}</h3>
            
            <button
               onClick={async () => {
                  try {
                    await sendFriendRequest(selectedUserProfile.id, selectedUserProfile.name);
                    alert("Demande d'ami envoyée avec succès !");
                  } catch (e: any) {
                    alert(e.message || "Erreur lors de l'envoi de la demande");
                  }
                  setSelectedUserProfile(null);
               }}
               className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow flex items-center justify-center gap-2 active:scale-95"
            >
              <UserPlus className="w-5 h-5" />
              Demander en ami
            </button>
          </div>
        </div>
      )}
      
      <ConfirmModal
        isOpen={confirmDialog?.isOpen || false}
        message={confirmDialog?.message || ""}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog(null)}
      />

      {/* Hidden file input outside of conditional renders */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*,audio/*"
        onChange={onFileSelect}
      />
      <input
        type="file"
        ref={cameraInputRef}
        className="hidden"
        accept="image/*,video/*"
        capture="environment"
        onChange={onFileSelect}
      />
    </div>
  );
}
