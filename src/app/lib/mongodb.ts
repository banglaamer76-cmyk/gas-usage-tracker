import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Keep one connection per server process: survives hot reloads in development
// and is reused across invocations of a warm serverless function.
const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached = (globalForMongoose.mongooseCache ??= { conn: null, promise: null });

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  cached.promise ??= mongoose.connect(uri);
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Let the next request retry instead of reusing a rejected promise forever.
    cached.promise = null;
    throw error;
  }
  return cached.conn;
}
