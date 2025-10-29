import Demo from '@/components/demo';
import FetchServerSide from '@/hooks/providers/useServerServices';
import serviceSelector from '@/hooks/serviceSelector';
import { useServerService } from '@/hooks/useServerService';

export default async function DemoPage() {
  const { data, success, error } = await useServerService({
    serviceKey: 'demoTest',
    fetcher: serviceSelector(v => v.simple()),
  });
  return (
    <FetchServerSide services={{ demoTest: serviceSelector(v => v.simple()) }}>
      <Demo />
    </FetchServerSide>
  );
}
