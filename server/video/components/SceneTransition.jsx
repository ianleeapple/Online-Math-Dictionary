import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
} from 'remotion';

/**
 * 場景過渡效果組件
 * 提供多種過渡動畫效果
 */
export const SceneTransition = ({ style = 'fade', duration = 30 }) => {
  const frame = useCurrentFrame();
  
  switch (style) {
    case 'slide':
      return <SlideTransition frame={frame} duration={duration} />;
    case 'zoom':
      return <ZoomTransition frame={frame} duration={duration} />;
    case 'wipe':
      return <WipeTransition frame={frame} duration={duration} />;
    default:
      return <FadeTransition frame={frame} duration={duration} />;
  }
};

/**
 * 淡入淡出過渡
 */
const FadeTransition = ({ frame, duration }) => {
  const opacity = interpolate(frame, [0, duration / 2, duration], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        opacity,
      }}
    />
  );
};

/**
 * 滑動過渡
 */
const SlideTransition = ({ frame, duration }) => {
  const progress = interpolate(frame, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(90deg, transparent 0%, #fff 50%, transparent 100%)',
        transform: `translateX(${(progress - 0.5) * 200}%)`,
      }}
    />
  );
};

/**
 * 縮放過渡
 */
const ZoomTransition = ({ frame, duration }) => {
  const scale = spring({
    frame,
    from: 0,
    to: 3,
    fps: 30,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  const opacity = interpolate(frame, [0, duration / 2, duration], [0, 0.8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#fff',
        opacity,
        transform: `scale(${scale})`,
        borderRadius: '50%',
        transformOrigin: 'center',
      }}
    />
  );
};

/**
 * 擦除過渡
 */
const WipeTransition = ({ frame, duration }) => {
  const progress = interpolate(frame, [0, duration], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(90deg, #fff 0%, #fff ${progress}%, transparent ${progress}%)`,
      }}
    />
  );
};