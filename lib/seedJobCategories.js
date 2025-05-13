import { JobCategory } from '../models/jobCategories.js';
import connectMongoDB from './mongodb.js';
import dotenv from 'dotenv';

dotenv.config();
const defaultCategories = ['IT', 'Medical', 'Marketing', 'Finance', 'Engineering', 'Education'];

async function seedCategories() {
  await connectMongoDB();

  for (const name of defaultCategories) {
    try {
      await JobCategory.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
    } catch (err) {
      console.error(`Error seeding category "${name}":`, err.message);
    }
  }

  console.log('Categories seeded successfully.');
  process.exit(0);
}

seedCategories();
