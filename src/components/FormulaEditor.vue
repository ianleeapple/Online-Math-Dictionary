<template>
  <div class="math-editor">
    <label v-if="label" class="editor-label">{{ label }}</label>

    <div class="equation-ribbon">
      <div class="ribbon-tabs">
        <button
          v-for="tab in ribbonTabs"
          :key="tab.id"
          :class="['ribbon-tab', { active: tab.id === activeTabId }]"
          type="button"
          @click="selectTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="ribbon-groups" v-if="activeTab">
        <div class="ribbon-group" v-for="group in activeTab.groups" :key="group.title">
          <div class="group-items">
            <button
              v-for="item in group.items"
              :key="item.id"
              type="button"
              class="ribbon-button"
              :title="item.tooltip || item.label"
              @click="handleInsert(item)"
            >
              <span class="button-preview">{{ item.preview }}</span>
              <span class="button-label">{{ item.label }}</span>
            </button>
          </div>
          <div class="group-title">{{ group.title }}</div>
        </div>
      </div>
    </div>

    <div ref="host" class="mathfield-host"></div>
    <p v-if="placeholder" class="placeholder-hint">{{ placeholder }}</p>
    <div v-if="showLatex" class="latex-output">
      <span class="latex-label">LaTeX</span>
      <span class="latex-value">{{ latex }}</span>
    </div>
  </div>
</template>

<script setup>
import { MathfieldElement } from 'mathlive';
import 'mathlive/static.css';
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '可直接貼上 Word 方程式，或使用數學鍵盤輸入' },
  showLatex: { type: Boolean, default: true }
});

const emit = defineEmits(['update:modelValue', 'input', 'ready']);

const host = ref(null);
const mathfield = ref(null);
const latex = ref(props.modelValue ?? '');

const ribbonTabs = [
  {
    id: 'common',
    label: '常用',
    groups: [
      {
        title: '分數與根號',
        items: [
          {
            id: 'frac-simple',
            label: '普通分數',
            preview: 'a⁄b',
            latex: '\\frac{\\placeholder{分子}}{\\placeholder{分母}}'
          },
          {
            id: 'frac-mixed',
            label: '連續分數',
            preview: '1/(1+x)',
            latex: '\\frac{\\placeholder{1}}{\\placeholder{1}+\\placeholder{x}}'
          },
          {
            id: 'sqrt-simple',
            label: '平方根',
            preview: '√x',
            latex: '\\sqrt{\\placeholder{x}}'
          },
          {
            id: 'sqrt-n',
            label: 'n 次根',
            preview: 'ⁿ√x',
            latex: '\\sqrt[\\placeholder{n}]{\\placeholder{x}}'
          }
        ]
      },
      {
        title: '上下標與括號',
        items: [
          {
            id: 'superscript',
            label: '上標',
            preview: 'x²',
            latex: '\\placeholder{x}^{\\placeholder{2}}'
          },
          {
            id: 'subscript',
            label: '下標',
            preview: 'aₙ',
            latex: '\\placeholder{a}_{\\placeholder{n}}'
          },
          {
            id: 'parentheses',
            label: '括號',
            preview: '( )',
            latex: '\\left( \\placeholder{\u5167\u5bb9} \\right)'
          },
          {
            id: 'absolute',
            label: '絕對值',
            preview: '|x|',
            latex: '\\left| \\placeholder{x} \\right|'
          }
        ]
      }
    ]
  },
  {
    id: 'operators',
    label: '運算符號',
    groups: [
      {
        title: '微積分',
        items: [
          {
            id: 'integral',
            label: '不定積分',
            preview: '∫ f(x) dx',
            latex: '\\int \\placeholder{f(x)}\\,\\mathrm{d}x'
          },
          {
            id: 'def-integral',
            label: '定積分',
            preview: '∫ₐᵇ',
            latex: '\\int_{\\placeholder{a}}^{\\placeholder{b}} \\placeholder{f(x)}\\,\\mathrm{d}x'
          },
          {
            id: 'sum',
            label: '總和',
            preview: '∑',
            latex: '\\sum_{\\placeholder{i=1}}^{\\placeholder{n}} \\placeholder{a_i}'
          },
          {
            id: 'prod',
            label: '連乘',
            preview: '∏',
            latex: '\\prod_{\\placeholder{i=1}}^{\\placeholder{n}} \\placeholder{a_i}'
          }
        ]
      },
      {
        title: '其他運算',
        items: [
          {
            id: 'limit',
            label: '極限',
            preview: 'lim',
            latex: '\\lim_{\\placeholder{x\\to a}} \\placeholder{f(x)}'
          },
          {
            id: 'derivative',
            label: '導數',
            preview: 'd/dx',
            latex: '\\frac{\\mathrm{d}}{\\mathrm{d}x} \\left( \\placeholder{f(x)} \\right)'
          },
          {
            id: 'partial',
            label: '偏導數',
            preview: '∂f/∂x',
            latex: '\\frac{\\partial \\placeholder{f}}{\\partial \\placeholder{x}}'
          },
          {
            id: 'vector',
            label: '向量',
            preview: '→',
            latex: '\\vec{\\placeholder{v}}'
          }
        ]
      }
    ]
  },
  {
    id: 'symbols',
    label: '符號',
    groups: [
      {
        title: '希臘字母',
        items: [
          { id: 'alpha', label: 'α', preview: 'α', latex: '\\alpha' },
          { id: 'beta', label: 'β', preview: 'β', latex: '\\beta' },
          { id: 'gamma', label: 'γ', preview: 'γ', latex: '\\gamma' },
          { id: 'theta', label: 'θ', preview: 'θ', latex: '\\theta' },
          { id: 'lambda', label: 'λ', preview: 'λ', latex: '\\lambda' },
          { id: 'pi', label: 'π', preview: 'π', latex: '\\pi' }
        ]
      },
      {
        title: '關係符號',
        items: [
          { id: 'neq', label: '不等於', preview: '≠', latex: '\\neq' },
          { id: 'approx', label: '近似', preview: '≈', latex: '\\approx' },
          { id: 'leq', label: '≤', preview: '≤', latex: '\\leq' },
          { id: 'geq', label: '≥', preview: '≥', latex: '\\geq' },
          { id: 'infty', label: '無限', preview: '∞', latex: '\\infty' },
          { id: 'angle', label: '角度', preview: '∠', latex: '\\angle' }
        ]
      }
    ]
  }
];

const activeTabId = ref(ribbonTabs[0]?.id ?? '');

const activeTab = computed(() => ribbonTabs.find(tab => tab.id === activeTabId.value));

const syncLatexFromField = () => {
  if (!mathfield.value) return;
  const value = mathfield.value.getValue('latex-expanded');
  latex.value = value;
  emit('update:modelValue', value);
  emit('input', value);
};

onMounted(() => {
  if (!host.value) return;

  const field = new MathfieldElement();
  field.setOptions({
    smartMode: true,
    smartFence: true,
    smartSuperscript: true,
    inlineShortcuts: 'default',
    locale: 'zh-tw',
    virtualKeyboardMode: 'manual',
    customVirtualKeyboardLayers: 'numeric greek symbols',
    readAloudHook: () => null
  });

  field.value = props.modelValue ?? '';
  field.placeholder = props.placeholder ?? '';

  field.addEventListener('input', syncLatexFromField);
  field.addEventListener('focus', () => host.value?.classList.add('focused'));
  field.addEventListener('blur', () => host.value?.classList.remove('focused'));

  host.value.appendChild(field);
  mathfield.value = field;
  emit('ready', field);
  syncLatexFromField();
});

onBeforeUnmount(() => {
  if (!mathfield.value) return;
  mathfield.value.removeEventListener('input', syncLatexFromField);
  mathfield.value.remove();
  mathfield.value = null;
});

watch(() => props.modelValue, (value) => {
  const next = value ?? '';
  if (!mathfield.value) {
    latex.value = next;
    return;
  }
  const current = mathfield.value.getValue('latex-expanded');
  if (current === next) return;
  mathfield.value.setValue(next, { format: 'latex', silenceNotifications: true });
  latex.value = next;
});

watch(() => props.placeholder, (hint) => {
  if (mathfield.value) {
    mathfield.value.placeholder = hint ?? '';
  }
});

defineExpose({
  focus: () => mathfield.value?.focus(),
  blur: () => mathfield.value?.blur(),
  getLatex: () => mathfield.value?.getValue('latex-expanded') ?? '',
  insert: (snippet) => {
    if (!mathfield.value || !snippet) return;
    mathfield.value.focus();
    mathfield.value.insert(snippet, {
      format: 'latex',
      insertionMode: 'replaceSelection',
      selectionMode: 'placeholder'
    });
  }
});

const selectTab = (id) => {
  activeTabId.value = id;
  mathfield.value?.focus();
};

const handleInsert = (item) => {
  if (!mathfield.value) return;
  mathfield.value.focus();
  mathfield.value.insert(item.latex, {
    format: 'latex',
    insertionMode: 'replaceSelection',
    selectionMode: 'placeholder'
  });
};
</script>

<style scoped>
.math-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2328;
}

.equation-ribbon {
  border: 1px solid #d0d7de;
  border-radius: 12px;
  background: linear-gradient(180deg, #f9fbff 0%, #eef3fb 100%);
  padding: 12px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ribbon-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid rgba(9, 105, 218, 0.2);
  padding-bottom: 8px;
}

.ribbon-tab {
  padding: 6px 14px;
  border-radius: 999px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ribbon-tab:hover {
  background: rgba(9, 105, 218, 0.12);
  color: #0b4aa2;
}

.ribbon-tab.active {
  background: #0b4aa2;
  color: #fff;
  box-shadow: 0 2px 6px rgba(11, 74, 162, 0.25);
}

.ribbon-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.ribbon-group {
  background: #fff;
  border: 1px solid rgba(9, 105, 218, 0.15);
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 8px;
}

.ribbon-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 10px;
  background: #f7faff;
  border: 1px solid rgba(9, 105, 218, 0.15);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ribbon-button:hover {
  background: #fff;
  border-color: rgba(9, 105, 218, 0.3);
  box-shadow: 0 4px 8px rgba(15, 76, 129, 0.12);
}

.ribbon-button:active {
  transform: translateY(1px);
}

.button-preview {
  font-size: 16px;
  font-family: 'Cambria Math', 'Times New Roman', serif;
}

.button-label {
  font-size: 11px;
  color: #4a5568;
}

.group-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  text-align: center;
}

.mathfield-host {
  border: 1px solid #d0d7de;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  min-height: 120px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.mathfield-host.focused {
  border-color: #0969da;
  box-shadow: 0 0 0 4px rgba(9, 105, 218, 0.15);
}

.mathfield-host :deep(math-field) {
  width: 100%;
  min-height: 88px;
  font-size: 20px;
  line-height: 1.6;
  font-family: 'Cambria Math', 'Times New Roman', serif;
  background: transparent;
  border: none;
  outline: none;
}

.mathfield-host :deep(math-field:focus) {
  outline: none;
  box-shadow: none;
}

.placeholder-hint {
  margin: -8px 0 0;
  font-size: 12px;
  color: #57606a;
}

.latex-output {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: 'Fira Code', Consolas, monospace;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 10px;
  padding: 12px 16px;
  color: #1f2328;
  word-break: break-word;
}

.latex-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #57606a;
}

.latex-value {
  font-size: 14px;
}

@media (max-width: 768px) {
  .equation-ribbon {
    padding: 10px;
  }

  .ribbon-groups {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .mathfield-host {
    padding: 12px;
    min-height: 100px;
  }

  .mathfield-host :deep(math-field) {
    font-size: 18px;
    min-height: 72px;
  }

  .latex-output {
    font-size: 13px;
    padding: 10px 12px;
  }
}
</style>
