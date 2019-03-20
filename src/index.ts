import { MutationMap } from './mutator'
import { VDOM, VNode, createRealElement, updateRealElement } from './vdom'

interface NekoConstructor<State, Mutations> {
  readonly rootElement: HTMLElement | string
  readonly vdom: VDOM<State, MutationMap<State>>
  state: State
  readonly mutations: MutationMap<State>
}

export default class VirtualNeko<State, Mutations> {
  private readonly rootElement: HTMLElement
  private readonly vdom: VDOM<State, MutationMap<State>>
  private state: State
  private readonly mutations: MutationMap<State>
  private currentTree: VNode
  private nextTree: VNode
  private renderRequestId: number | null = null

  constructor({
    rootElement,
    vdom,
    state,
    mutations,
  }: NekoConstructor<State, Mutations>) {
    this.rootElement =
      typeof rootElement === 'string'
        ? document.querySelector(rootElement)
        : rootElement
    this.state = state
    this.vdom = vdom
    this.mutations = this.observeMutations(mutations)
    this.updateVDOM()
  }

  private updateVDOM(nextState: State = this.state): void {
    this.state = nextState
    this.nextTree = this.vdom(this.state, this.mutations)
    this.throttleRendering()
  }

  private observeMutations(mutations: MutationMap<State>): MutationMap<State> {
    return Object.entries(mutations).reduce(
      (tree, [mutationKey, mutation]) => ({
        ...tree,
        [mutationKey]: (state: State, ...payload: any) => {
          const newState = mutation(state, ...payload)
          this.updateVDOM(newState)
          return newState
        },
      }),
      {} as MutationMap<State>
    )
  }

  public throttleRendering(): void {
    if (this.renderRequestId === null) {
      this.renderRequestId = window.requestAnimationFrame(() => this.render())
    }
  }

  public render(): void {
    this.currentTree
      ? updateRealElement({
          parentElement: this.rootElement,
          currentNode: this.rootElement.firstChild,
          currentNeko: this.currentTree,
          nextNeko: this.nextTree,
        })
      : this.rootElement.appendChild(createRealElement(this.nextTree))
    this.currentTree = this.nextTree
    this.renderRequestId = null
  }
}

export { VDOM, createVNode } from './vdom'
export { MutationMap } from './mutator'
