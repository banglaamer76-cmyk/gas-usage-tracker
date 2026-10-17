// models/Cylinder.ts
import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

// The household's current gas cylinder. There is only ever one document, with
// _id CURRENT_CYLINDER, and setting a new change date overwrites it.
const CylinderSchema = new Schema({
  _id: { type: String, required: true },
  // The day it was connected, as "YYYY-MM-DD". A calendar date rather than an
  // instant, so everyone counts usage from midnight in their own timezone.
  changedOn: { type: String, required: true },
  // Who last set the date.
  updatedByEmail: { type: String, required: true },
  updatedByName: { type: String, required: true },
}, { timestamps: true });

export const CURRENT_CYLINDER = 'current';

export type CylinderFields = InferSchemaType<typeof CylinderSchema>;

export const Cylinder: Model<CylinderFields> =
  (models.Cylinder as Model<CylinderFields> | undefined) ?? model<CylinderFields>('Cylinder', CylinderSchema);
