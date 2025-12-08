import { Schema } from 'mongoose';

const organizationSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
    },
    { timestamps: true },
);

export default organizationSchema;
