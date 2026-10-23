import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 1 },
  mascot: { type: String, required: true, trim: true, minlength: 1 },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

export const Team = model('Team', teamSchema);
