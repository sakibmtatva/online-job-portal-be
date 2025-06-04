import connectMongoDB from '@/lib/mongodb';
import Column from '@/models/trello';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';
import Application from '@/models/application';

export const POST = withApiHandler(async request => {
  await connectMongoDB();
  const { name, jobId } = await request.json();
  const userDetails = JSON.parse(request.headers.get('x-user'));

  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Only employers can create columns', 403);
  }

  if (!name?.trim()) {
    throw new ApiError('Column name is required and cannot be empty', 400);
  }

  if (!jobId) {
    throw new ApiError('Job id is required', 400);
  }

  const existingColumn = await Column.findOne({
    userId: userDetails.id,
    jobId: jobId,
    name: name.trim(),
  });

  if (existingColumn || name === 'All Applications' || name === 'Shortlisted') {
    throw new ApiError('Column with this name already exists', 400);
  }

  const column = await Column.create({
    userId: userDetails.id,
    name: name.trim(),
    jobId: jobId,
  });

  return successResponse(column, 'Column created successfully', 201);
});

export const GET = withApiHandler(async request => {
  await connectMongoDB();
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  const userDetails = JSON.parse(request.headers.get('x-user'));

  const query = {
    userId: userDetails.id,
    ...(jobId ? { jobId: jobId } : {}),
  };

  const columns = await Column.find(query).select('-__v').lean().sort({ createdAt: -1 });

  if (!columns.length) {
    return successResponse([], 'No columns found', 200);
  }

  return successResponse(columns, 'Columns fetched successfully', 200);
});

export const DELETE = withApiHandler(async request => {
  await connectMongoDB();
  const { searchParams } = new URL(request.url);
  const columnId = searchParams.get('columnId');
  const jobId = searchParams.get('jobId');
  const userDetails = JSON.parse(request.headers.get('x-user'));

  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Only employers can delete columns', 403);
  }

  if (!columnId) {
    throw new ApiError('Column ID is required', 400);
  }

  if (!jobId) {
    throw new ApiError('Job ID is required', 400);
  }

  const column = await Column.findOne({
    _id: columnId,
    userId: userDetails.id,
  });

  if (!column) {
    throw new ApiError('Column not found', 404);
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

  await Column.findByIdAndDelete(columnId);

  return successResponse(null, 'Column deleted successfully', 200);
});

export const PUT = withApiHandler(async request => {
  await connectMongoDB();
  const { searchParams } = new URL(request.url);
  const columnId = searchParams.get('columnId');
  const jobId = searchParams.get('jobId');
  const name = searchParams.get('name');
  const userDetails = JSON.parse(request.headers.get('x-user'));

  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Only employers can update columns', 403);
  }

  if (!columnId) {
    throw new ApiError('Column ID is required', 400);
  }

  if (!jobId) {
    throw new ApiError('Job ID is required', 400);
  }

  if (!name?.trim()) {
    throw new ApiError('Column name is required and cannot be empty', 400);
  }

  const column = await Column.findOne({
    _id: columnId,
    jobId: jobId,
    userId: userDetails.id,
  });

  if (!column) {
    throw new ApiError('Column not found', 404);
  }

  if (column.name === name.trim()) {
    return successResponse(column, 'Column name is same as previous', 200);
  }

  const existingColumn = await Column.findOne({
    userId: userDetails.id,
    name: name.trim(),
    jobId: jobId,
    _id: { $ne: columnId },
  });

  if (existingColumn) {
    throw new ApiError('Column with this name already exists', 400);
  }

  if (name === 'All Applications' || name === 'Shortlisted') {
    throw new ApiError('Column name cannot be "All Applications" or "Shortlisted"', 400);
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

  const updatedColumn = await Column.findByIdAndUpdate(columnId, { name: name.trim() }, { new: true }).select('-__v');

  return successResponse(updatedColumn, 'Column updated successfully', 200);
});
