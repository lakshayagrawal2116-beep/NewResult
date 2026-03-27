const mongoose = require('mongoose');
const dotenv = require('dotenv');
const StudentResult = require('./models/StudentResult');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://zerodha123:zerodha123@cluster0.qiphosx.mongodb.net/university-results';

async function fixDepartmentName() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');
    
    // Find how many documents have the wrong name
    const count = await StudentResult.countDocuments({ department: 'Electronics & Communication Engineering' });
    console.log(`Found ${count} students with the incorrect department name.`);
    
    if (count > 0) {
      console.log('Updating departments to "EC"...');
      const result = await StudentResult.updateMany(
        { department: 'Electronics & Communication Engineering' },
        { $set: { department: 'EC' } }
      );
      
      console.log(`Successfully updated ${result.modifiedCount} records!`);
    } else {
      console.log('No records needed fixing.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected.');
  }
}

fixDepartmentName();
