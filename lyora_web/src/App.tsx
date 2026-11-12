import { AppProviders } from '@/core/providers/AppProviders';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
