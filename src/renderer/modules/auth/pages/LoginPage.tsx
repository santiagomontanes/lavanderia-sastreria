import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { SessionUser } from '@shared/types';
import { api } from '@renderer/services/api';
import { Button, Input } from '@renderer/ui/components';

export const LoginPage = ({ onLogin }: { onLogin: (user: SessionUser) => void }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const mutation = useMutation({ mutationFn: api.login, onSuccess: onLogin });

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <span className="eyebrow">Fase 1 · acceso inicial</span>
        <h2>Iniciar sesión</h2>
        <p>Usa el usuario semilla <strong>admin</strong> con contraseña <strong>admin</strong>.</p>
        <label><span>Usuario</span><Input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label><span>Contraseña</span><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <Button onClick={() => mutation.mutate({ username, password })} disabled={mutation.isPending}>Entrar</Button>
        {mutation.isError && <p className="error-text">{(mutation.error as Error).message}</p>}
      </div>
    </div>
  );
};
