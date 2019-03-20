import { MutationTree } from './mutator'
import { VDOM, VNode, createRealElement, updateRealElement } from './vdom'

interface NekoConstructor<State, Mutations> {
  rootElement: HTMLElement | string
  vdom: VDOM<State, MutationTree<State>>
  state: State
  mutations: MutationTree<State>
}
export default class VirtualNeko<State, Mutatitons> {
  private readonly rootElement: HTMLElement
  private readonly vdom: VDOM<State, MutationTree<State>>
  private state: State
  private readonly mutations: MutationTree<State>
  private currentTree: VNode
  private nextTree: VNode
  private renderRequestId: number | null = null

  constructor({
    rootElement,
    vdom,
    state,
    mutations,
  }: NekoConstructor<State, Mutatitons>) {
    this.rootElement =
      typeof rootElement === 'string'
        ? document.querySelector(rootElement)
        : rootElement
    this.vdom = this.registerVDOM(vdom)
    // this.state = this.observeState(state)
    this.state = state
    this.mutations = this.observeMutations(mutations)
    this.refreshVDOM()
  }

  private registerVDOM(vdom): VDOM<State, MutationTree<State>> {
    return vdom
  }

  private updateVDOM(nextState: State = this.state): State {
    this.state = nextState
    this.nextTree = this.vdom(nextState, this.mutations)
    this.render()
    return nextState
  }

  private observeMutations(
    mutations: MutationTree<State>
  ): MutationTree<State> {
    return Object.entries(mutations).reduce(
      (tree, [mutationKey, mutation]): MutationTree<State> => ({
        ...tree,
        [mutationKey]: (state: State, ...payload: any) => {
          const newState = mutation(state, ...payload)
          return this.updateVDOM(newState)
        },
      }),
      {} as MutationTree<State>
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
          parentElemen: this.rootElement,
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
export { MutationTree } from './mutator'
