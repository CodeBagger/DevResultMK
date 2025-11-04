export interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  color?: string;
}

export type ViewType = 'day' | 'week' | 'month';
