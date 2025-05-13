import dotenv from 'dotenv';
import connectMongoDB from './mongodb.js';
import City from '../models/cities.js';

dotenv.config();

const indianCities = [
  { name: 'Mumbai' },
  { name: 'Delhi' },
  { name: 'Bengaluru' },
  { name: 'Hyderabad' },
  { name: 'Ahmedabad' },
  { name: 'Chennai' },
  { name: 'Kolkata' },
  { name: 'Pune' },
  { name: 'Jaipur' },
  { name: 'Lucknow' },
  { name: 'Surat' },
  { name: 'Kanpur' },
  { name: 'Nagpur' },
  { name: 'Indore' },
  { name: 'Bhopal' },
  { name: 'Patna' },
  { name: 'Vadodara' },
  { name: 'Ludhiana' },
  { name: 'Agra' },
  { name: 'Nashik' },
];

async function seedCities() {
  try {
    await connectMongoDB();
    await City.deleteMany();
    await City.insertMany(indianCities);
    console.log('Cities seeded successfully.');
    process.exit();
  } catch (error) {
    console.error('Failed to seed cities:', error);
    process.exit(1);
  }
}

seedCities();
