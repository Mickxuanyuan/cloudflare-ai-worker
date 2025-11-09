import { createSchema, createYoga } from 'graphql-yoga';
import { typeDefs, resolvers, YogaContext } from './schema';
import { WorkerEnv } from './deepseek';

export type Env = WorkerEnv;

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga<YogaContext>({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Request, Response, Headers },
  context: ({ request, env }) => ({
    env: (env as Env) ?? (request as unknown as { env?: Env }).env,
  }),
});

export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext
  ): Promise<Response> {
    return yoga.fetch(request, { env, executionContext });
  },
};
