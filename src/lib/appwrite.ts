import { Client, Account, Databases, Query, ID } from 'appwrite';

const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);

export const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
export const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_USERS_COLLECTION_ID!;
export const EXAMS_COLLECTION_ID = process.env.NEXT_PUBLIC_EXAMS_COLLECTION_ID!;
export const QUESTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_QUESTIONS_COLLECTION_ID!;
export const SUBMISSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_SUBMISSIONS_COLLECTION_ID!;
export const LEADERBOARD_COLLECTION_ID = process.env.NEXT_PUBLIC_LEADERBOARD_COLLECTION_ID!;

export { ID, Query };
export default client;