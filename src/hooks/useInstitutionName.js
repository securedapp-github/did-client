import { useEffect, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { getMe } from '../utils/api';

const deriveName = (payload = {}) => {
  return (
    payload?.institutionName ||
    payload?.institution_name ||
    payload?.collegeName ||
    payload?.universityName ||
    ''
  );
};

const useInstitutionName = () => {
  const { isAuthenticated } = useAuthContext();
  const [institutionName, setInstitutionName] = useState('');

  useEffect(() => {
    let ignore = false;

    const fetchName = async () => {
      if (!isAuthenticated) {
        setInstitutionName('');
        return;
      }

      try {
        const res = await getMe();
        const payload = res?.data?.user || res?.data?.data || res?.data || {};
        const name = deriveName(payload);
        if (!ignore) {
          setInstitutionName(name || '');
        }
      } catch (error) {
        if (!ignore) {
          setInstitutionName('');
        }
      }
    };

    fetchName();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  return institutionName;
};

export default useInstitutionName;
