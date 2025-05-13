import mongoose, { Schema } from 'mongoose';

const loginSchema = new Schema(
  {
    email: String,
    password: String,
  },
  {
    timestamps: true,
  }
);

const Login = mongoose.models.Users || mongoose.model('Users', loginSchema);

export default Login;
