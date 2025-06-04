import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import connectMongoDB from '@/lib/mongodb';
import Column from '@/models/trello';
import Application from '@/models/application';
import '@/models/candidate';
import '@/models/employer';

const typeDefs = `#graphql
  type Column {
    _id: ID!
    userId: ID!
    jobId: ID!
    name: String!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getColumns(jobId: ID): [Column]!
  }

  type Mutation {
    createColumn(name: String!, jobId: ID!): Column!
    updateColumn(columnId: ID!, name: String!, jobId: ID!): Column!
    deleteColumn(columnId: ID!, jobId: ID!): Column!
  }
`;

const resolvers = {
  Query: {
    getColumns: async (_, { jobId }, context) => {
      await connectMongoDB();
      const userDetails = context.userDetails;
      let columns = [];
      if (userDetails.user_type !== 'Employer') {
        throw new Error('Only employers can get columns', 403);
      }
      if (!jobId) {
        columns = await Column.find({ userId: userDetails.id }).select('-__v').lean().sort({ createdAt: -1 });
      } else {
        columns = await Column.find({ userId: userDetails.id, jobId: jobId })
          .select('-__v')
          .lean()
          .sort({ createdAt: -1 });
      }
      return columns;
    },
  },
  Mutation: {
    createColumn: async (_, { name, jobId }, context) => {
      await connectMongoDB();
      const userDetails = context.userDetails;

      if (userDetails.user_type !== 'Employer') {
        throw new Error('Only employers can create columns', 403);
      }

      if (!name?.trim()) {
        throw new Error('Column name is required and cannot be empty', 400);
      }

      if (!jobId) {
        throw new Error('Job ID is required', 400);
      }

      const existingColumn = await Column.findOne({
        userId: userDetails.id,
        jobId: jobId,
        name: name.trim(),
      });

      if (existingColumn || name === 'All Applications' || name === 'Shortlisted') {
        throw new Error('Column with this name already exists', 400);
      }

      return await Column.create({
        userId: userDetails.id,
        jobId: jobId,
        name: name.trim(),
      });
    },
    updateColumn: async (_, { columnId, name, jobId }, context) => {
      await connectMongoDB();
      const userDetails = context.userDetails;

      if (userDetails.user_type !== 'Employer') {
        throw new Error('Only employers can update columns', 403);
      }

      if (!columnId) {
        throw new Error('Column ID is required', 400);
      }

      if (!jobId) {
        throw new Error('Job ID is required', 400);
      }

      if (!name?.trim()) {
        throw new Error('Column name is required and cannot be empty', 400);
      }

      const column = await Column.findOne({
        _id: columnId,
        jobId: jobId,
        userId: userDetails.id,
      });

      if (!column) {
        throw new Error('Column not found', 404);
      }

      if (column.name === name.trim()) {
        return column;
      }

      const existingColumn = await Column.findOne({
        userId: userDetails.id,
        name: name.trim(),
        jobId: jobId,
        _id: { $ne: columnId },
      });

      if (existingColumn) {
        throw new Error('Column with this name already exists', 400);
      }

      if (name === 'All Applications' || name === 'Shortlisted') {
        throw new Error('Column name cannot be "All Applications" or "Shortlisted"', 400);
      }

      const applicationsExist = await Application.find({
        job: jobId,
        trello_name: column.name,
      });

      if (applicationsExist) {
        await Application.updateMany(
          {
            job: jobId,
            trello_name: column.name,
          },
          { $set: { trello_name: name.trim() } }
        );
      }

      return await Column.findByIdAndUpdate(columnId, { name: name.trim() }, { new: true }).select('-__v');
    },
    deleteColumn: async (_, { columnId, jobId }, context) => {
      await connectMongoDB();
      const userDetails = context.userDetails;

      if (userDetails.user_type !== 'Employer') {
        throw new Error('Only employers can delete columns', 403);
      }

      if (!columnId) {
        throw new Error('Column ID is required', 400);
      }

      const column = await Column.findOne({
        _id: columnId,
        userId: userDetails.id,
      });

      if (!column) {
        throw new Error('Column not found', 404);
      }

      const applicationsExist = await Application.find({
        job: jobId,
        trello_name: column.name,
      });

      if (applicationsExist) {
        await Application.updateMany(
          {
            job: jobId,
            trello_name: column.name,
          },
          { $set: { trello_name: 'All Applications' } }
        );
      }

      const deleteColumn = await Column.findById(columnId);
      await Column.findByIdAndDelete(columnId);
      return deleteColumn;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const graphqlHandler = startServerAndCreateNextHandler(server, {
  context: async req => {
    const userDetails = JSON.parse(req.headers.get('x-user'));
    return { userDetails };
  },
});

export const POST = graphqlHandler;
