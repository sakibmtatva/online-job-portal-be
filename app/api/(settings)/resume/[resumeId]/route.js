import mongoose from 'mongoose';
import connectMongoDB from '@/lib/mongodb';

const ResumeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    fullName: { type: String },
    lastName: { type: String },
    jobTitle: { type: String },
    address: { type: String },
    email: { type: String },
    phone: { type: String },
}, { timestamps: true });
const Resume = mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);

const successResponse = (data, message = 'Success', status = 200) => {
    return new Response(JSON.stringify({ success: true, message, data }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
};

const errorResponse = (message, status = 500, data = null) => {
    return new Response(JSON.stringify({ success: false, message, data }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
};

export async function DELETE(request, { params }) {
    try {
        await connectMongoDB();
        const { resumeId } = params;
        if (!resumeId) return errorResponse('Resume ID is required', 400);
        const deleted = await Resume.findByIdAndDelete(resumeId);
        if (!deleted) return errorResponse('Resume not found', 404);
        return successResponse(deleted, 'Resume deleted successfully', 200);
    } catch (error) {
        console.error('DELETE Resume Error:', error);
        return errorResponse(error?.message || 'Something went wrong while deleting resume', 500, error?.stack || null);
    }
}
