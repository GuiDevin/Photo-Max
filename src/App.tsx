import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/AppShell';
import { Dashboard } from '@/pages/Dashboard';
import { Services } from '@/pages/Services';
import { Contracts } from '@/pages/Contracts';
import { Clients } from '@/pages/Clients';
import { Finance } from '@/pages/Finance';
import { Tasks } from '@/pages/Tasks';
import { Settings } from '@/pages/Settings';
import { ToastProvider } from '@/hooks/useToast';
import { SearchProvider } from '@/hooks/useGlobalSearch';

export function App() {
  return (
    <ToastProvider>
      <SearchProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/servicos" element={<Services />} />
            <Route path="/contratos" element={<Contracts />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/financeiro" element={<Finance />} />
            <Route path="/tarefas" element={<Tasks />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </SearchProvider>
    </ToastProvider>
  );
}