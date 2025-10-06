<template>
  <span ref="mathContainer" v-html="renderedContent"></span>
</template>

<script>
import { onMounted } from 'vue';

export default {
  name: 'MathContent',
  props: {
    content: {
      type: String,
      required: true
    }
  },
  computed: {
    renderedContent() {
      return this.renderMath(this.content);
    }
  },
  mounted() {
    this.loadMathJax();
  },
  updated() {
    this.typesetMath();
  },
  methods: {
    loadMathJax() {
      if (window.MathJax) {
        this.typesetMath();
        return;
      }

      window.MathJax = {
        tex: {
          inlineMath: [['\\(', '\\)']],
          displayMath: [['\\[', '\\]']],
          processEscapes: true,
        },
        svg: {
          fontCache: 'global'
        },
        startup: {
          ready: () => {
            window.MathJax.startup.defaultReady();
            this.typesetMath();
          }
        }
      };

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
      script.async = true;
      document.head.appendChild(script);
    },
    typesetMath() {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([this.$refs.mathContainer]).catch((err) => {
          console.error('MathJax typeset error:', err);
        });
      }
    },
    renderMath(text) {
      if (!text) return '';
      // 直接返回文字，讓 MathJax 處理渲染
      return text;
    }
  }
};
</script>

<style scoped>
/* MathJax 渲染的數學公式樣式 */
span :deep(mjx-container) {
  font-size: 1.1em;
}

span :deep(mjx-container[display="block"]) {
  margin: 1em 0;
}
</style>
