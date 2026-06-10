export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image?: string;
  social_media?: {
    instagram?: boolean;
    facebook?: boolean;
    whatsapp?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image?: string;
  social_media?: {
    instagram?: boolean;
    facebook?: boolean;
    whatsapp?: boolean;
  };
}


