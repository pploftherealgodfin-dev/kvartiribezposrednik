import SiteLayout from './SiteLayout';
import { useAuth } from '@/hooks/useAuth';
export default function ProfileRecovery() {
  const { retryProfile, signOut } = useAuth();
  return <SiteLayout><section role="alert" className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Не успяхме да заредим профила ти</h1><p className="mt-4 text-foreground-600">Възможно е връзката да е прекъсната. Опитай отново. Ако проблемът остане, излез и влез пак.</p><div className="mt-6 flex justify-center gap-3"><button onClick={retryProfile} className="rounded-md bg-primary-600 px-5 py-3 font-semibold text-background-50">Опитай отново</button><button onClick={signOut} className="rounded-md border border-background-300 px-5 py-3">Изход</button></div></section></SiteLayout>;
}
