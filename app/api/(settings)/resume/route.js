import { NextRequest } from 'next/server';
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
    about: { type: String },
    educationDetails: [
        {
            university: { type: String },
            degree: { type: String },
            major: { type: String },
            startDate: { type: String },
            endDate: { type: String },
            description: { type: String },
        }
    ],
    professionalExperience: [
        {
            positionTitle: { type: String },
            companyName: { type: String },
            city: { type: String },
            state: { type: String },
            startDate: { type: String },
            endDate: { type: String },
            summary: { type: String },
        }
    ],
    color: { type: String, default: '#e11d48' }
}, { timestamps: true });
const Resume = mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);

const successResponse = (data, message = 'Success', status = 200) => {
    return new Response(JSON.stringify({ success: true, message, data }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
};

const errorResponse = (message, status = 500) => {
    return new Response(JSON.stringify({ success: false, message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
};

export async function POST(request) {
    try {
        await connectMongoDB();
        const userHeader = request.headers.get('x-user');
        if (!userHeader) return errorResponse('Unauthorized - Missing User Header', 401);
        let userDetails;
        try {
            userDetails = JSON.parse(userHeader);
        } catch {
            return errorResponse('Invalid user header format', 400);
        }
        if (!userDetails?.id) return errorResponse('Unauthorized - Missing User ID', 401);
        const payload = await request.json();
        if (!Array.isArray(payload.professionalExperience)) {
            payload.professionalExperience = [];
        }
        if (!Array.isArray(payload.educationDetails)) {
            payload.educationDetails = [];
        }
        const resume = await Resume.findOneAndUpdate(
            { user: userDetails.id },
            { $set: { ...payload, user: userDetails.id } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return successResponse(resume, 'Resume saved successfully', 201);
    } catch (error) {
        console.error('POST Resume Error:', error);
        return errorResponse('Something went wrong while saving resume');
    }
}

export async function GET(request) {
    try {
        await connectMongoDB();
        const userHeader = request.headers.get('x-user');
        if (!userHeader) return errorResponse('Unauthorized - Missing User Header', 401);
        let userDetails;
        try {
            userDetails = JSON.parse(userHeader);
        } catch {
            return errorResponse('Invalid user header format', 400);
        }
        if (!userDetails?.id) return errorResponse('Unauthorized - Missing User ID', 401);
        const resume = await Resume.findOne({ user: userDetails.id }).sort({ updatedAt: -1 }).lean();
        if (!resume) return errorResponse('Resume not found', 404);
        if (!Array.isArray(resume.professionalExperience)) {
            resume.professionalExperience = [];
        }
        if (!Array.isArray(resume.educationDetails)) {
            resume.educationDetails = [];
        }
        return successResponse(resume, 'Resume fetched successfully');
    } catch (error) {
        console.error('GET Resume Error:', error);
        return errorResponse('Something went wrong while fetching resume');
    }
}

export async function PUT(request) {
    try {
        await connectMongoDB();
        const userHeader = request.headers.get('x-user');
        if (!userHeader) return errorResponse('Unauthorized - Missing User Header', 401);
        let userDetails;
        try {
            userDetails = JSON.parse(userHeader);
        } catch {
            return errorResponse('Invalid user header format', 400);
        }
        if (!userDetails?.id) return errorResponse('Unauthorized - Missing User ID', 401);
        const payload = await request.json();
        if (!Array.isArray(payload.professionalExperience)) {
            payload.professionalExperience = [];
        }
        if (!Array.isArray(payload.educationDetails)) {
            payload.educationDetails = [];
        }
        const updatedResume = await Resume.findOneAndUpdate(
            { user: userDetails.id },
            { $set: { ...payload } },
            { new: true }
        );
        if (!updatedResume) return errorResponse('Resume not found', 404);
        return successResponse(updatedResume, 'Resume updated successfully', 200);
    } catch (error) {
        console.error('PUT Resume Error:', error);
        return errorResponse('Something went wrong while updating resume');
    }
}
