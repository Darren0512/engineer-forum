
export type CommentRule = {
  tenureMin?: { y:number, m:number, noLimit:boolean },
  tenureMax?: { y:number, m:number, noLimit:boolean },
  salaryMin?: { v:number, noLimit:boolean },
  salaryMax?: { v:number, noLimit:boolean },
};

export type UserProfile = {
  uid: string;
  nick: string;
  industry: string;
  y: number;
  m: number;
  salary10k: number;
  updatedAt: number;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  industry: string;
  authorUid: string;
  authorSnapshot: { nick:string, industry:string, y:number, m:number, salary10k:number };
  rules: CommentRule;
  likesCount: number;
  commentsCount: number;
  createdAt: number;
  editedAt?: number;
  deleted?: boolean;
};

export type Comment = {
  id: string;
  uid: string;
  snapshot: { nick:string, industry:string, y:number, m:number, salary10k:number };
  text: string;
  createdAt: number;
  editedAt?: number;
  deleted?: boolean;
  parentId?: string;
};

export type Notification = {
  id: string;
  uid: string;
  text: string;
  postId: string;
  createdAt: number;
  read: boolean;
};
