import { MutationMap } from './mutator'
import { VNode, createRealElement, updateRealElement } from './vdom'

export interface Store<State, MutationsType> {
  state: State
  readonly mutations: MutationsType
}

type RegisteredNekoStore<State> = Store<State, MutationMap<State>>

export interface VDOM<State> {
  (store: RegisteredNekoStore<State>): VNode
}

interface NekoConstructor<State, Mutations> {
  readonly rootElement: HTMLElement | string
  readonly vdom: VDOM<State>
  readonly store: Store<State, Mutations>
  readonly mutations: MutationMap<State>
}

export default class VirtualNeko<State, Mutations> {
  private readonly rootElement: HTMLElement
  private readonly vdom: VDOM<State>
  private currentState: State
  private readonly store: RegisteredNekoStore<State>
  private readonly mutations: MutationMap<State>
  private currentTree: VNode
  private nextTree: VNode
  private renderRequestId: number | null = null

  constructor({ rootElement, vdom, store }: NekoConstructor<State, Mutations>) {
    this.rootElement =
      typeof rootElement === 'string'
        ? document.querySelector(rootElement)
        : rootElement
    this.currentState = store.state
    this.store = this.registerStore(store)
    this.vdom = vdom
    this.updateVDOM()
  }

  private registerStore(
    store: Store<State, Mutations>
  ): RegisteredNekoStore<State> {
    const observedMutations = this.observeMutations(store.mutations)
    const references = {
      state: () => this.currentState,
      mutations: () => observedMutations,
    }
    return new Proxy(
      {},
      {
        get: (_, prop: keyof Store<State, Mutations>) => {
          return references[prop]()
        },
        set: (target, prop, value) => {
          if (prop === 'state') {
            return (this.currentState = value)
          }
          return false
        },
      }
    ) as RegisteredNekoStore<State>
  }

  private updateVDOM(): void {
    this.nextTree = this.vdom(this.store)
    this.throttleRendering()
  }

  private observeMutations(mutations: Mutations): MutationMap<State> {
    return Object.entries(mutations).reduce(
      (tree, [mutationKey, mutation]) => ({
        ...tree,
        [mutationKey]: (state: State, ...payload: any) => {
          this.store.state = mutation(this.store.state, ...payload)
          this.updateVDOM()
          return this.store.state
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

export { createVNode } from './vdom'
export { MutationMap } from './mutator'
