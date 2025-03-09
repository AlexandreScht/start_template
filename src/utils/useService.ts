import { mutate } from 'swr';

export default function useService() {
  if (typeof window === 'undefined') mutate(null);
}
