export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  status?: string;
  bio?: string;
  last_seen?: string;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: number;
  type: 'private' | 'group';
  name: string;
  avatar?: string;
  created_by: number;
  participants: User[];
  last_message?: {
    id: number;
    content: string;
    type: 'text' | 'image' | 'file' | 'voice' | 'document' | 'audio';
    created_at: string;
    user: User;
  } | null;
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
  message_type: 'text' | 'image' | 'file' | 'voice' | 'document' | 'audio';
  file_url?: string;
  reply_to_id?: number;
  reply_to?: Message;
  forwarded_from?: number;
  forwarded_from_message?: Message;
  is_deleted: boolean;
  deleted_for_all: boolean;
  user: User;
  reactions?: MessageReaction[];
  created_at: string;
  updated_at: string;
}

// Ensure MessageReaction is defined and exported
export interface MessageReaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  user: User;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  bio?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface CreateChatRequest {
  type: 'private' | 'group';
  participant_ids: number[];
  name?: string;
}

export interface SendMessageRequest {
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'voice' | 'document' | 'audio';
  file_url?: string;
  reply_to_id?: number;
}

export interface ForwardMessageRequest {
  target_chat_id: number;
}

export interface DeleteMessageRequest {
  delete_type: 'for_me' | 'for_everyone';
}

export interface AddReactionRequest {
  emoji: string;
}

export interface UpdateReactionRequest {
  emoji: string;
} 