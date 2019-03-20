import VirtualNeko, { VDOM, createVNode as h, MutationMap } from '../src'

type State = typeof state
type Mutations = typeof mutations

const state = {
  tasks: [
    'virtual dom',
    '完全に理解する',
    'yes I can',
    'resessh',
    'finish',
    'incomplete',
  ],
  form: {
    input: '',
    hasError: false,
  },
}

const validateInput = input => !input || input.length < 3 || input.length > 20

const mutations: MutationMap<State> = {
  updateInput(state, input: string) {
    return {
      ...state,
      form: {
        ...state.form,
        input,
      },
    }
  },
  updateHasError(state, hasError: boolean) {
    return {
      ...state,
      form: {
        ...state.form,
        hasError,
      },
    }
  },
  createTask(state) {
    return {
      ...state,
      tasks: [...state.tasks, state.form.input],
      form: {
        ...state.form,
        input: '',
      },
    }
  },
  removeTask(state, index: number) {
    return {
      ...state,
      tasks: [...state.tasks.slice(0, index), ...state.tasks.slice(index + 1)],
    }
  },
}

const vdom: VDOM<State> = ({ state, mutations }) => {
  return h(
    'div',
    { style: 'padding: 20px;' },
    h('h1', { class: 'title' }, '仮想DOMの状態管理失敗してるTODOアプリ'),
    h(
      'div',
      { class: 'field' },
      h('label', { class: 'label' }, 'Task Title'),
      h('input', {
        type: 'text',
        class: 'input',
        style: 'width: 200px;',
        value: state.form.input,
        oninput: (ev: Event) => {
          const target = ev.target as HTMLInputElement
          const input = target.value
          mutations.updateInput(state, input)
          mutations.updateHasError(state, validateInput(input))
        },
      }),
      h(
        'button',
        {
          type: 'button',
          class: 'button is-primary',
          style: 'margin-left: 10px;',
          onclick: () => {
            const currentInput = state.form.input
            const isValid = validateInput(currentInput)
            mutations.updateHasError(state, isValid)
            if (isValid) {
              mutations.createTask(state)
            }
          },
        },
        'create'
      ),
      h(
        'p',
        {
          class: 'notification',
          style: `display: ${state.form.hasError ? 'display' : 'none'}`,
        },
        '3〜20文字で入力してください'
      )
    ),
    h(
      'ul',
      { class: 'panel' },
      ...state.tasks.map((task, index) => {
        return h(
          'li',
          { class: 'panel-block' },
          h(
            'button',
            {
              type: 'button',
              class: 'delete',
              style: 'margin-right: 10px;',
              onclick: () => mutations.removeTask(state, index),
            },
            'remove'
          ),
          task
        )
      })
    )
  )
}

new VirtualNeko<State, Mutations>({
  rootElement: '#app',
  vdom,
  store: {
    state,
    mutations,
  },
})
