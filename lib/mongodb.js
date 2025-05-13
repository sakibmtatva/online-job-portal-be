import mongoose from 'mongoose';

const connectMongoDB = async () => {
  const connectionState = mongoose.connection.readyState;
  if (connectionState === 1) {
    return mongoose;
  }

  try {
    await mongoose.connect(process.env.DATABASE_URL, {});
  } catch (error) {
    console.log('Error', error);
    throw new Error('Error to connect database');
  }
};

export default connectMongoDB;
