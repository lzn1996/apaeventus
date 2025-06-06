// src/screens/MyTicketsScreen/types.ts

export interface MyEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl?: string;
}

export interface MyTicketsScreenProps {
  events: MyEvent[];
}
