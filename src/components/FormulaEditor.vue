<template>
  <div class="math-editor">
    <label v-if="label" class="editor-label">{{ label }}</label>
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
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';

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
  insert: (snippet) => mathfield.value?.insert(snippet ?? '')
});
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
