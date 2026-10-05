// PhotoMax — Settings page
import { useRef, useState } from 'react';
import {
  Settings as SettingsIcon,
  Upload,
  Download,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/layout/Layout';
import {
  Badge,
  Button,
  Input,
  SectionHeader,
  Select,
} from '@/components/ui/primitives';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { importData } from '@/utils/storage';

export function Settings() {
  const settings = useAppStore((s) => s.data.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const resetData = useAppStore((s) => s.resetData);
  const replaceData = useAppStore((s) => s.replaceData);
  const exportSnapshot = useAppStore((s) => s.exportSnapshot);
  const { push } = useToast();

  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportSnapshot()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photomax-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    push({ title: 'Backup exportado', variant: 'success' });
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      push({ title: 'Arquivo muito grande', variant: 'error' });
      return;
    }
    const text = await file.text();
    const parsed = importData(text);
    if ('error' in parsed) {
      push({ title: 'Erro ao importar', description: parsed.error, variant: 'error' });
      return;
    }
    replaceData(parsed);
    push({ title: 'Dados importados', variant: 'success' });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Configurações"
        subtitle="Personalize o PhotoMax para o seu estúdio"
        icon={<SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
      />

      <div className="grid gap-5 xl:gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pm-card p-4 sm:p-6 xl:col-span-2"
        >
          <SectionHeader
            title="Identidade do estúdio"
            description="Defina como o PhotoMax se apresenta"
            actions={<Badge variant="brand">Recomendado</Badge>}
          />
          <div className="pm-stagger mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Nome do estúdio"
              value={settings.studioName}
              onChange={(e) => setSettings({ studioName: e.target.value })}
              maxLength={80}
            />
            <Input
              label="Seu nome"
              value={settings.ownerName}
              onChange={(e) => setSettings({ ownerName: e.target.value })}
              maxLength={80}
            />
            <Select
              label="Moeda"
              value={settings.currency}
              onChange={(e) => setSettings({ currency: e.target.value as 'BRL' | 'USD' | 'EUR' })}
              options={[
                { value: 'BRL', label: 'Real Brasileiro (R$)' },
                { value: 'USD', label: 'Dólar Americano ($)' },
                { value: 'EUR', label: 'Euro (€)' },
              ]}
            />
            <Select
              label="Idioma"
              value={settings.locale}
              onChange={(e) => setSettings({ locale: e.target.value as 'pt-BR' | 'en-US' })}
              options={[
                { value: 'pt-BR', label: 'Português (Brasil)' },
                { value: 'en-US', label: 'English (US)' },
              ]}
            />
            <Select
              label="Tema"
              value={settings.theme}
              onChange={(e) => setSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
              options={[
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Escuro' },
                { value: 'system', label: 'Sistema' },
              ]}
            />
            <Input
              label="Alíquota de impostos"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={Math.round(settings.taxRate * 1000) / 10}
              onChange={(e) =>
                setSettings({ taxRate: Math.max(0, Math.min(1, Number(e.target.value) / 100)) })
              }
              hint={`${(settings.taxRate * 100).toFixed(1)}% aplicado sobre o total recebido`}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="pm-card p-4 sm:p-6"
        >
          <SectionHeader
            title="Backup e dados"
            description="Exporte ou restaure todos os seus dados a qualquer momento."
          />
          <div className="pm-stagger mt-4 space-y-2">
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<Download className="h-4 w-4" />}
              onClick={download}
            >
              Exportar JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={onImport}
            />
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={() => fileRef.current?.click()}
            >
              Importar JSON
            </Button>
            <Button
              variant="danger"
              fullWidth
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setConfirmReset(true)}
            >
              Resetar tudo
            </Button>
          </div>

          <div className="pm-divider my-4" />
          <div className="rounded-xl border border-amber-200/80 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200">
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              Atenção
            </p>
            <p className="mt-1">
              Resetar substitui todos os dados pelos exemplos iniciais. Faça backup antes.
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="pm-card p-4 sm:p-6"
      >
        <SectionHeader
          title="Sobre o PhotoMax"
          description="Detalhes da plataforma"
        />
        <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
          O PhotoMax é uma plataforma completa de gestão para fotógrafos. Reúne contratos,
          finanças, CRM e tarefas em uma só interface, com persistência local no seu navegador
          (privado e offline-first).
        </p>
        <div className="pm-stagger mt-4 grid gap-2 sm:grid-cols-3">
          <Pill label="Versão" value="1.1.0" />
          <Pill label="Stack" value="React 18 + Vite + Tailwind" />
          <Pill label="Persistência" value="localStorage criptografado" />
        </div>
      </motion.div>

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pm-card max-w-md p-6"
          >
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-900 dark:text-ink-50">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Resetar todos os dados?
            </h3>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
              Esta ação substitui todos os contratos, clientes, tarefas e despesas pelos dados de
              exemplo. Faça backup antes se quiser preservá-los.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={() => {
                  resetData();
                  setConfirmReset(false);
                  push({ title: 'Dados restaurados', variant: 'success' });
                }}
              >
                Resetar agora
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-200/80 bg-white/60 p-3 dark:border-ink-800 dark:bg-ink-900/60">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-ink-900 dark:text-ink-50">{value}</p>
    </div>
  );
}