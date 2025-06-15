'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID, ID } from '@/lib/appwrite';
import { User, AuthContextType } from '@/types';
import { AppwriteException } from 'appwrite';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const session = await account.get();
      if (session) {
        const userData: User = {
          $id: session.$id,
          email: session.email,
          name: session.name,
          createdAt: session.$createdAt
        };
        setUser(userData);
      }
    } catch (error) {
      console.log('No active session');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
      await checkAuth();
    } catch (error) {
      if (error instanceof AppwriteException) {
        throw new Error(error.message);
      }
      throw new Error('登入失敗');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const newAccount = await account.create(ID.unique(), email, password, name);
        
        await databases.createDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          newAccount.$id,
          {
            email,
            name,
            createdAt: new Date().toISOString()
          }
        );
        
        await login(email, password);
        return; // 成功後退出
      } catch (error) {
        if (error instanceof AppwriteException) {
          // 如果是速率限制錯誤，等待後重試
          if (error.code === 429) {
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // 遞增等待時間
              continue;
            }
          }
          throw new Error(error.message);
        }
        throw new Error('註冊失敗');
      }
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}