import React from 'react';
import { Composition } from 'remotion';
import { MathVideoSequence } from './MathVideoSequence';

/**
 * Remotion 影片專案的根組件
 * 定義影片的組合 (Compositions)
 */
export const MathVideoRoot = () => {
  return (
    <>
      <Composition
        id="MathVideoComposition"
        component={MathVideoSequence}
        durationInFrames={600} // 20秒 * 30fps，會被動態覆蓋
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          question: '計算二次方程式 $x^2 + 5x + 6 = 0$ 的解',
          script: {
            title: '二次方程式解題',
            scenes: [
              {
                type: 'question',
                title: '題目',
                content: '計算二次方程式 $x^2 + 5x + 6 = 0$ 的解',
                duration: 4
              },
              {
                type: 'analysis',
                title: '題目分析',
                content: '這是一個標準的二次方程式，我們可以用因式分解或二次公式來解',
                duration: 3
              },
              {
                type: 'concept',
                title: '解題概念',
                content: '觀察係數：$a = 1$, $b = 5$, $c = 6$\n尋找兩個數字相加等於 5，相乘等於 6\n這兩個數字是 2 和 3',
                duration: 5
              },
              {
                type: 'steps',
                title: '詳細步驟',
                content: '$x^2 + 5x + 6 = 0$\n$(x + 2)(x + 3) = 0$\n$x + 2 = 0$ 或 $x + 3 = 0$\n$x = -2$ 或 $x = -3$',
                duration: 6
              },
              {
                type: 'answer',
                title: '最終答案',
                content: '$x = -2$ 或 $x = -3$',
                duration: 2
              }
            ]
          },
          style: 'whiteboard',
          options: {
            showBackground: true,
            animateText: true,
            showSteps: true
          }
        }}
      />
    </>
  );
};