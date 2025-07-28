export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  is_online: boolean;
  last_seen?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: number;
  type: 'private' | 'group';
  name: string | null;
  avatar: string | null;
  created_by: number;
  participants: User[];
  last_message: Message | null;
  is_archived: boolean;
  is_muted: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  file_url?: string;
  user: User;
  reply_to_id: number | null;
  reply_to: Message | null;
  forwarded_from: number | null;
  forwarded_from_message: Message | null;
  is_deleted: boolean;
  deleted_for_all: boolean;
  reactions: MessageReaction[];
  created_at: string;
  updated_at: string;
}

export interface MessageReaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  user: User;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  avatar?: File;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ChatService {
  getChats(): Promise<Chat[]>;
  getChat(id: number): Promise<Chat>;
  createChat(data: { type: 'private' | 'group'; name?: string; participant_ids: number[] }): Promise<Chat>;
  getMessages(chatId: number): Promise<Message[]>;
  sendMessage(chatId: number, data: { content: string; message_type?: string; file_url?: string; reply_to_id?: number }): Promise<Message>;
  searchMessages(chatId: number, query: string, page: number): Promise<PaginatedResponse<Message>>;
  unarchiveChat(chatId: number): Promise<Chat>;
}

export interface ArchivedChatsListProps {
  chats: Chat[];
  onSelectChat: (chat: Chat) => void;
  onUnarchive: (chat: Chat) => void;
}