export type Mutation<State> = (state: State, ...data: any) => State
export type MutationTree<State> = {
  [mutation: string]: Mutation<State>
}
