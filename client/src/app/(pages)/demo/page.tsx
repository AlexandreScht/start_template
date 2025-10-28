import Demo from '@/components/demo';
import FetchServerSide from '@/hooks/providers/useServerServices';
import serviceSelector from '@/hooks/serviceSelector';

export default async function DemoPage() {
  return (
    <FetchServerSide services={{ demoTest: serviceSelector(v => v.simple()) }}>
      <Demo />
    </FetchServerSide>
  );
}
