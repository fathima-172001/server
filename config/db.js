import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop all indexes from the posts collection
    try {
      await conn.connection.collection('posts').dropIndexes();
      console.log('Successfully dropped all indexes from posts collection');
    } catch (indexError) {
      console.error('Error dropping indexes:', indexError);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
