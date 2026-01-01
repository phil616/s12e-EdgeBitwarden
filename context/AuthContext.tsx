'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  decryptVault,
  deriveAuthHash,
  deriveMasterKey,
  encryptVault,
  exportMasterKey,
  generateSalt,
  importMasterKey
} from '@/lib/crypto';
import { VaultData, VaultItem, EncryptedVault } from '@/lib/types';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  masterKey: CryptoKey | null;
  vaultData: VaultData | null;
  needsSetup: boolean;
  checkStatus: () => Promise<void>;
  setup: (password: string) => Promise<void>;
  login: (password: string) => Promise<void>;
  loginPasskey: () => Promise<void>;
  registerPasskey: () => Promise<void>;
  logout: () => void;
  addItem: (item: VaultItem) => Promise<void>;
  updateItem: (item: VaultItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const router = useRouter();

  // Check initialization status
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/auth/setup');
      const data = await res.json();
      setNeedsSetup(!data.initialized);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const setup = async (password: string) => {
    setIsLoading(true);
    try {
      const salt = await generateSalt();
      const key = await deriveMasterKey(password, salt);
      const authHash = await deriveAuthHash(password, salt);

      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authHash, salt }),
      });

      if (!res.ok) throw new Error('Setup failed');

      setMasterKey(key);
      setVaultData({ items: [], updatedAt: Date.now() });
      setIsAuthenticated(true);
      setNeedsSetup(false);
      
      // Initial sync (empty vault)
      await syncVault({ items: [], updatedAt: Date.now() }, key);
      
      router.push('/');
    } catch (e) {
      toast.error('初始化失败');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (password: string) => {
    setIsLoading(true);
    try {
      // 1. We don't have salt yet. We need to "Login" first to get salt?
      // Wait, standard practice: Send email (user), get salt.
      // Here we only have one user. So we assume we can fetch salt?
      // My API /login requires authHash... which requires salt!
      // Chicken and egg.
      // Correction: /api/auth/setup implies we store salt.
      // I should expose an endpoint to GET salt (unauthenticated) or 
      // return salt on failed login? No, salt is usually public.
      // Let's create an endpoint GET /api/auth/salt ? 
      // Or just assume single user and GET /api/auth/setup returns salt?
      // GET /api/auth/setup returns { initialized: bool }.
      
      // Let's fetch salt first. I'll hack /api/auth/login to support a pre-flight?
      // Or better: The user enters password. We need salt.
      // Let's change /api/auth/login to accept just username (if multi) or nothing?
      // Or just GET /api/auth/params ?
      
      // **Quick Fix**: I will modify `app/api/auth/setup/route.ts` GET to return salt if initialized.
      const statusRes = await fetch('/api/auth/setup');
      const statusData = await statusRes.json();
      if (!statusData.initialized) throw new Error('Not initialized');
      
      // Wait, I didn't return salt in GET /api/auth/setup. I should.
      // I will assume I can fetch it.
      // For now, let's assume I add that field.
      // But wait, if I can't modify the API easily now... 
      // Actually I can edit the file.
      
      // Let's fetch salt from a new endpoint or update GET /api/auth/setup
      // I'll update GET /api/auth/setup to return salt.
    } catch (e) {
        // ...
    }
  };
  
  // Re-implementing login with salt fetching logic in mind
  const loginReal = async (password: string) => {
      setIsLoading(true);
      try {
          // Fetch salt (assuming I'll fix the API)
          const paramsRes = await fetch('/api/auth/params'); // New endpoint
          if (!paramsRes.ok) throw new Error('Failed to get auth params');
          const { salt } = await paramsRes.json();
          
          const key = await deriveMasterKey(password, salt);
          const authHash = await deriveAuthHash(password, salt);
          
          const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ authHash })
          });
          
          if (!res.ok) throw new Error('Invalid password');
          
          const data = await res.json();
          // data.vault is EncryptedVault
          if (data.vault) {
              const decrypted = await decryptVault(data.vault.iv, data.vault.data, key);
              setVaultData(decrypted);
          } else {
              setVaultData({ items: [], updatedAt: Date.now() });
          }
          
          setMasterKey(key);
          setIsAuthenticated(true);
          router.push('/');
      } catch (e) {
          toast.error('登录失败');
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  const loginPasskey = async () => {
    setIsLoading(true);
    try {
        const resp = await fetch('/api/auth/passkey/auth/start');
        const opts = await resp.json();
        
        const verificationResp = await startAuthentication(opts);
        
        const verifyRes = await fetch('/api/auth/passkey/auth/finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(verificationResp)
        });
        
        if (!verifyRes.ok) throw new Error('Passkey validation failed');
        
        const data = await verifyRes.json();
        setIsAuthenticated(true);
        
        if (data.masterKey) {
            // Decrypt vault with retrieved master key
            try {
                const key = await importMasterKey(data.masterKey);
                setMasterKey(key);
                
                if (data.vault) {
                    const decrypted = await decryptVault(data.vault.iv, data.vault.data, key);
                    setVaultData(decrypted);
                } else {
                    setVaultData({ items: [], updatedAt: Date.now() });
                }
                toast.success('通过通行密钥登录并解锁');
            } catch (err) {
                console.error('Failed to import master key', err);
                toast.error('Passkey valid, but failed to unlock vault');
                setVaultData(null);
            }
        } else if (data.vault) {
             setVaultData(null); 
             toast.success('Logged in via Passkey. Please unlock vault with password.');
        } else {
            setVaultData({ items: [], updatedAt: Date.now() });
        }
        router.push('/');
    } catch (e) {
        toast.error('Passkey login failed');
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const registerPasskey = async () => {
      try {
          const resp = await fetch('/api/auth/passkey/register/start');
          const opts = await resp.json();
          
          const attResp = await startRegistration(opts);
          
          // Export master key to wrap it on server
          let masterKeyJwk = undefined;
          if (masterKey) {
              masterKeyJwk = await exportMasterKey(masterKey);
          }

          const verifyRes = await fetch('/api/auth/passkey/register/finish', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  attResp,
                  masterKey: masterKeyJwk
              })
          });
          
          if (verifyRes.ok) {
              toast.success('通行密钥注册成功！');
          } else {
              throw new Error('Verification failed');
          }
      } catch (e) {
          toast.error('注册通行密钥失败');
          console.error(e);
      }
  };

  const syncVault = async (newData: VaultData, key: CryptoKey) => {
      const encrypted = await encryptVault(newData, key);
      await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(encrypted)
      });
      setVaultData(newData);
  };

  const addItem = async (item: VaultItem) => {
      if (!masterKey || !vaultData) return;
      const newData = {
          ...vaultData,
          items: [...vaultData.items, item],
          updatedAt: Date.now()
      };
      await syncVault(newData, masterKey);
  };

  const updateItem = async (updatedItem: VaultItem) => {
      if (!masterKey || !vaultData) return;
      const newData = {
          ...vaultData,
          items: vaultData.items.map(i => i.id === updatedItem.id ? updatedItem : i),
          updatedAt: Date.now()
      };
      await syncVault(newData, masterKey);
  };

  const deleteItem = async (id: string) => {
      if (!masterKey || !vaultData) return;
      const newData = {
          ...vaultData,
          items: vaultData.items.filter(i => i.id !== id),
          updatedAt: Date.now()
      };
      await syncVault(newData, masterKey);
  };

  const logout = () => {
      setMasterKey(null);
      setVaultData(null);
      setIsAuthenticated(false);
      router.push('/login');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, isLoading, masterKey, vaultData, needsSetup,
      checkStatus, setup, login: loginReal, loginPasskey, registerPasskey, logout,
      addItem, updateItem, deleteItem
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
