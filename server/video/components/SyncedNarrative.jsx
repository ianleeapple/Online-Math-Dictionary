import React from 'react';
import { useCurrentFrame, useVideoConfig, Audio, Sequence } from 'remotion';

/**
 * 同步旁白組件
 * 根據音訊時間軸同步顯示文字內容
 */
export const SyncedNarrative = ({ audioTimeline, scene, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  if (!audioTimeline || !audioTimeline.segments) {
    // 無音訊時間軸，使用基本顯示
    return (
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '5%',
        right: '5%',
        padding: '30px 40px',
        background: 'rgba(0, 0, 0, 0.75)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
      }}>
        <p style={{
          margin: 0,
          fontSize: '32px',
          lineHeight: 1.6,
          color: '#fff',
          textAlign: 'center',
          fontFamily: 'Microsoft JhengHei, sans-serif',
        }}>
          {scene.visualContent || scene.narrative}
        </p>
      </div>
    );
  }

  // 找到當前時間對應的文字片段
  const currentSegment = audioTimeline.segments.find(seg => {
    const segmentStart = seg.startTime;
    const segmentEnd = seg.endTime;
    return currentTime >= segmentStart && currentTime < segmentEnd;
  });

  // 計算當前已說完的文字
  const spokenSegments = audioTimeline.segments.filter(seg => 
    currentTime >= seg.endTime
  );

  return (
    <div style={{
      position: 'absolute',
      bottom: '10%',
      left: '5%',
      right: '5%',
      padding: '30px 40px',
      background: 'rgba(0, 0, 0, 0.75)',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        fontSize: '32px',
        lineHeight: 1.8,
        color: '#fff',
        fontFamily: 'Microsoft JhengHei, sans-serif',
      }}>
        {/* 已說完的文字（灰色） */}
        {spokenSegments.map((seg, idx) => (
          <span key={`spoken-${idx}`} style={{
            color: '#999',
            marginRight: '4px',
          }}>
            {seg.text}
          </span>
        ))}
        
        {/* 正在說的文字（高亮） */}
        {currentSegment && (
          <span style={{
            color: '#FFD700',
            fontWeight: currentSegment.emphasis === 'strong' ? 'bold' : 'normal',
            fontSize: currentSegment.emphasis === 'strong' ? '36px' : '32px',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.6)',
            animation: 'pulse 0.5s ease-in-out infinite',
          }}>
            {currentSegment.text}
          </span>
        )}
      </div>
      
      {/* 音訊播放 */}
      {audioTimeline.audioPath && (
        <Audio
          src={audioTimeline.audioPath}
          startFrom={startFrame}
        />
      )}
      
      {/* CSS 動畫 */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * 教學停頓提示組件
 * 在關鍵停頓點顯示思考提示
 */
export const ThinkingPause = ({ duration = 1.0, message = "思考一下..." }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = frame / (duration * fps);

  // 淡入淡出效果
  const opacity = progress < 0.2 
    ? progress / 0.2 
    : progress > 0.8 
    ? (1 - progress) / 0.2 
    : 1;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: opacity,
    }}>
      <div style={{
        padding: '20px 40px',
        background: 'rgba(255, 215, 0, 0.15)',
        border: '2px dashed #FFD700',
        borderRadius: '8px',
        fontSize: '28px',
        color: '#FFD700',
        fontFamily: 'Microsoft JhengHei, sans-serif',
        textAlign: 'center',
      }}>
        [思考] {message}
      </div>
      
      {/* 思考動畫 */}
      <div style={{
        marginTop: '10px',
        textAlign: 'center',
        fontSize: '24px',
      }}>
        <span style={{
          animation: 'bounce 0.6s ease-in-out infinite',
          animationDelay: '0s',
        }}>·</span>
        <span style={{
          animation: 'bounce 0.6s ease-in-out infinite',
          animationDelay: '0.2s',
        }}>·</span>
        <span style={{
          animation: 'bounce 0.6s ease-in-out infinite',
          animationDelay: '0.4s',
        }}>·</span>
      </div>
      
      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

/**
 * 重點強調組件
 * 用於強調關鍵概念
 */
export const EmphasisHighlight = ({ text, type = 'normal' }) => {
  const frame = useCurrentFrame();
  const scale = 1 + Math.sin(frame * 0.1) * 0.05;

  const styles = {
    normal: {
      color: '#fff',
      fontSize: '48px',
    },
    important: {
      color: '#FFD700',
      fontSize: '56px',
      fontWeight: 'bold',
      textShadow: '0 0 30px rgba(255, 215, 0, 0.8)',
    },
    warning: {
      color: '#FF6B6B',
      fontSize: '52px',
      fontWeight: 'bold',
      textShadow: '0 0 30px rgba(255, 107, 107, 0.8)',
    },
  };

  return (
    <div style={{
      display: 'inline-block',
      transform: type !== 'normal' ? `scale(${scale})` : 'none',
      transition: 'transform 0.3s ease',
      ...styles[type],
      fontFamily: 'Microsoft JhengHei, sans-serif',
    }}>
      {text}
    </div>
  );
};

export default SyncedNarrative;
