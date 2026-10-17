// models/GasSession.ts
import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const GasSessionSchema = new Schema({
  userEmail: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userImage: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  durationInSeconds: { type: Number, default: 0 },
}, { timestamps: true });

GasSessionSchema.index({ userEmail: 1, startTime: 1 });
GasSessionSchema.index({ startTime: 1 });
// One running timer per user, enforced by the database so two simultaneous
// "start" requests (e.g. from two devices) can't both create a session.
GasSessionSchema.index(
  { userEmail: 1, endTime: 1 },
  { unique: true, partialFilterExpression: { endTime: { $type: 'null' } } }
);

export type GasSessionFields = InferSchemaType<typeof GasSessionSchema>;

function createModel() {
  const GasSessionModel = model<GasSessionFields>('GasSession', GasSessionSchema);
  GasSessionModel.on('index', (error?: Error) => {
    if (error) console.error('[GasSession] index build failed:', error.message);
  });
  return GasSessionModel;
}

export const GasSession: Model<GasSessionFields> =
  (models.GasSession as Model<GasSessionFields> | undefined) ?? createModel();
