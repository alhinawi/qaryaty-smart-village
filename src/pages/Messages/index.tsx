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
      <div className="mb-6">
        <h2 className="text-[clamp(1.375rem,3vw,1.75rem)] font-black text-green-dark font-['Tajawal',sans-serif] mb-1">💬 الرسائل والمحادثات</h2>
        <p className="text-sm text-text-muted">تواصل مباشرة مع الدعم الفني، المناديب، ومزودي الخدمات في القرية</p>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm min-h-[480px] grid grid-cols-1 md:grid-cols-[280px_1fr]">
        {/* Contacts Sidebar */}
        <div className="border-l border-gray-100 bg-gray-50">
          {chats.map((chat) => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            return (
              <div
                key={chat.id}
                className={`flex items-center gap-3 p-3.5 border-b border-gray-100 cursor-pointer transition-colors duration-150 ${
                  chat.id === activeChatId ? 'bg-white border-r-[3px] border-r-green' : ''
                }`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <div className="relative text-[24px]">
                  <span className="contact-avatar">{chat.avatar}</span>
                  {chat.online && <span className="w-2 h-2 rounded-full bg-success absolute bottom-0 right-0" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-extrabold">{chat.name}</h4>
                    <span className="text-[11px] text-text-muted">{lastMsg?.time}</span>
                  </div>
                  <p className="text-xs text-text-muted whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px]">{lastMsg?.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Conversation Area */}
        <div className="flex flex-col h-[480px]">
          {/* Active Contact Header */}
          <div className="py-3 px-4 border-b border-gray-100 flex items-center gap-3">
            <span className="text-[28px]">{activeChat.avatar}</span>
            <div>
              <h3>{activeChat.name}</h3>
              <span className="text-xs text-text-muted">
                {activeChat.role} • {activeChat.online ? 'متصل الآن 🟢' : 'غير متصل'}
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-cream">
            {activeChat.messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[75%] py-2.5 px-3.5 rounded-2xl text-sm ${
                  msg.sender === 'me' ? 'self-start bg-green text-white rounded-br-[4px]' : 'self-end bg-white text-text shadow-[0_2px_8px_rgba(0,0,0,0.05)] rounded-bl-[4px]'
                }`}
              >
                <p>{msg.text}</p>
                <span className="block text-[10px] opacity-70 mt-1 text-left">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex gap-2 bg-white">
            <input
              type="text"
              placeholder="اكتب رسالتك هنا..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 py-2.5 px-3.5 rounded-xl border border-gray-200 font-['Cairo',sans-serif] text-sm outline-none"
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
