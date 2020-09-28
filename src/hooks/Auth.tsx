import React, {
  FC,
  createContext,
  useCallback,
  useState,
  useContext,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-community/async-storage';

import api from '../services/api';

interface AuthState {
  token: string;
  user: object;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthContextData {
  user: object;
  signIn(credentials: SignInCredentials): Promise<void>;
  signOut(): void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData,
);

export const AuthProvider: FC = ({ children }) => {
  const [data, setData] = useState<AuthState>({} as AuthContextData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData(): Promise<void> {
      const [token, user] = await AsyncStorage.multiGet([
        '@GoBaber:token',
        '@GoBaber:user',
      ]);

      setData(
        token[1] && user[1]
          ? { token: token[1], user: JSON.parse(user[1]) }
          : ({} as AuthState),
      );

      setLoading(false);
    }

    loadStorageData();
  });

  const signIn = useCallback(async ({ email, password }) => {
    const response = await api.post<AuthState>('sessions', {
      email,
      password,
    });

    const { token, user } = response.data;

    await AsyncStorage.multiSet([
      ['@GoBaber:token', token],
      ['@GoBaber:user', JSON.stringify(user)],
    ]);

    setData({ token, user });
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(['@GoBaber:token', '@GoBaber:user']);

    setData({} as AuthState);
  }, []);

  return (
    <AuthContext.Provider value={{ user: data.user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
