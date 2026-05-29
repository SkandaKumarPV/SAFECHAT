export interface User {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  bio?: string;
  safetyScore: number;
  stats: {
    posts: number;
    followers: number;
    following: number;
  };
  safetyStats: {
    commentsFlagged: number;
    messagesFlagged: number;
  };
}

export interface Post {
  id: string;
  user: Partial<User>;
  image: string;
  caption: string;
  likes: number;
  createdAt: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  authorId?: string;
  username: string;
  text: string;
  createdAt: string;
  isToxic?: boolean;
  toxicityScore?: number;
  toxicityLabel?: string;
}

export interface Notification {
  id: string;
  type: 'like' | 'follow' | 'comment' | 'toxicity_warning';
  user?: Partial<User>;
  text: string;
  createdAt: string;
  image?: string;
  isRead: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  toxicityLevel?: 'none' | 'low' | 'medium' | 'high';
}

export interface ApiUser {
  id: number;
  username: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
}

export interface ApiComment {
  id: number;
  content: string;
  created_at: string;
  author: ApiUser;
  is_toxic: boolean;
  blocked: boolean;
  toxicity_label?: string | null;
  toxicity_score?: number | null;
}

export interface ApiPost {
  id: number;
  content: string;
  image_url?: string | null;
  likes_count: number;
  created_at: string;
  author: ApiUser;
  comments: ApiComment[];
}

export interface ApiMessage {
  id: number;
  content: string;
  created_at: string;
  sender: ApiUser;
  receiver: ApiUser;
  is_toxic: boolean;
  toxicity_label?: string | null;
  toxicity_score?: number | null;
}

export interface ApiUserProfile {
  user: ApiUser;
  stats: {
    posts: number;
    followers: number;
    following: number;
    comments_flagged: number;
    messages_flagged: number;
    is_following: boolean;
    is_followed_by: boolean;
  };
}

export interface ApiFollow {
  id: number;
  follower: ApiUser;
  following: ApiUser;
  created_at: string;
}

export interface ApiNotification {
  id: string;
  type: 'follow' | 'comment' | string;
  text: string;
  created_at: string;
  actor?: ApiUser | null;
  post_id?: number | null;
}
