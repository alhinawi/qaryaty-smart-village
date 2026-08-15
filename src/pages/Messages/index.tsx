// ─── Imports
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/useUIStore';

// ─── Initial Demo Chats
interface ChatMessage {
  id: string;
  sender: 'other' | 'me';
  text: string;
  time: string;
}

interface ChatContact {
  id: string;
  name: string;
  role: string;
  avatar: string;
  online: boolean;
  messages: ChatMessage[];
}

const INITIAL_CHATS: ChatContact[] = [
  {
    id: 'chat_1',
    name: 'خدمة عملاء قريتي',
    role: 'الدعم الفني',
    avatar: '🏡',
    online: true,
    messages: [
      {
        id: 'm1',
        sender: 'other',
        text: 'أهلاً بك في تطبيق قريتي! كيف نقدر نساعدك اليوم؟',
        time: '10:00 ص',
      },
    ],
  },
  {
    id: 'chat_2',
    name: 'الكابتن محمد (مندوب التوصيل)',
    role: 'سائق دليفري',
    avatar: '🛵',
    online: true,
    messages: [
      {
        id: 'm2',
        sender: 'other',
        text: 'أنا على مدخل القرية أمام المسجد الكبير، طالع على العنوان الآن.',
        time: '11:20 ص',
      },
    ],
  },
  {
    id: 'chat_3',
    name: 'الأسطى حسن (السباك)',
    role: 'حرفي',
    avatar: '🔧',
    online: false,
    messages: [
      {
        id: 'm3',
        sender: 'other',
        text: 'تمام، هكون عندك الساعة ٤ العصر ومعايا كل قطع الغيار.',
        time: 'أمس',
      },
    ],
  },
];

// ─── Component
export default function MessagesPage() {
  const [chats, setChats] = useState<ChatContact[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string>('chat_1');
  const [inputText, setInputText] = useState('');
  const showToast = useUIStore((state) => state.showToast);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'me',
      text: inputText.trim(),
      time: 'الآن',
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, newMsg] }
          : chat
      )
    );

    setInputText('');

    // Simulate quick auto-reply after 1 second
    setTimeout(() => {
      const replies = [
        'تمام يا فندم، طلبك قيد المتابعة فوراً!',
        'وصلت رسالتك وهنتواصل معاك في أسرع وقت.',
        'شكراً لتواصلك، كلنا في خدمة أهل القرية 🌟',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const autoReply: ChatMessage = {
        id: `reply_${Date.now()}`,
        sender: 'other',
        text: randomReply,
        time: 'الآن',
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, autoReply] }
            : chat
        )
      );
      showToast(`💬 رد جديد من ${activeChat.name}`);
    }, 1200);
  };

  return (
    <div className="messages-page-container">
      <div className="page-header-title">
        <h2>💬 الرسائل والمحادثات</h2>
        <p>تواصل مباشرة مع الدعم الفني، المناديب، ومزودي الخدمات في القرية</p>
      </div>

      <div className="chat-layout-container">
        {/* Contacts Sidebar */}
        <div className="chat-contacts-sidebar">
          {chats.map((chat) => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            return (
              <div
                key={chat.id}
                className={`contact-item ${
                  chat.id === activeChatId ? 'active' : ''
                }`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <div className="contact-avatar-box">
                  <span className="contact-avatar">{chat.avatar}</span>
                  {chat.online && <span className="online-indicator" />}
                </div>
                <div className="contact-info">
                  <div className="contact-name-row">
                    <h4>{chat.name}</h4>
                    <span className="contact-time">{lastMsg?.time}</span>
                  </div>
                  <p className="contact-last-msg">{lastMsg?.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Conversation Area */}
        <div className="chat-conversation-area">
          {/* Active Contact Header */}
          <div className="conversation-header">
            <span className="conv-avatar">{activeChat.avatar}</span>
            <div>
              <h3>{activeChat.name}</h3>
              <span className="conv-role">
                {activeChat.role} • {activeChat.online ? 'متصل الآن 🟢' : 'غير متصل'}
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="messages-feed">
            {activeChat.messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-bubble ${
                  msg.sender === 'me' ? 'me' : 'other'
                }`}
              >
                <p>{msg.text}</p>
                <span className="msg-time">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="message-input-form">
            <input
              type="text"
              placeholder="اكتب رسالتك هنا..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <Button type="submit" variant="primary" size="md">
              إرسال ⬅️
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
