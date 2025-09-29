import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import './katex-minimal.css';

/**
 * 數學公式渲染器
 * 支援 KaTeX 渲染數學公式和普通文字
 */
export const MathRenderer = ({ content, inline = false }) => {
  if (!content) return null;

  // 解析內容中的數學公式
  const parseContent = (text) => {
    const parts = [];
    let currentIndex = 0;
    
    // 匹配 $...$ (行內公式) 和 $$...$$ (塊級公式)
    const mathRegex = /(\$\$[\s\S]*?\$\$)|(\$[^$\n]*?\$)/g;
    let match;
    
    while ((match = mathRegex.exec(text)) !== null) {
      // 添加公式前的普通文字
      if (match.index > currentIndex) {
        const beforeText = text.substring(currentIndex, match.index);
        if (beforeText.trim()) {
          parts.push({
            type: 'text',
            content: beforeText,
            key: `text-${parts.length}`,
          });
        }
      }
      
      // 添加數學公式
      const mathContent = match[0];
      const isBlock = mathContent.startsWith('$$');
      const formula = isBlock 
        ? mathContent.slice(2, -2).trim()
        : mathContent.slice(1, -1).trim();
      
      parts.push({
        type: 'math',
        content: formula,
        isBlock,
        key: `math-${parts.length}`,
      });
      
      currentIndex = match.index + match[0].length;
    }
    
    // 添加剩餘的普通文字
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText.trim()) {
        parts.push({
          type: 'text',
          content: remainingText,
          key: `text-${parts.length}`,
        });
      }
    }
    
    return parts;
  };

  const renderPart = (part) => {
    if (part.type === 'math') {
      try {
        if (part.isBlock) {
          return (
            <div key={part.key} style={{ margin: '20px 0', textAlign: 'center' }}>
              <BlockMath math={part.content} />
            </div>
          );
        } else {
          return <InlineMath key={part.key} math={part.content} />;
        }
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        // 如果 KaTeX 渲染失敗，顯示原始公式
        return (
          <span key={part.key} style={{ 
            color: '#e74c3c', 
            fontFamily: 'monospace',
            backgroundColor: '#ffe6e6',
            padding: '2px 4px',
            borderRadius: '3px'
          }}>
            {part.isBlock ? `$$${part.content}$$` : `$${part.content}$`}
          </span>
        );
      }
    } else {
      // 處理普通文字，包括換行
      const lines = part.content.split('\n');
      return (
        <span key={part.key}>
          {lines.map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
      );
    }
  };

  const parts = parseContent(content);
  
  if (parts.length === 0) {
    return <span>{content}</span>;
  }

  return (
    <div style={{ 
      lineHeight: '1.6',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap'
    }}>
      {parts.map(renderPart)}
    </div>
  );
};

/**
 * 數學公式動畫組件
 * 支援逐步顯示數學公式的不同部分
 */
export const AnimatedMathRenderer = ({ content, progress = 1, highlightParts = [] }) => {
  // 根據進度控制顯示的內容
  const visibleContent = content.substring(0, Math.floor(content.length * progress));
  
  return (
    <div style={{ position: 'relative' }}>
      <MathRenderer content={visibleContent} />
      {/* 可以添加高亮效果 */}
      {highlightParts.map((part, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            backgroundColor: 'rgba(255, 255, 0, 0.3)',
            borderRadius: '4px',
            pointerEvents: 'none',
            ...part.style,
          }}
        />
      ))}
    </div>
  );
};

/**
 * 數學步驟渲染器
 * 用於顯示解題步驟，支援步驟間的動畫
 */
export const MathStepsRenderer = ({ steps, currentStep = 0 }) => {
  return (
    <div style={{ textAlign: 'left' }}>
      {steps.map((step, index) => {
        const isVisible = index <= currentStep;
        const isCurrent = index === currentStep;
        
        return (
          <div
            key={index}
            style={{
              opacity: isVisible ? 1 : 0.3,
              transform: `translateX(${isVisible ? '0' : '20px'})`,
              transition: 'all 0.5s ease',
              marginBottom: '30px',
              padding: '20px',
              backgroundColor: isCurrent ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
              borderLeft: isCurrent ? '4px solid #3498db' : '4px solid transparent',
              borderRadius: '8px',
            }}
          >
            <div style={{ 
              fontSize: '24px', 
              color: '#7f8c8d', 
              marginBottom: '10px',
              fontWeight: 'bold'
            }}>
              步驟 {index + 1}
            </div>
            <MathRenderer content={step.content} />
            {step.explanation && (
              <div style={{ 
                fontSize: '32px', 
                color: '#95a5a6', 
                marginTop: '10px',
                fontStyle: 'italic'
              }}>
                {step.explanation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};