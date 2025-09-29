import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
  spring,
  useSpringValue,
} from 'remotion';
import { MathRenderer } from './MathRenderer';
import { SceneTransition } from './SceneTransition';

/**
 * 數學解題影片的主要序列組件
 * 根據腳本內容渲染不同的場景
 */
export const MathVideoSequence = ({ question, script, style, options }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // 計算每個場景的開始幀和持續幀數
  const scenes = script.scenes || [];
  let currentFrame = 0;
  const sceneFrames = scenes.map((scene) => {
    const duration = scene.duration || 3;
    const frames = duration * fps;
    const result = {
      ...scene,
      startFrame: currentFrame,
      endFrame: currentFrame + frames,
      durationInFrames: frames,
    };
    currentFrame += frames;
    return result;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: getBackgroundColor(style) }}>
      {/* 背景裝飾 */}
      <BackgroundDecoration style={style} frame={frame} />
      
      {/* 渲染所有場景 */}
      {sceneFrames.map((scene, index) => (
        <Sequence
          key={index}
          from={scene.startFrame}
          durationInFrames={scene.durationInFrames}
        >
          <SceneComponent
            scene={scene}
            style={style}
            width={width}
            height={height}
            fps={fps}
          />
        </Sequence>
      ))}
      
      {/* 場景間的過渡效果 */}
      {sceneFrames.map((scene, index) => {
        if (index === sceneFrames.length - 1) return null;
        return (
          <Sequence
            key={`transition-${index}`}
            from={scene.endFrame - 15} // 過渡效果持續 0.5 秒
            durationInFrames={30}
          >
            <SceneTransition style={style} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * 單個場景組件
 */
const SceneComponent = ({ scene, style, width, height, fps }) => {
  const frame = useCurrentFrame();
  
  // 入場動畫
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 根據場景類型渲染不同內容
  const renderSceneContent = () => {
    switch (scene.type) {
      case 'question':
        return <QuestionScene scene={scene} style={style} />;
      case 'analysis':
        return <AnalysisScene scene={scene} style={style} />;
      case 'concept':
        return <ConceptScene scene={scene} style={style} />;
      case 'steps':
        return <StepsScene scene={scene} style={style} />;
      case 'answer':
        return <AnswerScene scene={scene} style={style} />;
      default:
        return <DefaultScene scene={scene} style={style} />;
    }
  };

  return (
    <AbsoluteFill style={{ opacity }}>
      {renderSceneContent()}
    </AbsoluteFill>
  );
};

/**
 * 題目場景
 */
const QuestionScene = ({ scene, style }) => {
  const frame = useCurrentFrame();
  
  // 打字機效果
  const textProgress = interpolate(frame, [0, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  const displayedText = scene.content.substring(0, Math.floor(scene.content.length * textProgress));

  return (
    <AbsoluteFill style={{ padding: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={getTitleStyle(style)}>
        {scene.title}
      </div>
      <div style={getContentStyle(style)}>
        <MathRenderer content={displayedText} />
      </div>
    </AbsoluteFill>
  );
};

/**
 * 概念解析場景
 */
const AnalysisScene = ({ scene, style }) => {
  return (
    <AbsoluteFill style={{ padding: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={getTitleStyle(style)}>
        {scene.title}
      </div>
      <div style={getContentStyle(style)}>
        <MathRenderer content={scene.content} />
      </div>
    </AbsoluteFill>
  );
};

/**
 * 解題概念場景
 */
const ConceptScene = ({ scene, style }) => {
  const frame = useCurrentFrame();
  const concepts = scene.content.split('\n').filter(Boolean);
  
  return (
    <AbsoluteFill style={{ padding: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={getTitleStyle(style)}>
        {scene.title}
      </div>
      <div style={getListStyle(style)}>
        {concepts.map((concept, index) => {
          const showFrame = index * 30; // 每 1 秒顯示一個概念
          const opacity = interpolate(frame, [showFrame, showFrame + 15], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          
          return (
            <div key={index} style={{ ...getListItemStyle(style), opacity }}>
              <MathRenderer content={`${index + 1}. ${concept}`} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/**
 * 詳細步驟場景
 */
const StepsScene = ({ scene, style }) => {
  const frame = useCurrentFrame();
  const steps = scene.content.split('\n').filter(Boolean);
  
  return (
    <AbsoluteFill style={{ padding: '80px', display: 'flex', flexDirection: 'column' }}>
      <div style={getTitleStyle(style)}>
        {scene.title}
      </div>
      <div style={getListStyle(style)}>
        {steps.map((step, index) => {
          const showFrame = index * 40; // 每 1.33 秒顯示一個步驟
          const opacity = interpolate(frame, [showFrame, showFrame + 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          
          // 高亮效果
          const highlight = interpolate(frame, [showFrame + 20, showFrame + 50], [1, 0.7], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          
          return (
            <div 
              key={index} 
              style={{ 
                ...getListItemStyle(style), 
                opacity,
                backgroundColor: `rgba(255, 255, 0, ${highlight * 0.2})`,
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px'
              }}
            >
              <MathRenderer content={`${index + 1}. ${step}`} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/**
 * 答案場景
 */
const AnswerScene = ({ scene, style }) => {
  const frame = useCurrentFrame();
  
  // 放大效果
  const scale = spring({
    frame,
    from: 0.5,
    to: 1,
    fps: 30,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ ...getTitleStyle(style), transform: `scale(${scale})` }}>
        {scene.title}
      </div>
      <div style={{ ...getAnswerStyle(style), transform: `scale(${scale})` }}>
        <MathRenderer content={scene.content} />
      </div>
    </AbsoluteFill>
  );
};

/**
 * 預設場景
 */
const DefaultScene = ({ scene, style }) => {
  return (
    <AbsoluteFill style={{ padding: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={getContentStyle(style)}>
        <MathRenderer content={scene.content} />
      </div>
    </AbsoluteFill>
  );
};

/**
 * 背景裝飾組件
 */
const BackgroundDecoration = ({ style, frame }) => {
  if (style === 'simple') return null;
  
  // 根據樣式添加不同的背景裝飾
  return (
    <AbsoluteFill style={{ opacity: 0.1 }}>
      {/* 幾何圖案或數學符號背景 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '10%',
        fontSize: '200px',
        color: '#888',
        transform: `rotate(${frame * 0.5}deg)`,
      }}>
        ∑
      </div>
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '10%',
        fontSize: '150px',
        color: '#888',
        transform: `rotate(${-frame * 0.3}deg)`,
      }}>
        π
      </div>
    </AbsoluteFill>
  );
};

// 樣式函數
const getBackgroundColor = (style) => {
  switch (style) {
    case 'whiteboard':
      return '#f8f9fa';
    case 'animated':
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    default:
      return '#ffffff';
  }
};

const getTitleStyle = (style) => ({
  fontSize: '72px',
  fontWeight: 'bold',
  color: style === 'whiteboard' ? '#2c3e50' : '#333',
  marginBottom: '40px',
  textAlign: 'center',
});

const getContentStyle = (style) => ({
  fontSize: '48px',
  color: style === 'whiteboard' ? '#34495e' : '#444',
  lineHeight: '1.6',
  textAlign: 'center',
});

const getListStyle = (style) => ({
  fontSize: '40px',
  color: style === 'whiteboard' ? '#34495e' : '#444',
  lineHeight: '1.8',
});

const getListItemStyle = (style) => ({
  marginBottom: '20px',
  padding: '10px 0',
});

const getAnswerStyle = (style) => ({
  fontSize: '80px',
  fontWeight: 'bold',
  color: '#e74c3c',
  marginTop: '40px',
  textAlign: 'center',
  padding: '30px',
  border: '4px solid #e74c3c',
  borderRadius: '20px',
  backgroundColor: 'rgba(231, 76, 60, 0.1)',
});