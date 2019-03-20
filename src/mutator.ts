export type Mutation<State> = (state: State, ...data: any) => State
export type MutationMap<State> = {
  [mutation: string]: Mutation<State>
}
