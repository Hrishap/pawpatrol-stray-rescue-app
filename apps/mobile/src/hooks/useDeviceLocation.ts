import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { KOCHI_CENTER } from '@/hooks/useCases';

export function useDeviceLocation() {
  const [coords, setCoords] = useState(KOCHI_CENTER);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.granted) {
          const pos = await Location.getCurrentPositionAsync({});
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch {
        // keep the default Kochi center
      } finally {
        setReady(true);
      }
    })();
  }, []);

  return { coords, ready };
}
