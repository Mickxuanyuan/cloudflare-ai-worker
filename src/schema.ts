import { gql } from 'graphql-tag';
import { ChatMessage, WorkerEnv, fetchDeepseekCompletion } from './deepseek';

export const typeDefs = gql`
  type ChatMessage {
    id: ID!
    role: String!
    content: String!
  }

  type ChatResponse {
    message: ChatMessage!
  }

  type Query {
    _health: String!
  }

  input SendMessageInput {
    message: String!
  }

  type Mutation {
    sendMessage(input: SendMessageInput!): ChatResponse!
  }
`;

export type YogaContext = {
  env?: WorkerEnv;
};

export const resolvers = {
  Query: {
    _health: () => 'ok',
  },
  Mutation: {
    sendMessage: async (
      _parent: unknown,
      args: { input: { message: string } },
      context: YogaContext
    ) => {
      const reply = await fetchDeepseekCompletion(args.input.message, context.env);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
      };

      return { message: assistantMessage };
    },
  },
};
