export const START = "__start__";
export const END = "__end__";

type NodeHandler<TState> = (state: TState) => Promise<TState> | TState;

type GraphNodeMap<TState> = Map<string, NodeHandler<TState>>;
type GraphEdgeMap = Map<string, string>;

export class StateGraph<TState> {
  private nodes: GraphNodeMap<TState>;
  private edges: GraphEdgeMap;

  constructor() {
    this.nodes = new Map<string, NodeHandler<TState>>();
    this.edges = new Map<string, string>();
  }

  addNode(name: string, handler: NodeHandler<TState>): this {
    this.nodes.set(name, handler);
    return this;
  }

  addEdge(from: string, to: string): this {
    this.edges.set(from, to);
    return this;
  }

  compile() {
    const nodes = this.nodes;
    const edges = this.edges;

    return {
      invoke: async (initialState: TState): Promise<TState> => {
        let pointer = edges.get(START);
        let state = initialState;

        while (pointer && pointer !== END) {
          const handler = nodes.get(pointer);
          if (!handler) {
            throw new Error(`Missing graph node handler for: ${pointer}`);
          }

          state = await handler(state);
          pointer = edges.get(pointer);
        }

        return state;
      },
    };
  }
}
