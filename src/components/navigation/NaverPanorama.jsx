import { useEffect, useRef, useState } from 'react';

// 좌표를 받아 네이버 거리뷰(파노라마)를 렌더하고 촬영일자를 노출하는 코어 컴포넌트
export default function NaverPanorama({ lat, lng, className = '', style, onPhotoDate }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ok | empty | error

  useEffect(() => {
    if (lat == null || lng == null) return;
    if (!window.naver?.maps?.Panorama) { setStatus('error'); return; }

    let cancelled = false;
    setStatus('loading');

    const pano = new window.naver.maps.Panorama(containerRef.current, {
      position: new window.naver.maps.LatLng(lat, lng),
      pov: { pan: 0, tilt: 0, fov: 100 },
      flightSpot: false,
    });

    const okListener = window.naver.maps.Event.addListener(pano, 'pano_changed', () => {
      if (cancelled) return;
      setStatus('ok');
      const loc = pano.getLocation?.();
      if (loc?.photodate && onPhotoDate) onPhotoDate(loc.photodate);
    });
    const errListener = window.naver.maps.Event.addListener(pano, 'pano_status', (status) => {
      if (cancelled) return;
      if (status !== 'OK') setStatus('empty');
    });

    return () => {
      cancelled = true;
      window.naver.maps.Event.removeListener(okListener);
      window.naver.maps.Event.removeListener(errListener);
    };
  }, [lat, lng, onPhotoDate]);

  return (
    <div className={`relative ${className}`} style={style}>
      <div ref={containerRef} className="w-full h-full" />
      {status !== 'ok' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-sm text-gray-500 px-6 text-center">
          {status === 'loading' && '거리뷰 불러오는 중...'}
          {status === 'empty' && '이 위치는 거리뷰가 제공되지 않습니다.'}
          {status === 'error' && '거리뷰를 불러올 수 없습니다.'}
        </div>
      )}
    </div>
  );
}
