import { Timestamp } from "firebase/firestore";

export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl: string;
  createdAt: Timestamp;
}
