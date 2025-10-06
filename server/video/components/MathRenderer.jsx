import React from 'react';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

// 初始化 MathJax (伺服器端)
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX({ packages: AllPackages });
const svg = new SVG({ fontCache: 'none' });
const html = mathjax.document('', { InputJax: tex, OutputJax: svg });

/**
 * 將 LaTeX 公式轉換為 SVG
 */
function renderMathToSVG(latex, display = false) {
  try {
    const node = html.convert(latex, { display });
    return adaptor.innerHTML(node);
  } catch (error) {
    console.error('MathJax rendering error:', error);
    return `<span style="color: red;">${latex}</span>`;
  }
}

/**
 * 解析文字中的數學公式並轉換為 SVG
 */
function parseAndRenderMath(text) {
  if (!text) return '';
  
  let result = text;
  
  // 處理區塊公式 \[...\]
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
    return renderMathToSVG(formula, true);
  });
  
  // 處理行內公式 \(...\)
  result = result.replace(/\\\((.*?)\\\)/g, (match, formula) => {
    return renderMathToSVG(formula, false);
  });
  
  // 處理 Markdown 區塊公式 $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    return renderMathToSVG(formula, true);
  });
  
  // 處理 Markdown 行內公式 $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
    return renderMathToSVG(formula, false);
  });
  
  return result;
}

/**
 * 數學公式渲染器
 * 支援 MathJax 渲染數學公式和普通文字 (伺服器端渲染)
 */
export const MathRenderer = ({ content, inline = false }) => {
  if (!content) return null;

  const renderedContent = parseAndRenderMath(content);

  return (
    <div 
      style={{ 
        lineHeight: '1.6',
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap'
      }}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
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